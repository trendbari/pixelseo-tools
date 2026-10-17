import { create } from 'zustand';
import { toast } from 'sonner';
import {
  AppLanguage,
  AppTheme,
  ProcessedImageItem,
  ConversionPreferences,
  WatermarkPreferences,
  SeoGeneratorConfig,
  generateUniqueImageId,
} from '@/types';
import { processImageWithWorkerOrFallback } from '@/lib/workers/workerBridge';
import { generateSeoForItem } from '@/lib/seoEngine';
import { exportMetadataToCsv } from '@/lib/csvExporter';
import { downloadAllAsZip, downloadInBatches, estimateZipMemoryUsage } from '@/lib/zipExporter';
import { imageFileSchema } from '@/lib/validation';
import { ProcessingQueue } from '@/lib/image/queue';
import { generateImageThumbnail } from '@/lib/image/thumbnails';
import { getScenarioGuidance } from '@/lib/errorGuidance';

let activeStoreQueue: ProcessingQueue | null = null;

export interface PixelSeoState {
  // Localization & Theme
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Processing Queue
  items: ProcessedImageItem[];
  setItems: (items: ProcessedImageItem[] | ((prev: ProcessedImageItem[]) => ProcessedImageItem[])) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  zipProgress: number | null;
  setZipProgress: (zipProgress: number | null) => void;
  previewItem: ProcessedImageItem | null;
  setPreviewItem: (item: ProcessedImageItem | null) => void;
  isPreferencesOpen: boolean;
  setIsPreferencesOpen: (open: boolean) => void;
  batchProgress: { completed: number; total: number } | null;
  setBatchProgress: (batchProgress: { completed: number; total: number } | null) => void;

  // Preferences
  convPrefs: ConversionPreferences;
  setConvPrefs: (prefs: ConversionPreferences | ((prev: ConversionPreferences) => ConversionPreferences)) => void;
  wmPrefs: WatermarkPreferences;
  setWmPrefs: (prefs: WatermarkPreferences | ((prev: WatermarkPreferences) => WatermarkPreferences)) => void;
  seoConfig: SeoGeneratorConfig;
  setSeoConfig: (config: SeoGeneratorConfig | ((prev: SeoGeneratorConfig) => SeoGeneratorConfig)) => void;

  // Actions
  handleUploadFiles: (files: FileList | File[] | null) => Promise<void>;
  handleLoadDemoImages: () => Promise<void>;
  handleConvertAll: () => Promise<void>;
  handleConvertSingle: (id: string) => Promise<void>;
  handleCancelProcessing: () => void;
  handleRetryFailed: () => Promise<void>;
  handleRemoveItem: (id: string) => void;
  handleClearAll: () => void;
  handleDownloadZip: () => Promise<void>;
  handleDownloadInBatches: (batchSize?: number) => Promise<void>;
  handleExportCsv: () => void;
  markItemsStale: () => void;
}

export const usePixelSeoStore = create<PixelSeoState>((set, get) => ({
  lang: 'en',
  setLang: (newLang) => {
    set({ lang: newLang });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pixelseo_lang', newLang);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', newLang);
      document.documentElement.lang = newLang;
    }
  },

  theme: 'light',
  setTheme: (newTheme) => {
    set({ theme: newTheme });
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('pixelseo_theme', newTheme);
      } catch {}
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  },

  items: [],
  setItems: (updater) => {
    set((state) => {
      const nextItems = typeof updater === 'function' ? updater(state.items) : updater;
      // Revoke URLs for any removed items to prevent memory leaks
      const nextIds = new Set(nextItems.map((it) => it.id));
      state.items.forEach((oldItem) => {
        if (!nextIds.has(oldItem.id)) {
          if (oldItem.previewUrl) {
            try { URL.revokeObjectURL(oldItem.previewUrl); } catch {}
          }
          if (oldItem.thumbnailUrl && oldItem.thumbnailUrl !== oldItem.previewUrl) {
            try { URL.revokeObjectURL(oldItem.thumbnailUrl); } catch {}
          }
          if (oldItem.convertedUrl) {
            try { URL.revokeObjectURL(oldItem.convertedUrl); } catch {}
          }
        }
      });
      return { items: nextItems };
    });
  },

  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),

  zipProgress: null,
  setZipProgress: (zipProgress) => set({ zipProgress }),

  previewItem: null,
  setPreviewItem: (previewItem) => set({ previewItem }),

  isPreferencesOpen: false,
  setIsPreferencesOpen: (isPreferencesOpen) => set({ isPreferencesOpen }),
  batchProgress: null,
  setBatchProgress: (batchProgress) => set({ batchProgress }),

  convPrefs: {
    format: 'webp',
    quality: 85,
    resizeEnabled: false,
    maxWidth: 1920,
    maxHeight: 1080,
    preserveAspectRatio: true,
    namingPattern: 'original',
    prefix: '',
    suffix: '',
  },
  setConvPrefs: (updater) => {
    set((state) => {
      const nextConvPrefs = typeof updater === 'function' ? updater(state.convPrefs) : updater;

      // Persist serializable preferences to localStorage (never store Blobs)
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('pixelseo_quality', String(nextConvPrefs.quality));
          localStorage.setItem('pixelseo_conv_prefs', JSON.stringify(nextConvPrefs));
        } catch {}
      }

      // Check if conversion preferences changed
      const hasChanged = JSON.stringify(state.convPrefs) !== JSON.stringify(nextConvPrefs);

      let nextItems = state.items;
      if (hasChanged && !state.isProcessing) {
        nextItems = state.items.map((it) => {
          if (it.status === 'done' || it.convertedBlob) {
            if (it.convertedUrl) {
              try { URL.revokeObjectURL(it.convertedUrl); } catch {}
            }
            return {
              ...it,
              status: 'idle',
              progress: 0,
              convertedBlob: null,
              convertedUrl: null,
              convertedSize: null,
              compressionPercent: undefined,
              isStale: true,
            };
          }
          return it;
        });
      }

      return {
        convPrefs: nextConvPrefs,
        items: nextItems,
      };
    });
  },

  wmPrefs: {
    enabled: false,
    type: 'text',
    text: '© My Brand',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 28,
    position: 'bottom-right',
    opacity: 0.55,
    logoBlob: null,
    logoUrl: null,
    logoScale: 0.2,
    rotation: 0,
    margin: 24,
    hasShadow: true,
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    shadowBlur: 6,
    applyScope: 'all',
    selectedImageIds: [],
  },
  setWmPrefs: (updater) => {
    set((state) => {
      const nextWmPrefs = typeof updater === 'function' ? updater(state.wmPrefs) : updater;

      // Save serializable watermark preferences (NEVER logoBlob or logoUrl!)
      if (typeof localStorage !== 'undefined') {
        try {
          const serializableWm = {
            enabled: nextWmPrefs.enabled,
            type: nextWmPrefs.type,
            text: nextWmPrefs.text,
            textColor: nextWmPrefs.textColor,
            fontFamily: nextWmPrefs.fontFamily,
            fontSize: nextWmPrefs.fontSize,
            position: nextWmPrefs.position,
            opacity: nextWmPrefs.opacity,
            logoScale: nextWmPrefs.logoScale,
            rotation: nextWmPrefs.rotation,
            margin: nextWmPrefs.margin,
            hasShadow: nextWmPrefs.hasShadow,
            shadowColor: nextWmPrefs.shadowColor,
            shadowBlur: nextWmPrefs.shadowBlur,
            applyScope: nextWmPrefs.applyScope,
          };
          localStorage.setItem('pixelseo_wm_prefs', JSON.stringify(serializableWm));
        } catch {}
      }

      // Check if watermark settings changed
      const oldKeys = { ...state.wmPrefs, logoBlob: null, logoUrl: null };
      const newKeys = { ...nextWmPrefs, logoBlob: null, logoUrl: null };
      const hasChanged = JSON.stringify(oldKeys) !== JSON.stringify(newKeys);

      let nextItems = state.items;
      if (hasChanged && !state.isProcessing) {
        nextItems = state.items.map((it) => {
          if (it.status === 'done' || it.convertedBlob) {
            if (it.convertedUrl) {
              try { URL.revokeObjectURL(it.convertedUrl); } catch {}
            }
            return {
              ...it,
              status: 'idle',
              progress: 0,
              convertedBlob: null,
              convertedUrl: null,
              convertedSize: null,
              compressionPercent: undefined,
              isStale: true,
            };
          }
          return it;
        });
      }

      return {
        wmPrefs: nextWmPrefs,
        items: nextItems,
      };
    });
  },

  markItemsStale: () => {
    set((state) => ({
      items: state.items.map((it) => {
        if (it.status === 'done' || it.convertedBlob) {
          if (it.convertedUrl) {
            try { URL.revokeObjectURL(it.convertedUrl); } catch {}
          }
          return {
            ...it,
            status: 'idle',
            progress: 0,
            convertedBlob: null,
            convertedUrl: null,
            convertedSize: null,
            compressionPercent: undefined,
            isStale: true,
          };
        }
        return it;
      }),
    }));
  },

  seoConfig: {
    brandName: '',
    category: '',
    defaultAltTemplate: '',
    defaultTitleTemplate: '',
    autoExtractKeywords: true,
    ecommercePreset: 'standard',
  },
  setSeoConfig: (updater) => {
    set((state) => ({
      seoConfig: typeof updater === 'function' ? updater(state.seoConfig) : updater,
    }));
  },

  handleUploadFiles: async (files) => {
    if (!files || files.length === 0) return;
    const { items, convPrefs, seoConfig, lang } = get();

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

    const batch = Array.from(files).slice(0, availableSlots);
    const newItems: ProcessedImageItem[] = [];

    for (let idx = 0; idx < batch.length; idx++) {
      const file = batch[idx];

      // Zod Validation
      const validation = imageFileSchema.safeParse({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      if (!validation.success) {
        const guidance = getScenarioGuidance('unsupported_format', lang, {
          filename: file.name,
          format: file.type || 'unknown',
        });
        toast.error(`${guidance.title}: ${guidance.whatHappened} ${guidance.nextStep}`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const id = generateUniqueImageId();

      let thumbnailUrl: string | null = null;
      let origW = 0;
      let origH = 0;

      try {
        const thumb = await generateImageThumbnail(file, 320);
        thumbnailUrl = thumb.thumbnailUrl;
        origW = thumb.originalWidth;
        origH = thumb.originalHeight;
      } catch {
        thumbnailUrl = previewUrl;
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
        status: 'idle',
        stage: 'queued',
        progress: 0,
        isStale: false,
        seo: {
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
          alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
          description: '',
          tags: [],
          keywords: [],
        },
      };

      item.seo = generateSeoForItem(item, seoConfig);
      newItems.push(item);
    }

    if (newItems.length > 0) {
      set((state) => ({ items: [...state.items, ...newItems] }));
      toast.success(
        lang === 'bn'
          ? `${newItems.length}টি ছবি কিউতে যুক্ত হয়েছে!`
          : `Added ${newItems.length} images to processing queue!`
      );

      // Async natural dimensions decode
      if (typeof Image !== 'undefined') {
        newItems.forEach((itm) => {
          const img = new Image();
          img.src = itm.previewUrl;
          img.onload = () => {
            set((state) => ({
              items: state.items.map((p) =>
                p.id === itm.id
                  ? { ...p, originalWidth: img.naturalWidth, originalHeight: img.naturalHeight }
                  : p
              ),
            }));
          };
        });
      }
    }
  },

  handleLoadDemoImages: async () => {
    const demoSpecs = [
      { name: 'image-1.jpg', width: 1200, height: 800, color: '#3B82F6', title: 'Blue Ocean Breeze' },
      { name: 'image-2.jpg', width: 1080, height: 1080, color: '#10B981', title: 'Emerald Forest Bag' },
      { name: 'image-3.jpg', width: 1920, height: 1080, color: '#F59E0B', title: 'Golden Sunset Watch' },
      { name: 'image-4.jpg', width: 800, height: 1200, color: '#8B5CF6', title: 'Purple Leather Jacket' },
      { name: 'image-5.jpg', width: 1400, height: 900, color: '#EF4444', title: 'Ruby Athletic Shoes' },
      { name: 'image-6.jpg', width: 1200, height: 1200, color: '#06B6D4', title: 'Cyan Tech Gadget' },
    ];

    const demoItems: ProcessedImageItem[] = [];

    for (let i = 0; i < demoSpecs.length; i++) {
      const spec = demoSpecs[i];
      const canvas = document.createElement('canvas');
      canvas.width = spec.width;
      canvas.height = spec.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      const grad = ctx.createLinearGradient(0, 0, spec.width, spec.height);
      grad.addColorStop(0, spec.color);
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, spec.width, spec.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = `bold ${Math.max(28, Math.floor(spec.width / 22))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(spec.title, spec.width / 2, spec.height / 2);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.9);
      });

      const file = new File([blob], spec.name, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      const id = generateUniqueImageId('demo');

      const item: ProcessedImageItem = {
        id,
        file,
        name: spec.name,
        originalSize: blob.size,
        originalWidth: spec.width,
        originalHeight: spec.height,
        previewUrl,
        status: 'idle',
        stage: 'queued',
        progress: 0,
        seo: {
          title: spec.title,
          alt: `${spec.title} - High resolution product photo`,
          description: `Shop authentic ${spec.title} with premium finish and fast delivery.`,
          tags: ['demo', 'sample', 'pixel-seo', 'webp'],
          keywords: [spec.title.toLowerCase(), 'e-commerce', 'photo'],
        },
      };

      demoItems.push(item);
    }

    set((state) => ({ items: [...state.items, ...demoItems] }));
    toast.success('Loaded 6 demo catalog images!');
  },

  handleConvertAll: async () => {
    const { items, isProcessing, convPrefs, wmPrefs, lang } = get();
    if (items.length === 0 || isProcessing) return;

    const pendingItems = items.filter((it) => it.status !== 'done' || it.isStale);
    if (pendingItems.length === 0) return;

    set((state) => ({
      isProcessing: true,
      items: state.items.map((it) =>
        it.status !== 'done' || it.isStale
          ? { ...it, status: 'idle', stage: 'queued', progress: 0, isStale: false, errorMessage: undefined }
          : it
      ),
    }));

    activeStoreQueue = new ProcessingQueue(2);

    try {
      await activeStoreQueue.run(pendingItems, convPrefs, wmPrefs, {
        onItemStart: (id) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id ? { ...it, status: 'processing', stage: 'decoding', progress: 25 } : it
            ),
          }));
        },
        onItemStage: (id, stage, progress) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id
                ? {
                    ...it,
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
                : it
            ),
          }));
        },
        onItemProgress: (id, progress) => {
          set((state) => ({
            items: state.items.map((it) => (it.id === id ? { ...it, progress } : it)),
          }));
        },
        onItemSuccess: (id, result) => {
          set((state) => {
            const currentItem = state.items.find((it) => it.id === id);
            const originalSize = currentItem?.originalSize || 0;
            const compressionPercent =
              originalSize > 0
                ? Math.max(0, Math.round(((originalSize - result.size) / originalSize) * 100))
                : 0;

            if (currentItem?.convertedUrl && currentItem.convertedUrl !== result.url) {
              try { URL.revokeObjectURL(currentItem.convertedUrl); } catch {}
            }

            return {
              items: state.items.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      status: 'done',
                      stage: 'completed',
                      progress: 100,
                      convertedBlob: result.blob,
                      convertedUrl: result.url,
                      convertedSize: result.size,
                      convertedWidth: result.width,
                      convertedHeight: result.height,
                      compressionPercent,
                      watermarkApplied: wmPrefs.enabled,
                      errorMessage: undefined,
                      isStale: false,
                    }
                  : it
              ),
            };
          });
        },
        onItemError: (id, err) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id
                ? {
                    ...it,
                    status: 'error',
                    stage: 'failed',
                    progress: 0,
                    errorMessage: err || 'Conversion failed',
                  }
                : it
            ),
          }));
        },
        onTotalProgress: (completed, total) => {
          set({ batchProgress: { completed, total } });
        },
      });

      toast.success(lang === 'bn' ? 'সবগুলো ছবি সফলভাবে কনভার্ট হয়েছে!' : 'All images converted to WebP successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Queue conversion failed');
    } finally {
      set({ isProcessing: false, batchProgress: null });
      activeStoreQueue = null;
    }
  },

  handleConvertSingle: async (id) => {
    const { items, convPrefs, wmPrefs } = get();
    const item = items.find((it) => it.id === id);
    if (!item) return;

    set((state) => ({
      items: state.items.map((it) =>
        it.id === id ? { ...it, status: 'processing', stage: 'decoding', progress: 25 } : it
      ),
    }));

    try {
      if (convPrefs.resizeEnabled) {
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, stage: 'resizing', progress: 50 } : it
          ),
        }));
      }

      if (wmPrefs.enabled) {
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, stage: 'watermarking', progress: 75 } : it
          ),
        }));
      }

      set((state) => ({
        items: state.items.map((it) =>
          it.id === id ? { ...it, stage: 'encoding', progress: 90 } : it
        ),
      }));

      const isWatermarkApplicable =
        wmPrefs.enabled &&
        (wmPrefs.applyScope === 'all' ||
          (wmPrefs.applyScope === 'selected' &&
            Array.isArray(wmPrefs.selectedImageIds) &&
            wmPrefs.selectedImageIds.includes(item.id)));

      const effectiveWmPrefs = isWatermarkApplicable ? wmPrefs : { ...wmPrefs, enabled: false };

      const result = await processImageWithWorkerOrFallback(item, convPrefs, effectiveWmPrefs);
      const compressionPercent =
        item.originalSize > 0
          ? Math.max(0, Math.round(((item.originalSize - result.size) / item.originalSize) * 100))
          : 0;

      // Revoke previous convertedUrl if present and different
      if (item.convertedUrl && item.convertedUrl !== result.url) {
        try { URL.revokeObjectURL(item.convertedUrl); } catch {}
      }

      set((state) => ({
        items: state.items.map((it) =>
          it.id === id
            ? {
                ...it,
                status: 'done',
                stage: 'completed',
                progress: 100,
                convertedBlob: result.blob,
                convertedUrl: result.url,
                convertedSize: result.size,
                convertedWidth: result.width,
                convertedHeight: result.height,
                compressionPercent,
                watermarkApplied: wmPrefs.enabled,
                errorMessage: undefined,
                isStale: false,
              }
            : it
        ),
      }));
      toast.success(`Converted ${item.name}`);
    } catch (err: any) {
      set((state) => ({
        items: state.items.map((it) =>
          it.id === id
            ? { ...it, status: 'error', stage: 'failed', progress: 0, errorMessage: err?.message || 'Failed' }
            : it
        ),
      }));
    }
  },

  handleCancelProcessing: () => {
    if (activeStoreQueue) {
      activeStoreQueue.cancel();
      activeStoreQueue = null;
    }
    set((state) => ({
      isProcessing: false,
      items: state.items.map((it) =>
        it.status === 'processing' || it.stage === 'queued'
          ? { ...it, status: 'cancelled', stage: 'cancelled', progress: 0 }
          : it
      ),
    }));
    toast.info('Processing cancelled');
  },

  handleRetryFailed: async () => {
    const { items, convPrefs, wmPrefs } = get();
    const failedItems = items.filter((it) => it.status === 'error' || it.stage === 'failed');
    if (failedItems.length === 0) return;

    set((state) => ({
      isProcessing: true,
      items: state.items.map((it) =>
        it.status === 'error' || it.stage === 'failed'
          ? { ...it, status: 'idle', stage: 'queued', progress: 0, errorMessage: undefined }
          : it
      ),
    }));

    activeStoreQueue = new ProcessingQueue(2);

    try {
      await activeStoreQueue.run(failedItems, convPrefs, wmPrefs, {
        onItemStart: (id) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id ? { ...it, status: 'processing', stage: 'decoding', progress: 25 } : it
            ),
          }));
        },
        onItemStage: (id, stage, progress) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id
                ? {
                    ...it,
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
                : it
            ),
          }));
        },
        onItemProgress: (id, progress) => {
          set((state) => ({
            items: state.items.map((it) => (it.id === id ? { ...it, progress } : it)),
          }));
        },
        onItemSuccess: (id, result) => {
          set((state) => {
            const currentItem = state.items.find((it) => it.id === id);
            const originalSize = currentItem?.originalSize || 0;
            const compressionPercent =
              originalSize > 0
                ? Math.max(0, Math.round(((originalSize - result.size) / originalSize) * 100))
                : 0;

            if (currentItem?.convertedUrl && currentItem.convertedUrl !== result.url) {
              try { URL.revokeObjectURL(currentItem.convertedUrl); } catch {}
            }

            return {
              items: state.items.map((it) =>
                it.id === id
                  ? {
                      ...it,
                      status: 'done',
                      stage: 'completed',
                      progress: 100,
                      convertedBlob: result.blob,
                      convertedUrl: result.url,
                      convertedSize: result.size,
                      convertedWidth: result.width,
                      convertedHeight: result.height,
                      compressionPercent,
                      watermarkApplied: wmPrefs.enabled,
                      errorMessage: undefined,
                      isStale: false,
                    }
                  : it
              ),
            };
          });
        },
        onItemError: (id, err) => {
          set((state) => ({
            items: state.items.map((it) =>
              it.id === id
                ? {
                    ...it,
                    status: 'error',
                    stage: 'failed',
                    progress: 0,
                    errorMessage: err || 'Conversion failed',
                  }
                : it
            ),
          }));
        },
        onTotalProgress: (completed, total) => {
          set({ batchProgress: { completed, total } });
        },
      });
    } finally {
      set({ isProcessing: false, batchProgress: null });
      activeStoreQueue = null;
    }
  },

  handleRemoveItem: (id) => {
    set((state) => {
      const target = state.items.find((it) => it.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.thumbnailUrl && target.thumbnailUrl !== target.previewUrl) URL.revokeObjectURL(target.thumbnailUrl);
        if (target.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      }
      return { items: state.items.filter((it) => it.id !== id) };
    });
  },

  handleClearAll: () => {
    const { items, lang } = get();
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      if (it.thumbnailUrl && it.thumbnailUrl !== it.previewUrl) URL.revokeObjectURL(it.thumbnailUrl);
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl);
    });
    set({ items: [] });
    toast.info(lang === 'bn' ? 'কিউ খালি করা হয়েছে' : 'Workspace queue cleared');
  },

  handleDownloadZip: async () => {
    const { items, convPrefs, wmPrefs, seoConfig, lang } = get();
    const completedItems = items.filter((it) => it.status === 'done' && it.convertedBlob);

    if (completedItems.length === 0) {
      toast.error(lang === 'bn' ? 'প্রথমে ছবি কনভার্ট করুন।' : 'Convert images first before downloading.');
      return;
    }

    // Optimization 6: Consider estimated memory usage before ZIP generation
    const memEstimate = estimateZipMemoryUsage(completedItems);
    if (memEstimate.isHighMemory) {
      toast.warning(
        lang === 'bn'
          ? `আনুমানিক মেমোরি ব্যবহার ${memEstimate.formattedTotal}। প্যাকেজিং চলাকালীন ট্যাব খোলা রাখুন।`
          : `Estimated archive memory: ${memEstimate.formattedTotal}. Packaging in progress, keep this tab open.`
      );
    }

    try {
      set({ zipProgress: 10 });
      await downloadAllAsZip(
        completedItems,
        convPrefs,
        seoConfig,
        wmPrefs,
        (progress) => set({ zipProgress: progress })
      );
      toast.success(lang === 'bn' ? 'জিপ ডাউনলোড শুরু হয়েছে!' : 'ZIP package downloaded successfully!');
    } catch (e: any) {
      toast.error(`ZIP creation failed: ${e?.message || e}`);
    } finally {
      setTimeout(() => set({ zipProgress: null }), 1000);
    }
  },

  handleDownloadInBatches: async (batchSize = 30) => {
    const { items, convPrefs, wmPrefs, seoConfig, lang } = get();
    const completedItems = items.filter((it) => it.status === 'done' && it.convertedBlob);

    if (completedItems.length === 0) {
      toast.error(lang === 'bn' ? 'প্রথমে ছবি কনভার্ট করুন।' : 'Convert images first before downloading.');
      return;
    }

    try {
      set({ zipProgress: 10 });
      const result = await downloadInBatches(
        completedItems,
        convPrefs,
        seoConfig,
        wmPrefs,
        batchSize,
        (currentBatch, totalBatches, pct) => {
          const overall = Math.round(((currentBatch - 1) / totalBatches) * 100 + pct / totalBatches);
          set({ zipProgress: overall });
        }
      );
      toast.success(
        lang === 'bn'
          ? `${result.totalBatches}টি পার্টে মোট ${result.totalExported}টি ছবি সফলভাবে ডাউনলোড হয়েছে!`
          : `Safely exported ${result.totalExported} images across ${result.totalBatches} smaller archive parts!`
      );
    } catch (e: any) {
      toast.error(`Batch export failed: ${e?.message || e}`);
    } finally {
      setTimeout(() => set({ zipProgress: null }), 1000);
    }
  },

  handleExportCsv: () => {
    const { items, convPrefs, wmPrefs, lang } = get();
    if (items.length === 0) {
      toast.error(lang === 'bn' ? 'এক্সপোর্ট করার মতো কোনো ছবি নেই।' : 'No images available to export.');
      return;
    }
    exportMetadataToCsv(items, convPrefs, wmPrefs);
    toast.success(lang === 'bn' ? 'সিএসভি ফাইল ডাউনলোড হয়েছে!' : '16-column CSV metadata exported!');
  },
}));
