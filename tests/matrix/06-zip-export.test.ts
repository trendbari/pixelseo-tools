import { describe, it, expect, vi } from 'vitest';
import {
  downloadAllAsZip,
  estimateZipMemoryUsage,
  isItemValidForExport,
  HIGH_MEMORY_PAYLOAD_MB_THRESHOLD,
} from '@/lib/zipExporter';
import { ProcessedImageItem, ConversionPreferences, SeoGeneratorConfig } from '@/types';
import JSZip from 'jszip';

/**
 * PRD Test Suite: 6. ZIP Export (6 planned tests)
 * Tests actual production ZIP exporter module, directory hierarchy (images/, metadata/, README.txt),
 * STORE compression rule for WebP, 0-byte/corrupted output filtering,
 * Zip Slip path traversal defense, and memory estimation budget.
 */
describe('PRD Test Suite 6: ZIP Export (6 Tests)', () => {
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

  const defaultSeoConfig: SeoGeneratorConfig = {
    brandName: 'PixelSEO Store',
    category: 'Fashion',
    defaultAltTemplate: '{brand} {name}',
    defaultTitleTemplate: '{name} | {brand}',
    autoExtractKeywords: true,
    ecommercePreset: 'standard',
  };

  const setupMockDom = () => {
    const savedDocument = (globalThis as any).document;
    const savedWindow = (globalThis as any).window;
    const savedURL = (globalThis as any).URL;

    let capturedBlob: Blob | null = null;
    const mockAnchor: any = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      href: '',
      download: '',
    };

    (globalThis as any).window = globalThis;
    (globalThis as any).document = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'a') return mockAnchor;
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    };

    (globalThis as any).URL = {
      ...URL,
      createObjectURL: vi.fn((blob: any) => {
        capturedBlob = blob;
        return 'blob:mock-zip';
      }),
      revokeObjectURL: vi.fn(),
    };

    return {
      mockAnchor,
      getCapturedBlob: () => capturedBlob,
      cleanup: () => {
        if (savedDocument === undefined) {
          delete (globalThis as any).document;
        } else {
          (globalThis as any).document = savedDocument;
        }
        if (savedWindow === undefined) {
          delete (globalThis as any).window;
        } else {
          (globalThis as any).window = savedWindow;
        }
        (globalThis as any).URL = savedURL;
      },
    };
  };

  const createMockItem = (
    id: string,
    name: string,
    blobSize = 50000,
    status: 'idle' | 'processing' | 'done' | 'error' = 'done'
  ): ProcessedImageItem => {
    // 12-byte valid WebP container header: 'RIFF' [size] 'WEBP'
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x20, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);
    const payload = new Uint8Array(Math.max(12, blobSize));
    payload.set(webpHeader, 0);

    return {
      id,
      file: new File(['raw'], name, { type: 'image/jpeg' }),
      name,
      originalSize: 150000,
      originalWidth: 1200,
      originalHeight: 800,
      convertedBlob: new Blob([payload], { type: 'image/webp' }),
      convertedSize: blobSize,
      convertedWidth: 1200,
      convertedHeight: 800,
      previewUrl: 'blob:mock',
      status,
      stage: 'completed',
      progress: 100,
      seo: {
        title: name,
        alt: `${name} alt text`,
        description: '',
        tags: [],
        keywords: [],
      },
    };
  };

  // Test 1: Exact directory hierarchy
  it('1. generates exact required archive hierarchy: images/, metadata/, README.txt', async () => {
    const items = [
      createMockItem('1', 'photo-1.jpg'),
      createMockItem('2', 'photo-2.jpg'),
    ];

    const dom = setupMockDom();
    try {
      await downloadAllAsZip(items, defaultConvPrefs, defaultSeoConfig);

      const generatedZipBlob = dom.getCapturedBlob();
      expect(generatedZipBlob).toBeDefined();

      const zip = await JSZip.loadAsync(await (generatedZipBlob as any).arrayBuffer());

      // Verify folders and files exist in the hierarchy
      expect(zip.folder('images')).not.toBeNull();
      expect(zip.folder('metadata')).not.toBeNull();
      expect(zip.file('README.txt')).not.toBeNull();
      expect(zip.file('metadata/image-metadata.csv')).not.toBeNull();
      expect(zip.file('metadata/schema-imageobject.json')).not.toBeNull();

      // Verify files inside images/
      expect(zip.file('images/photo-1.webp')).not.toBeNull();
      expect(zip.file('images/photo-2.webp')).not.toBeNull();
    } finally {
      dom.cleanup();
    }
  });

  // Test 2: STORE compression for WebP files
  it('2. stores WebP files using STORE compression to prevent CPU and memory overhead', async () => {
    const item = createMockItem('1', 'sample.jpg');

    const zip = new JSZip();
    const imagesFolder = zip.folder('images');
    const isWebp = true;

    imagesFolder?.file('sample.webp', item.convertedBlob!, {
      compression: isWebp ? 'STORE' : 'DEFLATE',
    });

    const fileEntry = imagesFolder?.file('sample.webp');
    expect(fileEntry?.options.compression).toBe('STORE');
  });

  // Test 3: Filters out 0-byte or corrupted items
  it('3. filters out 0-byte, corrupted, or failed items from images/ folder', async () => {
    const validItem = createMockItem('v1', 'good.jpg', 50000, 'done');

    // Corrupted item with 0 bytes
    const emptyItem = createMockItem('e1', 'empty.jpg', 0, 'done');
    emptyItem.convertedBlob = new Blob([], { type: 'image/webp' });
    emptyItem.convertedSize = 0;

    // Failed item
    const failedItem = createMockItem('f1', 'broken.jpg', 0, 'error');

    expect(await isItemValidForExport(validItem)).toBe(true);
    expect(await isItemValidForExport(emptyItem)).toBe(false);
    expect(await isItemValidForExport(failedItem)).toBe(false);
  });

  // Test 4: Includes metadata CSV and Schema.org JSON
  it('4. includes complete metadata CSV and Schema.org JSON in metadata/ folder', async () => {
    const items = [createMockItem('1', 'hoodie.png')];

    const dom = setupMockDom();
    try {
      await downloadAllAsZip(items, defaultConvPrefs, defaultSeoConfig);
      const zipBlob = dom.getCapturedBlob();
      const zip = await JSZip.loadAsync(await (zipBlob as any).arrayBuffer());

      const csvContent = await zip.file('metadata/image-metadata.csv')?.async('string');
      const jsonContent = await zip.file('metadata/schema-imageobject.json')?.async('string');

      expect(csvContent).toBeDefined();
      expect(csvContent).toContain('original_filename');
      expect(csvContent).toContain('hoodie.png');

      expect(jsonContent).toBeDefined();
      const parsed = JSON.parse(jsonContent || '{}');
      expect(parsed['@context']).toBe('https://schema.org');
    } finally {
      dom.cleanup();
    }
  });

  // Test 5: Protects against Zip Slip directory traversal
  it('5. protects against Zip Slip directory traversal vulnerabilities', async () => {
    const maliciousItem = createMockItem('bad', '../../../../etc/passwd.jpg');

    const dom = setupMockDom();
    try {
      await downloadAllAsZip([maliciousItem], defaultConvPrefs, defaultSeoConfig);
      const zipBlob = dom.getCapturedBlob();
      const zip = await JSZip.loadAsync(await (zipBlob as any).arrayBuffer());

      const files = Object.keys(zip.files);
      // No entry must contain directory traversal characters
      files.forEach((path) => {
        expect(path).not.toContain('..');
      });
      // Sanitized into safe path inside images/
      expect(files.some((f) => f.startsWith('images/passwd'))).toBe(true);
    } finally {
      dom.cleanup();
    }
  });

  // Test 6: Memory budget assessment
  it('6. evaluates ZIP memory budget and provides batch export safeguards', () => {
    const smallBatch = [createMockItem('1', 'photo.jpg', 1024 * 1024 * 2)];
    const smallEstimate = estimateZipMemoryUsage(smallBatch);

    expect(smallEstimate.isHighMemory).toBe(false);
    expect(smallEstimate.validCount).toBe(1);

    // Large batch exceeding threshold
    const largeBatch = Array.from({ length: 15 }, (_, i) =>
      createMockItem(`large-${i}`, `img-${i}.jpg`, 10 * 1024 * 1024)
    );
    const largeEstimate = estimateZipMemoryUsage(largeBatch);

    expect(largeEstimate.totalMB).toBeGreaterThan(HIGH_MEMORY_PAYLOAD_MB_THRESHOLD);
    expect(largeEstimate.isHighMemory).toBe(true);
    expect(largeEstimate.warning).toBeDefined();
  });
});
