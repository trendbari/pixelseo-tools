import { z } from 'zod';

export const seoStudioInputSchema = z.object({
  contentText: z
    .string()
    .min(10, 'Content description must be at least 10 characters long')
    .max(5000, 'Content description cannot exceed 5000 characters'),
  targetKeyword: z.string().max(100, 'Target keyword is too long'),
  contentType: z.enum(['product', 'blog', 'service', 'website', 'category', 'article']),
  language: z.enum(['en', 'bn']),
  brandName: z.string().max(80, 'Brand name is too long'),
  targetAudience: z.string().max(120, 'Target audience is too long'),
});

export const seoInputSchema = z.object({
  content: z
    .string()
    .min(10, 'Content description must be at least 10 characters long')
    .max(5000, 'Content description cannot exceed 5000 characters'),
  contentType: z.enum(['product', 'blog', 'service', 'website']),
  language: z.enum(['en', 'bn']),
  focusKeyword: z.string().max(100, 'Focus keyword is too long').optional(),
  brandName: z.string().max(80, 'Brand name is too long').optional(),
  targetAudience: z.string().max(120, 'Target audience is too long').optional(),
});

export function validateSeoStudioInput(input: unknown) {
  return seoStudioInputSchema.safeParse(input);
}

export function validateSeoInput(input: unknown) {
  return seoInputSchema.safeParse(input);
}

export function evaluateTitleLength(length: number): 'short' | 'optimal' | 'long' {
  if (length < 40) return 'short';
  if (length <= 65) return 'optimal';
  return 'long';
}

export function evaluateDescriptionLength(length: number): 'short' | 'optimal' | 'long' {
  if (length < 120) return 'short';
  if (length <= 160) return 'optimal';
  return 'long';
}
