import { ProcessedImageItem, ConversionPreferences, SeoGeneratorConfig, WatermarkPreferences } from '@/types';
import {
  downloadAllAsZip,
  downloadInBatches,
  estimateZipMemoryUsage,
  isItemValidForExport,
  ZipMemoryEstimate,
} from '../zipExporter';

export {
  downloadAllAsZip,
  downloadInBatches,
  estimateZipMemoryUsage,
  isItemValidForExport,
};
export type { ZipMemoryEstimate };

export async function exportImagesZip(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  seoConfig: SeoGeneratorConfig,
  wmPrefs?: WatermarkPreferences,
  onProgress?: (progressPercent: number) => void
): Promise<void> {
  await downloadAllAsZip(items, convPrefs, seoConfig, wmPrefs, onProgress);
}
