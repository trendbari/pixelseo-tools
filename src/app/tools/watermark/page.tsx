'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import dynamic from 'next/dynamic';

const WatermarkStudioPanel = dynamic(
  () => import('@/components/WatermarkStudioPanel').then((m) => m.WatermarkStudioPanel),
  {
    ssr: false,
    loading: () => (
      <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Loading Watermark Studio Engine...
        </div>
      </div>
    ),
  }
);
import {
  Stamp,
  ChevronRight,
  Sliders,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

export default function WatermarkStudioPage() {
  const {
    lang,
    items,
    wmPrefs,
    setWmPrefs,
    handleUploadFiles,
    handleLoadDemoImages,
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
            {lang === 'bn' ? 'ওয়াটারমার্ক স্টুডিও' : 'Watermark Studio'}
          </span>
        </div>

        {/* Page Banner Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%)',
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
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stamp size={18} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'ওয়াটারমার্ক স্টুডিও (Watermark Studio)' : 'Watermark Studio & Live Simulator'}
              </h1>
              <span className="badge badge-success">Live 60fps Canvas</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              {lang === 'bn'
                ? 'লোগো বা টেক্সট ওয়াটারমার্ক কাস্টমাইজ করুন, ৯-পয়েন্ট গ্রিড বা টাইল প্যাটার্নে বসান এবং সরাসরি আপলোড করা ছবির ওপর লাইভ প্রিভিউ দেখুন।'
                : 'Imprint your brand copyright across catalog photos with custom PNG/SVG logos, typography, 9-point grid alignment, and opacity tuning. Applied synchronously across all queue images.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/tools/image-converter" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Sliders size={15} />
              <span>{lang === 'bn' ? 'কনভার্টার ওয়ার্কস্পেস' : 'Converter Workspace'}</span>
            </Link>
            <Link href="/tools/csv-export" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <FileSpreadsheet size={15} />
              <span>{lang === 'bn' ? 'সিএসভি মেটাডেটা' : 'CSV Metadata'}</span>
            </Link>
          </div>
        </div>

        {/* Shared Session Queue Status */}
        <SessionQueueBanner />

        {/* Quick upload trigger if no images in session */}
        {items.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              {lang === 'bn'
                ? 'আপনার সেশনে কোনো ছবি নেই। ওয়াটারমার্ক প্রিভিউ দেখতে স্যাম্পল ছবি লোড করুন অথবা নিজের ছবি আপলোড করুন।'
                : 'No images in current session. Load demo catalog photos to preview watermarks in real-time, or upload your own.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLoadDemoImages}
              >
                <span>{lang === 'bn' ? 'ডেমো ছবি লোড করুন (৬)' : 'Load Demo Images (6)'}</span>
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <UploadCloud size={16} />
                <span>{lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload Images'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleUploadFiles(e.target.files)}
                />
              </label>
            </div>
          </div>
        )}

        {/* Live Watermark Editor & Simulator */}
        <WatermarkStudioPanel
          lang={lang}
          prefs={wmPrefs}
          setPrefs={setWmPrefs}
          queueItems={items}
        />
      </main>

      <Footer />
    </div>
  );
}
