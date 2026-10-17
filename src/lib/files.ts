/**
 * File Management & Validation Utilities (src/lib/files.ts)
 * 
 * Provides:
 * - Single and batch image validation (SEC-01)
 * - Safe filename normalization and path traversal prevention (SEC-02, SEC-10)
 * - Human-readable file size formatting
 * - Image dimension reading via HTML5 Image API
 * - ImageItem construction with memory cleanup guarantees
 */

import { ProcessedImageItem, generateUniqueImageId } from '@/types';
import { processingLimits } from '@/config/limits';
import { sanitizeSafeFilename } from './security/filenameSanitizer';
import { validateImageFile, validateImageBatch, ImageBatchValidationResult } from './image/validation';

export { validateImageFile, validateImageBatch };
export type { ImageBatchValidationResult };

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Checks if a file or MIME type is an allowed image format
 */
export function isSupportedImageType(file: File | { type: string; name: string }): boolean {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  const supportedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

  const matchesType = supportedTypes.includes(file.type.toLowerCase());
  const matchesExt = supportedExts.some((ext) => file.name.toLowerCase().endsWith(ext));

  return matchesType || matchesExt;
}

/**
 * Asynchronously inspects natural image dimensions
 */
export function readImageDimensions(
  source: File | Blob | string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      resolve({ width, height });
    };

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(url);
      }
      reject(new Error('Failed to decode image dimensions'));
    };

    img.src = url;
  });
}

/**
 * Creates a normalized ProcessedImageItem with an object URL and sanitized name
 */
export function createProcessedImageItem(
  file: File,
  dimensions?: { width: number; height: number }
): ProcessedImageItem {
  const safeName = sanitizeSafeFilename(file.name, 'image');
  const previewUrl = URL.createObjectURL(file);

  return {
    id: generateUniqueImageId(),
    file,
    name: safeName,
    originalSize: file.size,
    originalWidth: dimensions?.width || 0,
    originalHeight: dimensions?.height || 0,
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
      title: '',
      alt: '',
      description: '',
      tags: [],
      keywords: [],
    },
  };
}
