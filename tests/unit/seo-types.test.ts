import { describe, it, expect } from 'vitest';
import {
  SeoContentType,
  SeoInput,
  SeoResult,
  SeoStudioInput,
  SeoStudioOutput,
  toSeoStudioInput,
  fromSeoStudioInput,
  toSeoResult,
  fromSeoResult,
} from '@/types';
import { generateSeo } from '@/lib/seo/generator';
import { validateSeoInput } from '@/lib/seo/validators';

describe('Unit Test: SEO Types & Model Adapters', () => {
  it('validates SeoInput and generateSeo for product content in English', () => {
    const input: SeoInput = {
      content: 'Premium handcrafted leather boots for winter trekking and hiking adventures.',
      contentType: 'product',
      language: 'en',
      focusKeyword: 'leather boots',
      brandName: 'NordicWear',
      targetAudience: 'Hikers',
    };

    const result: SeoResult = generateSeo(input);

    expect(result.title).toContain('Leather Boots');
    expect(result.focusKeyword).toBe('leather boots');
    expect(result.description).toContain('leather boots');
    expect(result.slug).toContain('leather-boots');
    expect(result.altText).toContain('Leather Boots');
    expect(result.ogTitle).toBe(result.title);
    expect(result.ogDescription).toBe(result.description);
    expect(result.secondaryKeywords.length).toBeGreaterThan(0);
    expect(result.tags.length).toBeGreaterThan(0);
  });

  it('validates SeoInput and generateSeo for website content in English and Bengali', () => {
    // English website
    const enInput: SeoInput = {
      content: 'Leading cloud-based image compression and SEO automation platform for merchants.',
      contentType: 'website',
      language: 'en',
      focusKeyword: 'image optimization',
      brandName: 'PixelSEO',
      targetAudience: 'E-commerce merchants',
    };

    const enResult = generateSeo(enInput);
    expect(enResult.title).toContain('PixelSEO');
    expect(enResult.title).toContain('Website');
    expect(enResult.description).toContain('image optimization');

    // Bengali website
    const bnInput: SeoInput = {
      content: 'অনলাইন ব্যবসার জন্য সেরা ইমেজ অপ্টিমাইজেশন ও এসইও প্ল্যাটফর্ম।',
      contentType: 'website',
      language: 'bn',
      focusKeyword: 'ইমেজ অপ্টিমাইজেশন',
      brandName: 'পিক্সেলএসইও',
      targetAudience: 'মার্চেন্টদের',
    };

    const bnResult = generateSeo(bnInput);
    expect(bnResult.title).toContain('পিক্সেলএসইও');
    expect(bnResult.title).toContain('অফিসিয়াল ওয়েবসাইট');
    expect(bnResult.focusKeyword).toBe('ইমেজ অপ্টিমাইজেশন');
  });

  it('handles bidirectional conversion between SeoInput and SeoStudioInput', () => {
    const input: SeoInput = {
      content: 'Modern responsive web development services.',
      contentType: 'service',
      language: 'en',
      focusKeyword: 'web development',
      brandName: 'TechCorp',
      targetAudience: 'Startups',
    };

    const studioInput: SeoStudioInput = toSeoStudioInput(input);
    expect(studioInput.contentText).toBe(input.content);
    expect(studioInput.contentType).toBe('service');
    expect(studioInput.targetKeyword).toBe('web development');
    expect(studioInput.brandName).toBe('TechCorp');
    expect(studioInput.targetAudience).toBe('Startups');

    const backToInput = fromSeoStudioInput(studioInput);
    expect(backToInput.content).toBe(input.content);
    expect(backToInput.contentType).toBe(input.contentType);
    expect(backToInput.focusKeyword).toBe(input.focusKeyword);
    expect(backToInput.brandName).toBe(input.brandName);
    expect(backToInput.targetAudience).toBe(input.targetAudience);
  });

  it('handles bidirectional conversion between SeoResult and SeoStudioOutput', () => {
    const output: SeoStudioOutput = {
      metaTitle: 'Premium Coffee Beans | Fresh Roast',
      metaDescription: 'Order freshly roasted artisan coffee beans online with fast delivery.',
      focusKeyword: 'coffee beans',
      secondaryKeywords: ['fresh roast', 'artisan coffee'],
      seoTags: ['coffee', 'roast'],
      urlSlug: 'premium-coffee-beans',
      imageAltText: 'Fresh artisan coffee beans showcase',
      ogTitle: 'Premium Coffee Beans | Fresh Roast',
      ogDescription: 'Order freshly roasted artisan coffee beans online with fast delivery.',
    };

    const result: SeoResult = toSeoResult(output);
    expect(result.title).toBe(output.metaTitle);
    expect(result.description).toBe(output.metaDescription);
    expect(result.focusKeyword).toBe('coffee beans');
    expect(result.tags).toEqual(['coffee', 'roast']);
    expect(result.slug).toBe('premium-coffee-beans');
    expect(result.altText).toBe('Fresh artisan coffee beans showcase');

    const backToOutput = fromSeoResult(result);
    expect(backToOutput.metaTitle).toBe(output.metaTitle);
    expect(backToOutput.metaDescription).toBe(output.metaDescription);
    expect(backToOutput.focusKeyword).toBe(output.focusKeyword);
    expect(backToOutput.seoTags).toEqual(output.seoTags);
    expect(backToOutput.urlSlug).toBe(output.urlSlug);
    expect(backToOutput.imageAltText).toBe(output.imageAltText);
  });

  it('validates SeoInput schema with Zod', () => {
    const valid = validateSeoInput({
      content: 'Comprehensive travel guide to exploring the Alps in summer.',
      contentType: 'blog',
      language: 'en',
      focusKeyword: 'alps travel guide',
    });
    expect(valid.success).toBe(true);

    const invalidShortContent = validateSeoInput({
      content: 'Too short',
      contentType: 'blog',
      language: 'en',
    });
    expect(invalidShortContent.success).toBe(false);

    const invalidContentType = validateSeoInput({
      content: 'Valid content that is sufficiently long for analysis',
      contentType: 'invalid-type',
      language: 'en',
    });
    expect(invalidContentType.success).toBe(false);
  });
});
