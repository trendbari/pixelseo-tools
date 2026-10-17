import { z } from 'zod';

/**
 * Zod Schema for File Upload Validation (IMG-01, IMG-02)
 */
export const imageFileSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z
    .number()
    .max(20 * 1024 * 1024, 'File size must not exceed 20 MB'),
  type: z.string().refine(
    (type) =>
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'].includes(
        type.toLowerCase()
      ),
    'Only JPG, PNG, and WebP images are supported'
  ),
});

/**
 * Zod Schema for Conversion Preferences (IMG-03, IMG-04, IMG-05)
 */
export const conversionPreferencesSchema = z.object({
  format: z.enum(['webp', 'png', 'jpeg']),
  quality: z.number().int().min(1).max(100),
  resizeEnabled: z.boolean(),
  maxWidth: z.number().int().min(10).max(8192),
  maxHeight: z.number().int().min(10).max(8192),
  preserveAspectRatio: z.boolean(),
  namingPattern: z.enum(['original', 'kebab', 'seo-slug', 'custom']),
  prefix: z.string().max(50).optional(),
  suffix: z.string().max(50).optional(),
});

/**
 * Zod Schema for Watermark Preferences (Wireframe & Spec)
 */
export const watermarkPreferencesSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(['text', 'logo', 'both']),
  text: z.string().max(120, 'Watermark text cannot exceed 120 characters'),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color'),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(8).max(140),
  position: z.enum([
    'top-left',
    'top-center',
    'top-right',
    'middle-left',
    'center',
    'middle-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
    'tile',
  ]),
  opacity: z.number().min(0).max(1),
  logoScale: z.number().min(0.05).max(0.6),
  rotation: z.number().min(-180).max(180),
  margin: z.number().min(0).max(100),
  hasShadow: z.boolean(),
});

/**
 * Zod Schema for SEO Content Studio Input
 */
export const seoStudioInputSchema = z.object({
  contentText: z
    .string()
    .min(10, 'Content input must contain at least 10 characters for keyword extraction')
    .max(5000, 'Content input exceeds 5000 characters limit'),
  targetKeyword: z.string().max(100).optional(),
  contentType: z.enum(['product', 'blog', 'service', 'website', 'category', 'article']),
  language: z.enum(['en', 'bn']),
  brandName: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
});

/**
 * Zod Schema for High-Level SEO Input
 */
export const seoInputSchema = z.object({
  content: z
    .string()
    .min(10, 'Content must contain at least 10 characters for keyword extraction')
    .max(5000, 'Content exceeds 5000 characters limit'),
  contentType: z.enum(['product', 'blog', 'service', 'website']),
  language: z.enum(['en', 'bn']),
  focusKeyword: z.string().max(100).optional(),
  brandName: z.string().max(80).optional(),
  targetAudience: z.string().max(120).optional(),
});

/**
 * Zod Schema for Contact Form Submission
 */
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  category: z.enum(['general', 'bug', 'feature', 'partnership']),
  subject: z.string().max(120).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ValidatedImageFile = z.infer<typeof imageFileSchema>;
export type ValidatedConversionPrefs = z.infer<typeof conversionPreferencesSchema>;
export type ValidatedWatermarkPrefs = z.infer<typeof watermarkPreferencesSchema>;
export type ValidatedSeoStudioInput = z.infer<typeof seoStudioInputSchema>;
export type ValidatedSeoInput = z.infer<typeof seoInputSchema>;
export type ValidatedContactForm = z.infer<typeof contactFormSchema>;
