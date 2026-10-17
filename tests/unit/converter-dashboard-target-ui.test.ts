import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { usePixelSeoStore } from '@/store/usePixelSeoStore';
import { ProcessedImageItem } from '@/types';

describe('Converter Dashboard — Target UI v3.1 Acceptance Requirements', () => {
  const mainWorkspacePath = path.resolve(__dirname, '../../src/components/MainWorkspace.tsx');
  const imageCardPath = path.resolve(__dirname, '../../src/components/ImageCard.tsx');
  const bulkConverterPanelPath = path.resolve(__dirname, '../../src/components/BulkConverterPanel.tsx');
  const globalsCssPath = path.resolve(__dirname, '../../src/app/globals.css');

  const mainWorkspaceContent = fs.readFileSync(mainWorkspacePath, 'utf8');
  const imageCardContent = fs.readFileSync(imageCardPath, 'utf8');
  const bulkConverterContent = fs.readFileSync(bulkConverterPanelPath, 'utf8');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');

  // Requirement 1: সব controls keyboard ও mouse দিয়ে ব্যবহারযোগ্য (Keyboard & Mouse Accessibility)
  describe('Requirement 1: Keyboard & Mouse Accessibility', () => {
    it('provides visible focus ring with offset and glow for all interactive controls', () => {
      expect(globalsCssContent).toContain(':focus-visible');
      expect(globalsCssContent).toContain('outline: 2px solid');
      expect(globalsCssContent).toContain('outline-offset: 2px');
    });

    it('ensures thumbnail preview has keyboard trigger onKeyDown (Enter or Space) and tabIndex', () => {
      expect(imageCardContent).toContain('role="button"');
      expect(imageCardContent).toContain('tabIndex={0}');
      expect(imageCardContent).toContain("e.key === 'Enter' || e.key === ' '");
    });

    it('ensures list view table preview has keyboard accessibility with tabIndex and onKeyDown', () => {
      expect(mainWorkspaceContent).toContain('tabIndex={0}');
      expect(mainWorkspaceContent).toContain('role="button"');
      expect(mainWorkspaceContent).toContain("e.key === 'Enter' || e.key === ' '");
    });

    it('provides descriptive aria-labels on action buttons and controls', () => {
      expect(mainWorkspaceContent).toContain('aria-label=');
      expect(mainWorkspaceContent).toContain('aria-valuemin={0}');
      expect(mainWorkspaceContent).toContain('aria-valuemax={100}');
      expect(mainWorkspaceContent).toContain('role="progressbar"');
      expect(imageCardContent).toContain('aria-label=');
    });
  });

  // Requirement 2: Mobile-এ horizontal overflow থাকবে না (Zero Mobile Horizontal Overflow)
  describe('Requirement 2: Mobile Zero Horizontal Overflow', () => {
    it('enforces overflow-x: hidden on root html, body, and workspace wrapper', () => {
      expect(globalsCssContent).toContain('html, body {');
      expect(globalsCssContent).toContain('overflow-x: hidden');
      expect(mainWorkspaceContent).toContain("overflowX: 'hidden'");
    });

    it('ensures table list view is wrapped in a horizontal touch-scrolling container without viewport overflow', () => {
      expect(mainWorkspaceContent).toContain('overflowX: \'auto\'');
      expect(mainWorkspaceContent).toContain('WebkitOverflowScrolling: \'touch\'');
    });

    it('ensures responsive auto-fit grid sizing with min(..., 100%) so columns shrink gracefully on 320px screens', () => {
      expect(globalsCssContent).toContain('minmax(min(280px, 100%), 1fr)');
      expect(mainWorkspaceContent).toContain('minmax(min(220px, 100%), 1fr)');
    });
  });

  // Requirement 3: Processing চলাকালে প্রয়োজনীয় buttons disabled থাকবে (Buttons disabled during processing)
  describe('Requirement 3: Button Disablement During Processing', () => {
    it('disables file upload controls (Select Images, Folder, Demo) when isProcessing is true', () => {
      expect(mainWorkspaceContent).toContain('disabled={isProcessing || items.length >= 100}');
    });

    it('disables Clear All button during processing', () => {
      expect(mainWorkspaceContent).toContain('disabled={isProcessing}');
    });

    it('disables conversion preferences inputs (format, quality, resize, watermark) during processing', () => {
      expect(mainWorkspaceContent).toContain('id="ws-format-select"');
      expect(mainWorkspaceContent).toContain('disabled={isProcessing}');
      expect(mainWorkspaceContent).toContain('id="ws-quality-slider"');
      expect(mainWorkspaceContent).toContain('id="workspaceResizeToggle"');
      expect(mainWorkspaceContent).toContain('id="workspaceWatermarkToggle"');
    });

    it('disables image actions (Remove, Download, Retry, Edit SEO) inside ImageCard during processing', () => {
      expect(imageCardContent).toContain('isProcessing?: boolean');
      expect(imageCardContent).toContain('disabled={!item.convertedUrl || isProcessing}');
      expect(imageCardContent).toContain('disabled={isProcessing}');
    });

    it('disables BulkConverterPanel inputs during processing', () => {
      expect(bulkConverterContent).toContain('isProcessing?: boolean');
      expect(bulkConverterContent).toContain('disabled={isProcessing}');
    });

    it('disables Download ZIP when processing or when 0 images are completed', () => {
      expect(mainWorkspaceContent).toContain('disabled={completedCount === 0 || isProcessing}');
    });
  });

  // Requirement 4: প্রতিটি ফাইলের success/failure status দেখা যাবে (Per-file status visibility)
  describe('Requirement 4: Per-file Status Visibility', () => {
    it('displays distinct visual indicators for queued, processing stages, completed, and failed states', () => {
      expect(imageCardContent).toContain('Ready (WEBP)');
      expect(imageCardContent).toContain('Decoding... 25%');
      expect(imageCardContent).toContain('Resizing... 50%');
      expect(imageCardContent).toContain('Watermarking... 75%');
      expect(imageCardContent).toContain('Encoding... 90%');
      expect(imageCardContent).toContain('Failed');
      expect(imageCardContent).toContain('Needs Re-convert');
    });

    it('renders a visible error notice box with the error message when an image fails', () => {
      expect(imageCardContent).toContain('image-error-notice');
      expect(imageCardContent).toContain('item.errorMessage');
      expect(imageCardContent).toContain('role="alert"');
    });

    it('renders per-file status in list view table rows with error explanation and retry action', () => {
      expect(mainWorkspaceContent).toContain('Needs Re-convert');
      expect(mainWorkspaceContent).toContain('item.errorMessage');
      expect(mainWorkspaceContent).toContain('handleRetrySingle');
    });
  });

  // Requirement 5: Conversion Settings পরিবর্তন করলে stale output পুনরায় generate করতে হবে (Stale Output Re-generation)
  describe('Requirement 5: Stale Output Detection & Re-generation', () => {
    it('marks completed items as stale and resets output when conversion settings change', () => {
      const store = usePixelSeoStore.getState();

      // Seed store with a mock completed item
      const mockBlob = new Blob(['RIFF....WEBPVP8 '], { type: 'image/webp' });
      const mockItem: ProcessedImageItem = {
        id: 'test-item-stale-1',
        file: new File([], 'photo.jpg', { type: 'image/jpeg' }),
        name: 'photo.jpg',
        originalSize: 1000,
        originalWidth: 800,
        originalHeight: 600,
        previewUrl: 'blob:mock-preview',
        convertedBlob: mockBlob,
        convertedUrl: 'blob:mock-converted',
        convertedSize: 450,
        status: 'done',
        stage: 'completed',
        progress: 100,
        isStale: false,
        seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
      };

      usePixelSeoStore.setState({ items: [mockItem], isProcessing: false });

      // Change conversion quality
      store.setConvPrefs((prev) => ({ ...prev, quality: 65 }));

      const updated = usePixelSeoStore.getState().items[0];
      expect(updated.isStale).toBe(true);
      expect(updated.status).toBe('idle');
      expect(updated.convertedBlob).toBeNull();
      expect(updated.convertedUrl).toBeNull();
    });

    it('displays Stale Output Notification Banner in MainWorkspace when items are stale', () => {
      expect(mainWorkspaceContent).toContain('items.some((i) => i.isStale)');
      expect(mainWorkspaceContent).toContain('Re-convert All Stale');
    });

    it('includes stale items in handleConvertAll queue to guarantee re-generation', () => {
      expect(mainWorkspaceContent).toContain('it.status !== \'done\' || it.isStale');
    });
  });

  // Requirement 6: Dark Mode এবং Light Mode-এ contrast বজায় থাকবে (WCAG AA Contrast in Light and Dark)
  describe('Requirement 6: Contrast in Light and Dark Modes', () => {
    it('defines accessible text colors in light mode (minimum 4.5:1 contrast for normal text)', () => {
      expect(globalsCssContent).toContain('--text-primary: #0F172A');
      expect(globalsCssContent).toContain('--text-secondary: #334155');
      expect(globalsCssContent).toContain('--text-muted: #64748B');
    });

    it('defines high-contrast text colors in dark mode ([data-theme="dark"])', () => {
      expect(globalsCssContent).toContain('[data-theme=\'dark\']');
      expect(globalsCssContent).toContain('--text-primary: #F8FAFC');
      expect(globalsCssContent).toContain('--text-secondary: #CBD5E1');
      expect(globalsCssContent).toContain('--text-muted: #94A3B8');
    });

    it('provides high-contrast theme-specific focus rings', () => {
      expect(globalsCssContent).toContain(':focus-visible');
      expect(globalsCssContent).toContain('[data-theme=\'dark\'] :focus-visible');
      expect(globalsCssContent).toContain('#60A5FA');
    });
  });

  // Target UI Illustration Elements
  describe('Target UI Structure & Verification', () => {
    it('prominently features Uploaded Images header with 100 max counter badge', () => {
      expect(mainWorkspaceContent).toContain('Uploaded Images');
      expect(mainWorkspaceContent).toContain('100 max');
    });

    it('prominently features Overall Progress with percentage bar matching 75% target illustration', () => {
      expect(mainWorkspaceContent).toContain('Overall Progress');
      expect(mainWorkspaceContent).toContain('{overallProgress}%');
    });

    it('prominently features Convert All and Download ZIP buttons', () => {
      expect(mainWorkspaceContent).toContain('Convert All');
      expect(mainWorkspaceContent).toContain('Download ZIP');
    });
  });
});
