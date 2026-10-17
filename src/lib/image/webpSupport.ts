/**
 * WebP Encoder Feature Detection & Container Verification
 * 
 * According to HTML5 Canvas Specifications, if a requested MIME type is unsupported
 * during toBlob() or toDataURL(), user agents MUST fallback silently to image/png.
 * 
 * This module provides active feature detection and binary header validation
 * to ensure genuine WEBP encoding without silent fallbacks.
 */

let cachedWebpSupported: boolean | null = null;

/**
 * Feature-detects whether the browser/runtime supports WebP encoding.
 * Tests via OffscreenCanvas.convertToBlob and HTMLCanvasElement.toDataURL.
 */
export async function isWebpEncoderSupported(): Promise<boolean> {
  if (cachedWebpSupported !== null) {
    return cachedWebpSupported;
  }

  // 1. Check via OffscreenCanvas if available
  if (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof OffscreenCanvas.prototype.convertToBlob === 'function'
  ) {
    try {
      const oc = new OffscreenCanvas(2, 2);
      const ctx = oc.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.fillRect(0, 0, 2, 2);
        const blob = await oc.convertToBlob({ type: 'image/webp', quality: 0.85 });
        if (blob && blob.type === 'image/webp' && blob.size > 0) {
          cachedWebpSupported = true;
          return true;
        }
      }
    } catch {
      // OffscreenCanvas test failed, try HTMLCanvasElement
    }
  }

  // 2. Check via HTMLCanvasElement if DOM is present
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 128, 255, 0.8)';
        ctx.fillRect(0, 0, 2, 2);
      }
      const dataUrl = canvas.toDataURL('image/webp');
      if (dataUrl && dataUrl.startsWith('data:image/webp')) {
        cachedWebpSupported = true;
        return true;
      }
    } catch {
      // HTMLCanvasElement test failed
    }
  }

  // In Node test environments where canvas is not polyfilled or WebP is unsupported
  cachedWebpSupported = false;
  return false;
}

/**
 * Validates that a generated image Blob is a genuine WebP file.
 * Inspects both the blob MIME type and the RIFF/WEBP magic container bytes.
 */
export async function verifyWebpBlob(blob: Blob): Promise<boolean> {
  if (!blob || blob.size < 12) {
    return false;
  }

  // If browser silently fell back to PNG, blob.type will be image/png
  if (blob.type !== 'image/webp') {
    return false;
  }

  try {
    const slice = blob.slice(0, 12);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Bytes 0..3 must be 'RIFF' (0x52, 0x49, 0x46, 0x46)
    const hasRiff =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46;

    // Bytes 8..11 must be 'WEBP' (0x57, 0x45, 0x42, 0x50)
    const hasWebp =
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    return hasRiff && hasWebp;
  } catch {
    // If ArrayBuffer reading is unavailable, rely on verified MIME type
    return blob.type === 'image/webp';
  }
}

/**
 * Reset cache for testing purposes
 */
export function resetWebpSupportCache(): void {
  cachedWebpSupported = null;
}
