import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences, ImageCsvRecord } from '@/types';
import { formatOutputFilename } from './imageProcessor';

export type { ImageCsvRecord };

export const CSV_HEADERS = [
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
] as const;

/**
 * Sanitize and escape cell to prevent CSV Formula Injection (CWE-1236)
 * and conform strictly to RFC 4180 standards.
 */
export function sanitizeAndEscapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Prevent Spreadsheet Formula Injection (OWASP / CWE-1236)
  // If untrusted input starts with =, +, -, @, tab, or carriage return,
  // prepend a single quote (') so spreadsheets interpret it strictly as text.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180 quoting: escape double quotes by doubling them (""")
  // and enclose in quotes if it contains commas, quotes, or newlines.
  if (
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r') ||
    str.startsWith("'")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

/**
 * Maps a single ProcessedImageItem to the exact ImageCsvRecord contract
 */
export function itemToCsvRecord(
  item: ProcessedImageItem,
  convPrefs: ConversionPreferences,
  index: number,
  wmPrefs?: WatermarkPreferences,
  usedNames?: Set<string>
): ImageCsvRecord {
  const optName = formatOutputFilename(item.name, convPrefs, index, usedNames);
  const origBytes = item.originalSize || 0;
  const outBytes = item.convertedSize ?? item.convertedBlob?.size ?? 0;
  const targetW = item.convertedWidth || item.originalWidth || 0;
  const targetH = item.convertedHeight || item.originalHeight || 0;
  const qualityVal = convPrefs.quality || 85;

  const isWatermarkApplied = Boolean(
    item.watermarkApplied ??
      (wmPrefs?.enabled &&
        (wmPrefs.applyScope === 'all' ||
          (wmPrefs.applyScope === 'selected' &&
            Array.isArray(wmPrefs.selectedImageIds) &&
            wmPrefs.selectedImageIds.includes(item.id))))
  );

  let statusStr = 'ready';
  if (item.status === 'done') {
    statusStr = 'completed';
  } else if (item.status === 'error') {
    statusStr = item.errorMessage ? `failed: ${item.errorMessage}` : 'failed';
  } else if (item.status === 'cancelled') {
    statusStr = 'cancelled';
  } else if (item.status === 'processing') {
    statusStr = 'processing';
  }

  const keywordsStr = item.seo.keywords ? item.seo.keywords.join(', ') : '';

  return {
    original_filename: item.name,
    output_filename: optName,
    original_size_bytes: origBytes,
    output_size_bytes: outBytes,
    width: targetW,
    height: targetH,
    quality: qualityVal,
    watermark_applied: isWatermarkApplied,
    alt_text: item.seo.alt || '',
    seo_title: item.seo.title || '',
    meta_description: item.seo.description || '',
    keywords: keywordsStr,
    status: statusStr,
  };
}

/**
 * Formats an ImageCsvRecord into a sanitized RFC 4180 comma-delimited row
 */
export function formatCsvRecordRow(record: ImageCsvRecord): string {
  return [
    sanitizeAndEscapeCsvCell(record.original_filename),
    sanitizeAndEscapeCsvCell(record.output_filename),
    record.original_size_bytes,
    record.output_size_bytes,
    record.width,
    record.height,
    record.quality,
    record.watermark_applied,
    sanitizeAndEscapeCsvCell(record.alt_text),
    sanitizeAndEscapeCsvCell(record.seo_title),
    sanitizeAndEscapeCsvCell(record.meta_description),
    sanitizeAndEscapeCsvCell(record.keywords),
    sanitizeAndEscapeCsvCell(record.status),
  ].join(',');
}

/**
 * Generate full CSV string conforming to the exact ImageCsvRecord Contract:
 * original_filename, output_filename, original_size_bytes, output_size_bytes,
 * width, height, quality, watermark_applied, alt_text, seo_title,
 * meta_description, keywords, status
 */
export function generateMetadataCsvString(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  wmPrefs?: WatermarkPreferences
): string {
  const usedNames = new Set<string>();
  const records = items.map((item, idx) =>
    itemToCsvRecord(item, convPrefs, idx, wmPrefs, usedNames)
  );
  const rows = records.map(formatCsvRecordRow);

  // Prepend UTF-8 BOM (\uFEFF) so Bengali (বাংলা) & Unicode display properly in Excel
  return '\uFEFF' + [CSV_HEADERS.join(','), ...rows].join('\r\n');
}

/**
 * Generate and download CSV file containing all image metadata
 */
export function exportMetadataToCsv(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  wmPrefs?: WatermarkPreferences
): void {
  if (items.length === 0) return;

  const csvContent = generateMetadataCsvString(items, convPrefs, wmPrefs);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `image-metadata-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
