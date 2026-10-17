/**
 * Image Processing Web Worker
 * Offloads CPU-intensive pixel manipulation and WebP generation from main UI thread.
 */

self.onmessage = async (e: MessageEvent) => {
  const { id, imageBitmap, options } = e.data;

  try {
    const { convPrefs, wmPrefs } = options;
    let targetWidth = imageBitmap.width;
    let targetHeight = imageBitmap.height;

    // Handle Resize Dimensions
    if (convPrefs.resizeEnabled) {
      const maxW = convPrefs.maxWidth > 0 ? convPrefs.maxWidth : targetWidth;
      const maxH = convPrefs.maxHeight > 0 ? convPrefs.maxHeight : targetHeight;

      if (convPrefs.preserveAspectRatio) {
        const ratio = Math.min(maxW / targetWidth, maxH / targetHeight);
        if (ratio < 1) {
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        }
      } else {
        targetWidth = Math.min(targetWidth, maxW);
        targetHeight = Math.min(targetHeight, maxH);
      }
    }

    // Offscreen Canvas rendering
    const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = offscreen.getContext('2d');

    if (!ctx) {
      throw new Error('OffscreenCanvas 2D context unavailable');
    }

    // Draw main image bitmap
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    // Apply Watermark if enabled
    if (wmPrefs && wmPrefs.enabled) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, wmPrefs.opacity));

      const margin = wmPrefs.margin || 24;
      const fontPx = Math.max(16, Math.round(targetWidth * ((wmPrefs.fontSize || 28) / 1000)));
      ctx.font = `600 ${fontPx}px Inter, sans-serif`;
      ctx.fillStyle = wmPrefs.textColor || '#FFFFFF';

      if (wmPrefs.hasShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;
      }

      const drawWatermarkText = (x: number, y: number, alignH: CanvasTextAlign, alignV: CanvasTextBaseline) => {
        ctx.save();
        ctx.translate(x, y);
        if (wmPrefs.rotation) {
          ctx.rotate((wmPrefs.rotation * Math.PI) / 180);
        }
        ctx.textAlign = alignH;
        ctx.textBaseline = alignV;
        if (wmPrefs.text) {
          ctx.fillText(wmPrefs.text, 0, 0);
        }
        ctx.restore();
      };

      if (wmPrefs.position === 'tile') {
        const stepX = Math.round(targetWidth / 3.5);
        const stepY = Math.round(targetHeight / 3.5);
        for (let tx = stepX / 2; tx < targetWidth; tx += stepX) {
          for (let ty = stepY / 2; ty < targetHeight; ty += stepY) {
            drawWatermarkText(tx, ty, 'center', 'middle');
          }
        }
      } else {
        switch (wmPrefs.position) {
          case 'top-left':
            drawWatermarkText(margin, margin, 'left', 'top');
            break;
          case 'top-center':
            drawWatermarkText(targetWidth / 2, margin, 'center', 'top');
            break;
          case 'top-right':
            drawWatermarkText(targetWidth - margin, margin, 'right', 'top');
            break;
          case 'middle-left':
            drawWatermarkText(margin, targetHeight / 2, 'left', 'middle');
            break;
          case 'center':
            drawWatermarkText(targetWidth / 2, targetHeight / 2, 'center', 'middle');
            break;
          case 'middle-right':
            drawWatermarkText(targetWidth - margin, targetHeight / 2, 'right', 'middle');
            break;
          case 'bottom-left':
            drawWatermarkText(margin, targetHeight - margin, 'left', 'bottom');
            break;
          case 'bottom-center':
            drawWatermarkText(targetWidth / 2, targetHeight - margin, 'center', 'bottom');
            break;
          case 'bottom-right':
          default:
            drawWatermarkText(targetWidth - margin, targetHeight - margin, 'right', 'bottom');
            break;
        }
      }

      ctx.restore();
    }

    // Convert to WebP / PNG / JPEG Blob
    const mimeType =
      convPrefs.format === 'png'
        ? 'image/png'
        : convPrefs.format === 'jpeg'
        ? 'image/jpeg'
        : 'image/webp';

    const quality = Math.max(0.1, Math.min(1.0, convPrefs.quality / 100));
    const blob = await offscreen.convertToBlob({ type: mimeType, quality });

    try {
      offscreen.width = 0;
      offscreen.height = 0;
    } catch {}

    self.postMessage({
      id,
      success: true,
      blob,
      width: targetWidth,
      height: targetHeight,
      size: blob.size,
    });
  } catch (err: any) {
    self.postMessage({
      id,
      success: false,
      error: err?.message || 'Web Worker conversion failed',
    });
  }
};
