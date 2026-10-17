import { ProcessedImageItem, ConversionPreferences, WatermarkPreferences, SeoGeneratorConfig } from '@/types';
import { formatOutputFilename } from './imageProcessor';
import { generateMetadataCsvString } from './csvExporter';
import { generateSchemaOrgJsonLd } from './seoEngine';
import { sanitizeSafeFilename } from './security/filenameSanitizer';
import { verifyWebpBlob } from './image/webpSupport';

// Optimization 1: Lazy-load heavy JSZip library on demand to minimize initial bundle size
let jszipModulePromise: Promise<any> | null = null;
async function getJSZip(): Promise<any> {
  if (!jszipModulePromise) {
    jszipModulePromise = import('jszip').then((m) => m.default || m);
  }
  return jszipModulePromise;
}

// Memory threshold: >120MB or >50 large images in browser heap risks tab limits
export const HIGH_MEMORY_PAYLOAD_MB_THRESHOLD = 120;
export const DEFAULT_SMALL_BATCH_SIZE = 30;

export interface ZipMemoryEstimate {
  totalBytes: number;
  totalMB: number;
  formattedTotal: string;
  isHighMemory: boolean;
  warning?: string;
  validCount: number;
  corruptedCount: number;
  suggestedBatchSize: number;
  totalBatches: number;
}

/**
 * Checks whether an item contains a valid, non-corrupted output blob
 */
export async function isItemValidForExport(
  item: ProcessedImageItem,
  format: string = 'webp'
): Promise<boolean> {
  if (item.status !== 'done' || !item.convertedBlob) {
    return false;
  }
  const size = item.convertedSize ?? item.convertedBlob.size;
  if (!size || size <= 0) {
    return false;
  }

  // Corrupted output detection: verify genuine WebP binary container header
  if (format === 'webp' || item.convertedBlob.type === 'image/webp') {
    if (item.convertedBlob.size >= 12) {
      try {
        const isValid = await verifyWebpBlob(item.convertedBlob);
        if (!isValid) return false;
      } catch {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluates total memory requirements and returns risk assessment and batch recommendations
 */
export function estimateZipMemoryUsage(items: ProcessedImageItem[]): ZipMemoryEstimate {
  let totalBytes = 0;
  let validCount = 0;
  let corruptedCount = 0;

  for (const it of items) {
    if (it.status === 'done' && it.convertedBlob) {
      const size = it.convertedSize || it.convertedBlob.size || 0;
      if (size > 0) {
        totalBytes += size;
        validCount++;
      } else {
        corruptedCount++;
      }
    } else if (it.status === 'error') {
      corruptedCount++;
    }
  }

  const totalMB = totalBytes / (1024 * 1024);
  const isHighMemory = totalMB > HIGH_MEMORY_PAYLOAD_MB_THRESHOLD || validCount > 50;
  const suggestedBatchSize = DEFAULT_SMALL_BATCH_SIZE;
  const totalBatches = Math.max(1, Math.ceil(validCount / suggestedBatchSize));

  return {
    totalBytes,
    totalMB,
    formattedTotal: totalMB < 1 ? `${(totalBytes / 1024).toFixed(1)} KB` : `${totalMB.toFixed(1)} MB`,
    isHighMemory,
    warning: isHighMemory
      ? `Estimated ZIP payload is ${totalMB.toFixed(1)} MB. Archive packaging may require substantial browser memory. Smaller-batch export (${suggestedBatchSize} images/part) is recommended to prevent tab memory limits.`
      : undefined,
    validCount,
    corruptedCount,
    suggestedBatchSize,
    totalBatches,
  };
}

/**
 * Creates and downloads the structured ZIP archive:
 * 
 * pixelseo-export.zip
 * ├── images/
 * │   ├── image-001.webp
 * │   ├── image-002.webp
 * │   └── image-003.webp
 * ├── metadata/
 * │   ├── image-metadata.csv
 * │   └── schema-imageobject.json
 * └── README.txt
 * 
 * Strictly excludes corrupted or 0-byte items from the images/ folder.
 */
export async function downloadAllAsZip(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  seoConfig: SeoGeneratorConfig,
  wmPrefs?: WatermarkPreferences,
  onProgress?: (progressPercent: number) => void,
  customArchiveName: string = 'pixelseo-export.zip'
): Promise<{ successCount: number; corruptedCount: number; archiveName: string }> {
  const JSZip = await getJSZip();
  const zip = new JSZip();

  // 1. Folder: images/ (only successfully converted, verified non-corrupted images)
  const imagesFolder = zip.folder('images');
  let successCount = 0;
  let corruptedCount = 0;
  const usedNames = new Set<string>();

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const isValid = await isItemValidForExport(item, convPrefs.format);

    if (isValid && item.convertedBlob) {
      const rawFilename = formatOutputFilename(item.name, convPrefs, index, usedNames);
      // SEC-10: Zip Slip defense - ensure filename cannot contain directory traversal characters
      const ext = convPrefs.format === 'png' ? 'png' : convPrefs.format === 'jpeg' ? 'jpg' : 'webp';
      const fallbackName = `image-${String(index + 1).padStart(3, '0')}.${ext}`;
      const filename = sanitizeSafeFilename(rawFilename, fallbackName);

      const isWebp =
        filename.toLowerCase().endsWith('.webp') ||
        item.convertedBlob.type === 'image/webp' ||
        convPrefs.format === 'webp';

      // Rule: ZIP compression STORE for WEBP files (already compressed, zero CPU waste, prevents memory spike)
      (imagesFolder || zip).file(filename, item.convertedBlob, {
        compression: isWebp ? 'STORE' : 'DEFLATE',
      });
      successCount++;
    } else if (item.status === 'done' || item.status === 'error') {
      corruptedCount++;
    }
  }

  // 2. Folder: metadata/ containing image-metadata.csv matching the exact ImageCsvRecord contract
  const metadataFolder = zip.folder('metadata');
  const metadataCsvContent = generateMetadataCsvString(items, convPrefs, wmPrefs);
  (metadataFolder || zip).file('image-metadata.csv', metadataCsvContent);

  // Also include Schema.org JSON-LD in metadata folder for convenience
  const schemaJson = generateSchemaOrgJsonLd(items, seoConfig.brandName);
  (metadataFolder || zip).file('schema-imageobject.json', schemaJson);

  // 3. File: README.txt in ZIP root
  const totalOriginalBytes = items.reduce((acc, curr) => acc + (curr.originalSize || 0), 0);
  const totalConvertedBytes = items.reduce(
    (acc, curr) => acc + (curr.convertedBlob?.size || curr.convertedSize || curr.originalSize || 0),
    0
  );
  const totalSavedBytes = Math.max(0, totalOriginalBytes - totalConvertedBytes);
  const totalSavingsPct =
    totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 0;

  const readmeContent = `===================================================================
PixelSEO Tools 3.1 - Batch Image & SEO Metadata Export Package
===================================================================
Archive Name: ${customArchiveName}
Export Date: ${new Date().toUTCString()}
Total Items Evaluated: ${items.length}
Successfully Packaged in images/: ${successCount}
Corrupted/Failed Items Excluded: ${corruptedCount}
Target Output Format: ${convPrefs.format.toUpperCase()} (Quality: ${convPrefs.quality}%)
Watermark Imprinted: ${wmPrefs?.enabled ? 'Yes (' + (wmPrefs.type || 'text') + ')' : 'No'}
Bandwidth Savings: ${totalSavingsPct}% (${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB saved)

ZIP ARCHIVE CONTENTS:
---------------------
1. images/
   Contains all ${successCount} successfully converted images in high-performance ${convPrefs.format.toUpperCase()} format.
   (Corrupted or invalid outputs have been strictly filtered out).
   Ready for direct upload to Shopify, WooCommerce, WordPress, Webflow, or custom CDN.

2. metadata/
   - image-metadata.csv
     Complete RFC 4180 CSV export encoded with UTF-8 BOM conforming to the ImageCsvRecord contract:
     original_filename, output_filename, original_size_bytes, output_size_bytes,
     width, height, quality, watermark_applied, alt_text, seo_title,
     meta_description, keywords, status.
   - schema-imageobject.json
     Schema.org structured ImageObject JSON-LD snippets for Google rich image search.

3. README.txt
   This manifest and import guide.

HOW TO IMPORT INTO E-COMMERCE STORES:
--------------------------------------
- Shopify:
  Upload the .webp files into Shopify Settings -> Files.
  Map 'output_filename' and 'alt_text' from image-metadata.csv into your Products CSV.
- WooCommerce:
  Use WooCommerce Product CSV Importer. Match 'Images' column with the optimized file paths.
- Google Merchant Center:
  Ensure alt_text and seo_title match your product feed for image search SEO ranking.

Security & Privacy Guarantee:
All images and metadata were processed 100% locally in your browser memory.
Zero cloud uploads. Zero remote database logging.
https://pixelseo.tools
===================================================================
`;

  zip.file('README.txt', readmeContent);

  // 4. Generate compressed ZIP
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata: { percent: number }) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  // 5. Trigger browser download if in browser environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = customArchiveName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 1000);
  }

  return { successCount, corruptedCount, archiveName: customArchiveName };
}

/**
 * Splits large batches into memory-safe smaller chunks (e.g. 25-30 images/part)
 * and exports sequential ZIP archives with garbage collection pauses in between.
 * Prevents browser memory limits from causing crashes on 100-image batches.
 */
export async function downloadInBatches(
  items: ProcessedImageItem[],
  convPrefs: ConversionPreferences,
  seoConfig: SeoGeneratorConfig,
  wmPrefs?: WatermarkPreferences,
  batchSize: number = DEFAULT_SMALL_BATCH_SIZE,
  onBatchProgress?: (currentBatch: number, totalBatches: number, progressPct: number) => void
): Promise<{ totalBatches: number; totalExported: number; corruptedCount: number }> {
  const completedItems = items.filter((it) => it.status === 'done' && it.convertedBlob && it.convertedBlob.size > 0);
  
  if (completedItems.length === 0) {
    throw new Error('No completed images available to export.');
  }

  const totalBatches = Math.ceil(completedItems.length / batchSize);
  let totalExported = 0;
  let totalCorrupted = 0;

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * batchSize;
    const batchSlice = completedItems.slice(startIdx, startIdx + batchSize);
    const batchNum = b + 1;
    const archiveName = `pixelseo-export-part-${batchNum}-of-${totalBatches}.zip`;

    const result = await downloadAllAsZip(
      batchSlice,
      convPrefs,
      seoConfig,
      wmPrefs,
      (pct) => onBatchProgress?.(batchNum, totalBatches, pct),
      archiveName
    );

    totalExported += result.successCount;
    totalCorrupted += result.corruptedCount;

    // Yield to browser event loop and garbage collector between batch downloads
    if (b < totalBatches - 1) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return { totalBatches, totalExported, corruptedCount: totalCorrupted };
}
