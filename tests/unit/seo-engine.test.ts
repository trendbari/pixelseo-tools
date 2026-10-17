import { describe, it, expect } from 'vitest';
import { generateSeoStudioOutput } from '@/lib/seo/generator';
import { evaluateTitleLength, evaluateDescriptionLength } from '@/lib/seo/validators';

describe('Unit Test: Bilingual SEO NLP Engine', () => {
  it('generates English SEO metadata properly', () => {
    const res = generateSeoStudioOutput({
      contentText: 'Premium handcrafted leather boots for winter trekking and hiking adventures.',
      targetKeyword: 'leather boots',
      contentType: 'product',
      language: 'en',
      brandName: 'NordicWear',
      targetAudience: 'Hikers',
    });

    expect(res.metaTitle).toContain('Leather Boots');
    expect(res.focusKeyword).toBe('leather boots');
    expect(res.secondaryKeywords.length).toBeGreaterThan(0);
    expect(res.urlSlug).toContain('leather-boots');
  });


  it('generates Bengali SEO metadata properly', () => {
    const res = generateSeoStudioOutput({
      contentText: 'আরামদায়ক সুতি পাঞ্জাবি ঈদ কালেকশন এর জন্য আধুনিক ডিজাইন।',
      targetKeyword: 'সুতি পাঞ্জাবি',
      contentType: 'product',
      language: 'bn',
      brandName: 'আড়ং',
      targetAudience: 'ক্রেতা',
    });

    expect(res.metaTitle).toContain('সুতি পাঞ্জাবি');
    expect(res.focusKeyword).toBe('সুতি পাঞ্জাবি');
  });

  it('evaluates character lengths correctly', () => {
    expect(evaluateTitleLength(25)).toBe('short');
    expect(evaluateTitleLength(55)).toBe('optimal');
    expect(evaluateTitleLength(80)).toBe('long');

    expect(evaluateDescriptionLength(90)).toBe('short');
    expect(evaluateDescriptionLength(150)).toBe('optimal');
    expect(evaluateDescriptionLength(190)).toBe('long');
  });
});
