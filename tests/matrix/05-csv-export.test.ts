import { describe, it, expect } from 'vitest';
import {
  generateMetadataCsvString,
  sanitizeAndEscapeCsvCell,
  itemToCsvRecord,
  CSV_HEADERS,
} from '@/lib/csvExporter';
import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';

/**
 * PRD Test Suite: 5. CSV Export (6 planned tests)
 * Tests actual production CSV exporter module, 13-field snake_case contract,
 * UTF-8 BOM byte marker (\uFEFF), CWE-1236 formula sanitization, RFC 4180 escaping,
 * and error/cancelled status serialization.
 */
describe('PRD Test Suite 5: CSV Export (6 Tests)', () => {
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

  const createMockItem = (
    id: string,
    name: string,
    status: 'idle' | 'processing' | 'done' | 'error' | 'cancelled' = 'done'
  ): ProcessedImageItem => ({
    id,
    file: new File(['data'], name, { type: 'image/jpeg' }),
    name,
    originalSize: 500000,
    originalWidth: 1600,
    originalHeight: 1200,
    convertedBlob: new Blob(['webp-data'], { type: 'image/webp' }),
    convertedSize: 120000,
    convertedWidth: 1600,
    convertedHeight: 1200,
    previewUrl: 'blob:preview',
    status,
    stage: 'completed',
    progress: 100,
    watermarkApplied: true,
    seo: {
      title: 'Handmade Leather Wallet - Best Price in BD',
      alt: 'Black genuine leather wallet with RFID blocking',
      description: 'Buy premium handcrafted leather wallet online at best price.',
      tags: ['leather', 'wallet', 'fashion'],
      keywords: ['wallet', 'leather wallet', 'mens accessories'],
    },
  });

  // Test 1: Exactly 13 snake_case headers
  it('1. exports all 13 exact snake_case schema headers required by PRD metadata contract', () => {
    const expectedHeaders = [
      'original_filename',
      'output_filename',
      'original_size_bytes',
      'output_size_bytes',
      'width',
      'height',
      'quality',
      'watermark_applied',
      'alt_text',
      'seo_title',
      'meta_description',
      'keywords',
      'status',
    ];

    expect(CSV_HEADERS).toEqual(expectedHeaders);
    expect(CSV_HEADERS.length).toBe(13);

    const csvContent = generateMetadataCsvString([], defaultConvPrefs);
    const headerLine = csvContent.replace(/^\uFEFF/, '').split('\r\n')[0];
    expect(headerLine).toBe(expectedHeaders.join(','));
  });

  // Test 2: UTF-8 BOM (\uFEFF)
  it('2. prepends UTF-8 BOM (\\uFEFF) for Bengali (বাংলা) and Excel character compatibility', () => {
    const item = createMockItem('bn-1', 'পণ্য-ছবি.jpg');
    item.seo.title = 'চামড়ার মানিব্যাগ';

    const csvContent = generateMetadataCsvString([item], defaultConvPrefs);

    expect(csvContent.charCodeAt(0)).toBe(0xfeff);
    expect(csvContent.startsWith('\uFEFF')).toBe(true);
    expect(csvContent).toContain('চামড়ার মানিব্যাগ');
  });

  // Test 3: Formula injection protection (CWE-1236)
  it('3. neutralizes CSV spreadsheet formula injection attacks (CWE-1236)', () => {
    // Malicious spreadsheet formulas starting with =, +, -, @, \t
    expect(sanitizeAndEscapeCsvCell('=cmd|/C calc!A0')).toBe(`"'=cmd|/C calc!A0"`);
    expect(sanitizeAndEscapeCsvCell('+1+2')).toBe(`"'+1+2"`);
    expect(sanitizeAndEscapeCsvCell('-50+10')).toBe(`"'-50+10"`);
    expect(sanitizeAndEscapeCsvCell('@SUM(1,2)')).toBe(`"'@SUM(1,2)"`);
  });

  // Test 4: RFC 4180 escaping
  it('4. escapes commas, linebreaks, and double quotes strictly per RFC 4180 standards', () => {
    // Value with quotes and comma
    const escaped = sanitizeAndEscapeCsvCell('Special "Discount", 20% Off');
    expect(escaped).toBe('"Special ""Discount"", 20% Off"');

    // Value with newline
    const withNewline = sanitizeAndEscapeCsvCell('Line 1\nLine 2');
    expect(withNewline).toBe('"Line 1\nLine 2"');
  });

  // Test 5: Accurate mapping of item fields into record
  it('5. maps ProcessedImageItem fields accurately into CSV record values', () => {
    const item = createMockItem('item-1', 'handbag.png');
    const record = itemToCsvRecord(item, defaultConvPrefs, 0);

    expect(record.original_filename).toBe('handbag.png');
    expect(record.output_filename).toBe('handbag.webp');
    expect(record.original_size_bytes).toBe(500000);
    expect(record.output_size_bytes).toBe(120000);
    expect(record.width).toBe(1600);
    expect(record.height).toBe(1200);
    expect(record.quality).toBe(85);
    expect(record.watermark_applied).toBe(true);
    expect(record.status).toBe('completed');
    expect(record.keywords).toContain('wallet');
  });

  // Test 6: Handles failed and cancelled statuses
  it('6. handles items with error and cancelled statuses serializing status reason', () => {
    const errorItem = createMockItem('err-1', 'broken.jpg', 'error');
    errorItem.errorMessage = 'Decode buffer overflow';

    const cancelledItem = createMockItem('can-1', 'cancelled.jpg', 'cancelled');

    const errRecord = itemToCsvRecord(errorItem, defaultConvPrefs, 0);
    const canRecord = itemToCsvRecord(cancelledItem, defaultConvPrefs, 1);

    expect(errRecord.status).toBe('failed: Decode buffer overflow');
    expect(canRecord.status).toBe('cancelled');
  });
});
