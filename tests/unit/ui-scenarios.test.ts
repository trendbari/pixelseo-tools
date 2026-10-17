import { describe, it, expect } from 'vitest';
import { getScenarioGuidance, ScenarioType } from '@/lib/errorGuidance';
import { resolveBatchOutputFilenames } from '@/lib/imageProcessor';
import { ProcessedImageItem, ConversionPreferences } from '@/types';

describe('UI Scenarios & Error Guidance Specification', () => {
  const allScenarios: ScenarioType[] = [
    'no_images',
    'over_100_files',
    'unsupported_format',
    'corrupt_image',
    'memory_pressure',
    'webp_unsupported',
    'duplicate_filename',
    'zip_failure',
    'no_seo_input',
    'offline_mode',
    'session_refresh',
  ];

  it('guarantees that every scenario provides both "what happened" and "next step" in English and Bengali', () => {
    allScenarios.forEach((scenario) => {
      // English check
      const enGuidance = getScenarioGuidance(scenario, 'en', {
        attempted: 120,
        added: 100,
        filename: 'corrupted-file.xyz',
        format: 'xyz',
        uniqueName: 'photo-1.webp',
        reason: 'Memory limit',
        quality: 85,
      });

      expect(enGuidance.title).toBeTruthy();
      expect(enGuidance.whatHappened).toBeTruthy();
      expect(enGuidance.nextStep).toBeTruthy();
      expect(enGuidance.whatHappened.length).toBeGreaterThan(10);
      expect(enGuidance.nextStep.length).toBeGreaterThan(10);

      // Bengali check
      const bnGuidance = getScenarioGuidance(scenario, 'bn', {
        attempted: 120,
        added: 100,
        filename: 'corrupted-file.xyz',
        format: 'xyz',
        uniqueName: 'photo-1.webp',
        reason: 'মেমোরি সীমা',
        quality: 85,
      });

      expect(bnGuidance.title).toBeTruthy();
      expect(bnGuidance.whatHappened).toBeTruthy();
      expect(bnGuidance.nextStep).toBeTruthy();
      expect(bnGuidance.whatHappened.length).toBeGreaterThan(10);
      expect(bnGuidance.nextStep.length).toBeGreaterThan(10);
    });
  });

  describe('Scenario 1: No images -> Upload placeholder', () => {
    it('returns guidance for empty workspace queue', () => {
      const en = getScenarioGuidance('no_images', 'en');
      const bn = getScenarioGuidance('no_images', 'bn');

      expect(en.whatHappened).toContain('workspace queue is currently empty');
      expect(en.nextStep).toContain('Drag and drop');
      expect(bn.whatHappened).toContain('ওয়ার্কস্পেস কিউ বর্তমানে খালি রয়েছে');
      expect(bn.nextStep).toContain('ড্র্যাগ ও ড্রপ');
    });
  });

  describe('Scenario 2: Over 100 files -> Limit warning', () => {
    it('informs user about 100-file cap and specifies slots added', () => {
      const guidance = getScenarioGuidance('over_100_files', 'en', { attempted: 110, added: 95 });
      expect(guidance.whatHappened).toContain('100 images');
      expect(guidance.whatHappened).toContain('110');
      expect(guidance.nextStep).toContain('95 available slots were added');
    });

    it('bilingual Bengali guidance explains memory protection and batch processing', () => {
      const guidance = getScenarioGuidance('over_100_files', 'bn', { attempted: 105, added: 100 });
      expect(guidance.whatHappened).toContain('মেমরি সুরক্ষায়');
      expect(guidance.nextStep).toContain('সম্পন্ন করে ডাউনলোড করুন');
    });
  });

  describe('Scenario 3: Unsupported format -> Reject + reason', () => {
    it('explains the rejected format and lists supported alternatives', () => {
      const guidance = getScenarioGuidance('unsupported_format', 'en', {
        filename: 'document.pdf',
        format: 'application/pdf',
      });
      expect(guidance.whatHappened).toContain('document.pdf');
      expect(guidance.nextStep).toContain('JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp), or AVIF (.avif)');
    });
  });

  describe('Scenario 4: Corrupt image -> Failed status + Retry', () => {
    it('specifies corruption cause and provides retry guidance', () => {
      const en = getScenarioGuidance('corrupt_image', 'en', { filename: 'broken.png' });
      expect(en.whatHappened).toContain('could not be decoded');
      expect(en.nextStep).toContain('Retry Failed');

      const bn = getScenarioGuidance('corrupt_image', 'bn', { filename: 'broken.png' });
      expect(bn.whatHappened).toContain('ডিকোড করা যায়নি');
      expect(bn.nextStep).toContain('Retry Failed');
    });
  });

  describe('Scenario 5: Memory pressure -> Pause / Reduce concurrency', () => {
    it('explains heap pressure and concurrency reduction from 2 to 1', () => {
      const en = getScenarioGuidance('memory_pressure', 'en');
      expect(en.whatHappened).toContain('heap memory');
      expect(en.nextStep).toContain('reduced from 2 to 1 worker');

      const bn = getScenarioGuidance('memory_pressure', 'bn');
      expect(bn.whatHappened).toContain('র‍্যামে চাপ বৃদ্ধি পেয়েছে');
      expect(bn.nextStep).toContain('২ থেকে ১-এ নামিয়ে');
    });
  });

  describe('Scenario 6: WEBP unsupported -> Unsupported browser warning', () => {
    it('alerts about browser limitation and fallback to PNG', () => {
      const en = getScenarioGuidance('webp_unsupported', 'en');
      expect(en.whatHappened).toContain('does not natively support WebP');
      expect(en.nextStep).toContain('fall back to PNG format');
    });
  });

  describe('Scenario 7: Duplicate filename -> Unique output naming', () => {
    it('resolves duplicate filenames without collision in batch export', () => {
      const convPrefs: ConversionPreferences = {
        format: 'webp',
        quality: 85,
        resizeEnabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        preserveAspectRatio: true,
        namingPattern: 'original',
        prefix: '',
        suffix: '',
      };

      const mockItems: ProcessedImageItem[] = [
        {
          id: 'item-1',
          file: new File([], 'product-photo.jpg'),
          name: 'product-photo.jpg',
          originalSize: 1000,
          originalWidth: 800,
          originalHeight: 600,
          previewUrl: '',
          convertedBlob: null,
          convertedUrl: null,
          convertedSize: null,
          convertedWidth: 0,
          convertedHeight: 0,
          status: 'idle',
          progress: 0,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
        {
          id: 'item-2',
          file: new File([], 'product-photo.png'),
          name: 'product-photo.png',
          originalSize: 1200,
          originalWidth: 800,
          originalHeight: 600,
          previewUrl: '',
          convertedBlob: null,
          convertedUrl: null,
          convertedSize: null,
          convertedWidth: 0,
          convertedHeight: 0,
          status: 'idle',
          progress: 0,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
        {
          id: 'item-3',
          file: new File([], 'product-photo.jpg'),
          name: 'product-photo.jpg',
          originalSize: 1500,
          originalWidth: 800,
          originalHeight: 600,
          previewUrl: '',
          convertedBlob: null,
          convertedUrl: null,
          convertedSize: null,
          convertedWidth: 0,
          convertedHeight: 0,
          status: 'idle',
          progress: 0,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
      ];

      const nameMap = resolveBatchOutputFilenames(mockItems, convPrefs);

      expect(nameMap.get('item-1')).toBe('product-photo.webp');
      expect(nameMap.get('item-2')).toBe('product-photo-1.webp');
      expect(nameMap.get('item-3')).toBe('product-photo-2.webp');

      // Verify guidance message explains collision prevention
      const guidance = getScenarioGuidance('duplicate_filename', 'en', {
        filename: 'product-photo.jpg',
        uniqueName: 'product-photo-1.webp',
      });
      expect(guidance.whatHappened).toContain('Multiple uploaded files share the same filename');
      expect(guidance.nextStep).toContain('prevent file collisions');
    });
  });

  describe('Scenario 8: ZIP generation failure -> Retry export', () => {
    it('explains archive error and instructs user to retry export or download individually', () => {
      const guidance = getScenarioGuidance('zip_failure', 'en', { reason: 'Corrupted blob payload' });
      expect(guidance.whatHappened).toContain('Could not bundle the ZIP archive');
      expect(guidance.whatHappened).toContain('Corrupted blob payload');
      expect(guidance.nextStep).toContain('Retry Export');
      expect(guidance.nextStep).toContain('download converted WebP images individually');
    });
  });

  describe('Scenario 9: No SEO input -> Disable Generate', () => {
    it('explains missing context and guides user to provide product text or keywords', () => {
      const en = getScenarioGuidance('no_seo_input', 'en');
      expect(en.whatHappened).toContain('Content text, brand name, and target keyword are currently empty');
      expect(en.nextStep).toContain('enter your product description, brand, or focus keyword');

      const bn = getScenarioGuidance('no_seo_input', 'bn');
      expect(bn.whatHappened).toContain('কনটেন্ট বিবরণ, ব্র্যান্ডের নাম বা ফোকাস কিওয়ার্ড খালি');
      expect(bn.nextStep).toContain('পণ্যের বিবরণ বা ফোকাস কিওয়ার্ড লিখুন');
    });
  });

  describe('Scenario 10: Offline -> Image tools remain usable after app load', () => {
    it('assures user of local processing capability without internet', () => {
      const en = getScenarioGuidance('offline_mode', 'en');
      expect(en.whatHappened).toContain('working offline');
      expect(en.nextStep).toContain('100% locally');
      expect(en.nextStep).toContain('remain fully usable without internet');
    });
  });

  describe('Scenario 11: Browser refresh -> Session recovery notice', () => {
    it('notifies user of private RAM reset while confirming preserved user preferences', () => {
      const guidance = getScenarioGuidance('session_refresh', 'en', { quality: 90 });
      expect(guidance.whatHappened).toContain('browser RAM');
      expect(guidance.nextStep).toContain('Quality 90%');
      expect(guidance.nextStep).toContain('restored');
    });
  });
});
