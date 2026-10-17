import {
  ConversionPreferences,
  WatermarkPreferences,
  ProcessedImageItem,
} from '@/types';
import { verifyWebpBlob } from './image/webpSupport';
import { sanitizeSafeFilename } from './security/filenameSanitizer';
import { applyWatermarkToCanvas } from './image/watermark';

/**
 * Format target filename based on user preferences and ensure unique names on duplicate filenames
 * Fully sanitized against path traversal, control characters, and Windows reserved names (SEC-02, SEC-10)
 */
export function formatOutputFilename(
  originalName: string,
  prefs: ConversionPreferences,
  index: number,
  usedNames?: Set<string>
): string {
  const safeName = sanitizeSafeFilename(originalName, `image-${index + 1}`);
  const baseName = safeName.substring(0, safeName.lastIndexOf('.')) || safeName;
  const ext = prefs.format === 'png' ? 'png' : prefs.format === 'jpeg' ? 'jpg' : 'webp';

  let cleaned = baseName;

  switch (prefs.namingPattern) {
    case 'kebab':
      cleaned = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `image-${index + 1}`;
      break;
    case 'seo-slug':
      cleaned =
        (baseName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `image-${index + 1}`) + '-seo-optimized';
      break;
    case 'custom': {
      const safePrefix = prefs.prefix ? sanitizeSafeFilename(prefs.prefix).replace(/\.[^/.]+$/, '') : '';
      const safeSuffix = prefs.suffix ? sanitizeSafeFilename(prefs.suffix).replace(/\.[^/.]+$/, '') : '';
      cleaned = `${safePrefix ? safePrefix + '-' : ''}${baseName}${safeSuffix ? '-' + safeSuffix : ''}`;
      break;
    }
    case 'original':
    default:
      cleaned = baseName;
      break;
  }

  // Ensure base name is safe and non-empty
  cleaned = sanitizeSafeFilename(cleaned, `image-${index + 1}`);
  let finalName = `${cleaned}.${ext}`;

  // Unique output naming for duplicate filenames
  if (usedNames) {
    if (usedNames.has(finalName)) {
      let counter = 1;
      while (usedNames.has(`${cleaned}-${counter}.${ext}`)) {
        counter++;
      }
      finalName = `${cleaned}-${counter}.${ext}`;
    }
    usedNames.add(finalName);
  }

  return finalName;
}

/**
 * Pre-computes unique output filenames across an entire batch of images
 */
export function resolveBatchOutputFilenames(
  items: Array<{ name: string; id?: string }>,
  prefs: ConversionPreferences
): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();
  items.forEach((item, idx) => {
    const unique = formatOutputFilename(item.name, prefs, idx, used);
    if (item.id) {
      result.set(item.id, unique);
    }
    result.set(String(idx), unique);
  });
  return result;
}

/**
 * Helper to load an image element safely
 */
function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image resource'));
    img.src = url;
  });
}

/**
 * Process a single image with conversion, optional resizing, and optional watermark
 */
export async function processSingleImage(
  item: ProcessedImageItem,
  convPrefs: ConversionPreferences,
  wmPrefs: WatermarkPreferences
): Promise<{
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}> {
  const img = await loadImageFromUrl(item.previewUrl);

  let targetWidth = img.naturalWidth;
  let targetHeight = img.naturalHeight;

  // Handle resizing
  if (convPrefs.resizeEnabled) {
    const maxW = convPrefs.maxWidth > 0 ? convPrefs.maxWidth : targetWidth;
    const maxH = convPrefs.maxHeight > 0 ? convPrefs.maxHeight : targetHeight;

    if (convPrefs.preserveAspectRatio) {
      const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
      if (ratio < 1) {
        targetWidth = Math.round(targetWidth * ratio);
        targetHeight = Math.round(targetHeight * ratio);
      }
    } else {
      targetWidth = Math.min(targetWidth, maxW);
      targetHeight = Math.min(targetHeight, maxH);
    }
  }

  // Set up Canvas: prefer OffscreenCanvas with convertToBlob; fallback to HTMLCanvasElement
  const supportsOffscreen =
    typeof OffscreenCanvas !== 'undefined' &&
    typeof OffscreenCanvas.prototype.convertToBlob === 'function';

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;

  if (supportsOffscreen) {
    canvas = new OffscreenCanvas(targetWidth, targetHeight);
    ctx = canvas.getContext('2d', { alpha: true });
  } else if (typeof document !== 'undefined') {
    const domCanvas = document.createElement('canvas');
    domCanvas.width = targetWidth;
    domCanvas.height = targetHeight;
    canvas = domCanvas;
    ctx = domCanvas.getContext('2d', { alpha: true });
  } else {
    throw new Error('Canvas rendering context is not available in current environment');
  }

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Preserve PNG transparency by clearing canvas with transparent alpha
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // If target format is JPEG (no alpha support), fill white background
  if (convPrefs.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw main image (original image in memory remains untouched)
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Apply Watermark if enabled using the unified rendering engine
  if (wmPrefs.enabled) {
    await applyWatermarkToCanvas(ctx, targetWidth, targetHeight, wmPrefs);
  }

  // Determine mime type and quality
  const mimeType =
    convPrefs.format === 'png'
      ? 'image/png'
      : convPrefs.format === 'jpeg'
      ? 'image/jpeg'
      : 'image/webp';
  
  const quality = Math.max(0.1, Math.min(1.0, convPrefs.quality / 100));

  // Export to Blob: OffscreenCanvas.convertToBlob() or HTMLCanvasElement.toBlob() fallback
  let blob: Blob;
  if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
    blob = await canvas.convertToBlob({ type: mimeType, quality });
  } else if ('toBlob' in canvas && typeof (canvas as HTMLCanvasElement).toBlob === 'function') {
    blob = await new Promise((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image Blob from Canvas'));
        },
        mimeType,
        quality
      );
    });
  } else {
    throw new Error('Neither OffscreenCanvas nor HTMLCanvasElement blob conversion is supported');
  }

  // Feature detection check: verify that requested WebP did not silently fallback to PNG
  if (convPrefs.format === 'webp') {
    if (blob.type !== 'image/webp') {
      throw new Error(
        `WebP encoder unsupported: browser returned ${blob.type} fallback instead of requested image/webp`
      );
    }
    const isValidWebp = await verifyWebpBlob(blob);
    if (!isValidWebp) {
      throw new Error(
        'WebP encoding verification failed: binary container does not conform to valid WebP format.'
      );
    }
  }

  // Optimization 5: Clean up canvas resources immediately to release GPU memory buffer
  try {
    if ('width' in canvas && 'height' in canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch {}

  const convertedUrl = URL.createObjectURL(blob);

  return {
    blob,
    url: convertedUrl,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
  };
}
