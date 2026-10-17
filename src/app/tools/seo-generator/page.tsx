'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import { SeoGeneratorPanel } from '@/components/SeoGeneratorPanel';
import {
  Sparkles,
  ChevronRight,
  Sliders,
  FileSpreadsheet,
  Stamp,
  Globe2,
} from 'lucide-react';

export default function SeoGeneratorPage() {
  const {
    lang,
    seoConfig,
    setSeoConfig,
    items,
    setItems,
  } = usePixelSeo();

  return (
    <div className="app-layout">
      <Header />

      <main className="container" style={{ paddingBottom: '60px', paddingTop: '20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>
          <ChevronRight size={14} />
          <Link href="/tools/image-converter" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {lang === 'bn' ? 'টুলস' : 'Tools'}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
            {lang === 'bn' ? 'এসইও কনটেন্ট স্টুডিও' : 'SEO Content Studio'}
          </span>
        </div>

        {/* Page Banner Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'এসইও কনটেন্ট স্টুডিও (SEO Generator)' : 'SEO Content Studio & Metadata Engine'}
              </h1>
              <span className="badge badge-primary">Bangla + English</span>
              <span className="badge badge-success">0 API Keys Needed</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              {lang === 'bn'
                ? 'পণ্য, ব্লগ এবং সার্ভিসের জন্য রুল-বেসড মেটা টাইটেল (৫০-৬০ অক্ষর), মেটা ডেসক্রিপশন (১৪০-১৬০ অক্ষর), ফোকাস কিওয়ার্ড, এবং লাইভ গুগল সার্চ স্নsnippet প্রিভিউ তৈরি করুন।'
                : 'Free client-side rule-based NLP engine. Generate SERP-optimized Meta Titles (50–60 chars), Meta Descriptions (140–160 chars), URL slugs, and WCAG Alt text with 1-click apply to active session images.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/tools/image-converter" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Sliders size={15} />
              <span>{lang === 'bn' ? 'কনভার্টার' : 'Converter'}</span>
            </Link>
            <Link href="/tools/watermark" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Stamp size={15} />
              <span>{lang === 'bn' ? 'ওয়াটারমার্ক' : 'Watermark'}</span>
            </Link>
            <Link href="/tools/csv-export" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <FileSpreadsheet size={15} />
              <span>{lang === 'bn' ? 'সিএসভি' : 'CSV'}</span>
            </Link>
          </div>
        </div>

        {/* Shared Session Queue Status */}
        <SessionQueueBanner />

        {/* Full Interactive SEO Generator Panel */}
        <SeoGeneratorPanel
          lang={lang}
          seoConfig={seoConfig}
          setSeoConfig={setSeoConfig}
          items={items}
          setItems={setItems}
        />
      </main>

      <Footer />
    </div>
  );
}
