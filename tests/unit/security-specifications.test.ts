import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { imageFileSchema } from '@/lib/validation';
import { sanitizeSafeFilename, sanitizeZipEntryPath } from '@/lib/security/filenameSanitizer';
import { formatOutputFilename } from '@/lib/imageProcessor';
import { sanitizeSvgString } from '@/lib/svgSanitizer';
import { sanitizeAndEscapeCsvCell, generateMetadataCsvString } from '@/lib/csvExporter';
import { ProcessedImageItem } from '@/types';

describe('PixelSEO Security Architecture (SEC-01 to SEC-10)', () => {
  const nextConfigPath = fs.existsSync(path.resolve(__dirname, '../../next.config.ts'))
    ? path.resolve(__dirname, '../../next.config.ts')
    : path.resolve(__dirname, '../../next.config.mjs');
  const privacyPagePath = path.resolve(__dirname, '../../src/app/privacy/page.tsx');
  const storePath = path.resolve(__dirname, '../../src/store/usePixelSeoStore.ts');
  const zipExporterPath = path.resolve(__dirname, '../../src/lib/zipExporter.ts');

  // SEC-01: File type & size validation
  describe('SEC-01: File type & size validation', () => {
    it('accepts valid images up to 20 MB', () => {
      const valid = imageFileSchema.safeParse({
        name: 'sample.jpg',
        size: 19 * 1024 * 1024,
        type: 'image/jpeg',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects files exceeding 20 MB', () => {
      const invalidSize = imageFileSchema.safeParse({
        name: 'huge.png',
        size: 21 * 1024 * 1024,
        type: 'image/png',
      });
      expect(invalidSize.success).toBe(false);
      expect(invalidSize.error?.issues[0].message).toContain('20 MB');
    });

    it('rejects unsupported and potentially executable mime types', () => {
      const dangerousTypes = ['application/x-msdownload', 'text/html', 'application/javascript', 'image/gif'];
      dangerousTypes.forEach((type) => {
        const result = imageFileSchema.safeParse({
          name: 'file.exe',
          size: 1024,
          type,
        });
        expect(result.success).toBe(false);
      });
    });
  });

  // SEC-02: Safe filename normalization
  describe('SEC-02: Safe filename normalization', () => {
    it('strips directory traversal path components and null bytes', () => {
      expect(sanitizeSafeFilename('../../etc/passwd.jpg')).toBe('passwd.jpg');
      expect(sanitizeSafeFilename('..\\..\\windows\\system32\\cmd.exe.png')).toBe('cmd.exe.png');
      expect(sanitizeSafeFilename('image\x00malicious.webp')).toBe('imagemalicious.webp');
    });

    it('handles Windows reserved device names safely by prepending file-', () => {
      expect(sanitizeSafeFilename('CON.png')).toBe('file-CON.png');
      expect(sanitizeSafeFilename('prn.jpg')).toBe('file-prn.jpg');
      expect(sanitizeSafeFilename('aux.webp')).toBe('file-aux.webp');
      expect(sanitizeSafeFilename('nul.png')).toBe('file-nul.png');
      expect(sanitizeSafeFilename('COM1.jpg')).toBe('file-COM1.jpg');
    });

    it('removes NTFS alternate data streams and shell control characters', () => {
      expect(sanitizeSafeFilename('image.png:hiddenstream')).toBe('image.pnghiddenstream');
      expect(sanitizeSafeFilename('image;rm -rf;test.png')).toBe('imagerm -rftest.png');
      expect(sanitizeSafeFilename('photo<test>|pipe?.webp')).toBe('phototestpipe.webp');
    });

    it('formatOutputFilename normalizes malicious inputs into safe filenames', () => {
      const convPrefs = {
        format: 'webp',
        quality: 85,
        resizeEnabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        preserveAspectRatio: true,
        namingPattern: 'original',
        prefix: '',
        suffix: '',
      } as any;

      const output = formatOutputFilename('../../../root.jpg', convPrefs, 0);
      expect(output).not.toContain('..');
      expect(output).not.toContain('/');
      expect(output).toBe('root.webp');
    });

    it('sanitizes custom prefixes and suffixes against directory traversal', () => {
      const convPrefs = {
        format: 'webp',
        quality: 85,
        resizeEnabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        preserveAspectRatio: true,
        namingPattern: 'custom',
        prefix: '../../bad-prefix',
        suffix: 'bad/suffix',
      } as any;

      const output = formatOutputFilename('product.png', convPrefs, 0);
      expect(output).not.toContain('..');
      expect(output).not.toContain('/');
      // '../../bad-prefix' -> 'bad-prefix', 'bad/suffix' -> 'suffix'
      expect(output).toBe('bad-prefix-product-suffix.webp');
    });
  });

  // SEC-03: SVG sanitization / safe rasterization
  describe('SEC-03: SVG sanitization / safe rasterization', () => {
    it('strips <script> tags and executable JavaScript from SVG strings', () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <script>alert('XSS');</script>
          <circle cx="50" cy="50" r="40" fill="red" />
        </svg>
      `;
      const clean = sanitizeSvgString(maliciousSvg);
      expect(clean).not.toContain('<script');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('circle');
    });

    it('removes inline event handlers (onload, onerror, onclick)', () => {
      const xssSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <image href="x" onerror="alert('onerror')" onload="fetch('http://attacker.com')" />
        </svg>
      `;
      const clean = sanitizeSvgString(xssSvg);
      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('onload');
    });

    it('strips remote URLs and javascript: pseudoprotocols in href/src', () => {
      const remoteSvg = `
        <svg xmlns="http://www.w3.org/2000/svg">
          <a href="javascript:alert(1)"><text>Click</text></a>
          <image href="http://evil.com/tracker.png" />
        </svg>
      `;
      const clean = sanitizeSvgString(remoteSvg);
      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('http://evil.com');
    });

    it('strips XML external entities (XXE) and DTD declarations', () => {
      const xxeSvg = `
        <?xml version="1.0"?>
        <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
        <svg xmlns="http://www.w3.org/2000/svg"><text>&xxe;</text></svg>
      `;
      const clean = sanitizeSvgString(xxeSvg);
      expect(clean).not.toContain('<!DOCTYPE');
      expect(clean).not.toContain('<!ENTITY');
      expect(clean).not.toContain('SYSTEM');
    });
  });

  // SEC-04: No remote image upload by default
  describe('SEC-04: No remote image upload by default', () => {
    it('verifies all image operations are client-side only with zero remote upload routes', () => {
      const srcDir = path.resolve(__dirname, '../../src');
      // Ensure no upload API route exists
      expect(fs.existsSync(path.join(srcDir, 'app/api/upload'))).toBe(false);
      expect(fs.existsSync(path.join(srcDir, 'app/api/images'))).toBe(false);
    });
  });

  // SEC-05: Object URL cleanup
  describe('SEC-05: Object URL cleanup', () => {
    it('calls URL.revokeObjectURL on item removal and queue clear in store', () => {
      const storeContent = fs.readFileSync(storePath, 'utf8');
      expect(storeContent).toContain('URL.revokeObjectURL(oldItem.previewUrl)');
      expect(storeContent).toContain('URL.revokeObjectURL(oldItem.convertedUrl)');
      expect(storeContent).toContain('URL.revokeObjectURL(target.previewUrl)');
    });

    it('revokes generated object URLs immediately after trigger in zip and csv export', () => {
      const zipContent = fs.readFileSync(zipExporterPath, 'utf8');
      expect(zipContent).toContain('URL.revokeObjectURL(url)');

      const csvContent = fs.readFileSync(path.resolve(__dirname, '../../src/lib/csvExporter.ts'), 'utf8');
      expect(csvContent).toContain('URL.revokeObjectURL(url)');
    });
  });

  // SEC-06: Safe CSV serialization (Formula Injection defense)
  describe('SEC-06: Safe CSV serialization (OWASP CWE-1236)', () => {
    it('prepends single quote to cells beginning with formula characters (=, +, -, @, tab, cr)', () => {
      expect(sanitizeAndEscapeCsvCell('=cmd|/C calc!A0')).toBe(`"'=cmd|/C calc!A0"`);
      expect(sanitizeAndEscapeCsvCell('+12345')).toBe(`"'+12345"`);
      expect(sanitizeAndEscapeCsvCell('-54321')).toBe(`"'-54321"`);
      expect(sanitizeAndEscapeCsvCell('@SUM(1,2)')).toBe(`"'@SUM(1,2)"`);
      expect(sanitizeAndEscapeCsvCell('\tcalc')).toBe(`"'\tcalc"`);
    });

    it('properly quotes RFC 4180 commas, quotes, and newlines with UTF-8 BOM', () => {
      const items: ProcessedImageItem[] = [
        {
          id: '1',
          name: 'shirt, blue "special".png',
          originalSize: 1000,
          originalWidth: 800,
          originalHeight: 600,
          status: 'done',
          convertedBlob: new Blob(['x'], { type: 'image/webp' }),
          convertedSize: 400,
          convertedWidth: 800,
          convertedHeight: 600,
          seo: {
            alt: 'Cool, crisp shirt\n100% cotton',
            title: '=HYPERLINK("http://evil.com","Click")',
            description: 'Normal description',
            keywords: ['shirt', 'cotton'],
          },
        } as any,
      ];

      const csv = generateMetadataCsvString(items, {
        format: 'webp',
        quality: 85,
        namingPattern: 'original',
      } as any);

      // Must start with UTF-8 BOM (\uFEFF)
      expect(csv.startsWith('\uFEFF')).toBe(true);
      // Double quotes escaped
      expect(csv).toContain('""special""');
      // Formula injection escaped with single quote
      expect(csv).toContain(`'=HYPERLINK`);
    });
  });

  // SEC-07: Content Security Policy & Security Headers
  describe('SEC-07: Content Security Policy & Security Headers', () => {
    it('configures strict Content-Security-Policy in next.config.mjs', () => {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      expect(nextConfig).toContain('Content-Security-Policy');
      expect(nextConfig).toContain("default-src 'self'");
      expect(nextConfig).toContain("object-src 'none'");
      expect(nextConfig).toContain("frame-ancestors 'none'");
      expect(nextConfig).toContain("base-uri 'self'");
      expect(nextConfig).toContain("connect-src 'self'");
    });

    it('enforces anti-clickjacking and anti-sniffing headers', () => {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      expect(nextConfig).toContain('X-Frame-Options');
      expect(nextConfig).toContain('DENY');
      expect(nextConfig).toContain('X-Content-Type-Options');
      expect(nextConfig).toContain('nosniff');
      expect(nextConfig).toContain('Referrer-Policy');
      expect(nextConfig).toContain('Strict-Transport-Security');
    });
  });

  // SEC-08: No secrets in client bundle
  describe('SEC-08: No secrets in client bundle', () => {
    it('contains no hardcoded API keys, private tokens, or secrets', () => {
      const srcDir = path.resolve(__dirname, '../../src');
      const files = fs.readdirSync(srcDir, { recursive: true }) as string[];

      const secretPatterns = [
        /AIzaSy[0-9A-Za-z-_]{33}/, // Google API key
        /sk-[a-zA-Z0-9]{20,}/, // OpenAI API key
        /ghp_[a-zA-Z0-9]{36}/, // GitHub token
        /(?:secret|password|private_key)\s*[:=]\s*['"][^'"]{8,}['"]/i,
      ];

      files.forEach((file) => {
        const fullPath = path.join(srcDir, file);
        if (fs.statSync(fullPath).isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          secretPatterns.forEach((pattern) => {
            expect(pattern.test(content)).toBe(false);
          });
        }
      });
    });
  });

  // SEC-09: Dependency vulnerability checks
  describe('SEC-09: Dependency vulnerability checks', () => {
    it('includes postcss security override in package.json to ensure 0 vulnerabilities', () => {
      const pkgPath = path.resolve(__dirname, '../../package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(pkg.overrides).toBeDefined();
      expect(pkg.overrides.postcss).toBeDefined();
    });
  });

  // SEC-10: ZIP filename path traversal prevention (Zip Slip)
  describe('SEC-10: ZIP filename path traversal prevention (Zip Slip)', () => {
    it('sanitizeZipEntryPath keeps files strictly within the intended relative path', () => {
      expect(sanitizeZipEntryPath('images', '../../etc/passwd.webp')).toBe('images/passwd.webp');
      expect(sanitizeZipEntryPath('images', '..\\..\\windows\\system32\\calc.webp')).toBe('images/calc.webp');
      expect(sanitizeZipEntryPath('metadata', 'image-metadata.csv')).toBe('metadata/image-metadata.csv');
    });

    it('zipExporter calls sanitizeSafeFilename on all entry names before writing', () => {
      const zipContent = fs.readFileSync(zipExporterPath, 'utf8');
      expect(zipContent).toContain('sanitizeSafeFilename');
      expect(zipContent).toContain('SEC-10: Zip Slip defense');
    });
  });

  // Privacy Policy & Analytics Guarantees
  describe('Privacy Policy & Analytics Disclosures', () => {
    it('explicitly documents browser processing, zero server upload, and on-device storage', () => {
      const privacyContent = fs.readFileSync(privacyPagePath, 'utf8');
      expect(privacyContent).toContain('User Images Remain on the Device');
      expect(privacyContent).toContain('server-side image upload API');
      expect(privacyContent).toContain('remote storage বা database');
    });

    it('guarantees that optional analytics will never collect images, filenames, or SEO input', () => {
      const privacyContent = fs.readFileSync(privacyPagePath, 'utf8');
      expect(privacyContent).toContain('ব্যক্তিগত ছবি, ফাইলের নাম (filename) বা এসইও ইনপুট (SEO content/keywords) কোনোভাবেই সংগ্রহ করা হবে না');
      expect(privacyContent).toContain('personal images, filenames, or user SEO inputs will NEVER be collected');
    });

    it('clearly outlines future AI integration as strictly opt-in with explicit disclosure', () => {
      const privacyContent = fs.readFileSync(privacyPagePath, 'utf8');
      expect(privacyContent).toContain('Future AI Integration Architecture');
      expect(privacyContent).toContain('Opt-In');
      expect(privacyContent).toContain('ব্যবহারকারী স্পষ্ট অনুমতি না দিলে কোনো টেক্সট এআই সার্ভিসে পাঠানো হবে না');
    });
  });
});
