import { describe, it, expect } from 'vitest';
import { validateImageFile, validateImageBatch } from '@/lib/image/validation';
import { processingLimits } from '@/config/limits';

describe('Unit Test: Validation Engine', () => {
  it('validates correct image files', () => {
    const file = new File(['mock content'], 'product.jpg', { type: 'image/jpeg' });
    const res = validateImageFile(file);
    expect(res.success).toBe(true);
  });

  it('rejects oversized files exceeding 20MB', () => {
    const hugeSize = processingLimits.maxFileSizeBytes + 1024;
    const file = new File(['x'.repeat(100)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: hugeSize });

    const res = validateImageFile(file);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('exceeds maximum allowed limit');
    }
  });

  it('validates batch size limit (100 files)', () => {
    const files = Array.from({ length: 105 }, (_, i) =>
      new File(['test'], `img-${i}.jpg`, { type: 'image/jpeg' })
    );
    const res = validateImageBatch(files);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Cannot upload more than 100 images');
  });

  it('validates quality control across 1–100% range and rejects outside values', async () => {
    const { conversionPreferencesSchema } = await import('@/lib/validation');
    const validLow = conversionPreferencesSchema.safeParse({
      format: 'webp',
      quality: 1,
      resizeEnabled: false,
      maxWidth: 1920,
      maxHeight: 1080,
      preserveAspectRatio: true,
      namingPattern: 'original',
    });
    expect(validLow.success).toBe(true);

    const validHigh = conversionPreferencesSchema.safeParse({
      format: 'webp',
      quality: 100,
      resizeEnabled: false,
      maxWidth: 1920,
      maxHeight: 1080,
      preserveAspectRatio: true,
      namingPattern: 'original',
    });
    expect(validHigh.success).toBe(true);

    const invalidZero = conversionPreferencesSchema.safeParse({
      format: 'webp',
      quality: 0,
      resizeEnabled: false,
      maxWidth: 1920,
      maxHeight: 1080,
      preserveAspectRatio: true,
      namingPattern: 'original',
    });
    expect(invalidZero.success).toBe(false);

    const invalidOver = conversionPreferencesSchema.safeParse({
      format: 'webp',
      quality: 101,
      resizeEnabled: false,
      maxWidth: 1920,
      maxHeight: 1080,
      preserveAspectRatio: true,
      namingPattern: 'original',
    });
    expect(invalidOver.success).toBe(false);
  });
});
