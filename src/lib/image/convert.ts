import { ConversionPreferences, WatermarkPreferences, ProcessedImageItem } from '@/types';
import { calculateResizeDimensions } from './resize';
import { applyWatermarkToCanvas } from './watermark';
import { verifyWebpBlob } from './webpSupport';

export async function convertImage(
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
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Failed to load image resource'));
    el.src = item.previewUrl;
  });

  const { width: targetWidth, height: targetHeight } = calculateResizeDimensions(
    img.naturalWidth,
    img.naturalHeight,
    convPrefs.resizeEnabled ? convPrefs.maxWidth : undefined,
    convPrefs.resizeEnabled ? convPrefs.maxHeight : undefined,
    convPrefs.preserveAspectRatio
  );

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
    throw new Error('Canvas rendering context not available');
  }

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Preserve PNG transparency
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // If JPEG (no alpha channel), fill solid white
  if (convPrefs.format === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Draw image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Apply watermark if enabled (before encoding)
  if (wmPrefs.enabled) {
    await applyWatermarkToCanvas(ctx as CanvasRenderingContext2D, targetWidth, targetHeight, wmPrefs);
  }

  // Determine mime & quality
  const mimeType =
    convPrefs.format === 'png'
      ? 'image/png'
      : convPrefs.format === 'jpeg'
      ? 'image/jpeg'
      : 'image/webp';

  const qualityRatio = Math.max(0.1, Math.min(1.0, convPrefs.quality / 100));

  let blob: Blob;
  if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
    blob = await canvas.convertToBlob({ type: mimeType, quality: qualityRatio });
  } else if ('toBlob' in canvas && typeof (canvas as HTMLCanvasElement).toBlob === 'function') {
    blob = await new Promise<Blob>((resolve, reject) => {
      (canvas as HTMLCanvasElement).toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob'));
        },
        mimeType,
        qualityRatio
      );
    });
  } else {
    throw new Error('Neither OffscreenCanvas nor HTMLCanvasElement toBlob supported');
  }

  // Verify WebP output against silent fallback
  if (convPrefs.format === 'webp') {
    if (blob.type !== 'image/webp') {
      throw new Error(`WebP encoder unsupported: returned ${blob.type} fallback`);
    }
    const isValid = await verifyWebpBlob(blob);
    if (!isValid) {
      throw new Error('WebP encoding verification failed: invalid container');
    }
  }

  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    width: targetWidth,
    height: targetHeight,
    size: blob.size,
  };
}
