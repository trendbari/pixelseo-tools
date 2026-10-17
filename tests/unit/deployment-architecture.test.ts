import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Vercel Deployment Architecture & Static-Friendly Build Configuration', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const pkgPath = path.join(rootDir, 'package.json');
  const vercelJsonPath = path.join(rootDir, 'vercel.json');
  const srcDir = path.join(rootDir, 'src');

  it('declares all proposed build and validation pipeline scripts in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.scripts).toBeDefined();
    expect(pkg.scripts.lint).toBe('next lint');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts.build).toBe('next build');
    expect(pkg.scripts.validate).toBeDefined();
  });

  it('specifies Vercel framework settings in vercel.json', () => {
    expect(fs.existsSync(vercelJsonPath)).toBe(true);
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    expect(vercelConfig.framework).toBe('nextjs');
    expect(vercelConfig.buildCommand).toBe('npm run build');
    expect(vercelConfig.cleanUrls).toBe(true);
  });

  it('maintains a 100% static-friendly architecture without serverless API functions for MVP', () => {
    const apiDir = path.join(srcDir, 'app/api');
    // MVP goal: Zero serverless API functions, all conversion and SEO done client-side
    expect(fs.existsSync(apiDir)).toBe(false);
  });

  it('requires no mandatory server-side environment variables for MVP runtime', () => {
    const envExamplePath = path.join(rootDir, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      expect(content).not.toMatch(/^SECRET|^PRIVATE/m);
    }
    // No .env file is required in root for production builds
    const envLocalPath = path.join(rootDir, '.env.local');
    expect(fs.existsSync(envLocalPath)).toBe(false);
  });
});
