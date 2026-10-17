import { describe, it, expect, vi } from 'vitest';
import { ProcessingQueue, QueueCallbacks, ImageProcessorFn } from '@/lib/image/queue';
import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';

function createMockBatch(count: number, withFailures: number[] = []): ProcessedImageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `product-image-${String(i + 1).padStart(3, '0')}.jpg`,
    originalSize: 1024 * 350,
    originalWidth: 1920,
    originalHeight: 1080,
    previewUrl: `blob:mock-preview-${i + 1}`,
    convertedBlob: null,
    convertedUrl: null,
    convertedSize: null,
    convertedWidth: 0,
    convertedHeight: 0,
    status: 'idle',
    stage: 'queued',
    progress: 0,
    errorMessage: withFailures.includes(i) ? 'Corrupt image container' : undefined,
    seo: {
      title: `Product ${i + 1}`,
      alt: `High quality product ${i + 1}`,
      description: 'Optimized product image for e-commerce',
      tags: ['product'],
      keywords: ['store'],
    },
    file: { size: 1024 * 350, type: 'image/jpeg', name: `image-${i + 1}.jpg` } as any,
  }));
}

const defaultConvPrefs: ConversionPreferences = {
  format: 'webp',
  quality: 85,
  resizeEnabled: false,
  maxWidth: 1920,
  maxHeight: 1080,
  preserveAspectRatio: true,
  namingPattern: 'original',
  prefix: '',
  suffix: '',
};

const defaultWmPrefs: WatermarkPreferences = {
  enabled: false,
  type: 'text',
  text: 'PixelSEO',
  fontSize: 24,
  fontFamily: 'Inter',
  textColor: '#FFFFFF',
  opacity: 0.5,
  position: 'bottom-right',
  margin: 20,
  rotation: 0,
  hasShadow: true,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 4,
  logoBlob: null,
  logoUrl: null,
  logoScale: 0.2,
  applyScope: 'all',
  selectedImageIds: [],
};

describe('100-Image Batch Processing & Resilience', () => {
  it('processes a full 100-image batch gracefully with concurrent worker jobs', async () => {
    const batch = createMockBatch(100);
    const queue = new ProcessingQueue(2); // desktop concurrency of 2

    const completedIds: string[] = [];
    const stagesSeen = new Set<string>();

    const mockProcessor: ImageProcessorFn = vi.fn(async (item) => {
      // Simulate fast asynchronous worker processing
      await new Promise((resolve) => setTimeout(resolve, 2));
      return {
        blob: new Blob(['webp-data'], { type: 'image/webp' }),
        url: `blob:converted-${item.id}`,
        width: 1920,
        height: 1080,
        size: 1024 * 120, // 65% reduction
      };
    });

    const callbacks: QueueCallbacks = {
      onItemStart: vi.fn(),
      onItemProgress: vi.fn(),
      onItemStage: (id, stage) => {
        stagesSeen.add(stage);
      },
      onItemSuccess: (id) => {
        completedIds.push(id);
      },
      onItemError: vi.fn(),
      onTotalProgress: vi.fn(),
    };

    await queue.run(batch, defaultConvPrefs, defaultWmPrefs, callbacks, mockProcessor);

    expect(completedIds.length).toBe(100);
    expect(mockProcessor).toHaveBeenCalledTimes(100);
    expect(stagesSeen.has('decoding')).toBe(true);
    expect(stagesSeen.has('encoding')).toBe(true);
    expect(stagesSeen.has('completed')).toBe(true);
  });

  it('handles isolated corrupted images without breaking remaining batch items', async () => {
    // 100 items, with items 12, 45, and 88 corrupted
    const failIndices = [12, 45, 88];
    const batch = createMockBatch(100, failIndices);
    const queue = new ProcessingQueue(2);

    const successIds: string[] = [];
    const failedIds: string[] = [];

    const mockProcessor: ImageProcessorFn = vi.fn(async (item) => {
      const idx = parseInt(item.id.replace('item-', ''), 10) - 1;
      if (failIndices.includes(idx)) {
        throw new Error('Image decoding error: corrupted file signature');
      }
      return {
        blob: new Blob(['webp-data'], { type: 'image/webp' }),
        url: `blob:converted-${item.id}`,
        width: 1920,
        height: 1080,
        size: 1024 * 100,
      };
    });

    const callbacks: QueueCallbacks = {
      onItemStart: vi.fn(),
      onItemProgress: vi.fn(),
      onItemSuccess: (id) => successIds.push(id),
      onItemError: (id) => failedIds.push(id),
      onTotalProgress: vi.fn(),
    };

    await queue.run(batch, defaultConvPrefs, defaultWmPrefs, callbacks, mockProcessor);

    expect(successIds.length).toBe(97);
    expect(failedIds.length).toBe(3);
    expect(failedIds).toEqual(['item-13', 'item-46', 'item-89']);
  });

  it('automatically detects memory pressure and reduces concurrency to 1 worker', async () => {
    // Ultra-large batch payload (>80MB)
    const largeBatch = Array.from({ length: 5 }, (_, i) => ({
      id: `large-${i}`,
      name: `heavy-${i}.png`,
      originalSize: 20 * 1024 * 1024, // 20MB each = 100MB batch
      originalWidth: 4000,
      originalHeight: 3000, // 12MP each
      previewUrl: `blob:heavy-${i}`,
      convertedBlob: null,
      convertedUrl: null,
      convertedSize: null,
      convertedWidth: 0,
      convertedHeight: 0,
      status: 'idle',
      stage: 'queued',
      progress: 0,
      seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
      file: {} as any,
    })) as ProcessedImageItem[];

    const queue = new ProcessingQueue(2);
    let memoryPressureDetected = false;
    let reducedTo = 2;

    const callbacks: QueueCallbacks = {
      onItemStart: vi.fn(),
      onItemProgress: vi.fn(),
      onItemSuccess: vi.fn(),
      onItemError: vi.fn(),
      onTotalProgress: vi.fn(),
      onMemoryPressure: (info) => {
        memoryPressureDetected = true;
        reducedTo = info.reducedConcurrency;
      },
    };

    const mockProcessor: ImageProcessorFn = vi.fn(async () => ({
      blob: new Blob(['webp'], { type: 'image/webp' }),
      url: 'blob:mock',
      width: 4000,
      height: 3000,
      size: 500000,
    }));

    await queue.run(largeBatch, defaultConvPrefs, defaultWmPrefs, callbacks, mockProcessor);

    expect(memoryPressureDetected).toBe(true);
    expect(reducedTo).toBe(1);
    expect(queue.getConcurrency()).toBe(1);
  });

  it('supports cancellation midway through batch and halts pending tasks', async () => {
    const batch = createMockBatch(50);
    const queue = new ProcessingQueue(2);

    let processedCount = 0;
    const callbacks: QueueCallbacks = {
      onItemStart: vi.fn(),
      onItemProgress: vi.fn(),
      onItemSuccess: () => {
        processedCount++;
        if (processedCount === 5) {
          queue.cancel(); // cancel after 5 items
        }
      },
      onItemError: vi.fn(),
      onTotalProgress: vi.fn(),
    };

    const mockProcessor: ImageProcessorFn = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return {
        blob: new Blob(['webp'], { type: 'image/webp' }),
        url: 'blob:mock',
        width: 1920,
        height: 1080,
        size: 50000,
      };
    });

    await queue.run(batch, defaultConvPrefs, defaultWmPrefs, callbacks, mockProcessor);

    // Queue should have stopped well before processing all 50
    expect(processedCount).toBeLessThan(15);
  });
});
