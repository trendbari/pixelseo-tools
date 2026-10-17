import { describe, it, expect } from 'vitest';
import {
  generateCsvContent,
  sanitizeCsvValue,
  itemToCsvRecord,
  CSV_HEADERS,
  ImageCsvRecord,
} from '@/lib/export/csv';
import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';

describe('Unit Test: CSV Exporter & ImageCsvRecord Contract', () => {
  it('neutralizes formula injection characters (CWE-1236)', () => {
    expect(sanitizeCsvValue('=1+2')).toBe("'=1+2");
    expect(sanitizeCsvValue('+CMD')).toBe("'+CMD");
    expect(sanitizeCsvValue('-100')).toBe("'-100");
    expect(sanitizeCsvValue('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    expect(sanitizeCsvValue('Normal Product')).toBe('Normal Product');
  });

  it('strictly adheres to the ImageCsvRecord schema contract', () => {
    const mockItem: ProcessedImageItem = {
      id: 'test-1',
      file: new File([''], 'photo.jpg', { type: 'image/jpeg' }),
      name: 'photo.jpg',
      originalSize: 150000,
      originalWidth: 2000,
      originalHeight: 1500,
      previewUrl: 'blob:photo',
      convertedSize: 45000,
      convertedWidth: 1600,
      convertedHeight: 1200,
      compressionPercent: 70,
      watermarkApplied: true,
      status: 'done',
      progress: 100,
      seo: {
        title: 'প্রিমিয়াম শার্ট (Premium Shirt)',
        alt: 'Handmade Cotton Shirt',
        description: 'Best eco-friendly cotton shirt.',
        tags: ['shirt', 'cotton', 'eco'],
        keywords: ['shirt', 'cotton'],
      },
    };

    const convPrefs: ConversionPreferences = {
      format: 'webp',
      quality: 85,
      resizeEnabled: true,
      maxWidth: 1600,
      maxHeight: 1200,
      preserveAspectRatio: true,
      namingPattern: 'seo-slug',
      prefix: '',
      suffix: '',
    };

    const record: ImageCsvRecord = itemToCsvRecord(mockItem, convPrefs, 0);

    // Verify all 13 fields of the ImageCsvRecord contract
    expect(record.original_filename).toBe('photo.jpg');
    expect(record.output_filename).toBe('photo-seo-optimized.webp');
    expect(record.original_size_bytes).toBe(150000);
    expect(record.output_size_bytes).toBe(45000);
    expect(record.width).toBe(1600);
    expect(record.height).toBe(1200);
    expect(record.quality).toBe(85);
    expect(record.watermark_applied).toBe(true);
    expect(record.alt_text).toBe('Handmade Cotton Shirt');
    expect(record.seo_title).toBe('প্রিমিয়াম শার্ট (Premium Shirt)');
    expect(record.meta_description).toBe('Best eco-friendly cotton shirt.');
    expect(record.keywords).toBe('shirt, cotton');
    expect(record.status).toBe('completed');
  });

  it('generates valid 13-column CSV with UTF-8 BOM for Excel Unicode compatibility', () => {
    const mockItem: ProcessedImageItem = {
      id: 'test-1',
      file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
      name: 'test.jpg',
      originalSize: 100000,
      originalWidth: 1920,
      originalHeight: 1080,
      previewUrl: 'blob:test',
      convertedSize: 40000,
      convertedWidth: 1920,
      convertedHeight: 1080,
      compressionPercent: 60,
      watermarkApplied: true,
      status: 'done',
      progress: 100,
      seo: {
        title: 'Premium Shirt',
        alt: 'High Quality Shirt',
        description: 'Cotton shirt',
        tags: ['shirt', 'cotton'],
        keywords: ['shirt'],
      },
    };

    const convPrefs: ConversionPreferences = {
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

    const csv = generateCsvContent([mockItem], convPrefs);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(CSV_HEADERS.join(','));
    expect(csv).toContain('test.jpg');
    expect(csv).toContain('test.webp');
    expect(csv).toContain('completed');
  });
});
