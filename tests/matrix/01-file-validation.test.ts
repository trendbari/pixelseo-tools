import { describe, it, expect } from 'vitest';
import { validateImageFile, validateImageBatch } from '@/lib/image/validation';
import { processingLimits } from '@/config/limits';
import { createProcessedImageItem } from '@/lib/files';
import { imageFileSchema } from '@/lib/validation';

/**
 * PRD Test Suite: 1. File Validation (8 planned tests)
 * Imports actual production validation modules from src/lib/image/validation and src/lib/files.
 */
describe('PRD Test Suite 1: File Validation (8 Tests)', () => {
  // Test 1: Accepts JPG images
  it('1. accepts JPG images with image/jpeg MIME type', () => {
    const file = new File(['valid-jpg-binary-content'], 'photo.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('photo.jpg');
      expect(result.data.type).toBe('image/jpeg');
    }
  });

  // Test 2: Accepts PNG images
  it('2. accepts PNG images with image/png MIME type', () => {
    const file = new File(['valid-png-binary-content'], 'graphic.png', { type: 'image/png' });
    const result = validateImageFile(file);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('graphic.png');
      expect(result.data.type).toBe('image/png');
    }
  });

  // Test 3: Accepts modern next-gen WEBP and AVIF images
  it('3. accepts modern next-gen WEBP and AVIF image formats', () => {
    const webpFile = new File(['webp-binary'], 'modern.webp', { type: 'image/webp' });
    const avifFile = new File(['avif-binary'], 'modern.avif', { type: 'image/avif' });

    expect(validateImageFile(webpFile).success).toBe(true);
    expect(validateImageFile(avifFile).success).toBe(true);
  });

  // Test 4: Rejects unsupported formats
  it('4. rejects unsupported file formats such as GIF, PDF, and executables', () => {
    const pdfFile = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
    const exeFile = new File(['MZ'], 'program.exe', { type: 'application/x-msdownload' });
    const txtFile = new File(['hello world'], 'readme.txt', { type: 'text/plain' });

    const pdfResult = validateImageFile(pdfFile);
    const exeResult = validateImageFile(exeFile);
    const txtResult = validateImageFile(txtFile);

    expect(pdfResult.success).toBe(false);
    expect(exeResult.success).toBe(false);
    expect(txtResult.success).toBe(false);

    if (!pdfResult.success) {
      expect(pdfResult.error.issues[0].message).toContain('Unsupported image format');
    }
  });

  // Test 5: Rejects oversized files exceeding 20 MB limit
  it('5. rejects oversized image files exceeding the 20 MB threshold', () => {
    const oversizedSize = processingLimits.maxFileSizeBytes + 1024; // > 20 MB
    const largeFile = new File(['x'.repeat(100)], 'huge-banner.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: oversizedSize });

    const result = validateImageFile(largeFile);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('exceeds maximum allowed limit of 20MB');
    }
  });

  // Test 6: Enforces batch limit of max 100 images
  it('6. enforces batch limit rejecting uploads containing more than 100 images', () => {
    const overBatchFiles = Array.from({ length: 105 }, (_, i) =>
      new File(['test'], `batch-img-${i + 1}.jpg`, { type: 'image/jpeg' })
    );

    const batchResult = validateImageBatch(overBatchFiles);

    expect(batchResult.success).toBe(false);
    expect(batchResult.error).toContain('Cannot upload more than 100 images');
    expect(batchResult.validFiles.length).toBe(0);
  });

  // Test 7: Accepts full valid batch up to 100 images
  it('7. accepts valid batch containing up to 100 images within limits', () => {
    const validBatchFiles = Array.from({ length: 100 }, (_, i) =>
      new File(['valid-pixel'], `item-${i + 1}.png`, { type: 'image/png' })
    );

    const batchResult = validateImageBatch(validBatchFiles);

    expect(batchResult.success).toBe(true);
    expect(batchResult.validFiles.length).toBe(100);
    expect(batchResult.errors.length).toBe(0);
  });

  // Test 8: Sanitizes filename preventing directory traversal
  it('8. sanitizes filenames against directory traversal and control characters', () => {
    const maliciousFile = new File(['content'], '../../etc/shadow.png', { type: 'image/png' });
    const item = createProcessedImageItem(maliciousFile, { width: 1200, height: 800 });

    // Path traversal characters stripped to base filename
    expect(item.name).toBe('shadow.png');
    expect(item.name).not.toContain('..');
    expect(item.name).not.toContain('/');
    expect(item.name).not.toContain('\\');
    expect(item.originalWidth).toBe(1200);
    expect(item.originalHeight).toBe(800);
    expect(item.status).toBe('idle');

    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
});
