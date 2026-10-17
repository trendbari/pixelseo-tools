import { create } from 'zustand';
import { ProcessedImageItem, generateUniqueImageId } from '@/types';
import { validateImageBatch } from '@/lib/image/validation';
import { toast } from 'sonner';

interface ImageState {
  items: ProcessedImageItem[];
  activeItemId: string | null;
  isProcessing: boolean;
  totalProgress: number;
  addFiles: (files: File[]) => void;
  removeImage: (id: string) => void;
  clearAllImages: () => void;
  setActiveItem: (id: string | null) => void;
  updateItemProgress: (id: string, progress: number, status?: ProcessedImageItem['status']) => void;
  updateItemResult: (
    id: string,
    result: { blob: Blob; url: string; width: number; height: number; size: number }
  ) => void;
  setItemError: (id: string, error: string) => void;
  setIsProcessing: (val: boolean) => void;
  setTotalProgress: (val: number) => void;
  markAllStale: () => void;
}

export const useImageStore = create<ImageState>((set) => ({
  items: [],
  activeItemId: null,
  isProcessing: false,
  totalProgress: 0,

  addFiles: (files: File[]) => {
    const res = validateImageBatch(files);

    if (res.errors && res.errors.length > 0) {
      toast.error(`${res.errors.length} file(s) failed validation`, {
        description: res.errors[0]?.error,
      });
    }

    if (!res.success || !res.validFiles || res.validFiles.length === 0) return;

    const validFiles = res.validFiles;

    set((state) => {
      const remainingSlots = Math.max(0, 100 - state.items.length);
      const toAdd = validFiles.slice(0, remainingSlots);

      if (toAdd.length < validFiles.length) {
        toast.warning('Maximum queue limit reached (100 images)');
      }

      const newItems: ProcessedImageItem[] = toAdd.map((file) => ({
        id: generateUniqueImageId(),
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        previewUrl: URL.createObjectURL(file),
        status: 'idle',
        progress: 0,
        isStale: false,
        seo: {
          title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
          alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' '),
          description: '',
          tags: [],
          keywords: [],
        },
      }));

      toast.success(`Added ${newItems.length} image(s) to workspace`);
      return { items: [...state.items, ...newItems] };
    });
  },

  removeImage: (id: string) => {
    set((state) => {
      const target = state.items.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      return { items: state.items.filter((item) => item.id !== id) };
    });
  },

  clearAllImages: () => {
    set((state) => {
      state.items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
      });
      return { items: [], activeItemId: null, totalProgress: 0, isProcessing: false };
    });
    toast.info('Workspace cleared');
  },

  setActiveItem: (id) => set({ activeItemId: id }),

  updateItemProgress: (id, progress, status) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              progress,
              status: status || (progress === 100 ? 'done' : progress > 0 ? 'processing' : item.status),
            }
          : item
      ),
    }));
  },

  updateItemResult: (id, result) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== id) return item;
        // Revoke previous convertedUrl if present and different
        if (item.convertedUrl && item.convertedUrl !== result.url) {
          try { URL.revokeObjectURL(item.convertedUrl); } catch {}
        }

        const compressionPercent = item.originalSize
          ? Math.round(((item.originalSize - result.size) / item.originalSize) * 100)
          : 0;

        return {
          ...item,
          status: 'done',
          progress: 100,
          convertedBlob: result.blob,
          convertedUrl: result.url,
          convertedSize: result.size,
          convertedWidth: result.width,
          convertedHeight: result.height,
          compressionPercent,
          watermarkApplied: true,
          isStale: false,
        };
      }),
    }));
  },

  setItemError: (id, error) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: 'error', errorMessage: error } : item
      ),
    }));
  },

  setIsProcessing: (val) => set({ isProcessing: val }),
  setTotalProgress: (val) => set({ totalProgress: val }),

  markAllStale: () => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.status === 'done' || item.convertedBlob) {
          if (item.convertedUrl) {
            try { URL.revokeObjectURL(item.convertedUrl); } catch {}
          }
          return {
            ...item,
            status: 'idle',
            progress: 0,
            convertedBlob: null,
            convertedUrl: null,
            convertedSize: null,
            compressionPercent: undefined,
            isStale: true,
          };
        }
        return item;
      }),
    }));
  },
}));
