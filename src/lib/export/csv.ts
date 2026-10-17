import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences, ImageCsvRecord } from '@/types';
import {
  generateMetadataCsvString,
  sanitizeAndEscapeCsvCell,
  exportMetadataToCsv,
  itemToCsvRecord,
  formatCsvRecordRow,
  CSV_HEADERS,
} from '../csvExporter';

export type { ImageCsvRecord };
export {
  generateMetadataCsvString,
  sanitizeAndEscapeCsvCell,
  exportMetadataToCsv,
  itemToCsvRecord,
  formatCsvRecordRow,
  CSV_HEADERS,
};

/**
 * Strips formula injection characters for cell values
 */
export function sanitizeCsvValue(val: string): string {
  if (/^[=+\-@\t\r]/.test(val)) {
    return `'${val}`;
  }
  return val;
}

export const generateCsvContent = generateMetadataCsvString;
export const downloadCsvFile = exportMetadataToCsv;

export function exportMetadataCsv(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  wmPrefs?: WatermarkPreferences
): void {
  exportMetadataToCsv(items, convPrefs, wmPrefs);
}
