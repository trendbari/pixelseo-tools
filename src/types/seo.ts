export interface SeoMetadata {
  title: string;
  alt: string;
  description: string;
  tags: string[];
  keywords: string[];
}

export type SeoContentType =
  | 'product'
  | 'blog'
  | 'service'
  | 'website';

export type ExtendedSeoContentType =
  | SeoContentType
  | 'category'
  | 'article';

export interface SeoInput {
  content: string;
  contentType: SeoContentType;
  language: 'en' | 'bn';
  focusKeyword?: string;
  brandName?: string;
  targetAudience?: string;
}

export interface SeoResult {
  title: string;
  description: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
  slug: string;
  altText: string;
  ogTitle: string;
  ogDescription: string;
}

export interface SeoStudioInput {
  contentText: string;
  targetKeyword: string;
  contentType: ExtendedSeoContentType;
  language: 'en' | 'bn';
  brandName: string;
  targetAudience: string;
}

export interface SeoStudioOutput {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  seoTags: string[];
  urlSlug: string;
  imageAltText: string;
  ogTitle: string;
  ogDescription: string;
}

export interface SeoGeneratorConfig {
  brandName: string;
  category: string;
  defaultAltTemplate: string;
  defaultTitleTemplate: string;
  autoExtractKeywords: boolean;
  ecommercePreset: 'standard' | 'shopify' | 'woocommerce' | 'amazon';
}

/**
 * Adapter: Convert SeoInput to SeoStudioInput
 */
export function toSeoStudioInput(input: SeoInput): SeoStudioInput {
  return {
    contentText: input.content,
    contentType: input.contentType,
    language: input.language,
    targetKeyword: input.focusKeyword || '',
    brandName: input.brandName || '',
    targetAudience: input.targetAudience || '',
  };
}

/**
 * Adapter: Convert SeoStudioInput to SeoInput
 */
export function fromSeoStudioInput(studioInput: SeoStudioInput): SeoInput {
  const safeContentType: SeoContentType =
    studioInput.contentType === 'category' || studioInput.contentType === 'article'
      ? 'website'
      : (studioInput.contentType as SeoContentType);

  return {
    content: studioInput.contentText,
    contentType: safeContentType,
    language: studioInput.language,
    focusKeyword: studioInput.targetKeyword || undefined,
    brandName: studioInput.brandName || undefined,
    targetAudience: studioInput.targetAudience || undefined,
  };
}

/**
 * Adapter: Convert SeoStudioOutput to SeoResult
 */
export function toSeoResult(output: SeoStudioOutput): SeoResult {
  return {
    title: output.metaTitle,
    description: output.metaDescription,
    focusKeyword: output.focusKeyword,
    secondaryKeywords: output.secondaryKeywords,
    tags: output.seoTags,
    slug: output.urlSlug,
    altText: output.imageAltText,
    ogTitle: output.ogTitle,
    ogDescription: output.ogDescription,
  };
}

/**
 * Adapter: Convert SeoResult to SeoStudioOutput
 */
export function fromSeoResult(result: SeoResult): SeoStudioOutput {
  return {
    metaTitle: result.title,
    metaDescription: result.description,
    focusKeyword: result.focusKeyword,
    secondaryKeywords: result.secondaryKeywords,
    seoTags: result.tags,
    urlSlug: result.slug,
    imageAltText: result.altText,
    ogTitle: result.ogTitle,
    ogDescription: result.ogDescription,
  };
}

