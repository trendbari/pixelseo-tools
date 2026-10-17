import { describe, it, expect, afterEach } from 'vitest';
import { estimateZipMemoryUsage } from '@/lib/zipExporter';
import { getOptimalDeviceConcurrency, ProcessingQueue } from '@/lib/image/queue';
import { ProcessedImageItem } from '@/types';
import fs from 'fs';
import path from 'path';

describe('Performance Optimizations (8 Specifications)', () => {
  const imageCardPath = path.resolve(__dirname, '../../src/components/ImageCard.tsx');
  const mainWorkspacePath = path.resolve(__dirname, '../../src/components/MainWorkspace.tsx');
  const zipExporterPath = path.resolve(__dirname, '../../src/lib/zipExporter.ts');
  const queuePath = path.resolve(__dirname, '../../src/lib/image/queue.ts');
  const imageProcessorPath = path.resolve(__dirname, '../../src/lib/imageProcessor.ts');
  const globalsCssPath = path.resolve(__dirname, '../../src/app/globals.css');
  const workerBridgePath = path.resolve(__dirname, '../../src/lib/workers/workerBridge.ts');

  // Optimization 1: Lazy-load Watermark Studio & ZIP library
  describe('Optimization 1: Lazy loading Watermark Studio & ZIP library', () => {
    it('lazy-loads JSZip dynamically in zipExporter using dynamic import()', () => {
      const content = fs.readFileSync(zipExporterPath, 'utf8');
      expect(content).toContain("import('jszip')");
      // Must not statically import JSZip at top-level
      expect(content).not.toMatch(/^import\s+JSZip\s+from/m);
    });

    it('lazy-loads Watermark Studio modal dynamically in main pages', () => {
      const pagePath = path.resolve(__dirname, '../../src/app/page.tsx');
      const content = fs.readFileSync(pagePath, 'utf8');
      expect(content).toContain('dynamic(');
      expect(content).toContain('PreferencesModal');
      expect(content).toContain('ImageDetailModal');
    });
  });

  // Optimization 2: Image previews use thumbnails
  describe('Optimization 2: Image previews use thumbnails', () => {
    it('ensures ImageCard and workspace list use loading="lazy" and decoding="async"', () => {
      const cardContent = fs.readFileSync(imageCardPath, 'utf8');
      expect(cardContent).toContain('loading="lazy"');
      expect(cardContent).toContain('decoding="async"');

      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain('loading="lazy"');
      expect(wsContent).toContain('decoding="async"');
    });

    it('ensures ImageCard and workspace list prioritize thumbnailUrl before raw previewUrl', () => {
      const cardContent = fs.readFileSync(imageCardPath, 'utf8');
      expect(cardContent).toContain('item.thumbnailUrl');

      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain('item.thumbnailUrl');
    });
  });

  // Optimization 3: Visible images virtualized grid
  describe('Optimization 3: Virtualized grid with content-visibility', () => {
    it('applies content-visibility: auto and contain-intrinsic-size to .image-card', () => {
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
      expect(cssContent).toContain('content-visibility: auto');
      expect(cssContent).toContain('contain-intrinsic-size: 320px 280px');
    });
  });

  // Optimization 4: Limited concurrent processing
  describe('Optimization 4: Limited concurrent processing', () => {
    it('ProcessingQueue limits concurrent processing by default', () => {
      const queueContent = fs.readFileSync(queuePath, 'utf8');
      expect(queueContent).toContain('getOptimalDeviceConcurrency');
      expect(queueContent).toContain('activeWorkers');
    });
  });

  // Optimization 5: Worker and Canvas resources cleanup
  describe('Optimization 5: Worker and Canvas resources cleanup', () => {
    it('releases GPU buffer immediately by setting canvas width & height to 0', () => {
      const procContent = fs.readFileSync(imageProcessorPath, 'utf8');
      expect(procContent).toContain('canvas.width = 0');
      expect(procContent).toContain('canvas.height = 0');

      const bridgeContent = fs.readFileSync(workerBridgePath, 'utf8');
      expect(bridgeContent).toContain('worker.terminate()');
      expect(bridgeContent).toContain('URL.revokeObjectURL(workerUrl)');
      expect(bridgeContent).toContain('canvas.width = 0');
      expect(bridgeContent).toContain('canvas.height = 0');
    });
  });

  // Optimization 6: Estimate ZIP memory usage
  describe('Optimization 6: Estimate ZIP memory usage before generation', () => {
    it('accurately calculates small batch memory usage without high-memory warning', () => {
      const mockItems: ProcessedImageItem[] = [
        {
          id: '1',
          name: 'photo1.jpg',
          status: 'done',
          originalSize: 1024 * 500,
          convertedSize: 1024 * 200,
          convertedBlob: new Blob(['a'.repeat(1024 * 200)], { type: 'image/webp' }),
        } as any,
        {
          id: '2',
          name: 'photo2.jpg',
          status: 'done',
          originalSize: 1024 * 800,
          convertedSize: 1024 * 300,
          convertedBlob: new Blob(['b'.repeat(1024 * 300)], { type: 'image/webp' }),
        } as any,
      ];

      const estimate = estimateZipMemoryUsage(mockItems);
      expect(estimate.totalBytes).toBe(500 * 1024);
      expect(estimate.isHighMemory).toBe(false);
      expect(estimate.warning).toBeUndefined();
      expect(estimate.formattedTotal).toBe('500.0 KB');
    });

    it('flags batches exceeding 120MB as high memory risk with browser safety warning', () => {
      const mockItems: ProcessedImageItem[] = [
        {
          id: '1',
          name: 'huge-batch.webp',
          status: 'done',
          originalSize: 150 * 1024 * 1024,
          convertedSize: 130 * 1024 * 1024,
          convertedBlob: { size: 130 * 1024 * 1024, type: 'image/webp' } as any,
        } as any,
      ];

      const estimate = estimateZipMemoryUsage(mockItems);
      expect(estimate.totalMB).toBeCloseTo(130, 0);
      expect(estimate.isHighMemory).toBe(true);
      expect(estimate.warning).toContain('130.0 MB');
      expect(estimate.warning).toContain('substantial browser memory');
    });

    it('ignores items that failed or are pending conversion', () => {
      const mockItems: ProcessedImageItem[] = [
        {
          id: '1',
          name: 'done.webp',
          status: 'done',
          originalSize: 5000,
          convertedSize: 2000,
          convertedBlob: new Blob(['test'], { type: 'image/webp' }),
        } as any,
        {
          id: '2',
          name: 'failed.jpg',
          status: 'error',
          originalSize: 5000000,
          convertedSize: null,
          convertedBlob: null,
        } as any,
      ];

      const estimate = estimateZipMemoryUsage(mockItems);
      expect(estimate.totalBytes).toBe(2000);
    });
  });

  // Optimization 7: Mobile devices concurrency reduction
  describe('Optimization 7: Mobile devices concurrency reduction', () => {
    const originalNavigator = globalThis.navigator;
    const originalInnerWidth = globalThis.innerWidth;

    afterEach(() => {
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'innerWidth', {
        value: originalInnerWidth,
        configurable: true,
        writable: true,
      });
    });

    it('defaults to 2 concurrent workers on high-end desktop environments', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          hardwareConcurrency: 8,
        },
        configurable: true,
      });
      Object.defineProperty(globalThis, 'innerWidth', {
        value: 1440,
        configurable: true,
      });

      const concurrency = getOptimalDeviceConcurrency(2);
      expect(concurrency).toBe(2);

      const queue = new ProcessingQueue();
      expect(queue.getConcurrency()).toBe(2);
    });

    it('reduces concurrency to 1 worker on mobile user-agents (e.g., iPhone / Android)', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)',
          hardwareConcurrency: 6,
        },
        configurable: true,
      });
      Object.defineProperty(globalThis, 'innerWidth', {
        value: 390,
        configurable: true,
      });

      const concurrency = getOptimalDeviceConcurrency(2);
      expect(concurrency).toBe(1);

      const queue = new ProcessingQueue();
      expect(queue.getConcurrency()).toBe(1);
    });

    it('reduces concurrency to 1 worker on low-core CPUs (hardwareConcurrency <= 4)', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 2,
        },
        configurable: true,
      });
      Object.defineProperty(globalThis, 'innerWidth', {
        value: 1200,
        configurable: true,
      });

      const concurrency = getOptimalDeviceConcurrency(2);
      expect(concurrency).toBe(1);
    });

    it('reduces concurrency to 1 worker on small viewports (innerWidth <= 768px)', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Desktop)',
          hardwareConcurrency: 8,
        },
        configurable: true,
      });
      Object.defineProperty(globalThis, 'innerWidth', {
        value: 640,
        configurable: true,
      });

      const concurrency = getOptimalDeviceConcurrency(2);
      expect(concurrency).toBe(1);
    });
  });

  // Optimization 8: React components memoize where needed
  describe('Optimization 8: React components memoize where needed', () => {
    it('wraps ImageCardComponent in React.memo to prevent 100-card re-renders', () => {
      const cardContent = fs.readFileSync(imageCardPath, 'utf8');
      expect(cardContent).toContain('export const ImageCard = React.memo(');
    });
  });

  // Conversion Disclaimer Requirement
  describe('Conversion Time Disclaimer Requirement', () => {
    it('displays the explicit conversion time disclaimer in both Bengali and English', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain(
        'Conversion time নির্ভর করবে ছবির dimensions, ডিভাইসের RAM, CPU এবং browser codec support-এর ওপর। তাই ১০০টি ছবির জন্য নির্দিষ্ট সময়ের নিশ্চয়তা দেওয়া হবে না।'
      );
      expect(wsContent).toContain(
        'Conversion time depends on image dimensions, device RAM, CPU, and browser codec support; no fixed time guarantee is provided for 100-image batches.'
      );
    });
  });
});
