/**
 * Secure Client-Side SVG Sanitizer & Safe Rasterizer (SEC-03)
 * 
 * Protects against:
 * - Stored XSS via <script>, <foreignObject>, inline event handlers (onload, onerror)
 * - Remote resource fetching / SSRF probing via <image href="http://..."> or xlink:href
 * - XML External Entity (XXE) injection via <!DOCTYPE> and <!ENTITY>
 * - Protocol smuggling via javascript:, vbscript:, data:text/html
 */

const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'foreignobject',
  'audio',
  'video',
  'form',
  'input',
  'applet',
  'meta',
  'link',
];

const DANGEROUS_ATTRIBUTES = [
  /^on/i, // onload, onerror, onclick, onmouseover, etc.
  /formaction/i,
  /action/i,
];

/**
 * Sanitize an SVG string by removing dangerous elements, XXE entities, and remote references.
 * Operates across both Browser (via DOMParser) and Node.js testing environments (via safe regex filter).
 */
export function sanitizeSvgString(svgText: string): string {
  if (!svgText || typeof svgText !== 'string') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
  }

  // 1. Strip XML DTD declarations and Entity expansions (XXE defense)
  let cleanXml = svgText
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '')
    .trim();

  // 2. Browser DOMParser sanitization if available
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanXml, 'image/svg+xml');

    // Check for XML parser errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Malformed or corrupted SVG file');
    }

    // Remove dangerous tags recursively
    DANGEROUS_TAGS.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.parentNode?.removeChild(el));
    });

    // Clean all elements of malicious attributes & remote URLs
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        const val = attr.value.trim().toLowerCase();

        // Check dangerous on* event handlers
        if (DANGEROUS_ATTRIBUTES.some((pattern) => pattern.test(name))) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Block javascript:, vbscript:, data: URIs in href/xlink/src
        if (
          (name === 'href' || name === 'xlink:href' || name === 'src') &&
          (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:text'))
        ) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Block remote URLs (http:// or https:// or //)
        if (
          (name === 'href' || name === 'xlink:href' || name === 'src') &&
          (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('//'))
        ) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Clean inline style attribute from remote url(...) references
        if (name === 'style' && /url\s*\(\s*['"]?https?:/i.test(val)) {
          el.removeAttribute('style');
        }
      }
    });

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc.documentElement);
  }

  // 3. Fallback for Node / headless environments without DOMParser
  DANGEROUS_TAGS.forEach((tag) => {
    const tagRegex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}[^>]*\\/?>`, 'gi');
    cleanXml = cleanXml.replace(tagRegex, '');
  });

  // Remove on* attributes (handling nested quotes like onerror="alert('x')")
  cleanXml = cleanXml.replace(
    /\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ''
  );

  // Remove javascript: or vbscript: or remote URLs in href/src
  cleanXml = cleanXml.replace(
    /\s+(?:href|xlink:href|src)\s*=\s*(?:"(?:javascript:|vbscript:|https?:\/\/|\/\/)[^"]*"|'(?:javascript:|vbscript:|https?:\/\/|\/\/)[^']*'|[^\s>]+)/gi,
    ''
  );

  return cleanXml;
}

/**
 * Safely parse an SVG file, sanitize it, and render it to a safe Blob URL
 */
export async function sanitizeAndLoadSvgFile(file: File): Promise<{
  sanitizedBlob: Blob;
  objectUrl: string;
}> {
  const text = await file.text();
  const sanitized = sanitizeSvgString(text);

  const blob = new Blob([sanitized], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  return {
    sanitizedBlob: blob,
    objectUrl,
  };
}

/**
 * SEC-03: Safe SVG Rasterization
 * Renders a sanitized SVG onto an isolated Canvas element and exports it
 * as a flat raster PNG Blob, eliminating any vector XML payload before compositing.
 */
export async function safeRasterizeSvgToPng(
  svgBlob: Blob,
  maxWidth = 1000,
  maxHeight = 1000
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        let width = img.naturalWidth || 300;
        let height = img.naturalHeight || 300;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable for SVG rasterization');
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((pngBlob) => {
          // Release SVG URL immediately
          URL.revokeObjectURL(svgUrl);
          // Free canvas memory buffer
          canvas.width = 0;
          canvas.height = 0;

          if (!pngBlob) {
            reject(new Error('Failed to rasterize SVG into PNG blob'));
            return;
          }

          const pngUrl = URL.createObjectURL(pngBlob);
          resolve({
            blob: pngBlob,
            url: pngUrl,
            width,
            height,
          });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(svgUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG into raster image context'));
    };

    img.src = svgUrl;
  });
}
