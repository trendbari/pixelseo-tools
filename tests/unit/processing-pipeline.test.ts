import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessingQueue } from '@/lib/image/queue';
import { verifyWebpBlob, isWebpEncoderSupported } from '@/lib/image/webpSupport';
import { cancelActiveWorkerJob, cancelAllActiveWorkerJobs, isWorkerJobActive } from '@/lib/workers/workerBridge';
import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';
import JSZip from 'jszip';
import { downloadAllAsZip, downloadInBatches, estimateZipMemoryUsage } from '@/lib/zipExporter';

describe('Unit Test: Processing Pipeline & Queue Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockItem = (id: string, name = `photo-${id}.jpg`, size = 1024 * 500): ProcessedImageItem => {
    const file = new File(['dummy-content'], name, { type: 'image/jpeg' });
    return {
      id,
      file,
      name,
      originalSize: size,
      originalWidth: 1200,
      originalHeight: 800,
      previewUrl: `blob:mock-${id}`,
      status: 'idle',
      stage: 'queued',
      progress: 0,
      seo: {
        title: name,
        alt: `${name} description`,
        description: '',
        tags: [],
        keywords: [],
      },
    };
  };

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
    text: '© PixelSEO',
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
  };

  describe('1. Concurrency Limiter (IMG-11: Limited to 2 concurrent jobs)', () => {
    it('defaults concurrency to exactly 2 concurrent jobs', () => {
      const queue = new ProcessingQueue();
      expect(queue.getConcurrency()).toBe(2);
    });

    it('processes items with a maximum of 2 concurrent executions simultaneously', async () => {
      const queue = new ProcessingQueue(2);
      const items = [
        createMockItem('1'),
        createMockItem('2'),
        createMockItem('3'),
        createMockItem('4'),
      ];

      let activeCount = 0;
      let peakConcurrency = 0;

      const mockProcessor = vi.fn(async (item: ProcessedImageItem) => {
        activeCount++;
        if (activeCount > peakConcurrency) {
          peakConcurrency = activeCount;
        }
        // Simulate asynchronous conversion delay
        await new Promise((resolve) => setTimeout(resolve, 30));
        activeCount--;

        const dummyWebpBlob = new Blob(['mock-webp'], { type: 'image/webp' });
        return {
          blob: dummyWebpBlob,
          url: `blob:converted-${item.id}`,
          width: 1200,
          height: 800,
          size: 50000,
        };
      });

      const startSpy = vi.fn();
      const successSpy = vi.fn();
      const totalProgressSpy = vi.fn();

      await queue.run(
        items,
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: startSpy,
          onItemProgress: vi.fn(),
          onItemSuccess: successSpy,
          onItemError: vi.fn(),
          onTotalProgress: totalProgressSpy,
        },
        mockProcessor
      );

      // Verify peak concurrency never exceeded 2
      expect(peakConcurrency).toBeLessThanOrEqual(2);
      expect(peakConcurrency).toBeGreaterThanOrEqual(1);
      expect(successSpy).toHaveBeenCalledTimes(4);
      expect(totalProgressSpy).toHaveBeenLastCalledWith(4, 4);
    });
  });

  describe('2. Stage-based Progress Semantics', () => {
    it('emits queued -> decoding -> encoding -> completed stage progression when resize and watermark are disabled', async () => {
      const queue = new ProcessingQueue(2);
      const item = createMockItem('test-item-1');

      const stageCalls: Array<{ id: string; stage: string; progress: number }> = [];

      const mockProcessor = vi.fn(async () => ({
        blob: new Blob(['mock'], { type: 'image/webp' }),
        url: 'blob:mock',
        width: 1000,
        height: 800,
        size: 40000,
      }));

      await queue.run(
        [item],
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: (id, stage, progress) => {
            stageCalls.push({ id, stage, progress });
          },
          onItemSuccess: vi.fn(),
          onItemError: vi.fn(),
          onTotalProgress: vi.fn(),
        },
        mockProcessor
      );

      expect(stageCalls.map((c) => c.stage)).toEqual(['decoding', 'encoding', 'completed']);
      expect(stageCalls.map((c) => c.progress)).toEqual([25, 90, 100]);
    });

    it('includes resizing (50%) and watermarking (75%) stages when both options are enabled', async () => {
      const queue = new ProcessingQueue(2);
      const item = createMockItem('test-item-stages');

      const stageCalls: Array<{ stage: string; progress: number }> = [];

      const convPrefsWithResize: ConversionPreferences = {
        ...defaultConvPrefs,
        resizeEnabled: true,
        maxWidth: 800,
        maxHeight: 600,
      };

      const wmPrefsEnabled: WatermarkPreferences = {
        ...defaultWmPrefs,
        enabled: true,
      };

      const mockProcessor = vi.fn(async () => ({
        blob: new Blob(['mock'], { type: 'image/webp' }),
        url: 'blob:mock',
        width: 800,
        height: 533,
        size: 30000,
      }));

      await queue.run(
        [item],
        convPrefsWithResize,
        wmPrefsEnabled,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: (_id, stage, progress) => {
            stageCalls.push({ stage, progress });
          },
          onItemSuccess: vi.fn(),
          onItemError: vi.fn(),
          onTotalProgress: vi.fn(),
        },
        mockProcessor
      );

      expect(stageCalls.map((c) => c.stage)).toEqual([
        'decoding',
        'resizing',
        'watermarking',
        'encoding',
        'completed',
      ]);
      expect(stageCalls.map((c) => c.progress)).toEqual([25, 50, 75, 90, 100]);
    });

    it('emits failed stage (0%) when processor throws an error', async () => {
      const queue = new ProcessingQueue(2);
      const item = createMockItem('error-item');

      const stageCalls: string[] = [];
      const errorSpy = vi.fn();

      const failingProcessor = vi.fn(async () => {
        throw new Error('Image decoding failed');
      });

      await queue.run(
        [item],
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: (_id, stage) => stageCalls.push(stage),
          onItemSuccess: vi.fn(),
          onItemError: errorSpy,
          onTotalProgress: vi.fn(),
        },
        failingProcessor
      );

      expect(stageCalls).toContain('failed');
      expect(errorSpy).toHaveBeenCalledWith('error-item', 'Image decoding failed');
    });

    it('emits cancelled stage when queue.cancel() is invoked', async () => {
      const queue = new ProcessingQueue(1);
      const items = [createMockItem('c1'), createMockItem('c2')];

      const stageCalls: Array<{ id: string; stage: string }> = [];

      const slowProcessor = vi.fn(async (item: ProcessedImageItem) => {
        if (item.id === 'c1') {
          // Cancel while processing first item
          queue.cancel();
        }
        return {
          blob: new Blob(['mock'], { type: 'image/webp' }),
          url: 'blob:mock',
          width: 800,
          height: 600,
          size: 20000,
        };
      });

      await queue.run(
        items,
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: (id, stage) => stageCalls.push({ id, stage }),
          onItemSuccess: vi.fn(),
          onItemError: vi.fn(),
          onTotalProgress: vi.fn(),
        },
        slowProcessor
      );

      // Second item was cancelled without running
      const c2Stages = stageCalls.filter((c) => c.id === 'c2');
      expect(c2Stages.some((c) => c.stage === 'cancelled')).toBe(true);
    });

    it('terminates active worker job using cancellation protocol and job identifier', async () => {
      const queue = new ProcessingQueue(1);
      const item = createMockItem('active-cancel-job');

      const stageCalls: string[] = [];

      const longRunningProcessor = vi.fn(async (it: ProcessedImageItem) => {
        // Trigger queue-level cancellation with worker protocol
        queue.cancelJob(it.id);
        const err = new Error(`Job ${it.id} cancelled by user`);
        err.name = 'AbortError';
        throw err;
      });

      await queue.run(
        [item],
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: (_id, stage) => stageCalls.push(stage),
          onItemSuccess: vi.fn(),
          onItemError: vi.fn(),
          onTotalProgress: vi.fn(),
        },
        longRunningProcessor
      );

      expect(stageCalls).toContain('cancelled');
      expect(stageCalls).not.toContain('completed');
    });

    it('validates output MIME type and rejects unexpected fallback MIME types', async () => {
      const queue = new ProcessingQueue(1);
      const item = createMockItem('mime-mismatch-item');

      const errorCalls: string[] = [];

      // Mismatched processor: requested WEBP, but returned image/png
      const mismatchedProcessor = vi.fn(async () => {
        return {
          blob: new Blob(['fake-png'], { type: 'image/png' }),
          url: 'blob:fake-png',
          width: 800,
          height: 600,
          size: 1024,
        };
      });

      await queue.run(
        [item],
        defaultConvPrefs, // expects 'image/webp'
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: vi.fn(),
          onItemSuccess: vi.fn(),
          onItemError: (_id, error) => errorCalls.push(error),
          onTotalProgress: vi.fn(),
        },
        mismatchedProcessor
      );

      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0]).toMatch(/MIME mismatch|MIME type/i);
    });

    it('validates output dimensions and rejects non-positive dimensions', async () => {
      const queue = new ProcessingQueue(1);
      const item = createMockItem('invalid-dim-item');

      const errorCalls: string[] = [];

      const zeroDimProcessor = vi.fn(async () => {
        return {
          blob: new Blob(['data'], { type: 'image/webp' }),
          url: 'blob:data',
          width: 0,
          height: 0,
          size: 1024,
        };
      });

      await queue.run(
        [item],
        defaultConvPrefs,
        defaultWmPrefs,
        {
          onItemStart: vi.fn(),
          onItemProgress: vi.fn(),
          onItemStage: vi.fn(),
          onItemSuccess: vi.fn(),
          onItemError: (_id, error) => errorCalls.push(error),
          onTotalProgress: vi.fn(),
        },
        zeroDimProcessor
      );

      expect(errorCalls.length).toBe(1);
      expect(errorCalls[0]).toMatch(/Invalid output dimensions/i);
    });
  });

  describe('3. WebP Encoder Support Feature Detection & Container Header Verification', () => {
    it('successfully validates genuine WebP RIFF....WEBP binary header', async () => {
      // 12-byte RIFF container with WEBP header
      // 'R' 'I' 'F' 'F' [4-byte size] 'W' 'E' 'B' 'P'
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // Size (32 bytes)
        0x57, 0x45, 0x42, 0x50, // WEBP
        0x56, 0x50, 0x38, 0x20, // VP8
      ]);

      const validWebpBlob = new Blob([webpBytes], { type: 'image/webp' });
      const isValid = await verifyWebpBlob(validWebpBlob);
      expect(isValid).toBe(true);
    });

    it('rejects silent fallback PNG header disguised with image/webp MIME type', async () => {
      // PNG header magic bytes (\x89PNG\r\n\x1a\n)
      const pngBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      ]);

      const fakeWebpBlob = new Blob([pngBytes], { type: 'image/webp' });
      const isValid = await verifyWebpBlob(fakeWebpBlob);
      expect(isValid).toBe(false);
    });

    it('rejects JPEG header or truncated blob', async () => {
      // JPEG header (\xFF\xD8\xFF)
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const jpegBlob = new Blob([jpegBytes], { type: 'image/webp' });
      expect(await verifyWebpBlob(jpegBlob)).toBe(false);

      // Truncated blob (< 12 bytes)
      const emptyBlob = new Blob([], { type: 'image/webp' });
      expect(await verifyWebpBlob(emptyBlob)).toBe(false);
    });

    it('isWebpEncoderSupported returns boolean without crashing in any environment', async () => {
      const supported = await isWebpEncoderSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('4. ZIP Compression Rules (STORE for WEBP files, DEFLATE for metadata)', () => {
    it('configures STORE compression for WebP files and preserves metadata in ZIP', async () => {
      // Create a valid WebP byte buffer
      const webpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46,
        0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);
      const webpBlob = new Blob([webpBytes], { type: 'image/webp' });

      const item: ProcessedImageItem = {
        ...createMockItem('zip-item-1', 'product.png', 10000),
        status: 'done',
        convertedBlob: webpBlob,
        convertedUrl: 'blob:webp-1',
        convertedSize: webpBytes.length,
      };

      // Spy on JSZip.prototype.file to verify compression parameters passed
      const fileSpy = vi.spyOn(JSZip.prototype, 'file');

      // Mock saveAs / browser anchor click
      if (typeof document !== 'undefined') {
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          const el = {
            href: '',
            download: '',
            click: vi.fn(),
          } as any;
          return el;
        });
      }

      await downloadAllAsZip(
        [item],
        defaultConvPrefs,
        { brandName: 'TestBrand', category: '', defaultAltTemplate: '', defaultTitleTemplate: '', autoExtractKeywords: false, ecommercePreset: 'standard' },
        defaultWmPrefs
      );

      // Find the file call for the webp image
      const webpFileCall = fileSpy.mock.calls.find(([name]) => typeof name === 'string' && name.endsWith('.webp'));
      expect(webpFileCall).toBeDefined();
      if (webpFileCall) {
        const options = webpFileCall[2] as any;
        expect(options?.compression).toBe('STORE');
      }

      // Check metadata CSV and JSON-LD were added
      const csvCall = fileSpy.mock.calls.find(([name]) => name === 'image-metadata.csv');
      const jsonCall = fileSpy.mock.calls.find(([name]) => name === 'schema-imageobject.json');
      expect(csvCall).toBeDefined();
      expect(jsonCall).toBeDefined();

      fileSpy.mockRestore();
    });

    it('strictly excludes corrupted or 0-byte outputs from images/ directory during ZIP generation', async () => {
      // Create one valid WebP item and one corrupted/0-byte item
      const validWebpBytes = new Uint8Array([
        0x52, 0x49, 0x46, 0x46,
        0x1a, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x20,
      ]);
      const validItem: ProcessedImageItem = {
        ...createMockItem('valid-1', 'good.jpg', 20000),
        status: 'done',
        convertedBlob: new Blob([validWebpBytes], { type: 'image/webp' }),
        convertedSize: validWebpBytes.length,
      };

      const corruptItem: ProcessedImageItem = {
        ...createMockItem('corrupt-1', 'broken.jpg', 30000),
        status: 'done',
        convertedBlob: new Blob([], { type: 'image/webp' }), // 0 bytes = corrupt
        convertedSize: 0,
      };

      const failedItem: ProcessedImageItem = {
        ...createMockItem('failed-1', 'failed.jpg', 40000),
        status: 'error',
        convertedBlob: null,
      };

      const fileSpy = vi.spyOn(JSZip.prototype, 'file');

      const result = await downloadAllAsZip(
        [validItem, corruptItem, failedItem],
        defaultConvPrefs,
        { brandName: 'TestBrand', category: '', defaultAltTemplate: '', defaultTitleTemplate: '', autoExtractKeywords: false, ecommercePreset: 'standard' },
        defaultWmPrefs
      );

      expect(result.successCount).toBe(1);
      expect(result.corruptedCount).toBe(2);

      // Verify that corrupt or failed files were NOT added to the archive
      const addedFilenames = fileSpy.mock.calls.map(([name]) => name);
      expect(addedFilenames.some((n) => typeof n === 'string' && n.includes('broken'))).toBe(false);
      expect(addedFilenames.some((n) => typeof n === 'string' && n.includes('failed'))).toBe(false);

      fileSpy.mockRestore();
    });

    it('evaluates archive memory budget and provides smaller-batch export safeguards', async () => {
      const validWebpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46,
        0x1a, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
        0x56, 0x50, 0x38, 0x20,
      ]);
      // 55 items to exceed the 50 item threshold
      const mockItems: ProcessedImageItem[] = Array.from({ length: 55 }, (_, i) => ({
        ...createMockItem(`batch-item-${i}`, `img-${i}.jpg`, 2_500_000),
        status: 'done' as const,
        convertedBlob: new Blob([validWebpHeader], { type: 'image/webp' }),
        convertedSize: 2_500_000,
      }));

      const estimate = estimateZipMemoryUsage(mockItems);
      expect(estimate.isHighMemory).toBe(true);
      expect(estimate.warning).toBeDefined();
      expect(estimate.totalBatches).toBe(2); // 55 items / 30 batchSize = 2 batches
      expect(estimate.suggestedBatchSize).toBe(30);

      // Test downloadInBatches splits items properly
      const fileSpy = vi.spyOn(JSZip.prototype, 'file');
      const progressCalls: Array<{ batch: number; total: number }> = [];

      const batchResult = await downloadInBatches(
        mockItems,
        defaultConvPrefs,
        { brandName: 'TestBrand', category: '', defaultAltTemplate: '', defaultTitleTemplate: '', autoExtractKeywords: false, ecommercePreset: 'standard' },
        defaultWmPrefs,
        30,
        (current, total) => {
          progressCalls.push({ batch: current, total });
        }
      );

      expect(batchResult.totalBatches).toBe(2);
      expect(batchResult.totalExported).toBe(55);
      expect(progressCalls.length).toBeGreaterThan(0);

      fileSpy.mockRestore();
    });
  });
});
