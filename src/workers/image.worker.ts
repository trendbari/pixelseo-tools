// Dedicated Web Worker for background image processing
self.onmessage = async (e: MessageEvent) => {
  const { id, imageBitmap, options, type } = e.data;

  // Active cancellation protocol with job identifier
  if (type === 'CANCEL') {
    if (imageBitmap) {
      try {
        imageBitmap.close();
      } catch {}
    }
    self.postMessage({
      id,
      success: false,
      cancelled: true,
      error: 'Job cancelled by user',
    });
    return;
  }

  try {
    const { format = 'webp', quality = 0.85, width, height } = options || {};

    const targetWidth = width || imageBitmap.width;
    const targetHeight = height || imageBitmap.height;

    // Use OffscreenCanvas if supported
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Worker could not get OffscreenCanvas 2D context');
      }

      ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

      // Clean up source ImageBitmap immediately to free GPU texture memory
      try {
        imageBitmap.close();
      } catch {}

      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const blob = await canvas.convertToBlob({ type: mimeType, quality });

      // Clean up canvas surface
      try {
        canvas.width = 0;
        canvas.height = 0;
      } catch {}

      // Validate output MIME type
      if (format === 'webp' && blob.type !== 'image/webp') {
        throw new Error(`Worker WebP encoder unsupported: returned ${blob.type}`);
      }

      self.postMessage({
        id,
        success: true,
        blob,
        width: targetWidth,
        height: targetHeight,
        size: blob.size,
      });
    } else {
      throw new Error('OffscreenCanvas not supported in this browser environment');
    }
  } catch (err: any) {
    self.postMessage({
      id,
      success: false,
      error: err.message || 'Worker processing failed',
    });
  }
};

export {};
