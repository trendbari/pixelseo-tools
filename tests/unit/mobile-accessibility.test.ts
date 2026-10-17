import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Mobile Workspace & WCAG 2.2 AA Accessibility Specifications', () => {
  const globalsCssPath = path.resolve(__dirname, '../../src/app/globals.css');
  const mainWorkspacePath = path.resolve(__dirname, '../../src/components/MainWorkspace.tsx');
  const compactNavPath = path.resolve(__dirname, '../../src/components/CompactMobileNav.tsx');

  describe('WCAG 2.2 AA Accessibility Requirements', () => {
    it('implements visible focus indicators with outline and offset (SC 2.4.7, SC 2.4.11, SC 2.4.13)', () => {
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
      expect(cssContent).toContain(':focus-visible');
      expect(cssContent).toContain('outline: 2px solid');
      expect(cssContent).toContain('outline-offset: 2px');
    });

    it('supports prefers-reduced-motion media query for motion sensitivity (SC 2.3.3)', () => {
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssContent).toContain('animation-duration: 0.01ms');
      expect(cssContent).toContain('transition-duration: 0.01ms');
    });

    it('enforces minimum 44x44px touch targets on mobile viewports (SC 2.5.8)', () => {
      const cssContent = fs.readFileSync(globalsCssPath, 'utf8');
      expect(cssContent).toContain('@media (max-width: 768px)');
      expect(cssContent).toContain('min-height: 44px');
      expect(cssContent).toContain('min-width: 44px');
    });

    it('provides accessible progress bar with role="progressbar" and ARIA attributes (SC 4.1.2)', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain('role="progressbar"');
      expect(wsContent).toContain('aria-valuenow=');
      expect(wsContent).toContain('aria-valuemin={0}');
      expect(wsContent).toContain('aria-valuemax={100}');
      expect(wsContent).toContain('aria-label=');
      expect(wsContent).toContain('aria-valuetext=');
    });

    it('implements aria-live polite region for screen reader real-time status announcements (SC 4.1.3)', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain('aria-live="polite"');
      expect(wsContent).toContain('aria-atomic="true"');
      expect(wsContent).toContain('role="status"');
    });

    it('ensures screen reader-friendly form labels with htmlFor matching input id (SC 1.3.1, SC 4.1.2)', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      expect(wsContent).toContain('htmlFor="ws-format-select"');
      expect(wsContent).toContain('id="ws-format-select"');
      expect(wsContent).toContain('htmlFor="ws-quality-slider"');
      expect(wsContent).toContain('id="ws-quality-slider"');
    });

    it('does not rely on color alone for success or error indication (SC 1.4.1)', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      // Status badges pair icons (CheckCircle, AlertCircle, Loader2, Clock) with descriptive text
      expect(wsContent).toContain('<CheckCircle');
      expect(wsContent).toContain('<AlertCircle');
      expect(wsContent).toContain('<Loader2');
      expect(wsContent).toContain('<Clock');
      expect(wsContent).toContain('Ready (WEBP)');
      expect(wsContent).toContain('Failed');
    });
  });

  describe('Mobile Workspace Layout & Compact Navigation', () => {
    it('provides compact navigation replacing desktop sidebar on mobile screens', () => {
      expect(fs.existsSync(compactNavPath)).toBe(true);
      const navContent = fs.readFileSync(compactNavPath, 'utf8');
      expect(navContent).toContain('mobile-compact-nav');
      expect(navContent).toContain('role="navigation"');
      expect(navContent).toContain('Converter');
      expect(navContent).toContain('Watermark');
      expect(navContent).toContain('SEO');
      expect(navContent).toContain('Settings');
    });

    it('arranges Converter in the exact vertical order specified by the mobile layout concept', () => {
      const wsContent = fs.readFileSync(mainWorkspacePath, 'utf8');
      // Vertical order:
      // 1. PixelSEO + WEBP Converter + 100 Max badge
      // 2. Select Images (JPG / PNG • Up to 100)
      // 3. Conversion Settings (Format WEBP, Quality 85%)
      // 4. Uploaded Images list/grid
      // 5. Convert All Images / Download Panel

      const pixelSeoIdx = wsContent.indexOf('PixelSEO');
      const webpConverterIdx = wsContent.indexOf('WEBP Converter');
      const max100BadgeIdx = wsContent.indexOf('100 Max');
      const selectImagesIdx = wsContent.indexOf('Select Images');
      const formatIdx = wsContent.indexOf('ws-format-select');
      const qualityIdx = wsContent.indexOf('ws-quality-slider');
      const convertAllIdx = wsContent.indexOf('Convert All Images');

      expect(pixelSeoIdx).toBeGreaterThan(-1);
      expect(webpConverterIdx).toBeGreaterThan(pixelSeoIdx);
      expect(max100BadgeIdx).toBeGreaterThan(webpConverterIdx);
      expect(selectImagesIdx).toBeGreaterThan(max100BadgeIdx);
      expect(formatIdx).toBeGreaterThan(selectImagesIdx);
      expect(qualityIdx).toBeGreaterThan(formatIdx);
      expect(convertAllIdx).toBeGreaterThan(qualityIdx);
    });
  });
});
