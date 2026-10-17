import { WatermarkPreferences, WatermarkPosition, ExtendedWatermarkPosition } from '@/types';

/**
 * Universal Bengali and Unicode fallback font stack for crisp typography across all platforms
 */
export const BANGLA_UNICODE_FONT_STACK =
  '"Noto Sans Bengali", "SolaimanLipi", "Kalpurush", "Siyam Rupali", "Bangla", "Ador", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Helper to safely load watermark logo image in browser (Image) or worker (ImageBitmap)
 */
export async function loadWatermarkImage(
  url?: string | null,
  blob?: Blob | null
): Promise<CanvasImageSource> {
  if (typeof Image !== 'undefined' && url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load watermark logo image'));
      img.src = url;
    });
  }

  if (typeof createImageBitmap !== 'undefined' && blob) {
    return await createImageBitmap(blob);
  }

  if (typeof createImageBitmap !== 'undefined' && url) {
    const res = await fetch(url);
    const b = await res.blob();
    return await createImageBitmap(b);
  }

  throw new Error('No supported image loader available in this runtime environment');
}

/**
 * Applies text, logo, or unified combined watermark to an HTML or Offscreen Canvas.
 * This is the SINGLE SOURCE OF TRUTH for both Live Preview and Final Export rendering.
 */
export async function applyWatermarkToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  prefs: WatermarkPreferences,
  preloadedLogo?: CanvasImageSource | null
): Promise<void> {
  if (!prefs || !prefs.enabled) return;

  const opacity = Math.max(0, Math.min(1, prefs.opacity > 1 ? prefs.opacity / 100 : (prefs.opacity ?? 0.55)));
  if (opacity <= 0) return;

  const type = prefs.type || 'text';
  const rawText = (prefs.text || '').trim();
  const hasText = (type === 'text' || type === 'both') && rawText.length > 0;
  const hasLogo = type === 'logo' || type === 'both';

  // Proportional sizing based on nominal 1000px width reference
  const scaleRef = width / 1000;
  const margin = Math.max(4, Math.round(scaleRef * (prefs.margin ?? 24)));
  const fontPx = Math.max(14, Math.round(scaleRef * (prefs.fontSize || 32)));

  // Setup font with full Bengali & Unicode support
  const requestedFamily = prefs.fontFamily ? `"${prefs.fontFamily}", ` : '';
  const fontDefinition = `600 ${fontPx}px ${requestedFamily}${BANGLA_UNICODE_FONT_STACK}`;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = fontDefinition;
  ctx.fillStyle = prefs.textColor || '#FFFFFF';

  // High contrast drop shadow
  if (prefs.hasShadow !== false) {
    ctx.shadowColor = prefs.shadowColor || 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = Math.max(2, Math.round(scaleRef * (prefs.shadowBlur || 6)));
    ctx.shadowOffsetX = Math.max(1, Math.round(scaleRef * 2));
    ctx.shadowOffsetY = Math.max(1, Math.round(scaleRef * 2));
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Load logo source if required
  let logoSource: CanvasImageSource | null = preloadedLogo || null;
  let logoNaturalWidth = 0;
  let logoNaturalHeight = 0;

  if (hasLogo && !logoSource && (prefs.logoUrl || prefs.logoBlob)) {
    try {
      logoSource = await loadWatermarkImage(prefs.logoUrl, prefs.logoBlob);
    } catch (err) {
      console.warn('Watermark logo could not be loaded:', err);
    }
  }

  if (logoSource) {
    const rawLogo = logoSource as any;
    if (typeof rawLogo.naturalWidth === 'number' && rawLogo.naturalWidth > 0) {
      logoNaturalWidth = rawLogo.naturalWidth;
      logoNaturalHeight = rawLogo.naturalHeight;
    } else if (typeof rawLogo.width === 'number' && rawLogo.width > 0) {
      logoNaturalWidth = rawLogo.width;
      logoNaturalHeight = typeof rawLogo.height === 'number' ? rawLogo.height : rawLogo.width;
    } else if (rawLogo.width && typeof rawLogo.width.baseVal?.value === 'number') {
      logoNaturalWidth = rawLogo.width.baseVal.value;
      logoNaturalHeight = rawLogo.height?.baseVal?.value || logoNaturalWidth;
    }
  }

  // Calculate logo dimensions preserving aspect ratio
  const logoScale = Math.max(0.05, Math.min(0.6, prefs.logoScale || 0.2));
  const logoWidth = Math.round(width * logoScale);
  const logoHeight = logoNaturalWidth > 0
    ? Math.round((logoWidth / logoNaturalWidth) * logoNaturalHeight)
    : Math.round(logoWidth * 0.75);

  // Compute text metric and total watermark stamp bounding box
  const textMetrics = hasText ? ctx.measureText(rawText) : null;
  const textWidth = textMetrics ? textMetrics.width : 0;
  const gap = Math.round(fontPx * 0.4);

  let stampW = 0;
  let stampH = 0;

  if (type === 'text' || (type === 'both' && !logoSource)) {
    stampW = textWidth;
    stampH = fontPx;
  } else if (type === 'logo' || (type === 'both' && !hasText)) {
    stampW = logoWidth;
    stampH = logoHeight;
  } else if (type === 'both' && logoSource && hasText) {
    stampW = logoWidth + gap + textWidth;
    stampH = Math.max(logoHeight, fontPx);
  }

  if (stampW <= 0 || stampH <= 0) {
    ctx.restore();
    return;
  }

  const rotationDeg = prefs.rotation || 0;
  const rotationRad = (rotationDeg * Math.PI) / 180;

  // Single stamp drawer function: places and rotates content at specified anchor point
  const drawStamp = (
    anchorX: number,
    anchorY: number,
    alignH: 'left' | 'center' | 'right',
    alignV: 'top' | 'middle' | 'bottom'
  ) => {
    ctx.save();
    ctx.translate(anchorX, anchorY);

    if (rotationRad !== 0) {
      ctx.rotate(rotationRad);
    }

    let dx = 0;
    if (alignH === 'center') dx = -stampW / 2;
    else if (alignH === 'right') dx = -stampW;

    let dy = 0;
    if (alignV === 'middle') dy = -stampH / 2;
    else if (alignV === 'bottom') dy = -stampH;

    if (type === 'text' && hasText) {
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(rawText, dx, dy + stampH / 2);
    } else if (type === 'logo' && logoSource) {
      ctx.drawImage(logoSource, dx, dy, logoWidth, logoHeight);
    } else if (type === 'both') {
      if (logoSource) {
        const logoY = dy + (stampH - logoHeight) / 2;
        ctx.drawImage(logoSource, dx, logoY, logoWidth, logoHeight);
      }
      if (hasText) {
        const textStartX = logoSource ? dx + logoWidth + gap : dx;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(rawText, textStartX, dy + stampH / 2);
      }
    }

    ctx.restore();
  };

  // 9-Point Grid Positioning or Tile Repeating Pattern
  if (prefs.position === 'tile') {
    const stepX = Math.max(stampW + 60, Math.round(width / 3.2));
    const stepY = Math.max(stampH + 50, Math.round(height / 3.2));
    for (let tx = stepX / 2; tx < width; tx += stepX) {
      for (let ty = stepY / 2; ty < height; ty += stepY) {
        drawStamp(tx, ty, 'center', 'middle');
      }
    }
  } else {
    switch (prefs.position) {
      case 'top-left':
        drawStamp(margin, margin, 'left', 'top');
        break;
      case 'top-center':
        drawStamp(width / 2, margin, 'center', 'top');
        break;
      case 'top-right':
        drawStamp(width - margin, margin, 'right', 'top');
        break;
      case 'middle-left':
      case 'center-left':
        drawStamp(margin, height / 2, 'left', 'middle');
        break;
      case 'center':
        drawStamp(width / 2, height / 2, 'center', 'middle');
        break;
      case 'middle-right':
      case 'center-right':
        drawStamp(width - margin, height / 2, 'right', 'middle');
        break;
      case 'bottom-left':
        drawStamp(margin, height - margin, 'left', 'bottom');
        break;
      case 'bottom-center':
        drawStamp(width / 2, height - margin, 'center', 'bottom');
        break;
      case 'bottom-right':
      default:
        drawStamp(width - margin, height - margin, 'right', 'bottom');
        break;
    }
  }

  ctx.restore();
}

/**
 * Calculates raw coordinates for legacy compatibility
 */
export function calculateWatermarkCoordinates(
  pos: WatermarkPosition,
  w: number,
  h: number,
  itemW: number,
  itemH: number,
  margin: number
): { x: number; y: number } {
  let x = margin;
  let y = margin + itemH;

  switch (pos) {
    case 'top-left':
      x = margin;
      y = margin + itemH;
      break;
    case 'top-center':
      x = (w - itemW) / 2;
      y = margin + itemH;
      break;
    case 'top-right':
      x = w - itemW - margin;
      y = margin + itemH;
      break;
    case 'middle-left':
    case 'center-left':
      x = margin;
      y = (h + itemH) / 2;
      break;
    case 'center':
      x = (w - itemW) / 2;
      y = (h + itemH) / 2;
      break;
    case 'middle-right':
    case 'center-right':
      x = w - itemW - margin;
      y = (h + itemH) / 2;
      break;
    case 'bottom-left':
      x = margin;
      y = h - margin;
      break;
    case 'bottom-center':
      x = (w - itemW) / 2;
      y = h - margin;
      break;
    case 'bottom-right':
    default:
      x = w - itemW - margin;
      y = h - margin;
      break;
  }

  return { x, y };
}
