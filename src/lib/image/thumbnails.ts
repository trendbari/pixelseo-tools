/**
 * High-performance, low-memory thumbnail generation utility.
 * Decodes large (up to 20MB) source images into lightweight ~300px micro-thumbnails (<25KB)
 * to prevent GPU texture VRAM exhaustion and browser tab crashes during 100-image batches.
 */

export interface ThumbnailResult {
  thumbnailUrl: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Generates a lightweight micro-thumbnail for preview display in image grids.
 * Uses createImageBitmap with hardware downscaling when supported to avoid full 24MP raster buffers in memory.
 */
export async function generateImageThumbnail(
  file: File,
  maxDim = 320
): Promise<ThumbnailResult> {
  const supportsCreateImageBitmap = typeof createImageBitmap !== 'undefined';

  if (supportsCreateImageBitmap) {
    try {
      // 1. First probe natural dimensions with low memory cost
      const probeBitmap = await createImageBitmap(file);
      const originalWidth = probeBitmap.width;
      const originalHeight = probeBitmap.height;
      probeBitmap.close();

      // Calculate aspect ratio preserving thumbnail dimensions
      let thumbW = maxDim;
      let thumbH = maxDim;
      if (originalWidth > 0 && originalHeight > 0) {
        if (originalWidth > originalHeight) {
          thumbW = Math.min(maxDim, originalWidth);
          thumbH = Math.max(1, Math.round((originalHeight / originalWidth) * thumbW));
        } else {
          thumbH = Math.min(maxDim, originalHeight);
          thumbW = Math.max(1, Math.round((originalWidth / originalHeight) * thumbH));
        }
      }

      // 2. Decode directly at downscaled size to save RAM
      let thumbBitmap: ImageBitmap;
      try {
        thumbBitmap = await createImageBitmap(file, {
          resizeWidth: thumbW,
          resizeHeight: thumbH,
          resizeQuality: 'low',
        });
      } catch {
        // Fallback if resize options not supported by browser
        thumbBitmap = await createImageBitmap(file);
      }

      // 3. Render into low-overhead canvas & convert to small WebP
      let thumbBlob: Blob | null = null;

      if (typeof OffscreenCanvas !== 'undefined') {
        const offCanvas = new OffscreenCanvas(thumbW, thumbH);
        const ctx = offCanvas.getContext('2d', { alpha: true });
        if (ctx) {
          ctx.drawImage(thumbBitmap, 0, 0, thumbW, thumbH);
        }
        thumbBitmap.close();

        if (typeof offCanvas.convertToBlob === 'function') {
          thumbBlob = await offCanvas.convertToBlob({ type: 'image/webp', quality: 0.65 });
        }
        offCanvas.width = 0;
        offCanvas.height = 0;
      } else {
        const domCanvas = document.createElement('canvas');
        domCanvas.width = thumbW;
        domCanvas.height = thumbH;
        const ctx = domCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(thumbBitmap, 0, 0, thumbW, thumbH);
        }
        thumbBitmap.close();

        thumbBlob = await new Promise<Blob | null>((resolve) => {
          domCanvas.toBlob(resolve, 'image/webp', 0.65);
        });
        domCanvas.width = 0;
        domCanvas.height = 0;
      }

      if (thumbBlob && thumbBlob.size > 0) {
        const thumbnailUrl = URL.createObjectURL(thumbBlob);
        return {
          thumbnailUrl,
          width: thumbW,
          height: thumbH,
          originalWidth,
          originalHeight,
        };
      }
    } catch (bitmapErr) {
      // Fall through to HTMLImageElement fallback
    }
  }

  // Fallback: HTMLImageElement decode
  return new Promise((resolve) => {
    const rawUrl = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      let thumbW = maxDim;
      let thumbH = maxDim;
      if (originalWidth > originalHeight) {
        thumbH = Math.max(1, Math.round((originalHeight / originalWidth) * maxDim));
      } else {
        thumbW = Math.max(1, Math.round((originalWidth / originalHeight) * maxDim));
      }

      const canvas = document.createElement('canvas');
      canvas.width = thumbW;
      canvas.height = thumbH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, thumbW, thumbH);
      }

      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          URL.revokeObjectURL(rawUrl);

          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob);
            resolve({
              thumbnailUrl,
              width: thumbW,
              height: thumbH,
              originalWidth,
              originalHeight,
            });
          } else {
            resolve({
              thumbnailUrl: rawUrl,
              width: thumbW,
              height: thumbH,
              originalWidth,
              originalHeight,
            });
          }
        },
        'image/webp',
        0.65
      );
    };

    img.onerror = () => {
      resolve({
        thumbnailUrl: rawUrl,
        width: maxDim,
        height: maxDim,
        originalWidth: maxDim,
        originalHeight: maxDim,
      });
    };

    img.src = rawUrl;
  });
}
