import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  validateImageBatch,
  formatFileSize,
  isSupportedImageType,
  createProcessedImageItem,
} from '@/lib/files';
import { processingLimits } from '@/config/limits';

describe('Files Module (src/lib/files.ts & tests/files.test.ts)', () => {
  it('formats file sizes accurately into B, KB, and MB', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024 * 150)).toBe('150.0 KB');
    expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
  });

  it('validates supported image formats by MIME type and extension', () => {
    expect(isSupportedImageType({ type: 'image/jpeg', name: 'photo.jpg' })).toBe(true);
    expect(isSupportedImageType({ type: 'image/png', name: 'graphic.png' })).toBe(true);
    expect(isSupportedImageType({ type: 'image/webp', name: 'modern.webp' })).toBe(true);
    expect(isSupportedImageType({ type: 'image/avif', name: 'banner.avif' })).toBe(true);

    // Rejects unsupported formats
    expect(isSupportedImageType({ type: 'application/pdf', name: 'doc.pdf' })).toBe(false);
    expect(isSupportedImageType({ type: 'application/x-msdownload', name: 'app.exe' })).toBe(false);
  });

  it('validates image files within 20 MB size limit', () => {
    const validFile = new File(['valid content'], 'product.jpg', { type: 'image/jpeg' });
    const res = validateImageFile(validFile);
    expect(res.success).toBe(true);

    const oversizedFile = new File(['x'.repeat(100)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: 25 * 1024 * 1024 });
    const invalidRes = validateImageFile(oversizedFile);
    expect(invalidRes.success).toBe(false);
  });

  it('validates batches against the 100-file capacity limit', () => {
    const underLimit = Array.from({ length: 50 }, (_, i) =>
      new File(['test'], `img-${i}.jpg`, { type: 'image/jpeg' })
    );
    const validBatch = validateImageBatch(underLimit);
    expect(validBatch.success).toBe(true);
    expect(validBatch.validFiles.length).toBe(50);

    const overLimit = Array.from({ length: 105 }, (_, i) =>
      new File(['test'], `img-${i}.jpg`, { type: 'image/jpeg' })
    );
    const invalidBatch = validateImageBatch(overLimit);
    expect(invalidBatch.success).toBe(false);
    expect(invalidBatch.error).toContain('Cannot upload more than 100 images');
  });

  it('creates ProcessedImageItem with sanitized filename and safe initial state', () => {
    const mockFile = new File(['dummy'], '../../etc/passwd.png', { type: 'image/png' });
    const item = createProcessedImageItem(mockFile, { width: 800, height: 600 });

    expect(item.id).toBeDefined();
    // Path traversal stripped
    expect(item.name).toBe('passwd.png');
    expect(item.originalWidth).toBe(800);
    expect(item.originalHeight).toBe(600);
    expect(item.status).toBe('idle');
    expect(item.stage).toBe('queued');
    expect(item.previewUrl).toBeDefined();

    // Clean up
    URL.revokeObjectURL(item.previewUrl);
  });
});
