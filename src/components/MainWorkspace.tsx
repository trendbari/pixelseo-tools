'use client';

import React, { useState, useRef } from 'react';
import {
  AppLanguage,
  ProcessedImageItem,
  ConversionPreferences,
  WatermarkPreferences,
  SeoGeneratorConfig,
} from '@/types';
import { translations } from '@/locales/dictionary';
import { processSingleImage, formatOutputFilename, resolveBatchOutputFilenames } from '@/lib/imageProcessor';
import { generateSeoForItem } from '@/lib/seoEngine';
import { ProcessingQueue } from '@/lib/image/queue';
import { generateImageThumbnail } from '@/lib/image/thumbnails';
import { getScenarioGuidance } from '@/lib/errorGuidance';
import { estimateZipMemoryUsage } from '@/lib/zipExporter';
import { SystemAlertBanner } from './SystemAlertBanner';
import { ImageCard } from './ImageCard';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List,
  Sliders,
  Play,
  Download,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  XCircle,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  UploadCloud,
  FolderUp,
  Image as ImageIcon,
  ShieldAlert,
  Maximize2,
  Stamp,
  Sparkles,
} from 'lucide-react';

interface MainWorkspaceProps {
  lang: AppLanguage;
  items: ProcessedImageItem[];
  setItems: React.Dispatch<React.SetStateAction<ProcessedImageItem[]>>;
  convPrefs: ConversionPreferences;
  setConvPrefs: React.Dispatch<React.SetStateAction<ConversionPreferences>>;
  wmPrefs: WatermarkPreferences;
  setWmPrefs: React.Dispatch<React.SetStateAction<WatermarkPreferences>>;
  seoConfig: SeoGeneratorConfig;
  onDownloadZip: () => void;
  onExportCsv: () => void;
  onPreviewItem: (item: ProcessedImageItem) => void;
  onOpenWatermarkTab: () => void;
  isProcessing?: boolean;
  onConvertAll?: () => void;
}

export const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  lang,
  items,
  setItems,
  convPrefs,
  setConvPrefs,
  wmPrefs,
  setWmPrefs,
  seoConfig,
  onDownloadZip,
  onExportCsv,
  onPreviewItem,
  onOpenWatermarkTab,
  isProcessing: propIsProcessing,
  onConvertAll: propConvertAll,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const isProcessing = propIsProcessing !== undefined ? propIsProcessing : localIsProcessing;
  const [statusFilter, setStatusFilter] = useState<'all' | 'idle' | 'processing' | 'done' | 'error'>('all');
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);
  const cancelRequestedRef = useRef(false);
  const activeQueueRef = useRef<ProcessingQueue | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // File Validation: Max 20 MB per image
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

  // Handle incoming files with validation (IMG-01, IMG-02, 20MB limit, image decode validation)
  const handleValidateAndAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const availableSlots = 100 - items.length;
    if (availableSlots <= 0) {
      const guidance = getScenarioGuidance('over_100_files', lang, { attempted: files.length, added: 0 });
      toast.warning(`${guidance.title}: ${guidance.whatHappened}\n${guidance.nextStep}`);
      return;
    }

    if (files.length > availableSlots) {
      const guidance = getScenarioGuidance('over_100_files', lang, { attempted: files.length, added: availableSlots });
      toast.warning(`${guidance.title}: ${guidance.whatHappened}\n${guidance.nextStep}`);
    }

    const filesArray = Array.from(files).slice(0, availableSlots);
    const newItems: ProcessedImageItem[] = [];

    for (let idx = 0; idx < filesArray.length; idx++) {
      const file = filesArray[idx];

      // Validation 1: MIME Type & Extension check (Reject unsupported formats + clear reason)
      const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!file.type.startsWith('image/') || !hasValidExt) {
        const guidance = getScenarioGuidance('unsupported_format', lang, {
          filename: file.name,
          format: file.type || 'unknown',
        });
        toast.error(`${guidance.title}: ${guidance.whatHappened} ${guidance.nextStep}`);
        continue;
      }

      // Validation 2: Max 20 MB check
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB): ${
            lang === 'bn'
              ? 'ফাইলের আকার ২০ মেগাবাইট সীমা ছাড়িয়ে গেছে। অনুগ্রহ করে সংকুচিত ফাইল আপলোড করুন।'
              : 'File size exceeds 20 MB limit. Please compress image before upload.'
          }`
        );
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`;

      let thumbnailUrl: string | null = null;
      let origW = 0;
      let origH = 0;

      // Validation 3 & Thumbnail Generation: generate micro-thumbnail to prevent 100-image RAM exhaustion
      try {
        const thumb = await generateImageThumbnail(file, 320);
        thumbnailUrl = thumb.thumbnailUrl;
        origW = thumb.originalWidth;
        origH = thumb.originalHeight;

        // Large image memory warning check (> 16 Megapixels)
        if (thumb.originalWidth * thumb.originalHeight > 16_000_000) {
          const guidance = getScenarioGuidance('memory_pressure', lang);
          setMemoryNotice(guidance.whatHappened);
        }
      } catch (decodeErr) {
        console.error(`Failed to decode image ${file.name}:`, decodeErr);
        const guidance = getScenarioGuidance('corrupt_image', lang, { filename: file.name });
        toast.error(`${guidance.whatHappened} ${guidance.nextStep}`);
      }

      const item: ProcessedImageItem = {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: origW,
        originalHeight: origH,
        previewUrl,
        thumbnailUrl,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: null,
        convertedWidth: 0,
        convertedHeight: 0,
        status: origW === 0 && origH === 0 ? 'error' : 'idle',
        stage: origW === 0 && origH === 0 ? 'failed' : 'queued',
        progress: 0,
        errorMessage: origW === 0 && origH === 0 ? 'Corrupt or unsupported image file' : undefined,
        seo: {
          title: '',
          alt: '',
          description: '',
          tags: [],
          keywords: [],
        },
      };

      // Generate SEO metadata
      item.seo = generateSeoForItem(item, seoConfig);
      newItems.push(item);
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  // Helper to load 6 sample wireframe images for immediate demo testing
  const handleLoadDemoSamples = () => {
    const samples = [
      { name: 'image-1.jpg', color: '#2563EB', title: 'Product Showcase Angle 1' },
      { name: 'image-2.jpg', color: '#10B981', title: 'Product Top View' },
      { name: 'image-3.jpg', color: '#8B5CF6', title: 'Detailed Texture View' },
      { name: 'image-4.jpg', color: '#F59E0B', title: 'Packaging Display' },
      { name: 'image-5.jpg', color: '#EC4899', title: 'Lifestyle Feature Photo' },
      { name: 'image-6.jpg', color: '#06B6D4', title: 'Product Dimension Guide' },
    ];

    const demoItems: ProcessedImageItem[] = samples.map((sample, idx) => {
      // Create a small sample Canvas image
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = sample.color;
        ctx.fillRect(0, 0, 1200, 800);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PixelSEO Demo: ${sample.name}`, 600, 380);
        ctx.font = '32px Inter, sans-serif';
        ctx.fillText(sample.title, 600, 440);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const file = new File([blob], sample.name, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      const id = `demo-${Date.now()}-${idx}`;

      return {
        id,
        file,
        name: sample.name,
        originalSize: blob.size,
        originalWidth: 1200,
        originalHeight: 800,
        previewUrl,
        thumbnailUrl: previewUrl,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: null,
        convertedWidth: 0,
        convertedHeight: 0,
        status: 'idle',
        stage: 'queued',
        progress: 0,
        seo: {
          title: `${sample.title} | Premium Store`,
          alt: `${sample.title} high resolution photo`,
          description: `Detailed view for ${sample.name} optimized by PixelSEO.`,
          tags: ['ecommerce', 'demo', 'webp'],
          keywords: ['demo', 'product', 'photo'],
        },
      };
    });

    setItems((prev) => [...prev, ...demoItems]);
  };

  // Convert All Engine with limited concurrency (IMG-11, 2 parallel jobs), Cancellation (IMG-12), and Stage Semantics
  const handleConvertAll = async () => {
    if (propConvertAll) {
      propConvertAll();
      return;
    }
    if (items.length === 0 || isProcessing) return;

    const pendingItems = items.filter((it) => it.status !== 'done' || it.isStale);
    if (pendingItems.length === 0) return;

    setLocalIsProcessing(true);
    setBatchProgress({ completed: 0, total: pendingItems.length });
    setItems((prev) =>
      prev.map((it) =>
        it.status !== 'done' || it.isStale
          ? { ...it, status: 'idle', stage: 'queued', progress: 0, isStale: false, errorMessage: undefined }
          : it
      )
    );

    // Optimization 4 & 7: Auto-detect mobile devices & low-core environments (concurrency 1 on mobile, 2 on desktop)
    const queue = new ProcessingQueue();
    activeQueueRef.current = queue;

    try {
      await queue.run(pendingItems, convPrefs, wmPrefs, {
        onItemStart: (id) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, status: 'processing', stage: 'decoding', progress: 25 } : p
            )
          );
        },
        onItemStage: (id, stage, progress) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    stage,
                    progress,
                    status:
                      stage === 'completed'
                        ? 'done'
                        : stage === 'failed'
                        ? 'error'
                        : stage === 'cancelled'
                        ? 'cancelled'
                        : 'processing',
                  }
                : p
            )
          );
        },
        onItemProgress: (id, progress) => {
          setItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, progress } : p))
          );
        },
        onItemSuccess: (id, result) => {
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== id) return p;
              if (p.convertedUrl && p.convertedUrl !== result.url) {
                try { URL.revokeObjectURL(p.convertedUrl); } catch {}
              }
              const compressionPercent =
                p.originalSize > 0
                  ? Math.max(0, Math.round(((p.originalSize - result.size) / p.originalSize) * 100))
                  : 0;
              return {
                ...p,
                status: 'done',
                stage: 'completed',
                convertedBlob: result.blob,
                convertedUrl: result.url,
                convertedSize: result.size,
                convertedWidth: result.width,
                convertedHeight: result.height,
                compressionPercent,
                watermarkApplied: wmPrefs.enabled,
                progress: 100,
                isStale: false,
                errorMessage: undefined,
              };
            })
          );
        },
        onItemError: (id, error) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, status: 'error', stage: 'failed', progress: 0, errorMessage: error }
                : p
            )
          );
        },
        onMemoryPressure: (info) => {
          setMemoryNotice(info.message);
        },
        onTotalProgress: (completedCount, totalCount) => {
          setBatchProgress({ completed: completedCount, total: totalCount });
        },
      });
    } finally {
      setLocalIsProcessing(false);
      setBatchProgress(null);
      activeQueueRef.current = null;
    }
  };

  // Cancel conversion (IMG-12)
  const handleCancelProcessing = () => {
    if (activeQueueRef.current) {
      activeQueueRef.current.cancel();
      activeQueueRef.current = null;
    }
    setLocalIsProcessing(false);
    setBatchProgress(null);
    setItems((prev) =>
      prev.map((p) =>
        p.status === 'processing' || p.stage === 'queued'
          ? { ...itCancelled(p) }
          : p
      )
    );
  };

  const itCancelled = (p: ProcessedImageItem): ProcessedImageItem => ({
    ...p,
    status: 'cancelled',
    stage: 'cancelled',
    progress: 0,
  });

  // Retry failed images only (IMG-13)
  const handleRetryFailed = async () => {
    const failedItems = items.filter((i) => i.status === 'error' || i.stage === 'failed');
    if (failedItems.length === 0 || isProcessing) return;

    setLocalIsProcessing(true);
    setBatchProgress({ completed: 0, total: failedItems.length });
    setItems((prev) =>
      prev.map((it) =>
        it.status === 'error' || it.stage === 'failed'
          ? { ...it, status: 'idle', stage: 'queued', progress: 0, errorMessage: undefined }
          : it
      )
    );

    // Optimization 4 & 7: Auto-detect mobile devices & low-core environments (concurrency 1 on mobile, 2 on desktop)
    const queue = new ProcessingQueue();
    activeQueueRef.current = queue;

    try {
      await queue.run(failedItems, convPrefs, wmPrefs, {
        onItemStart: (id) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id ? { ...p, status: 'processing', stage: 'decoding', progress: 25 } : p
            )
          );
        },
        onItemStage: (id, stage, progress) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    stage,
                    progress,
                    status:
                      stage === 'completed'
                        ? 'done'
                        : stage === 'failed'
                        ? 'error'
                        : stage === 'cancelled'
                        ? 'cancelled'
                        : 'processing',
                  }
                : p
            )
          );
        },
        onItemProgress: (id, progress) => {
          setItems((prev) =>
            prev.map((p) => (p.id === id ? { ...p, progress } : p))
          );
        },
        onItemSuccess: (id, result) => {
          setItems((prev) =>
            prev.map((p) => {
              if (p.id !== id) return p;
              if (p.convertedUrl && p.convertedUrl !== result.url) {
                try { URL.revokeObjectURL(p.convertedUrl); } catch {}
              }
              const compressionPercent =
                p.originalSize > 0
                  ? Math.max(0, Math.round(((p.originalSize - result.size) / p.originalSize) * 100))
                  : 0;
              return {
                ...p,
                status: 'done',
                stage: 'completed',
                convertedBlob: result.blob,
                convertedUrl: result.url,
                convertedSize: result.size,
                convertedWidth: result.width,
                convertedHeight: result.height,
                compressionPercent,
                watermarkApplied: wmPrefs.enabled,
                progress: 100,
                isStale: false,
                errorMessage: undefined,
              };
            })
          );
        },
        onItemError: (id, error) => {
          setItems((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, status: 'error', stage: 'failed', progress: 0, errorMessage: error }
                : p
            )
          );
        },
        onMemoryPressure: (info) => {
          setMemoryNotice(info.message);
        },
        onTotalProgress: (completedCount, totalCount) => {
          setBatchProgress({ completed: completedCount, total: totalCount });
        },
      });
    } finally {
      setLocalIsProcessing(false);
      setBatchProgress(null);
      activeQueueRef.current = null;
    }
  };

  // Retry a single corrupt or failed image (IMG-13)
  const handleRetrySingle = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || isProcessing) return;

    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'processing', stage: 'decoding', progress: 25, errorMessage: undefined } : p
      )
    );

    try {
      const result = await processSingleImage(item, convPrefs, wmPrefs);
      const compressionPercent =
        item.originalSize > 0
          ? Math.max(0, Math.round(((item.originalSize - result.size) / item.originalSize) * 100))
          : 0;

      if (item.convertedUrl && item.convertedUrl !== result.url) {
        try { URL.revokeObjectURL(item.convertedUrl); } catch {}
      }

      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'done',
                stage: 'completed',
                convertedBlob: result.blob,
                convertedUrl: result.url,
                convertedSize: result.size,
                convertedWidth: result.width,
                convertedHeight: result.height,
                compressionPercent,
                watermarkApplied: wmPrefs.enabled,
                progress: 100,
                errorMessage: undefined,
              }
            : p
        )
      );
      toast.success(lang === 'bn' ? `${item.name} সফলভাবে কনভার্ট হয়েছে!` : `Converted ${item.name}!`);
    } catch (err: any) {
      const guidance = getScenarioGuidance('corrupt_image', lang, { filename: item.name });
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: 'error', stage: 'failed', progress: 0, errorMessage: `${guidance.whatHappened} ${guidance.nextStep}` }
            : p
        )
      );
      toast.error(guidance.whatHappened);
    }
  };

  // ZIP Download with error capture & retry guidance
  const handleZipWithRetry = async () => {
    try {
      setZipError(null);
      // Optimization 6: Estimate ZIP memory usage before archive generation
      const estimate = estimateZipMemoryUsage(items);
      if (estimate.isHighMemory) {
        toast.info(
          lang === 'bn'
            ? `আনুমানিক জিপ আকার ${estimate.formattedTotal}। মেমরি সুরক্ষায় জিপ প্যাকেজিং চলছে...`
            : `Estimated ZIP size is ${estimate.formattedTotal}. Preparing archive with memory monitoring...`
        );
      }
      await onDownloadZip();
    } catch (err: any) {
      const guidance = getScenarioGuidance('zip_failure', lang, {
        reason: err?.message || 'Archive creation constraint',
      });
      setZipError(`${guidance.whatHappened} ${guidance.nextStep}`);
      toast.error(guidance.whatHappened);
    }
  };

  // Remove single item (IMG-14)
  const handleRemoveItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) {
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target.thumbnailUrl && target.thumbnailUrl !== target.previewUrl) URL.revokeObjectURL(target.thumbnailUrl);
      if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear All items (IMG-14)
  const handleClearAll = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি সব ছবি মুছে ফেলতে চান?' : 'Clear all uploaded images?')) {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.thumbnailUrl && item.thumbnailUrl !== item.previewUrl) URL.revokeObjectURL(item.thumbnailUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
      setItems([]);
    }
  };

  // Download individual WEBP file (IMG-08)
  const handleDownloadSingle = (item: ProcessedImageItem, index: number) => {
    if (!item.convertedUrl) return;
    const filename = formatOutputFilename(item.name, convPrefs, index);
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Inline SEO update
  const handleUpdateSeo = (id: string, alt: string, title: string) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, seo: { ...p.seo, alt, title } } : p))
    );
  };

  // Calculate Overall Progress (IMG-07)
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'done').length;
  const failedCount = items.filter((i) => i.status === 'error').length;
  const overallProgress =
    batchProgress && batchProgress.total > 0
      ? Math.round((batchProgress.completed / batchProgress.total) * 100)
      : totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  // Filtered items
  const filteredItems = items.filter((i) => {
    if (statusFilter === 'idle') return i.status === 'idle';
    if (statusFilter === 'processing') return i.status === 'processing';
    if (statusFilter === 'done') return i.status === 'done';
    if (statusFilter === 'error') return i.status === 'error';
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Pre-calculate unique output filenames for collision-free duplicate resolution (IMG-08)
  const outputNameMap = React.useMemo(() => {
    return resolveBatchOutputFilenames(items, convPrefs);
  }, [items, convPrefs]);

  return (
    <div
      className="main-workspace-wrapper"
      id="main-workspace"
      style={{ marginBottom: '40px', overflowX: 'hidden', width: '100%', maxWidth: '100%' }}
      lang={lang}
    >
      {/* 0. Screen Reader Status Announcement Live Region (WCAG 2.2 AA SC 4.1.3 Status Messages) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {isProcessing
          ? lang === 'bn'
            ? `ব্যাচ রূপান্তর চলছে, মোট অগ্রগতি ${overallProgress} শতাংশ, ${completedCount}টি সম্পন্ন হয়েছে।`
            : `Batch conversion in progress, ${overallProgress}% complete, ${completedCount} of ${totalCount} images processed.`
          : items.length > 0 && completedCount === items.length
          ? lang === 'bn'
            ? `সকল ${totalCount}টি ছবি সফলভাবে অপ্টিমাইজ হয়েছে। জিপ ফাইল ডাউনলোড করার জন্য প্রস্তুত।`
            : `All ${totalCount} images converted successfully. Ready to download ZIP archive.`
          : memoryNotice
          ? `${lang === 'bn' ? 'মেমরি চাপ সতর্কতা' : 'Memory notice'}: ${memoryNotice}`
          : zipError
          ? `${lang === 'bn' ? 'জিপ ত্রুটি' : 'ZIP export error'}: ${zipError}`
          : ''}
      </div>

      {/* 0. System Alert Banner: Offline, WebP support, Memory Pressure, Zip Failures, Session Refresh */}
      <SystemAlertBanner
        onRetryZip={handleZipWithRetry}
        zipError={zipError}
        onClearZipError={() => setZipError(null)}
        memoryNotice={memoryNotice}
        onClearMemoryNotice={() => setMemoryNotice(null)}
      />

      {/* 1. Mobile & Desktop Workspace Header Concept: PixelSEO | WEBP Converter | 100 Max */}
      <div
        className="card"
        style={{
          padding: '24px',
          marginBottom: '20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-blue)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>
              PixelSEO
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-icon-box" style={{ width: '40px', height: '40px' }} aria-hidden="true">
                <Sliders size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>
                  {lang === 'bn' ? 'WEBP কনভার্টার (WEBP Converter)' : 'WEBP Converter'}
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {lang === 'bn' ? 'ব্যাচ প্রসেসিং ওয়ার্কস্পেস' : 'Batch processing workspace'}
                </p>
              </div>
            </div>
          </div>

          {/* Capacity Counter Badge: 100 Max */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 800,
                fontSize: '1rem',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}
              aria-label={`Capacity: ${items.length} of 100 images maximum`}
            >
              <ImageIcon size={18} aria-hidden="true" />
              <span>{items.length} / 100 Max</span>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                className="btn btn-danger"
                disabled={isProcessing}
                onClick={handleClearAll}
                aria-label={t.clearAll}
              >
                <Trash2 size={16} aria-hidden="true" />
                <span>{t.clearAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Select Images Drop/Upload Block (Mobile layout concept: Select Images | JPG / PNG • Up to 100) */}
        <div
          style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UploadCloud size={20} style={{ color: 'var(--primary-blue)' }} aria-hidden="true" />
              <span>{lang === 'bn' ? 'ছবি নির্বাচন করুন (Select Images)' : 'Select Images'}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              JPG / PNG / WEBP / AVIF • {lang === 'bn' ? 'সর্বোচ্চ ১০০টি ছবি' : 'Up to 100 images (Max 20MB)'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              style={{ display: 'none' }}
              aria-label="Upload image files"
              onChange={(e) => handleValidateAndAddFiles(e.target.files)}
            />
            <input
              type="file"
              ref={folderInputRef}
              multiple
              // @ts-expect-error webkitdirectory is standard for folder upload in modern browsers
              webkitdirectory=""
              style={{ display: 'none' }}
              aria-label="Upload entire image folder"
              onChange={(e) => handleValidateAndAddFiles(e.target.files)}
            />

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || items.length >= 100}
              style={{ minHeight: '44px', fontWeight: 700 }}
              aria-label={lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select images from computer'}
            >
              <UploadCloud size={18} aria-hidden="true" />
              <span>{lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Select Images'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing || items.length >= 100}
              style={{ minHeight: '44px' }}
              aria-label={lang === 'bn' ? 'ফোল্ডার নির্বাচন করুন' : 'Select folder from computer'}
            >
              <FolderUp size={16} aria-hidden="true" />
              <span>{lang === 'bn' ? 'ফোল্ডার' : 'Folder'}</span>
            </button>

            {items.length === 0 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleLoadDemoSamples}
                disabled={isProcessing || items.length >= 100}
                style={{ minHeight: '44px' }}
                title="Load 6 wireframe sample images for testing"
                aria-label="Load 6 sample demo images"
              >
                <Sparkles size={16} style={{ color: 'var(--primary-blue)' }} aria-hidden="true" />
                <span>{lang === 'bn' ? 'নমুনা ছবি (Demo)' : 'Demo (6)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Conversion Settings (Mobile layout concept: Conversion Settings | Format WEBP | Quality 85%) */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {lang === 'bn' ? 'কনভার্সন সেটিংস (Conversion Settings)' : 'Conversion Settings'}
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
              gap: '20px',
            }}
          >
            {/* Output Format: WEBP */}
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="ws-format-select" className="form-label" style={{ fontWeight: 700 }}>
                {t.outputFormat}
              </label>
              <select
                id="ws-format-select"
                className="form-select"
                value={convPrefs.format}
                disabled={isProcessing}
                aria-label={t.outputFormat}
                onChange={(e) => {
                  const newFormat = e.target.value as ConversionPreferences['format'];
                  setConvPrefs((p) => ({ ...p, format: newFormat }));
                  setItems((prev) =>
                    prev.map((it) => {
                      if (it.status === 'done' || it.convertedBlob) {
                        if (it.convertedUrl) {
                          try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                        }
                        return {
                          ...it,
                          status: 'idle',
                          stage: 'queued',
                          progress: 0,
                          convertedBlob: null,
                          convertedUrl: null,
                          convertedSize: null,
                          compressionPercent: undefined,
                          isStale: true,
                        };
                      }
                      return it;
                    })
                  );
                }}
              >
                <option value="webp">WEBP (Standard Default)</option>
                <option value="png">PNG (Lossless)</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>

            {/* Quality: 85% */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label htmlFor="ws-quality-slider" className="form-label" style={{ fontWeight: 700, margin: 0 }}>
                  {t.compressionQuality}
                </label>
                <span className="slider-val-badge" aria-live="polite">{convPrefs.quality}%</span>
              </div>
              <div className="range-slider-wrapper">
                <input
                  type="range"
                  id="ws-quality-slider"
                  min={1}
                  max={100}
                  step={1}
                  value={convPrefs.quality}
                  disabled={isProcessing}
                  className="range-slider"
                  aria-label={t.compressionQuality}
                  aria-valuemin={1}
                  aria-valuemax={100}
                  aria-valuenow={convPrefs.quality}
                  onChange={(e) => {
                    const newQ = Number(e.target.value);
                    setConvPrefs((p) => ({ ...p, quality: newQ }));
                    setItems((prev) =>
                      prev.map((it) => {
                        if (it.status === 'done' || it.convertedBlob) {
                          if (it.convertedUrl) {
                            try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                          }
                          return {
                            ...it,
                            status: 'idle',
                            stage: 'queued',
                            progress: 0,
                            convertedBlob: null,
                            convertedUrl: null,
                            convertedSize: null,
                            compressionPercent: undefined,
                            isStale: true,
                          };
                        }
                        return it;
                      })
                    );
                  }}
                />
              </div>
            </div>

          {/* Resize Images: Optional */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {lang === 'bn' ? 'রিসাইজ অপশন (ঐচ্ছিক)' : 'Resize Images (Optional)'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
              <input
                type="checkbox"
                id="workspaceResizeToggle"
                checked={convPrefs.resizeEnabled}
                disabled={isProcessing}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setConvPrefs((p) => ({ ...p, resizeEnabled: checked }));
                  setItems((prev) =>
                    prev.map((it) => {
                      if (it.status === 'done' || it.convertedBlob) {
                        if (it.convertedUrl) {
                          try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                        }
                        return {
                          ...it,
                          status: 'idle',
                          stage: 'queued',
                          progress: 0,
                          convertedBlob: null,
                          convertedUrl: null,
                          convertedSize: null,
                          compressionPercent: undefined,
                          isStale: true,
                        };
                      }
                      return it;
                    })
                  );
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="workspaceResizeToggle" style={{ fontSize: '0.88rem', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                {convPrefs.resizeEnabled
                  ? `${convPrefs.maxWidth} × ${convPrefs.maxHeight} px`
                  : lang === 'bn'
                  ? 'রিসাইজ বন্ধ (আসল মাপ)'
                  : 'Disabled (Keep Original)'}
              </label>
            </div>
          </div>

          {/* Apply watermark to all images */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {lang === 'bn' ? 'ওয়াটারমার্ক' : 'Watermark'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '42px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="workspaceWatermarkToggle"
                  checked={wmPrefs.enabled}
                  disabled={isProcessing}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setWmPrefs((p) => ({ ...p, enabled: checked }));
                    setItems((prev) =>
                      prev.map((it) => {
                        if (it.status === 'done' || it.convertedBlob) {
                          if (it.convertedUrl) {
                            try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                          }
                          return {
                            ...it,
                            status: 'idle',
                            stage: 'queued',
                            progress: 0,
                            convertedBlob: null,
                            convertedUrl: null,
                            convertedSize: null,
                            compressionPercent: undefined,
                            isStale: true,
                          };
                        }
                        return it;
                      })
                    );
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                />
                <label htmlFor="workspaceWatermarkToggle" style={{ fontSize: '0.85rem', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {lang === 'bn' ? 'সব ছবিতে যুক্ত করুন' : 'Apply to all images'}
                </label>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                disabled={isProcessing}
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                onClick={onOpenWatermarkTab}
                aria-label="Open Watermark Studio"
              >
                <Stamp size={14} />
                <span>Studio</span>
              </button>
            </div>
          </div>
        </div>

        {/* Optional Resize Input Fields when toggle is on */}
        {convPrefs.resizeEnabled && (
          <div
            style={{
              marginTop: '16px',
              padding: '14px 18px',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Max W (px):</span>
              <input
                type="number"
                value={convPrefs.maxWidth}
                disabled={isProcessing}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConvPrefs((p) => ({ ...p, maxWidth: val }));
                  setItems((prev) =>
                    prev.map((it) => {
                      if (it.status === 'done' || it.convertedBlob) {
                        if (it.convertedUrl) {
                          try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                        }
                        return {
                          ...it,
                          status: 'idle',
                          stage: 'queued',
                          progress: 0,
                          convertedBlob: null,
                          convertedUrl: null,
                          convertedSize: null,
                          compressionPercent: undefined,
                          isStale: true,
                        };
                      }
                      return it;
                    })
                  );
                }}
                style={{ width: '90px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}
                aria-label="Maximum width in pixels"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Max H (px):</span>
              <input
                type="number"
                value={convPrefs.maxHeight}
                disabled={isProcessing}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setConvPrefs((p) => ({ ...p, maxHeight: val }));
                  setItems((prev) =>
                    prev.map((it) => {
                      if (it.status === 'done' || it.convertedBlob) {
                        if (it.convertedUrl) {
                          try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                        }
                        return {
                          ...it,
                          status: 'idle',
                          stage: 'queued',
                          progress: 0,
                          convertedBlob: null,
                          convertedUrl: null,
                          convertedSize: null,
                          compressionPercent: undefined,
                          isStale: true,
                        };
                      }
                      return it;
                    })
                  );
                }}
                style={{ width: '90px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }}
                aria-label="Maximum height in pixels"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                id="wsPreserveAspect"
                checked={convPrefs.preserveAspectRatio}
                disabled={isProcessing}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setConvPrefs((p) => ({ ...p, preserveAspectRatio: checked }));
                  setItems((prev) =>
                    prev.map((it) => {
                      if (it.status === 'done' || it.convertedBlob) {
                        if (it.convertedUrl) {
                          try { URL.revokeObjectURL(it.convertedUrl); } catch {}
                        }
                        return {
                          ...it,
                          status: 'idle',
                          stage: 'queued',
                          progress: 0,
                          convertedBlob: null,
                          convertedUrl: null,
                          convertedSize: null,
                          compressionPercent: undefined,
                          isStale: true,
                        };
                      }
                      return it;
                    })
                  );
                }}
                style={{ accentColor: 'var(--primary-blue)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="wsPreserveAspect" style={{ fontSize: '0.82rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                {t.preserveAspect}
              </label>
            </div>
          </div>
        )}

        {/* Stale Output Notification Banner (Requirement 5) */}
        {items.some((i) => i.isStale) && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'var(--color-warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              <RotateCcw size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} aria-hidden="true" />
              <span>
                {lang === 'bn'
                  ? 'কনভার্সন সেটিংস পরিবর্তন করা হয়েছে। পরিবর্তিত সেটিংসে পুনরায় আউটপুট জেনারেট করতে হবে।'
                  : 'Conversion settings changed. Stale images will be re-generated with new settings.'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-warning"
              disabled={isProcessing}
              onClick={handleConvertAll}
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: 'var(--color-warning)',
                color: '#FFFFFF',
                border: 'none',
              }}
              aria-label={lang === 'bn' ? 'পুনরায় কনভার্ট করুন' : 'Re-convert all stale images'}
            >
              <Play size={14} aria-hidden="true" />
              <span>{lang === 'bn' ? 'পুনরায় কনভার্ট করুন' : 'Re-convert All Stale'}</span>
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Upload Placeholder when no images exist */}
      {items.length === 0 && (
        <div
          className="card"
          style={{
            padding: '44px 24px',
            textAlign: 'center',
            border: '2px dashed var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card-subtle)',
            marginBottom: '24px',
            transition: 'border-color 0.2s ease',
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--primary-blue)';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = 'var(--border-medium)';
            handleValidateAndAddFiles(e.dataTransfer.files);
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-blue-light)',
              color: 'var(--primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <UploadCloud size={30} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {lang === 'bn' ? 'কোনো ছবি আপলোড করা হয়নি' : 'No Images Uploaded Yet'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            {lang === 'bn'
              ? 'এখানে আপনার ছবি ড্র্যাগ করে ছেড়ে দিন অথবা ব্রাউজ করুন। একসাথে ১০০টি ছবি পর্যন্ত প্রসেস করা যাবে (JPEG, PNG, WEBP, AVIF — সর্বোচ্চ ২০ মেগাবাইট)।'
              : 'Drag & drop image files here or browse from your device. Process up to 100 images per batch (JPEG, PNG, WEBP, AVIF — max 20MB each).'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: '10px 22px', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <ImageIcon size={18} />
              <span>{lang === 'bn' ? 'ছবি নির্বাচন করুন' : 'Choose Images'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => folderInputRef.current?.click()}
              style={{ padding: '10px 18px', fontSize: '0.92rem' }}
            >
              <FolderUp size={18} />
              <span>{lang === 'bn' ? 'ফোল্ডার নির্বাচন' : 'Choose Folder'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleLoadDemoSamples}
              style={{ padding: '10px 18px', fontSize: '0.92rem' }}
            >
              <Sparkles size={16} style={{ color: 'var(--primary-blue)' }} />
              <span>{lang === 'bn' ? 'ডেমো ছবি লোড করুন (Demo)' : 'Load Demo Images (6)'}</span>
            </button>
          </div>

          <div
            style={{
              marginTop: '22px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>🔒 {lang === 'bn' ? '১০০% ক্লায়েন্ট-সাইড প্রসেসিং • আপনার ছবি কখনো ব্রাউজার থেকে বাইরে যায় না' : '100% Client-Side Processing • Your images never leave your browser'}</span>
          </div>
        </div>
      )}

      {/* 3. Uploaded Images Section: Title, 100 max, Grid/List Switcher, Items */}
      {items.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {lang === 'bn' ? 'আপলোডকৃত ছবিসমূহ (Uploaded Images)' : 'Uploaded Images'}
              </h3>
              <span className="badge badge-primary" style={{ fontWeight: 700 }} aria-label="100 maximum images limit">
                {items.length} / 100 max
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card-subtle)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                  onClick={() => setStatusFilter('all')}
                >
                  All ({items.length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'idle' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                  onClick={() => setStatusFilter('idle')}
                >
                  Ready ({items.filter((i) => i.status === 'idle').length})
                </button>
                <button
                  type="button"
                  className={`btn ${statusFilter === 'done' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                  onClick={() => setStatusFilter('done')}
                >
                  Done ({completedCount})
                </button>
                {failedCount > 0 && (
                  <button
                    type="button"
                    className={`btn ${statusFilter === 'error' ? 'btn-danger' : 'btn-outline'}`}
                    style={{ padding: '4px 10px', fontSize: '0.76rem', border: 'none' }}
                    onClick={() => setStatusFilter('error')}
                  >
                    Failed ({failedCount})
                  </button>
                )}
              </div>

              {/* Wireframe Grid / List Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-card-subtle)', padding: '3px', borderRadius: 'var(--radius-sm)' }}>
                <button
                  type="button"
                  className={`btn-icon ${viewMode === 'grid' ? 'active-view' : ''}`}
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: viewMode === 'grid' ? 'var(--primary-blue)' : 'transparent',
                    color: viewMode === 'grid' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                  }}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid view"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`btn-icon ${viewMode === 'list' ? 'active-view' : ''}`}
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    background: viewMode === 'list' ? 'var(--primary-blue)' : 'transparent',
                    color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                  }}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List view"
                >
                  <List size={16} />
                </button>
              </div>

              {/* Retry Failed button if errors exist */}
              {failedCount > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRetryFailed}
                  disabled={isProcessing}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  aria-label={`Retry ${failedCount} failed images`}
                >
                  <RotateCcw size={14} />
                  <span>{lang === 'bn' ? 'ব্যর্থগুলো পুনরায় চেষ্টা' : 'Retry Failed'} ({failedCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE: GRID */}
          {viewMode === 'grid' ? (
            <div className="images-grid" style={{ marginTop: '12px' }}>
              {filteredItems.map((item, idx) => (
                <ImageCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  convPrefs={convPrefs}
                  onRemove={handleRemoveItem}
                  onPreview={onPreviewItem}
                  onUpdateSeo={handleUpdateSeo}
                  onRetry={handleRetrySingle}
                  uniqueOutputName={outputNameMap.get(item.id)}
                  index={idx}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          ) : (
            /* VIEW MODE: LIST (Wireframe List presentation) */
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-medium)' }}>
                    <th style={{ padding: '12px 14px', width: '56px' }}>Preview</th>
                    <th style={{ padding: '12px 14px' }}>File Name</th>
                    <th style={{ padding: '12px 14px' }}>Original</th>
                    <th style={{ padding: '12px 14px' }}>Optimized</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const optName = outputNameMap.get(item.id) || formatOutputFilename(item.name, convPrefs, idx);
                    const isDuplicate = optName !== formatOutputFilename(item.name, convPrefs, idx);
                    const saved = item.convertedSize
                      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
                      : null;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: idx % 2 === 0 ? 'transparent' : 'var(--bg-card-subtle)',
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '4px',
                              background: '#0F172A',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Preview ${item.name}`}
                            onClick={() => onPreviewItem(item)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onPreviewItem(item);
                              }
                            }}
                          >
                            <img
                              src={item.convertedUrl || item.thumbnailUrl || item.previewUrl}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                          <div style={{ wordBreak: 'break-word' }}>{item.name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span>➔ {optName}</span>
                            {isDuplicate && (
                              <span
                                className="badge badge-secondary"
                                style={{ fontSize: '0.66rem', padding: '1px 5px' }}
                                title={lang === 'bn' ? 'অনন্য নাম নির্ধারণ করা হয়েছে' : 'Unique filename assigned'}
                              >
                                {lang === 'bn' ? 'অনন্য নাম' : 'Unique'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                          {formatSize(item.originalSize)}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {item.originalWidth > 0 ? `${item.originalWidth}x${item.originalHeight}` : ''}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {item.convertedSize ? (
                            <div>
                              <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
                                {formatSize(item.convertedSize)}
                              </span>
                              {saved !== null && (
                                <span className="savings-pill" style={{ marginLeft: '6px' }}>
                                  -{saved}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {item.isStale && (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <RotateCcw size={12} /> {lang === 'bn' ? 'পুনরায় কনভার্ট' : 'Needs Re-convert'}
                            </span>
                          )}
                          {!item.isStale && item.status === 'idle' && (
                            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
                              <Clock size={12} /> {item.stage === 'queued' ? (lang === 'bn' ? 'অপেক্ষমাণ' : 'Queued') : (lang === 'bn' ? 'প্রস্তুত' : 'Ready')}
                            </span>
                          )}
                          {item.status === 'processing' && (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Loader2 size={12} className="animate-spin" />
                              {item.stage === 'decoding'
                                ? (lang === 'bn' ? 'ডিকোড হচ্ছে (২৫%)' : 'Decoding (25%)')
                                : item.stage === 'resizing'
                                ? (lang === 'bn' ? 'রিসাইজ হচ্ছে (৫০%)' : 'Resizing (50%)')
                                : item.stage === 'watermarking'
                                ? (lang === 'bn' ? 'ওয়াটারমার্ক (৭৫%)' : 'Watermarking (75%)')
                                : item.stage === 'encoding'
                                ? (lang === 'bn' ? 'এনকোড হচ্ছে (৯০%)' : 'Encoding WEBP (90%)')
                                : (lang === 'bn' ? 'প্রসেসিং...' : 'Processing...')}
                            </span>
                          )}
                          {!item.isStale && item.status === 'done' && (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={12} /> {lang === 'bn' ? 'সম্পন্ন (WEBP)' : 'Ready (WEBP)'}
                            </span>
                          )}
                          {item.status === 'error' && (
                            <div>
                              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={item.errorMessage}>
                                <AlertCircle size={12} /> {lang === 'bn' ? 'ব্যর্থ হয়েছে' : 'Failed'}
                              </span>
                              {item.errorMessage && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-error)', marginTop: '2px', wordBreak: 'break-word' }}>
                                  {item.errorMessage}
                                </div>
                              )}
                            </div>
                          )}
                          {item.status === 'cancelled' && (
                            <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <XCircle size={12} /> {lang === 'bn' ? 'বাতিল করা হয়েছে' : 'Cancelled'}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            {item.status === 'error' && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                disabled={isProcessing}
                                style={{ padding: '5px 8px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleRetrySingle(item.id)}
                                title={lang === 'bn' ? 'ছবিটি পুনরায় চেষ্টা করুন' : 'Retry conversion'}
                                aria-label={`Retry ${item.name}`}
                              >
                                <RotateCcw size={12} />
                                <span>{lang === 'bn' ? 'চেষ্টা' : 'Retry'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                              disabled={!item.convertedUrl || isProcessing}
                              onClick={() => {
                                if (!item.convertedUrl || isProcessing) return;
                                const a = document.createElement('a');
                                a.href = item.convertedUrl;
                                a.download = optName;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }}
                              aria-label={`Download ${optName}`}
                            >
                              <Download size={13} />
                              <span>WEBP</span>
                            </button>

                            <button
                              type="button"
                              className="btn-icon"
                              style={{ padding: '6px' }}
                              onClick={() => onPreviewItem(item)}
                              title="Inspect"
                              aria-label={`Inspect ${item.name}`}
                            >
                              <Maximize2 size={14} />
                            </button>

                            <button
                              type="button"
                              className="btn-icon"
                              disabled={isProcessing}
                              style={{
                                padding: '6px',
                                color: isProcessing ? 'var(--text-muted)' : 'var(--color-error)',
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                              }}
                              onClick={() => handleRemoveItem(item.id)}
                              title="Remove"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. Total Progress & Action Bar Wireframe: Overall Progress 75% | Convert All | Download ZIP */}
      {items.length > 0 && (
        <div
          className="card"
          style={{
            padding: '24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Wireframe Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'সার্বিক অগ্রগতি (Overall Progress)' : 'Overall Progress'}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {overallProgress}%
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={overallProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={lang === 'bn' ? `মোট রূপান্তর অগ্রগতি ${overallProgress}%` : `Overall batch conversion progress ${overallProgress}%`}
              aria-valuetext={`${completedCount} of ${totalCount} completed`}
              style={{
                width: '100%',
                height: '14px',
                backgroundColor: 'var(--bg-card-subtle)',
                borderRadius: '7px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: `${overallProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563EB 0%, #10B981 100%)',
                  transition: 'width 250ms ease',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              <span>{completedCount} of {totalCount} completed</span>
              {failedCount > 0 && <span style={{ color: 'var(--color-error)' }}>{failedCount} failed</span>}
            </div>
          </div>

          {/* Wireframe Action Buttons: Convert All Images | Download ZIP */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {!isProcessing ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConvertAll}
                  disabled={items.length === 0}
                  style={{ minHeight: '48px', padding: '12px 28px', fontSize: '1.02rem', fontWeight: 700 }}
                  aria-label={lang === 'bn' ? 'সব ছবি কনভার্ট করুন' : 'Convert all images'}
                >
                  <Play size={18} aria-hidden="true" />
                  <span>{lang === 'bn' ? 'সব কনভার্ট করুন (Convert All Images)' : 'Convert All Images'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancelProcessing}
                  style={{ minHeight: '48px', padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }}
                  aria-label={lang === 'bn' ? 'প্রসেসিং বাতিল করুন' : 'Cancel processing'}
                >
                  <XCircle size={18} aria-hidden="true" />
                  <span>{lang === 'bn' ? 'প্রসেসিং বাতিল করুন (Cancel)' : 'Cancel Processing'}</span>
                </button>
              )}

              <button
                type="button"
                className="btn btn-success"
                onClick={handleZipWithRetry}
                disabled={completedCount === 0 || isProcessing}
                style={{ minHeight: '48px', padding: '12px 24px', fontSize: '1rem', fontWeight: 700 }}
                aria-label={lang === 'bn' ? 'জিপ ডাউনলোড করুন' : 'Download ZIP archive'}
              >
                <Download size={18} />
                <span>{lang === 'bn' ? 'জিপ ডাউনলোড (Download ZIP)' : 'Download ZIP'}</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={onExportCsv}
                disabled={items.length === 0 || isProcessing}
                style={{ minHeight: '48px', padding: '12px 18px', fontSize: '0.95rem' }}
                aria-label={lang === 'bn' ? 'সিএসভি ফাইল ডাউনলোড' : 'Export CSV metadata'}
              >
                <FileSpreadsheet size={18} />
                <span>CSV</span>
              </button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right', maxWidth: '440px', lineHeight: 1.4 }}>
              {lang === 'bn'
                ? 'Conversion time নির্ভর করবে ছবির dimensions, ডিভাইসের RAM, CPU এবং browser codec support-এর ওপর। তাই ১০০টি ছবির জন্য নির্দিষ্ট সময়ের নিশ্চয়তা দেওয়া হবে না।'
                : 'Conversion time depends on image dimensions, device RAM, CPU, and browser codec support; no fixed time guarantee is provided for 100-image batches.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
