export type ConversionFormat = 'webp' | 'png' | 'jpeg';

export type ImageStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ProcessingStage =
  | 'queued'
  | 'decoding'
  | 'resizing'
  | 'watermarking'
  | 'encoding'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImageItem {
  id: string;
  originalFile: File;
  originalName: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalType: 'image/jpeg' | 'image/png';

  outputName: string;
  outputBlob?: Blob;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;

  status: ImageStatus;
  stage?: ProcessingStage;
  progress: number;
  error?: string;

  watermarkApplied: boolean;
  altText: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  isStale?: boolean;
}

export interface ConversionSettings {
  format: 'webp';
  quality: number; // 1-100
  resizeEnabled: boolean;
  width?: number;
  height?: number;
  maintainAspectRatio: boolean;
  filenameSuffix: string;
  watermarkEnabled: boolean;
}

export interface ProcessedImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  thumbnailUrl?: string | null;
  convertedBlob?: Blob | null;
  convertedUrl?: string | null;
  convertedSize?: number | null;
  convertedWidth?: number;
  convertedHeight?: number;
  compressionPercent?: number;
  watermarkApplied?: boolean;
  status: 'idle' | 'queued' | 'processing' | 'done' | 'completed' | 'error' | 'failed' | 'cancelled';
  stage?: ProcessingStage;
  progress: number;
  errorMessage?: string;
  isStale?: boolean;
  seo: {
    title: string;
    alt: string;
    description: string;
    tags: string[];
    keywords: string[];
  };
}

export interface ConversionPreferences {
  format: ConversionFormat;
  quality: number; // 10 to 100
  resizeEnabled: boolean;
  maxWidth: number;
  maxHeight: number;
  preserveAspectRatio: boolean;
  namingPattern: 'original' | 'kebab' | 'seo-slug' | 'custom';
  prefix: string;
  suffix: string;
}

export interface ImageProcessingOptions {
  format: ConversionFormat;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveAspectRatio?: boolean;
}

/**
 * Adapter: Convert ProcessedImageItem to ImageItem
 */
export function toImageItem(item: ProcessedImageItem): ImageItem {
  const statusMap: Record<ProcessedImageItem['status'], ImageStatus> = {
    idle: 'queued',
    queued: 'queued',
    processing: 'processing',
    done: 'completed',
    completed: 'completed',
    error: 'failed',
    failed: 'failed',
    cancelled: 'cancelled',
  };

  const origType =
    item.file.type === 'image/png' ? ('image/png' as const) : ('image/jpeg' as const);

  return {
    id: item.id,
    originalFile: item.file,
    originalName: item.name,
    originalSize: item.originalSize,
    originalWidth: item.originalWidth,
    originalHeight: item.originalHeight,
    originalType: origType,
    outputName: item.name.replace(/\.[^/.]+$/, '.webp'),
    outputBlob: item.convertedBlob || undefined,
    outputSize: item.convertedSize || undefined,
    outputWidth: item.convertedWidth,
    outputHeight: item.convertedHeight,
    status: statusMap[item.status] || 'queued',
    stage: item.stage,
    progress: item.progress,
    error: item.errorMessage,
    watermarkApplied: Boolean(item.watermarkApplied),
    altText: item.seo?.alt || '',
    seoTitle: item.seo?.title || '',
    metaDescription: item.seo?.description || '',
    keywords: item.seo?.keywords || [],
    isStale: item.isStale,
  };
}

/**
 * Adapter: Convert ImageItem to ProcessedImageItem
 */
export function fromImageItem(item: ImageItem): ProcessedImageItem {
  const statusMap: Record<ImageStatus, ProcessedImageItem['status']> = {
    queued: 'idle',
    processing: 'processing',
    completed: 'done',
    failed: 'error',
    cancelled: 'cancelled',
  };

  return {
    id: item.id,
    file: item.originalFile,
    name: item.originalName,
    originalSize: item.originalSize,
    originalWidth: item.originalWidth,
    originalHeight: item.originalHeight,
    previewUrl: URL.createObjectURL(item.originalFile),
    convertedBlob: item.outputBlob,
    convertedUrl: item.outputBlob ? URL.createObjectURL(item.outputBlob) : null,
    convertedSize: item.outputSize,
    convertedWidth: item.outputWidth,
    convertedHeight: item.outputHeight,
    compressionPercent:
      item.originalSize && item.outputSize
        ? Math.round(((item.originalSize - item.outputSize) / item.originalSize) * 100)
        : 0,
    watermarkApplied: item.watermarkApplied,
    status: statusMap[item.status] || 'idle',
    stage: item.stage,
    progress: item.progress,
    errorMessage: item.error,
    isStale: item.isStale,
    seo: {
      title: item.seoTitle,
      alt: item.altText,
      description: item.metaDescription,
      tags: item.keywords,
      keywords: item.keywords,
    },
  };
}

/**
 * Robust unique ID generator for images to prevent filename conflicts
 */
export function generateUniqueImageId(prefix = 'img'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 9)}`;
}

