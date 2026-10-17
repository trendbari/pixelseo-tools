import { describe, it, expect } from 'vitest';
import {
  ImageItem,
  ImageStatus,
  ConversionSettings,
  ProcessedImageItem,
  toImageItem,
  fromImageItem,
} from '@/types';

describe('Unit Test: Image Types & Model Adapters', () => {
  it('validates ImageItem structure and toImageItem adapter', () => {
    const mockProcessed: ProcessedImageItem = {
      id: 'img-123',
      file: new File(['mock content'], 'photo.jpg', { type: 'image/jpeg' }),
      name: 'photo.jpg',
      originalSize: 50000,
      originalWidth: 1920,
      originalHeight: 1080,
      previewUrl: 'blob:mock',
      convertedBlob: new Blob(['webp content'], { type: 'image/webp' }),
      convertedUrl: 'blob:webp',
      convertedSize: 20000,
      convertedWidth: 1920,
      convertedHeight: 1080,
      compressionPercent: 60,
      watermarkApplied: true,
      status: 'done',
      progress: 100,
      seo: {
        title: 'Mountain Sunset',
        alt: 'High resolution mountain sunset',
        description: 'Scenic view of mountains during golden hour',
        tags: ['mountain', 'sunset'],
        keywords: ['mountain', 'sunset'],
      },
    };

    const imageItem: ImageItem = toImageItem(mockProcessed);

    expect(imageItem.id).toBe('img-123');
    expect(imageItem.originalName).toBe('photo.jpg');
    expect(imageItem.originalType).toBe('image/jpeg');
    expect(imageItem.status).toBe('completed');
    expect(imageItem.watermarkApplied).toBe(true);
    expect(imageItem.altText).toBe('High resolution mountain sunset');
    expect(imageItem.seoTitle).toBe('Mountain Sunset');
    expect(imageItem.metaDescription).toBe('Scenic view of mountains during golden hour');
    expect(imageItem.keywords).toEqual(['mountain', 'sunset']);
    expect(imageItem.outputName).toBe('photo.webp');
  });

  it('validates ConversionSettings contract', () => {
    const settings: ConversionSettings = {
      format: 'webp',
      quality: 85,
      resizeEnabled: true,
      width: 1200,
      height: 800,
      maintainAspectRatio: true,
      filenameSuffix: '-optimized',
      watermarkEnabled: false,
    };

    expect(settings.format).toBe('webp');
    expect(settings.quality).toBe(85);
    expect(settings.maintainAspectRatio).toBe(true);
    expect(settings.filenameSuffix).toBe('-optimized');
  });

  it('handles bidirectional conversion between ImageItem and ProcessedImageItem', () => {
    const originalItem: ImageItem = {
      id: 'item-999',
      originalFile: new File(['bytes'], 'sample.png', { type: 'image/png' }),
      originalName: 'sample.png',
      originalSize: 4000,
      originalWidth: 800,
      originalHeight: 600,
      originalType: 'image/png',
      outputName: 'sample.webp',
      status: 'queued',
      progress: 0,
      watermarkApplied: false,
      altText: 'Sample Alt',
      seoTitle: 'Sample Title',
      metaDescription: 'Sample Desc',
      keywords: ['sample'],
    };

    const processed = fromImageItem(originalItem);
    expect(processed.id).toBe('item-999');
    expect(processed.status).toBe('idle');
    expect(processed.seo.alt).toBe('Sample Alt');

    const backToItem = toImageItem(processed);
    expect(backToItem.id).toBe(originalItem.id);
    expect(backToItem.status).toBe('queued');
    expect(backToItem.altText).toBe('Sample Alt');
  });
});
