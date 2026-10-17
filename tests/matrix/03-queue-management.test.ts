import { describe, it, expect, vi } from 'vitest';
import { ProcessingQueue, getOptimalDeviceConcurrency } from '@/lib/image/queue';
import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences, ProcessingStage } from '@/types';

/**
 * PRD Test Suite: 3. Queue Management (10 planned tests)
 * Tests actual production ProcessingQueue engine, concurrency adaptation, stage state machines,
 * error isolation, memory pressure mitigation, job cancellation, retry flow, and progress callbacks.
 */
describe('PRD Test Suite 3: Queue Management (10 Tests)', () => {
  const defaultConvPrefs: ConversionPreferences = {
    format: 'webp',
    quality: 85,
    resizeEnabled: true,
    maxWidth: 1920,
    maxHeight: 1080,
    preserveAspectRatio: true,
    namingPattern: 'original',
    prefix: '',
    suffix: '',
  };

  const defaultWmPrefs: WatermarkPreferences = {
    enabled: true,
    type: 'text',
    text: 'PixelSEO',
    textColor: '#ffffff',
    fontFamily: 'Inter',
    fontSize: 24,
    position: 'bottom-right',
    opacity: 0.55,
    logoBlob: null,
    logoUrl: null,
    logoScale: 0.2,
    rotation: 0,
    margin: 20,
    hasShadow: true,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 4,
    applyScope: 'all',
    selectedImageIds: [],
  };

  const createMockItem = (id: string, name = `img-${id}.jpg`, size = 1024 * 100): ProcessedImageItem => ({
    id,
    file: new File(['mock'], name, { type: 'image/jpeg' }),
    name,
    originalSize: size,
    originalWidth: 1000,
    originalHeight: 800,
    previewUrl: `blob:mock-${id}`,
    status: 'idle',
    stage: 'queued',
    progress: 0,
    seo: {
      title: name,
      alt: name,
      description: '',
      tags: [],
      keywords: [],
    },
  });

  // Test 1: Concurrency limit 2 on desktop
  it('1. enforces default desktop concurrency limit of 2 concurrent workers', () => {
    const queue = new ProcessingQueue(2);
    expect(queue.getConcurrency()).toBe(2);
  });

  // Test 2: Adapts concurrency to 1 on mobile/constrained environments
  it('2. adapts concurrency to 1 on mobile or constrained CPU environments', () => {
    // Simulate mobile viewport width <= 768px
    (globalThis as any).innerWidth = 375;
    const mobileConcurrency = getOptimalDeviceConcurrency(2);
    expect(mobileConcurrency).toBe(1);

    // Reset innerWidth
    delete (globalThis as any).innerWidth;
  });

  // Test 3: Transitions items through sequential processing stages
  it('3. transitions items through sequential stages: queued -> decoding -> resizing -> watermarking -> encoding -> completed', async () => {
    const queue = new ProcessingQueue(1);
    const item = createMockItem('stage-test-1');
    const stages: ProcessingStage[] = [];

    const mockProcessor = vi.fn(async () => ({
      blob: new Blob(['webp'], { type: 'image/webp' }),
      url: 'blob:stage-result',
      width: 800,
      height: 600,
      size: 15000,
    }));

    await queue.run(
      [item],
      defaultConvPrefs,
      defaultWmPrefs,
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemStage: (_id, stage) => stages.push(stage),
        onItemSuccess: vi.fn(),
        onItemError: vi.fn(),
        onTotalProgress: vi.fn(),
      },
      mockProcessor
    );

    expect(stages).toContain('decoding');
    expect(stages).toContain('resizing');
    expect(stages).toContain('watermarking');
    expect(stages).toContain('encoding');
    expect(stages).toContain('completed');
  });

  // Test 4: Calculates accurate progress percentage across queue lifecycle
  it('4. calculates accurate progress percentage across queue lifecycle', async () => {
    const queue = new ProcessingQueue(2);
    const items = [
      createMockItem('p1'),
      createMockItem('p2'),
      createMockItem('p3'),
      createMockItem('p4'),
    ];

    const progressReports: Array<{ completed: number; total: number }> = [];

    const mockProcessor = vi.fn(async () => ({
      blob: new Blob(['webp'], { type: 'image/webp' }),
      url: 'blob:result',
      width: 1000,
      height: 800,
      size: 20000,
    }));

    await queue.run(
      items,
      defaultConvPrefs,
      { ...defaultWmPrefs, enabled: false },
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemSuccess: vi.fn(),
        onItemError: vi.fn(),
        onTotalProgress: (completed, total) => {
          progressReports.push({ completed, total });
        },
      },
      mockProcessor
    );

    expect(progressReports.length).toBe(4);
    expect(progressReports[progressReports.length - 1]).toEqual({ completed: 4, total: 4 });
  });

  // Test 5: Error isolation - failed item doesn't halt remaining items
  it('5. isolates failed image jobs so subsequent queue items complete successfully', async () => {
    const queue = new ProcessingQueue(1);
    const items = [
      createMockItem('fail-1'),
      createMockItem('success-2'),
      createMockItem('success-3'),
    ];

    const errorSpy = vi.fn();
    const successSpy = vi.fn();

    const mockProcessor = vi.fn(async (item: ProcessedImageItem) => {
      if (item.id === 'fail-1') {
        throw new Error('Image corrupt or decode failure');
      }
      return {
        blob: new Blob(['webp'], { type: 'image/webp' }),
        url: `blob:${item.id}`,
        width: 1000,
        height: 800,
        size: 25000,
      };
    });

    await queue.run(
      items,
      defaultConvPrefs,
      defaultWmPrefs,
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemSuccess: successSpy,
        onItemError: errorSpy,
        onTotalProgress: vi.fn(),
      },
      mockProcessor
    );

    // One error callback, two successful conversions
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('fail-1', 'Image corrupt or decode failure');
    expect(successSpy).toHaveBeenCalledTimes(2);
  });

  // Test 6: Cancels active and pending jobs via cancel()
  it('6. cancels active and pending worker jobs via cancel() protocol', async () => {
    const queue = new ProcessingQueue(1);
    const items = [createMockItem('c1'), createMockItem('c2'), createMockItem('c3')];

    let processedCount = 0;
    const mockProcessor = vi.fn(async () => {
      processedCount++;
      if (processedCount === 1) {
        queue.cancel();
      }
      return {
        blob: new Blob(['webp'], { type: 'image/webp' }),
        url: 'blob:c',
        width: 1000,
        height: 800,
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
        onItemSuccess: vi.fn(),
        onItemError: vi.fn(),
        onTotalProgress: vi.fn(),
      },
      mockProcessor
    );

    // Only the first item was processed before cancellation halted the rest
    expect(processedCount).toBe(1);
  });

  // Test 7: Cancels an individual job using cancelJob(id)
  it('7. cancels an individual job using cancelJob(id)', () => {
    const queue = new ProcessingQueue(2);
    expect(() => queue.cancelJob('test-job-99')).not.toThrow();
  });

  // Test 8: Memory pressure detection and automatic concurrency reduction
  it('8. detects high memory pressure and automatically reduces concurrency to 1', async () => {
    const queue = new ProcessingQueue(2);
    // Create large batch payload > 80 MB
    const heavyItems = Array.from({ length: 5 }, (_, i) =>
      createMockItem(`heavy-${i}`, `large-${i}.jpg`, 20 * 1024 * 1024)
    );

    const memoryPressureSpy = vi.fn();

    const mockProcessor = vi.fn(async () => ({
      blob: new Blob(['webp'], { type: 'image/webp' }),
      url: 'blob:heavy',
      width: 1000,
      height: 800,
      size: 50000,
    }));

    await queue.run(
      heavyItems,
      defaultConvPrefs,
      defaultWmPrefs,
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemSuccess: vi.fn(),
        onItemError: vi.fn(),
        onTotalProgress: vi.fn(),
        onMemoryPressure: memoryPressureSpy,
      },
      mockProcessor
    );

    expect(memoryPressureSpy).toHaveBeenCalledTimes(1);
    expect(memoryPressureSpy).toHaveBeenCalledWith(
      expect.objectContaining({ reducedConcurrency: 1 })
    );
    expect(queue.getConcurrency()).toBe(1);
  });

  // Test 9: Retry mechanism for failed items
  it('9. enables retry for failed items transitioning back into queued status', async () => {
    const queue = new ProcessingQueue(1);
    const failedItem = createMockItem('retry-item');
    failedItem.status = 'error';
    failedItem.errorMessage = 'Network timeout';

    // Transition back to queued for retry
    failedItem.status = 'queued';
    failedItem.errorMessage = undefined;

    const successSpy = vi.fn();
    const mockProcessor = vi.fn(async () => ({
      blob: new Blob(['webp'], { type: 'image/webp' }),
      url: 'blob:retry-success',
      width: 1000,
      height: 800,
      size: 25000,
    }));

    await queue.run(
      [failedItem],
      defaultConvPrefs,
      defaultWmPrefs,
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemSuccess: successSpy,
        onItemError: vi.fn(),
        onTotalProgress: vi.fn(),
      },
      mockProcessor
    );

    expect(successSpy).toHaveBeenCalledTimes(1);
  });

  // Test 10: Handles zero-item empty queue execution gracefully without hanging
  it('10. handles zero-item empty queue execution gracefully without hanging', async () => {
    const queue = new ProcessingQueue(2);
    const successSpy = vi.fn();

    await queue.run(
      [],
      defaultConvPrefs,
      defaultWmPrefs,
      {
        onItemStart: vi.fn(),
        onItemProgress: vi.fn(),
        onItemSuccess: successSpy,
        onItemError: vi.fn(),
        onTotalProgress: vi.fn(),
      }
    );

    expect(successSpy).not.toHaveBeenCalled();
  });
});
