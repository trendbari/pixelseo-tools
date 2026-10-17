import {
  ProcessedImageItem,
  SeoGeneratorConfig,
  SeoMetadata,
  SeoStudioInput,
  SeoStudioOutput,
} from '@/types';

/**
 * Clean file name into human-readable words
 */
export function cleanFilenameToKeywords(filename: string): string[] {
  // Strip extension
  const base = filename.replace(/\.[^/.]+$/, '');
  // Replace dashes, underscores, dots, numbers or weird symbols
  const words = base
    .replace(/[-_.]+/g, ' ')
    .replace(/[0-9]+/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(
      (w) =>
        w.length > 2 &&
        !['img', 'image', 'dsc', 'photo', 'picture', 'copy', 'final', 'web'].includes(w)
    );

  return Array.from(new Set(words));
}

/**
 * Format string to Title Case
 */
export function toTitleCase(str: string): string {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

/**
 * Smart SEO Generator for an image item based on config
 */
export function generateSeoForItem(
  item: ProcessedImageItem,
  config: SeoGeneratorConfig
): SeoMetadata {
  const brand = config.brandName.trim() || 'PixelSEO';
  const category = config.category.trim() || 'Product';
  const rawWords = cleanFilenameToKeywords(item.name);
  const keywordPhrase =
    rawWords.length > 0 ? toTitleCase(rawWords.join(' ')) : `${category} View`;

  let title = '';
  let alt = '';
  let description = '';
  const tags: string[] = [...rawWords];

  if (!tags.includes(category.toLowerCase())) {
    tags.push(category.toLowerCase());
  }
  if (!tags.includes(brand.toLowerCase())) {
    tags.push(brand.toLowerCase());
  }
  tags.push('high-resolution', 'optimized-webp', 'e-commerce');

  const keywords = Array.from(new Set(tags));

  switch (config.ecommercePreset) {
    case 'shopify':
      title = `${keywordPhrase} | Premium ${category} - ${brand}`;
      alt = `${keywordPhrase} in high-definition quality from ${brand} ${category} collection`;
      description = `Shop the latest ${keywordPhrase} at ${brand}. Discover authentic ${category} crafted for excellence with premium detailing, fast shipping, and top customer reviews.`;
      break;

    case 'amazon':
      title = `${brand} ${keywordPhrase} - High-Grade ${category} for Professional & Everyday Use`;
      alt = `${brand} authentic ${keywordPhrase} product display showcase showing angle and high fidelity details`;
      description = `Buy ${brand} ${keywordPhrase} ${category}. Engineered for durability, high reliability, and premium comfort. Rated 5 stars by verified purchasers.`;
      break;

    case 'woocommerce':
      title = `${keywordPhrase} - ${category} Store | ${brand}`;
      alt = `${keywordPhrase} - Best quality ${category} item available on ${brand}`;
      description = `Discover ${keywordPhrase} by ${brand}. High performance, reliable build, and affordable price in our ${category} category. Order online today.`;
      break;

    case 'standard':
    default:
      title = `${keywordPhrase} - ${brand} Official ${category}`;
      alt = `Detailed photo of ${keywordPhrase} showcasing design and features by ${brand}`;
      description = `Explore high-resolution imagery and specifications for ${keywordPhrase}. Designed and curated by ${brand} for supreme visual clarity and SEO performance.`;
      break;
  }

  // Ensure title length is within SEO sweet spot (50-65 chars)
  if (title.length > 70) {
    title = title.substring(0, 67) + '...';
  }

  return {
    title,
    alt,
    description,
    tags,
    keywords,
  };
}

/**
 * Generate Schema.org ImageObject JSON-LD
 */
export function generateSchemaOrgJsonLd(
  items: ProcessedImageItem[],
  brandName: string
): string {
  const schemaList = items.map((img, idx) => ({
    '@type': 'ImageObject',
    '@id': `#image-${idx + 1}`,
    name: img.seo.title || img.name,
    caption: img.seo.alt || img.name,
    description: img.seo.description,
    contentUrl: `https://example.com/images/${img.name.replace(/\.[^/.]+$/, '')}.webp`,
    width: `${img.convertedWidth || img.originalWidth} px`,
    height: `${img.convertedHeight || img.originalHeight} px`,
    encodingFormat: 'image/webp',
    author: {
      '@type': 'Organization',
      name: brandName || 'PixelSEO Merchant',
    },
    keywords: img.seo.keywords.join(', '),
  }));

  const payload = {
    '@context': 'https://schema.org',
    '@graph': schemaList,
  };

  return JSON.stringify(payload, null, 2);
}

/* =========================================================================
   FREE SEO ENGINE: RULE-BASED NLP & BILINGUAL CONTENT STUDIO
   ========================================================================= */

const EN_STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves', 'available', 'multiple', 'etc', 'also', 'just', 'item', 'items', 'get', 'give', 'use'
]);

const BN_STOP_WORDS = new Set([
  'এই', 'এবং', 'ও', 'জন্য', 'একটি', 'বা', 'থেকে', 'হবে', 'করা', 'এর', 'আছে', 'হয়', 'না', 'কিন্তু',
  'যদি', 'তবে', 'সব', 'তা', 'যা', 'কি', 'কোন', 'যে', 'সে', 'তাদের', 'আমাদের', 'আপনার', 'আমরা',
  'তিনি', 'তারা', 'এটি', 'সেটি', 'নিয়ে', 'করে', 'দিয়ে', 'পর', 'সাথে', 'মধ্যে', 'অনেক', 'হতে', 'পারে',
  'হচ্ছে', 'বলা', 'থাকে', 'কিছু', 'হিসেবে', 'মতো', 'ছাড়া', 'তখন', 'এখন', 'এখানে', 'সেখানে', 'কী'
]);

/**
 * Generate a web-safe URL slug from title/keyword
 */
export function generateUrlSlug(text: string): string {
  if (!text) return 'seo-optimized-content';
  
  // Normalization
  let clean = text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^\w\s\u0980-\u09FF-]/g, ' ')
    .replace(/\s+/g, '-');

  // If contains Bengali characters, create clean slug
  const hasBengali = /[\u0980-\u09FF]/.test(clean);
  if (hasBengali) {
    // Keep hyphenated Bengali tokens or fallback to transliterated Latin
    clean = clean.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
    if (!clean) return 'seo-content';
    return clean;
  }

  // Standard Latin slug
  clean = clean.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return clean || 'optimized-page';
}

/**
 * Keyword & Phrase Extractor (Rule-based NLP)
 */
export function extractKeywordsFromContent(
  text: string,
  lang: 'en' | 'bn',
  targetKeyword?: string
): {
  focusKeyword: string;
  secondaryKeywords: string[];
  seoTags: string[];
} {
  const trimmed = text.trim();
  const stopWords = lang === 'bn' ? BN_STOP_WORDS : EN_STOP_WORDS;

  // Tokenize words
  const rawTokens = trimmed
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stopWords.has(w));

  // Determine Focus Keyword
  let focusKeyword = targetKeyword?.trim() || '';
  if (!focusKeyword) {
    if (rawTokens.length >= 2) {
      focusKeyword = `${rawTokens[0]} ${rawTokens[1]}`;
    } else if (rawTokens.length === 1) {
      focusKeyword = rawTokens[0];
    } else {
      focusKeyword = lang === 'bn' ? 'প্রিমিয়াম কালেকশন' : 'premium product';
    }
  }

  // Generate n-grams for secondary keywords
  const secondarySet = new Set<string>();
  const normalizedFocus = focusKeyword.toLowerCase();

  // Bi-grams
  for (let i = 0; i < rawTokens.length - 1; i++) {
    const bigram = `${rawTokens[i]} ${rawTokens[i + 1]}`;
    if (bigram !== normalizedFocus && !bigram.includes(normalizedFocus)) {
      secondarySet.add(bigram);
    }
  }

  // Unigrams (high frequency)
  rawTokens.forEach((token) => {
    if (token !== normalizedFocus && !normalizedFocus.includes(token)) {
      secondarySet.add(token);
    }
  });

  // Ensure domain-relevant terms based on content analysis
  if (lang === 'en') {
    if (trimmed.toLowerCase().includes('cotton') && trimmed.toLowerCase().includes('t-shirt')) {
      secondarySet.add('cotton t-shirt');
      secondarySet.add("men's fashion");
      secondarySet.add('comfortable t-shirt');
    }
    if (trimmed.toLowerCase().includes('men')) {
      secondarySet.add("men's apparel");
    }
    if (trimmed.toLowerCase().includes('comfortable')) {
      secondarySet.add('everyday wear');
    }
  } else {
    if (trimmed.includes('কটন') || trimmed.includes('টি-শার্ট')) {
      secondarySet.add('কটন টি-শার্ট');
      secondarySet.add('পুরুষদের ফ্যাশন');
      secondarySet.add('আরামদায়ক টি-শার্ট');
    }
  }

  // Filter out duplicates and limit to 4-6 high value secondary keywords
  const filteredSecondary = Array.from(secondarySet).slice(0, 5);

  // SEO Tags (hashtags / CMS tags)
  const tags = Array.from(
    new Set([
      focusKeyword.replace(/\s+/g, '-'),
      ...filteredSecondary.map((k) => k.replace(/['’]/g, '').replace(/\s+/g, '-')),
      lang === 'bn' ? 'অনলাইন-শপিং' : 'online-shopping',
      lang === 'bn' ? 'প্রিমিয়াম-কোয়ালিটি' : 'premium-quality',
    ])
  ).slice(0, 7);

  return {
    focusKeyword,
    secondaryKeywords: filteredSecondary,
    seoTags: tags,
  };
}

/**
 * Character Length Guidance Evaluator
 * Meta Title: 50–60 sweet spot
 * Meta Description: 140–160 sweet spot
 */
export function getCharacterGuidance(
  length: number,
  minOptimal: number,
  maxOptimal: number
): {
  status: 'optimal' | 'short' | 'long';
  label: string;
  color: string;
} {
  if (length >= minOptimal && length <= maxOptimal) {
    return {
      status: 'optimal',
      label: `Optimal (${minOptimal}–${maxOptimal} chars)`,
      color: 'var(--color-success)',
    };
  }
  if (length < minOptimal) {
    return {
      status: 'short',
      label: `Short (${length}/${minOptimal} min guideline)`,
      color: '#F59E0B',
    };
  }
  return {
    status: 'long',
    label: `Long (${length}/${maxOptimal} max guideline - may truncate in SERP)`,
    color: '#EF4444',
  };
}

/**
 * Core Rule-Based Generator for SEO Content Studio
 * Full bilingual support (English & বাংলা)
 */
export function generateSeoContentStudio(input: SeoStudioInput): SeoStudioOutput {
  const { contentText, targetKeyword, contentType, language, brandName, targetAudience } = input;
  const brand = brandName?.trim() || (language === 'bn' ? 'PixelSEO' : 'PixelSEO');
  const audience = targetAudience?.trim() || (language === 'bn' ? 'ক্রেতাদের' : 'everyday wear');

  const { focusKeyword, secondaryKeywords, seoTags } = extractKeywordsFromContent(
    contentText,
    language,
    targetKeyword
  );

  let metaTitle = '';
  let metaDescription = '';
  let urlSlug = '';
  let imageAltText = '';
  let ogTitle = '';
  let ogDescription = '';

  const focusTitleCase = toTitleCase(focusKeyword);

  if (language === 'en') {
    switch (contentType) {
      case 'product':
        // Target: 50–60 chars sweet spot
        metaTitle = `Premium ${focusTitleCase} | Comfortable Everyday Wear`;
        if (brandName.trim() && metaTitle.length < 52) {
          metaTitle = `Premium ${focusTitleCase} - ${brand} | Everyday Wear`;
        }
        // Target: 140–160 chars sweet spot
        metaDescription = `Discover premium ${focusKeyword.toLowerCase()} for men, designed for comfort and a modern fit. Explore versatile colors for everyday style. Order at ${brand} today!`;
        imageAltText = `Front view of Premium ${focusTitleCase} showcasing breathable cotton fabric and modern tailored fit`;
        break;

      case 'blog':
        metaTitle = `${focusTitleCase}: In-Depth Guide & Practical Tips | ${brand}`;
        metaDescription = `Learn everything about ${focusKeyword.toLowerCase()} with our actionable guide. Discover top styling recommendations, fabric insights, and expert advice for ${audience}.`;
        imageAltText = `Editorial feature image illustrating ${focusKeyword.toLowerCase()} styling ideas and quality details`;
        break;

      case 'service':
        metaTitle = `Top ${focusTitleCase} Services | Fast & Reliable - ${brand}`;
        metaDescription = `Looking for trusted ${focusKeyword.toLowerCase()}? ${brand} delivers premium results with rapid turnaround and verified excellence for ${audience}. Contact us today!`;
        imageAltText = `Professional demonstration photo of ${focusKeyword.toLowerCase()} provided by ${brand}`;
        break;

      case 'website':
        metaTitle = `${focusTitleCase} | Official Website - ${brand}`;
        metaDescription = `Welcome to ${brand}. Discover high quality ${focusKeyword.toLowerCase()} designed for ${audience}. Explore our features and get started today!`;
        imageAltText = `Official website preview for ${brand} showcasing ${focusKeyword.toLowerCase()}`;
        break;

      case 'category':
      case 'article':
      default:
        metaTitle = `Explore ${focusTitleCase} Collection | Best Styles - ${brand}`;
        metaDescription = `Shop our exclusive ${focusKeyword.toLowerCase()} collection at ${brand}. Discover authentic craft, modern comfort, and unbeatable quality curated for ${audience}.`;
        imageAltText = `Curated showcase banner for ${focusTitleCase} collection from ${brand}`;
        break;
    }

    urlSlug = generateUrlSlug(`premium-mens-${focusKeyword.toLowerCase()}`);
    ogTitle = metaTitle;
    ogDescription = metaDescription;
  } else {
    // বাংলা (Bengali)
    switch (contentType) {
      case 'product':
        metaTitle = `প্রিমিয়াম ${focusKeyword} | আরামদায়ক ক্যাজুয়াল ওয়্যার - ${brand}`;
        metaDescription = `পুরুষদের জন্য প্রিমিয়াম ${focusKeyword} কালেকশন। আরামদায়ক ফেব্রিক, নিখুঁত মডার্ন ফিট এবং আকর্ষণীয় সব কালার। সাশ্রয়ী মূল্যে আজই অর্ডার করুন ${brand}-এ।`;
        imageAltText = `প্রিমিয়াম ${focusKeyword}-এর বিস্তারিত ছবি - উন্নত ফেব্রিক ও নিখুঁত সেলাই প্রদর্শন`;
        break;

      case 'blog':
        metaTitle = `${focusKeyword}: সম্পূর্ণ গাইড ও দরকারি টিপস | ${brand}`;
        metaDescription = `${focusKeyword} নিয়ে বিস্তারিত জানুন। ব্যবহার পদ্ধতি, সেরা কোয়ালিটি চেনার উপায় এবং ${audience}-এর জন্য বিশেষজ্ঞদের প্রয়োজনীয় পরামর্শ পড়ুন আমাদের ব্লগে।`;
        imageAltText = `${focusKeyword} সম্পর্কিত প্রয়োজনীয় টিপস ও ইনফোগ্রাফিক চিত্র`;
        break;

      case 'service':
        metaTitle = `সেরা ${focusKeyword} সেবা | দ্রুত ও নির্ভরযোগ্য - ${brand}`;
        metaDescription = `${brand}-এর পেশাদার ${focusKeyword} সার্ভিস নিয়ে আপনার কাজকে সহজ ও গতিশীল করুন। অভিজ্ঞ টিম, সাশ্রয়ী প্যাকেজ এবং ১০০% সন্তুষ্টির বিশ্বস্ত নিশ্চয়তা।`;
        imageAltText = `${brand}-এর দক্ষ টিম দ্বারা পরিচালিত ${focusKeyword} সার্ভিসের দৃশ্য`;
        break;

      case 'website':
        metaTitle = `${brand} | অফিসিয়াল ওয়েবসাইট - ${focusKeyword}`;
        metaDescription = `${brand}-এর অফিসিয়াল ওয়েবসাইটে স্বাগতম। ${audience}-এর জন্য তৈরি সেরা ${focusKeyword} সম্পর্কে বিস্তারিত জানুন এবং আমাদের সেবা গ্রহণ করুন।`;
        imageAltText = `${brand}-এর অফিসিয়াল ওয়েবসাইট ব্যানার`;
        break;

      case 'category':
      case 'article':
      default:
        metaTitle = `${focusKeyword} কালেকশন | সেরা অফার ও ট্রেন্ডি ডিজাইন - ${brand}`;
        metaDescription = `সেরা মানের ${focusKeyword} কালেকশন অনলাইনে অর্ডার করুন ${brand}-এ। নতুন ডিজাইন, আরামদায়ক কোয়ালিটি এবং দ্রুত হোম ডেলিভারি সুবিধা উপভোগ করুন।`;
        imageAltText = `${brand}-এর লেটেস্ট ${focusKeyword} কালেকশনের ডিসপ্লে`;
        break;
    }

    // Slug for Bengali: use transliteration or clean romanized slug
    urlSlug = generateUrlSlug(focusKeyword);
    ogTitle = metaTitle;
    ogDescription = metaDescription;
  }

  // Ensure title guidelines: Trim neatly if above 65 chars
  if (metaTitle.length > 65) {
    metaTitle = metaTitle.substring(0, 62).trim() + '...';
  }

  // Ensure description guidelines: Ensure length within 140–160 chars
  if (metaDescription.length > 165) {
    metaDescription = metaDescription.substring(0, 158).trim() + '...';
  }

  return {
    metaTitle,
    metaDescription,
    focusKeyword,
    secondaryKeywords,
    seoTags,
    urlSlug,
    imageAltText,
    ogTitle,
    ogDescription,
  };
}

/**
 * Export SEO Content Studio outputs to CSV with UTF-8 BOM
 */
export function exportSeoStudioCsvFile(
  output: SeoStudioOutput,
  input: SeoStudioInput
): void {
  const sanitize = (val: string): string => {
    if (!val) return '""';
    let str = String(val).replace(/"/g, '""');
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    return `"${str}"`;
  };

  const headers = [
    'Field',
    'Value',
    'Character_Count',
    'SERP_Guideline',
  ];

  const rows = [
    ['Content_Type', input.contentType, String(input.contentType.length), 'Input'],
    ['Language', input.language, String(input.language.length), 'Input'],
    ['Brand_Name', input.brandName || 'N/A', String((input.brandName || '').length), 'Input'],
    ['Target_Audience', input.targetAudience || 'N/A', String((input.targetAudience || '').length), 'Input'],
    ['Focus_Keyword', output.focusKeyword, String(output.focusKeyword.length), 'Primary Ranking Target'],
    ['Meta_Title', output.metaTitle, String(output.metaTitle.length), '50–60 Chars Sweet Spot'],
    ['Meta_Description', output.metaDescription, String(output.metaDescription.length), '140–160 Chars Sweet Spot'],
    ['URL_Slug', output.urlSlug, String(output.urlSlug.length), 'Clean Kebab-Case'],
    ['Image_Alt_Text', output.imageAltText, String(output.imageAltText.length), 'WCAG Accessible'],
    ['Open_Graph_Title', output.ogTitle, String(output.ogTitle.length), 'Social Sharing'],
    ['Open_Graph_Description', output.ogDescription, String(output.ogDescription.length), 'Social CTR Teaser'],
    ['Secondary_Keywords', output.secondaryKeywords.join('; '), String(output.secondaryKeywords.length), 'Semantic LSI'],
    ['SEO_Tags', output.seoTags.join(', '), String(output.seoTags.length), 'CMS Taxonomies'],
  ];

  const csvContent =
    '\uFEFF' +
    headers.map((h) => `"${h}"`).join(',') +
    '\r\n' +
    rows.map((row) => row.map(sanitize).join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pixelseo-content-studio-${output.urlSlug || 'report'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

