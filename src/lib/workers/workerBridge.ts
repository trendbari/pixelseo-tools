import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';
import { processSingleImage } from '@/lib/imageProcessor';
import { verifyWebpBlob } from '@/lib/image/webpSupport';

interface ActiveWorkerContext {
  id: string;
  worker: Worker;
  workerUrl: string;
  bitmap?: ImageBitmap | null;
  cancelled: boolean;
  reject?: (reason?: unknown) => void;
}

// Active worker registry keyed by job identifier for thread-level cancellation protocol
const activeWorkerPool = new Map<string, ActiveWorkerContext>();

/**
 * Cancels an active worker job by its unique job identifier,
 * sends cancellation message, terminates worker thread, closes bitmap, and releases resources.
 */
export function cancelActiveWorkerJob(id: string): boolean {
  const ctx = activeWorkerPool.get(id);
  if (!ctx) return false;

  ctx.cancelled = true;

  try {
    ctx.worker.postMessage({ type: 'CANCEL', id });
  } catch {}

  try {
    ctx.worker.terminate();
  } catch {}

  try {
    URL.revokeObjectURL(ctx.workerUrl);
  } catch {}

  if (ctx.bitmap) {
    try {
      ctx.bitmap.close();
    } catch {}
  }

  if (ctx.reject) {
    const cancelErr = new Error(`Job ${id} cancelled by user`);
    cancelErr.name = 'AbortError';
    ctx.reject(cancelErr);
  }

  activeWorkerPool.delete(id);
  return true;
}

/**
 * Cancels all currently active worker jobs across the queue
 */
export function cancelAllActiveWorkerJobs(): void {
  const activeIds = Array.from(activeWorkerPool.keys());
  for (const id of activeIds) {
    cancelActiveWorkerJob(id);
  }
}

/**
 * Checks if a specific job identifier currently has an active worker executing
 */
export function isWorkerJobActive(id: string): boolean {
  return activeWorkerPool.has(id);
}

/**
 * Executes image conversion by checking for OffscreenCanvas and Web Worker support,
 * with cancellation protocol and zero-fail fallback to main-thread Canvas processing.
 */
export async function processImageWithWorkerOrFallback(
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
  // Check if browser supports Web Workers and OffscreenCanvas
  const supportsOffscreen =
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' &&
    typeof createImageBitmap !== 'undefined';

  // If watermark is enabled or OffscreenCanvas unsupported, use Canvas 2D engine to ensure exact visual parity
  if (!supportsOffscreen || wmPrefs.enabled) {
    return processSingleImage(item, convPrefs, wmPrefs);
  }

  let bitmap: ImageBitmap | null = null;
  let workerUrl: string | null = null;

  try {
    bitmap = await createImageBitmap(item.file);

    // Create inline blob worker to avoid cross-origin and bundler asset issues
    const workerBlob = new Blob(
      [
        `
        self.onmessage = async (e) => {
          const { id, bitmap, convPrefs, wmPrefs, type } = e.data;

          if (type === 'CANCEL') {
            if (bitmap) {
              try { bitmap.close(); } catch {}
            }
            self.postMessage({ id, success: false, cancelled: true, error: 'Job cancelled by user' });
            return;
          }

          try {
            let targetWidth = bitmap.width;
            let targetHeight = bitmap.height;

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

            const canvas = new OffscreenCanvas(targetWidth, targetHeight);
            const ctx = canvas.getContext('2d', { alpha: true });
            if (!ctx) {
              throw new Error('Worker could not get OffscreenCanvas 2D context');
            }
            
            // Preserve PNG transparency or fill JPEG background
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            if (convPrefs.format === 'jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
            }

            ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

            // Close source bitmap immediately after drawing to release GPU texture memory
            try {
              bitmap.close();
            } catch (bErr) {}

            if (wmPrefs && wmPrefs.enabled && wmPrefs.text) {
              ctx.save();
              ctx.globalAlpha = wmPrefs.opacity || 0.55;
              const fontPx = Math.max(16, Math.round(targetWidth * ((wmPrefs.fontSize || 28) / 1000)));
              ctx.font = '600 ' + fontPx + 'px Inter, sans-serif';
              ctx.fillStyle = wmPrefs.textColor || '#FFFFFF';
              const margin = wmPrefs.margin || 24;

              let x = targetWidth - margin;
              let y = targetHeight - margin;
              let alignH = 'right';
              let alignV = 'bottom';

              if (wmPrefs.position === 'top-left') { x = margin; y = margin; alignH = 'left'; alignV = 'top'; }
              else if (wmPrefs.position === 'center') { x = targetWidth / 2; y = targetHeight / 2; alignH = 'center'; alignV = 'middle'; }

              ctx.textAlign = alignH;
              ctx.textBaseline = alignV;
              ctx.fillText(wmPrefs.text, x, y);
              ctx.restore();
            }

            const mime = convPrefs.format === 'png' ? 'image/png' : convPrefs.format === 'jpeg' ? 'image/jpeg' : 'image/webp';
            const quality = Math.max(0.01, Math.min(1.0, (convPrefs.quality || 85) / 100));
            const blob = await canvas.convertToBlob({ type: mime, quality });

            try {
              canvas.width = 0;
              canvas.height = 0;
            } catch (e) {}

            if (mime === 'image/webp' && blob.type !== 'image/webp') {
              throw new Error('Worker WebP encoder unsupported: returned ' + blob.type);
            }

            self.postMessage({ id, success: true, blob, width: targetWidth, height: targetHeight, size: blob.size });
          } catch(err) {
            self.postMessage({ id, success: false, error: err.message || 'Worker processing failed' });
          }
        };
        `,
      ],
      { type: 'application/javascript' }
    );

    workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    const result = await new Promise<{
      blob: Blob;
      width: number;
      height: number;
      size: number;
    }>((resolve, reject) => {
      const activeCtx: ActiveWorkerContext = {
        id: item.id,
        worker,
        workerUrl: workerUrl!,
        bitmap,
        cancelled: false,
        reject,
      };
      activeWorkerPool.set(item.id, activeCtx);

      worker.onmessage = (event) => {
        activeWorkerPool.delete(item.id);
        worker.terminate();
        if (workerUrl) {
          try { URL.revokeObjectURL(workerUrl); } catch {}
        }
        if (event.data.cancelled) {
          const cancelErr = new Error(`Job ${item.id} cancelled by user`);
          cancelErr.name = 'AbortError';
          reject(cancelErr);
          return;
        }
        if (event.data.success) {
          resolve({
            blob: event.data.blob,
            width: event.data.width,
            height: event.data.height,
            size: event.data.size,
          });
        } else {
          reject(new Error(event.data.error || 'Worker execution failed'));
        }
      };

      worker.onerror = (err) => {
        activeWorkerPool.delete(item.id);
        worker.terminate();
        if (workerUrl) {
          try { URL.revokeObjectURL(workerUrl); } catch {}
        }
        reject(err);
      };

      worker.postMessage(
        {
          id: item.id,
          bitmap,
          convPrefs,
          wmPrefs,
        },
        bitmap ? [bitmap] : []
      );
    });

    // Validate Output MIME Type and Dimensions after conversion
    const expectedMime =
      convPrefs.format === 'png'
        ? 'image/png'
        : convPrefs.format === 'jpeg'
        ? 'image/jpeg'
        : 'image/webp';

    if (result.blob.type && result.blob.type !== expectedMime) {
      throw new Error(`Output MIME type mismatch: expected ${expectedMime}, but encoder returned ${result.blob.type}`);
    }
    if (!result.width || result.width <= 0 || !result.height || result.height <= 0) {
      throw new Error(`Invalid output dimensions: ${result.width}x${result.height}`);
    }
    if (!result.size || result.size <= 0) {
      throw new Error(`Invalid output blob size: ${result.size} bytes`);
    }

    // Verify genuine WebP output container
    if (convPrefs.format === 'webp') {
      const isValid = await verifyWebpBlob(result.blob);
      if (!isValid) {
        throw new Error('Worker generated invalid WebP binary header');
      }
    }

    const url = URL.createObjectURL(result.blob);
    return {
      blob: result.blob,
      url,
      width: result.width,
      height: result.height,
      size: result.size,
    };
  } catch (err: unknown) {
    const errorObj = err as Error | undefined;
    // Do NOT fallback to main thread if the job was cancelled by user
    if (errorObj?.name === 'AbortError' || errorObj?.message?.toLowerCase().includes('cancel')) {
      throw err;
    }
    // Graceful fallback to main-thread Canvas processing
    return processSingleImage(item, convPrefs, wmPrefs);
  } finally {
    activeWorkerPool.delete(item.id);
  }
}
