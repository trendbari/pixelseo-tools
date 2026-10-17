import { describe, it, expect } from 'vitest';
import {
  imageFileSchema,
  conversionPreferencesSchema,
  seoStudioInputSchema,
} from '@/lib/validation';
import {
  extractKeywordsFromContent,
  generateSeoContentStudio,
  getCharacterGuidance,
  generateUrlSlug,
} from '@/lib/seoEngine';

describe('PixelSEO Recommended Stack: Zod Validation Suite', () => {
  it('validates file size within 20MB limit', () => {
    const validFile = {
      name: 'product-photo.jpg',
      size: 5 * 1024 * 1024, // 5MB
      type: 'image/jpeg',
    };
    const result = imageFileSchema.safeParse(validFile);
    expect(result.success).toBe(true);
  });

  it('rejects files exceeding 20MB limit', () => {
    const oversizedFile = {
      name: 'huge-raw-image.png',
      size: 25 * 1024 * 1024, // 25MB
      type: 'image/png',
    };
    const result = imageFileSchema.safeParse(oversizedFile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('20 MB');
    }
  });

  it('validates conversion preferences schema', () => {
    const validPrefs = {
      format: 'webp',
      quality: 85,
      resizeEnabled: false,
      maxWidth: 1920,
      maxHeight: 1080,
      preserveAspectRatio: true,
      namingPattern: 'original',
    };
    const result = conversionPreferencesSchema.safeParse(validPrefs);
    expect(result.success).toBe(true);
  });

  it('validates SEO Studio input schema', () => {
    const validSeoInput = {
      contentText: 'Premium cotton t-shirt for men. Comfortable fabric, modern fit.',
      targetKeyword: 'cotton t-shirt',
      contentType: 'product',
      language: 'en',
      brandName: 'PixelSEO',
      targetAudience: 'Men, Casual Wear',
    };
    const result = seoStudioInputSchema.safeParse(validSeoInput);
    expect(result.success).toBe(true);
  });
});

describe('PixelSEO SEO Engine & NLP Keyword Extraction', () => {
  it('extracts focus keyword and generates URL slug', () => {
    const content =
      'Premium cotton t-shirt for men. Comfortable fabric, modern fit, available in multiple colors.';
    const keywords = extractKeywordsFromContent(content, 'en', 'cotton t-shirt');

    expect(keywords.focusKeyword).toBe('cotton t-shirt');
    expect(keywords.secondaryKeywords.length).toBeGreaterThan(0);

    const slug = generateUrlSlug('Premium Men\'s Cotton T-Shirt');
    expect(slug).toBe('premium-mens-cotton-t-shirt');
  });

  it('evaluates Meta Title and Description character guidance accurately', () => {
    const optimalTitleGuidance = getCharacterGuidance(55, 50, 60);
    expect(optimalTitleGuidance.status).toBe('optimal');

    const shortTitleGuidance = getCharacterGuidance(30, 50, 60);
    expect(shortTitleGuidance.status).toBe('short');

    const optimalDescGuidance = getCharacterGuidance(150, 140, 160);
    expect(optimalDescGuidance.status).toBe('optimal');
  });

  it('generates bilingual SEO content for English and Bengali', () => {
    const enResult = generateSeoContentStudio({
      contentText: 'Premium cotton t-shirt for men. Comfortable fabric, modern fit.',
      targetKeyword: 'cotton t-shirt',
      contentType: 'product',
      language: 'en',
      brandName: 'PixelSEO',
      targetAudience: 'Men',
    });
    expect(enResult.metaTitle.toLowerCase()).toContain('cotton t-shirt');
    expect(enResult.urlSlug).toBe('premium-mens-cotton-t-shirt');

    const bnResult = generateSeoContentStudio({
      contentText: 'পুরুষদের জন্য প্রিমিয়াম কটন টি-শার্ট। আরামদায়ক ফেব্রিক ও আধুনিক ফিট।',
      targetKeyword: 'কটন টি-শার্ট',
      contentType: 'product',
      language: 'bn',
      brandName: 'PixelSEO',
      targetAudience: 'ক্রেতাদের',
    });
    expect(bnResult.metaTitle).toContain('কটন টি-শার্ট');
    expect(bnResult.metaDescription).toContain('PixelSEO');
  });
});
