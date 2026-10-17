/**
 * Image Conversion Entry Point (src/lib/convert.ts)
 * 
 * Provides unified access to Web Worker and Canvas-based image conversion,
 * resizing, watermarking, and WebP encoding.
 */

export { convertImage } from './image/convert';
export { processSingleImage } from './imageProcessor';
export { processImageWithWorkerOrFallback } from './workers/workerBridge';
export { verifyWebpBlob } from './image/webpSupport';
