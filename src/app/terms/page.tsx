'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';

export default function TermsPage() {
  const { lang } = usePixelSeo();

  return (
    <div className="app-layout">
      <Header />

      <main className="container" style={{ paddingBottom: '70px', paddingTop: '32px' }}>
        <SessionQueueBanner />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
            {lang === 'bn' ? 'ব্যবহারের শর্তাবলী' : 'Terms of Use'}
          </span>
        </div>

        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-blue)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={18} />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'ব্যবহারের শর্তাবলী (Terms of Use)' : 'Terms of Use'}
              </h1>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'সর্বশেষ সংস্করণ: অক্টোবর ২০২৬ • PixelSEO Tools v3.1'
                : 'Effective Date: October 2026 • PixelSEO Tools Platform v3.1'}
            </p>
          </div>

          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                1. Acceptance of Terms & Free Service License
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                By accessing and using PixelSEO Tools, you agree to comply with and be bound by these Terms of Use. PixelSEO Tools provides free, browser-based utilities for image conversion, watermarking, SEO generation, and metadata export for personal and commercial usage without subscription fees or user accounts.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                2. User Intellectual Property & Ownership
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong>You retain 100% exclusive ownership of all uploaded photographs, logos, and generated metadata.</strong> PixelSEO Tools does not claim any copyright, license, or proprietary rights over any content you process through the application. Because all processing occurs locally on your machine, no copies are preserved by PixelSEO Tools.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                3. Acceptable Use Guidelines
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                You agree not to use PixelSEO Tools to process, watermark, or generate metadata for materials that infringe on third-party trademarks, copyrights, or trade secrets, or content that violates applicable regional and international cyber laws.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                4. Disclaimer of Warranties & Limitation of Liability
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                PixelSEO Tools is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. Image processing speeds and compression efficiency depend directly on your device’s browser capabilities and CPU memory. PixelSEO Tools shall not be liable for any incidental data loss resulting from browser tab crashes or hardware limitations.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                5. Modifications to Service & Terms
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                We reserve the right to refine, modify, or update these terms and our client-side features at any time to reflect software improvements and browser platform updates. Continued use of the platform constitutes agreement to the amended terms.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
