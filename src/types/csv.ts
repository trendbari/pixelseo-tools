/**
 * CSV Metadata Record Contract for PixelSEO Tools v3.1
 * Strictly specifies column names and types for RFC 4180 CSV export.
 */
export interface ImageCsvRecord {
  original_filename: string;
  output_filename: string;
  original_size_bytes: number;
  output_size_bytes: number;
  width: number;
  height: number;
  quality: number;
  watermark_applied: boolean;
  alt_text: string;
  seo_title: string;
  meta_description: string;
  keywords: string;
  status: string;
}
