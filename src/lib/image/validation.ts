import { z } from 'zod';
import { processingLimits } from '@/config/limits';

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= processingLimits.maxFileSizeBytes, {
    message: `File size exceeds maximum allowed limit of ${processingLimits.maxFileSizeMB}MB`,
  })
  .refine(
    (file) =>
      processingLimits.supportedMimeTypes.includes(file.type as any) ||
      processingLimits.supportedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)),
    {
      message: 'Unsupported image format. Allowed formats: JPG, PNG, WEBP, AVIF, GIF',
    }
  );

export function validateImageFile(file: File) {
  return imageFileSchema.safeParse(file);
}

export interface ImageBatchValidationResult {
  success: boolean;
  validFiles: File[];
  errors: { name: string; error: string }[];
  error?: string;
}

export function validateImageBatch(files: File[]): ImageBatchValidationResult {
  if (files.length > processingLimits.maxBatchFiles) {
    return {
      success: false,
      validFiles: [],
      errors: [
        {
          name: 'Batch Limit',
          error: `Cannot upload more than ${processingLimits.maxBatchFiles} images at once`,
        },
      ],
      error: `Cannot upload more than ${processingLimits.maxBatchFiles} images at once`,
    };
  }

  const validFiles: File[] = [];
  const errors: { name: string; error: string }[] = [];

  for (const file of files) {
    const res = validateImageFile(file);
    if (res.success) {
      validFiles.push(file);
    } else {
      errors.push({ name: file.name, error: res.error.issues[0]?.message || 'Invalid file' });
    }
  }

  return { success: true, validFiles, errors };
}
