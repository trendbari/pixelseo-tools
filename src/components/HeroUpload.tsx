'use client';

import React, { useRef, useState } from 'react';
import { AppLanguage, ProcessedImageItem, SeoGeneratorConfig } from '@/types';
import { translations } from '@/locales/dictionary';
import { generateSeoForItem } from '@/lib/seoEngine';
import { getScenarioGuidance } from '@/lib/errorGuidance';
import { toast } from 'sonner';
import {
  UploadCloud,
  FolderUp,
  Image as ImageIcon,
  ShieldCheck,
  Trash2,
  Play,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';

interface HeroUploadProps {
  lang: AppLanguage;
  items: ProcessedImageItem[];
  setItems: React.Dispatch<React.SetStateAction<ProcessedImageItem[]>>;
  onProcessAll: () => void;
  onDownloadZip: () => void;
  onExportCsv: () => void;
  isProcessing: boolean;
  seoConfig: SeoGeneratorConfig;
}

export const HeroUpload: React.FC<HeroUploadProps> = ({
  lang,
  items,
  setItems,
  onProcessAll,
  onDownloadZip,
  onExportCsv,
  isProcessing,
  seoConfig,
}) => {
  const t = translations[lang];
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB limit
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

  const handleFiles = async (files: FileList | null) => {
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

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    const newItems: ProcessedImageItem[] = [];

    for (let idx = 0; idx < filesToAdd.length; idx++) {
      const file = filesToAdd[idx];

      // Format validation: Reject unsupported formats with reason + next step
      const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
      if (!file.type.startsWith('image/') || !hasValidExt) {
        const guidance = getScenarioGuidance('unsupported_format', lang, {
          filename: file.name,
          format: file.type || 'unknown',
        });
        toast.error(`${guidance.title}: ${guidance.whatHappened} ${guidance.nextStep}`);
        continue;
      }

      // Size limit: 20 MB max
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

      const item: ProcessedImageItem = {
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        previewUrl,
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: null,
        convertedWidth: 0,
        convertedHeight: 0,
        status: 'idle',
        stage: 'queued',
        progress: 0,
        seo: {
          title: '',
          alt: '',
          description: '',
          tags: [],
          keywords: [],
        },
      };

      // Verify real image decoding & mark corrupt if failed
      try {
        const img = new Image();
        img.src = previewUrl;
        await img.decode();
        item.originalWidth = img.naturalWidth;
        item.originalHeight = img.naturalHeight;
      } catch (decodeErr) {
        console.error(`Failed to decode image ${file.name}:`, decodeErr);
        const guidance = getScenarioGuidance('corrupt_image', lang, { filename: file.name });
        item.status = 'error';
        item.stage = 'failed';
        item.errorMessage = `${guidance.whatHappened} ${guidance.nextStep}`;
        toast.error(item.errorMessage);
      }

      // Auto generate initial SEO metadata
      item.seo = generateSeoForItem(item, seoConfig);
      newItems.push(item);
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClearAll = () => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি সব ছবি মুছে ফেলতে চান?' : 'Are you sure you want to clear all images?')) {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
      setItems([]);
    }
  };

  return (
    <section className="hero-section" id="hero">
      {/* Wireframe Badge */}
      <div className="hero-badges">
        <span className="badge badge-primary">
          <Sparkles size={14} />
          {t.heroBadge}
        </span>
        <span className="badge badge-success">
          <ShieldCheck size={14} />
          {t.badgeFree}
        </span>
      </div>

      {/* Wireframe Headline: Convert, Optimize & Rank Better. */}
      <h1 className="hero-title">
        {lang === 'bn' ? (
          <>
            কনভার্ট করুন, <span className="gradient-text">অপ্টিমাইজ করুন</span> ও সেরা র‍্যাংকিং পান।
          </>
        ) : (
          <>
            Convert, <span className="gradient-text">Optimize</span> & Rank Better.
          </>
        )}
      </h1>

      {/* Wireframe Description: Everything you need to optimize your images and SEO content — in one place. */}
      <p className="hero-subtitle">
        {t.heroDescription}
      </p>

      {/* Wireframe Drag & Drop Upload Zone */}
      <div
        className={`dropzone ${isDragOver ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          type="file"
          ref={folderInputRef}
          multiple
          // @ts-expect-error webkitdirectory is standard for folder upload in modern browsers
          webkitdirectory=""
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="dropzone-icon-circle">
          <UploadCloud size={32} />
        </div>

        {/* Wireframe Upload Copy */}
        <h3 className="dropzone-title">{t.dragDropTitle}</h3>
        <p className="dropzone-desc">{t.dragDropSubtitle}</p>

        <div
          className="dropzone-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: '12px 26px', fontSize: '1rem', fontWeight: 700 }}
          >
            <ImageIcon size={20} />
            <span>{t.chooseImagesBtn}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => folderInputRef.current?.click()}
            style={{ padding: '12px 20px', fontSize: '0.95rem' }}
          >
            <FolderUp size={18} />
            <span>{t.chooseFolderBtn}</span>
          </button>
        </div>

        {/* Wireframe sub-guarantee: Local processing • No signup required */}
        <div
          style={{
            marginTop: '20px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Lock size={14} style={{ color: 'var(--color-success)' }} />
          <span>{t.localProcessingNote}</span>
        </div>
      </div>

      {/* Quick Action Toolbar when images are in queue */}
      {items.length > 0 && (
        <div
          style={{
            marginTop: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={onProcessAll}
              disabled={isProcessing}
            >
              <Play size={16} />
              <span>{isProcessing ? t.processing : t.processAll}</span>
            </button>

            <button
              className="btn btn-success"
              onClick={onDownloadZip}
              disabled={isProcessing || !items.some((i) => i.status === 'done')}
            >
              <Download size={16} />
              <span>{t.downloadZip}</span>
            </button>

            <button
              className="btn btn-outline"
              onClick={onExportCsv}
            >
              <FileSpreadsheet size={16} />
              <span>{t.exportCsv}</span>
            </button>
          </div>

          <button
            className="btn btn-danger"
            onClick={handleClearAll}
          >
            <Trash2 size={16} />
            <span>{t.clearAll} ({items.length})</span>
          </button>
        </div>
      )}
    </section>
  );
};
