import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://pixelseo.tools';
  const lastModified = new Date();

  const routes = [
    { url: `${baseUrl}`, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/tools/image-converter`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/tools/watermark`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/tools/image-compressor`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/tools/csv-export`, priority: 0.8, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/tools/seo-generator`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/about`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/faq`, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${baseUrl}/privacy`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/terms`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contact`, priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  return routes.map((route) => ({
    ...route,
    lastModified,
  }));
}
