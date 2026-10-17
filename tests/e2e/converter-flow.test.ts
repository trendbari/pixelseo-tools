import { describe, it, expect } from 'vitest';
import { siteConfig } from '@/config/site';
import { processingLimits } from '@/config/limits';
import { headerNavItems, toolsCatalog } from '@/config/navigation';

describe('E2E / Flow Verification: Configuration & Navigation Contract', () => {
  it('validates site configuration integrity', () => {
    expect(siteConfig.name).toBe('PixelSEO Tools');
    expect(siteConfig.url).toBe('https://pixelseo.tools');
    expect(processingLimits.maxBatchFiles).toBe(100);
  });

  it('validates all tool catalog routes exist in navigation', () => {
    const toolHrefs = toolsCatalog.map((t) => t.href);
    expect(toolHrefs).toContain('/tools/image-converter');
    expect(toolHrefs).toContain('/tools/watermark');
    expect(toolHrefs).toContain('/tools/image-compressor');
    expect(toolHrefs).toContain('/tools/csv-export');
    expect(toolHrefs).toContain('/tools/seo-generator');

    expect(headerNavItems.length).toBeGreaterThan(4);
  });
});
