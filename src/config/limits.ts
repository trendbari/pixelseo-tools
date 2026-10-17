export const processingLimits = {
  maxBatchFiles: 100,
  maxFileSizeMB: 20,
  maxFileSizeBytes: 20 * 1024 * 1024,
  supportedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif'
  ] as const,
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'] as const,
  defaultQuality: 85,
  minQuality: 10,
  maxQuality: 100,
  defaultWatermarkOpacity: 0.55,
  defaultConcurrency: 4,
  maxDimensionConstraint: 8192
};
