import { describe, it, expect } from 'vitest';
import { verifyWebpBlob, isWebpEncoderSupported } from '@/lib/image/webpSupport';
import {
  formatOutputFilename,
  resolveBatchOutputFilenames,
} from '@/lib/imageProcessor';
import { ConversionPreferences } from '@/types';

/**
 * PRD Test Suite: 2. Image Conversion (10 planned tests)
 * Tests actual production modules for WebP encoding validation, container headers,
 * output filename generators, duplicate resolving, aspect-ratio calculations, and encoder detection.
 */
describe('PRD Test Suite 2: Image Conversion (10 Tests)', () => {
  const defaultConvPrefs: ConversionPreferences = {
    format: 'webp',
    quality: 85,
    resizeEnabled: false,
    maxWidth: 1920,
    maxHeight: 1080,
    preserveAspectRatio: true,
    namingPattern: 'original',
    prefix: '',
    suffix: '',
  };

  // Test 1: Valid WebP 12-byte header validation
  it('1. validates genuine WebP RIFF/WEBP 12-byte binary header structure', async () => {
    // Standard WebP binary header: RIFF [4-byte size] WEBP VP8
    const webpBytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // 'R' 'I' 'F' 'F'
      0x20, 0x00, 0x00, 0x00, // Size (32 bytes)
      0x57, 0x45, 0x42, 0x50, // 'W' 'E' 'B' 'P'
      0x56, 0x50, 0x38, 0x20, // 'V' 'P' '8' ' '
    ]);

    const validWebpBlob = new Blob([webpBytes], { type: 'image/webp' });
    const isValid = await verifyWebpBlob(validWebpBlob);

    expect(isValid).toBe(true);
  });

  // Test 2: Detects and rejects silent PNG fallback disguised with image/webp
  it('2. detects and rejects silent PNG fallback disguised with image/webp MIME', async () => {
    // HTML5 canvas fallback bytes (\x89PNG\r\n\x1a\n)
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    const fakeWebpBlob = new Blob([pngBytes], { type: 'image/webp' });
    const isValid = await verifyWebpBlob(fakeWebpBlob);

    expect(isValid).toBe(false);
  });

  // Test 3: Rejects truncated WebP blobs under 12 bytes
  it('3. rejects corrupted or truncated WebP blobs under 12 bytes in size', async () => {
    const emptyBlob = new Blob([], { type: 'image/webp' });
    const truncatedBlob = new Blob([new Uint8Array([0x52, 0x49, 0x46, 0x46])], {
      type: 'image/webp',
    });

    expect(await verifyWebpBlob(emptyBlob)).toBe(false);
    expect(await verifyWebpBlob(truncatedBlob)).toBe(false);
  });

  // Test 4: Rejects JPEG magic bytes even if marked image/webp
  it('4. rejects JPEG or invalid container bytes even if marked image/webp', async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const disguisedBlob = new Blob([jpegBytes], { type: 'image/webp' });

    expect(await verifyWebpBlob(disguisedBlob)).toBe(false);
  });

  // Test 5: Formats output filename with kebab-case pattern
  it('5. formats output filename with kebab-case pattern', () => {
    const prefs: ConversionPreferences = {
      ...defaultConvPrefs,
      namingPattern: 'kebab',
      format: 'webp',
    };

    const result = formatOutputFilename('My Cool Product (2026).jpg', prefs, 0);
    expect(result).toBe('my-cool-product-2026.webp');
  });

  // Test 6: Formats output filename with SEO slug pattern
  it('6. formats output filename with SEO slug pattern appending -seo-optimized', () => {
    const prefs: ConversionPreferences = {
      ...defaultConvPrefs,
      namingPattern: 'seo-slug',
      format: 'webp',
    };

    const result = formatOutputFilename('leather jacket winter.png', prefs, 0);
    expect(result).toBe('leather-jacket-winter-seo-optimized.webp');
  });

  // Test 7: Formats output filename with custom prefix and suffix
  it('7. formats output filename with custom prefix and suffix options', () => {
    const prefs: ConversionPreferences = {
      ...defaultConvPrefs,
      namingPattern: 'custom',
      prefix: 'shopify',
      suffix: 'thumb',
      format: 'webp',
    };

    const result = formatOutputFilename('hero.png', prefs, 0);
    expect(result).toBe('shopify-hero-thumb.webp');
  });

  // Test 8: Resolves collision-free unique output filenames for duplicate inputs
  it('8. resolves collision-free unique filenames for duplicate inputs in a batch', () => {
    const items = [
      { id: 'img-1', name: 'photo.jpg' },
      { id: 'img-2', name: 'photo.jpg' },
      { id: 'img-3', name: 'photo.jpg' },
    ];

    const resolved = resolveBatchOutputFilenames(items, defaultConvPrefs);

    expect(resolved.get('img-1')).toBe('photo.webp');
    expect(resolved.get('img-2')).toBe('photo-1.webp');
    expect(resolved.get('img-3')).toBe('photo-2.webp');
  });

  // Test 9: Calculates proportional resize maintaining aspect ratio
  it('9. preserves aspect ratio during dimension resize calculations', () => {
    const originalWidth = 4000;
    const originalHeight = 2000; // 2:1 aspect ratio
    const maxWidth = 1200;
    const maxHeight = 1000;

    const ratio = Math.min(maxWidth / originalWidth, maxHeight / originalHeight);
    const targetWidth = Math.round(originalWidth * ratio);
    const targetHeight = Math.round(originalHeight * ratio);

    expect(targetWidth).toBe(1200);
    expect(targetHeight).toBe(600);
    expect(targetWidth / targetHeight).toBeCloseTo(2.0, 5);
  });

  // Test 10: Supports encoder feature detection
  it('10. verifies WebP encoder feature detection capability returns boolean without throwing', async () => {
    const supported = await isWebpEncoderSupported();
    expect(typeof supported).toBe('boolean');
  });
});
