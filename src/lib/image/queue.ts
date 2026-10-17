import {
  ProcessedImageItem,
  ConversionPreferences,
  WatermarkPreferences,
  ProcessingStage,
} from '@/types';
import {
  processImageWithWorkerOrFallback,
  cancelActiveWorkerJob,
  cancelAllActiveWorkerJobs,
} from '@/lib/workers/workerBridge';
import { convertImage } from './convert';

export interface MemoryPressureInfo {
  message: string;
  nextStep: string;
  reducedConcurrency: number;
}

export interface QueueCallbacks {
  onItemStart: (id: string) => void;
  onItemProgress: (id: string, progress: number) => void;
  onItemStage?: (id: string, stage: ProcessingStage, progress: number) => void;
  onItemSuccess: (
    id: string,
    result: { blob: Blob; url: string; width: number; height: number; size: number }
  ) => void;
  onItemError: (id: string, error: string) => void;
  onTotalProgress: (completedCount: number, totalCount: number) => void;
  onMemoryPressure?: (info: MemoryPressureInfo) => void;
}

export type ImageProcessorFn = (
  item: ProcessedImageItem,
  convPrefs: ConversionPreferences,
  wmPrefs: WatermarkPreferences
) => Promise<{ blob: Blob; url: string; width: number; height: number; size: number }>;

/**
 * Optimization 7: Calculate optimal device concurrency.
 * Mobile devices, small screens, or low-core CPUs run with 1 worker to ensure 60fps responsiveness and zero tab freezing.
 * Desktop devices run with 2 workers.
 */
export function getOptimalDeviceConcurrency(defaultDesktop = 2): number {
  // 1. Mobile User-Agent check
  const isMobileAgent =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

  // 2. Viewport width check (phones and small tablets)
  const isSmallScreen =
    (typeof window !== 'undefined' && typeof window.innerWidth === 'number' && window.innerWidth <= 768) ||
    (typeof (globalThis as any).innerWidth === 'number' && (globalThis as any).innerWidth <= 768);

  // 3. Low core count (hardwareConcurrency <= 4)
  const isLowCore =
    typeof navigator !== 'undefined' &&
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency <= 4;

  if (isMobileAgent || isSmallScreen || isLowCore) {
    return 1;
  }

  return defaultDesktop;
}

export class ProcessingQueue {
  private queue: ProcessedImageItem[] = [];
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private concurrency: number = 2;
  private hasMemoryPressure: boolean = false;

  constructor(concurrency?: number) {
    const optimal = getOptimalDeviceConcurrency(2);
    this.concurrency = concurrency !== undefined ? Math.max(1, concurrency) : optimal;
  }

  public getConcurrency(): number {
    return this.concurrency;
  }

  /**
   * Cancels the entire queue and actively terminates all running worker threads via the cancellation protocol
   */
  public cancel(): void {
    this.isCancelled = true;
    this.isRunning = false;
    // Active worker job cancellation protocol
    cancelAllActiveWorkerJobs();
  }

  /**
   * Cancels a specific job identifier by terminating its worker thread
   */
  public cancelJob(id: string): void {
    cancelActiveWorkerJob(id);
  }

  /**
   * Evaluates memory pressure using performance.memory (Chromium) and batch payload heuristics
   */
  public checkMemoryPressure(items: ProcessedImageItem[]): { hasPressure: boolean; reason: string } {
    // 1. Check browser heap memory (Chromium performance.memory API)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      if (mem.jsHeapSizeLimit > 0 && mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.75) {
        return { hasPressure: true, reason: 'heap_limit_near' };
      }
    }

    // 2. Check total batch size or ultra-large megapixels
    const totalBytes = items.reduce((acc, it) => acc + (it.originalSize || 0), 0);
    const hasUltraLarge = items.some(
      (it) => it.originalWidth > 0 && it.originalWidth * it.originalHeight > 12_000_000
    );

    if (totalBytes > 80 * 1024 * 1024 || hasUltraLarge) {
      return { hasPressure: true, reason: 'large_payload' };
    }

    return { hasPressure: false, reason: '' };
  }

  public async run(
    items: ProcessedImageItem[],
    convPrefs: ConversionPreferences,
    wmPrefs: WatermarkPreferences,
    callbacks: QueueCallbacks,
    customProcessor?: ImageProcessorFn
  ): Promise<void> {
    this.queue = [...items];
    this.isRunning = true;
    this.isCancelled = false;

    let nextIndex = 0;
    let completedCount = 0;
    const totalCount = this.queue.length;

    if (totalCount === 0) {
      this.isRunning = false;
      return;
    }

    // Dynamic memory pressure check: Pause & Reduce concurrency to 1 if heap or payload is heavy
    const pressureCheck = this.checkMemoryPressure(items);
    if (pressureCheck.hasPressure) {
      this.hasMemoryPressure = true;
      this.concurrency = 1;
      callbacks.onMemoryPressure?.({
        message: 'High memory usage detected (large image resolutions in batch).',
        nextStep: 'Concurrency was automatically reduced to 1 worker with garbage collection pauses to prevent tab crashes.',
        reducedConcurrency: 1,
      });
    }

    // Default processor: Web Worker with OffscreenCanvas (preferred), falling back to main thread
    const processor = customProcessor || processImageWithWorkerOrFallback || convertImage;

    const worker = async () => {
      while (nextIndex < this.queue.length) {
        if (this.isCancelled) break;
        const item = this.queue[nextIndex++];

        // If under memory pressure, yield to main thread GC before next decode
        if (this.hasMemoryPressure) {
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        // Stage 1: Queued -> Decoding (25%)
        callbacks.onItemStart(item.id);
        callbacks.onItemStage?.(item.id, 'decoding', 25);
        callbacks.onItemProgress(item.id, 25);

        try {
          if (this.isCancelled) {
            callbacks.onItemStage?.(item.id, 'cancelled', 0);
            callbacks.onItemProgress(item.id, 0);
            break;
          }

          // Stage 2: Resizing (if enabled, 50%)
          if (convPrefs.resizeEnabled) {
            callbacks.onItemStage?.(item.id, 'resizing', 50);
            callbacks.onItemProgress(item.id, 50);
          }

          // Compute effective watermark preferences for this item based on applyScope (All vs Selected)
          const isWatermarkApplicable =
            wmPrefs.enabled &&
            (wmPrefs.applyScope === 'all' ||
              (wmPrefs.applyScope === 'selected' &&
                Array.isArray(wmPrefs.selectedImageIds) &&
                wmPrefs.selectedImageIds.includes(item.id)));

          const effectiveWmPrefs: WatermarkPreferences = isWatermarkApplicable
            ? wmPrefs
            : { ...wmPrefs, enabled: false };

          // Stage 3: Watermarking (if enabled for this item, 75%)
          if (effectiveWmPrefs.enabled) {
            callbacks.onItemStage?.(item.id, 'watermarking', 75);
            callbacks.onItemProgress(item.id, 75);
          }

          // Stage 4: Encoding WEBP (90%)
          callbacks.onItemStage?.(item.id, 'encoding', 90);
          callbacks.onItemProgress(item.id, 90);

          const result = await processor(item, convPrefs, effectiveWmPrefs);

          // Validate output MIME type and dimensions after conversion
          const expectedMime =
            convPrefs.format === 'png'
              ? 'image/png'
              : convPrefs.format === 'jpeg'
              ? 'image/jpeg'
              : 'image/webp';

          if (result.blob && result.blob.type && result.blob.type !== expectedMime) {
            throw new Error(`Output MIME mismatch: expected ${expectedMime}, but encoder returned ${result.blob.type}`);
          }

          if (!result.width || result.width <= 0 || !result.height || result.height <= 0) {
            throw new Error(`Invalid output dimensions: ${result.width}x${result.height}`);
          }

          if (!result.size || result.size <= 0) {
            throw new Error(`Invalid output size: ${result.size} bytes`);
          }

          if (this.isCancelled) {
            callbacks.onItemStage?.(item.id, 'cancelled', 0);
            callbacks.onItemProgress(item.id, 0);
            break;
          }

          // Stage 5: Completed (100%)
          callbacks.onItemStage?.(item.id, 'completed', 100);
          callbacks.onItemProgress(item.id, 100);
          callbacks.onItemSuccess(item.id, result);
        } catch (err: unknown) {
          const errorObj = err as Error | undefined;
          const isCancelledError =
            this.isCancelled ||
            errorObj?.name === 'AbortError' ||
            errorObj?.message?.toLowerCase().includes('cancel');

          if (isCancelledError) {
            callbacks.onItemStage?.(item.id, 'cancelled', 0);
            callbacks.onItemProgress(item.id, 0);
          } else {
            callbacks.onItemStage?.(item.id, 'failed', 0);
            callbacks.onItemProgress(item.id, 0);
            callbacks.onItemError(item.id, errorObj?.message || 'Processing failed');
          }
        }

        completedCount++;
        callbacks.onTotalProgress(completedCount, totalCount);
      }
    };

    // Execute concurrently up to this.concurrency limit (1 under memory pressure, otherwise 2)
    const activeWorkers = Math.min(this.concurrency, totalCount);
    const workerPromises = Array.from({ length: activeWorkers }, () => worker());

    await Promise.all(workerPromises);

    // If cancelled, notify any remaining items
    if (this.isCancelled && nextIndex < this.queue.length) {
      for (let i = nextIndex; i < this.queue.length; i++) {
        callbacks.onItemStage?.(this.queue[i].id, 'cancelled', 0);
        callbacks.onItemProgress(this.queue[i].id, 0);
      }
    }

    this.isRunning = false;
  }
}
