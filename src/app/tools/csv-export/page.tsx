'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import { CsvExportPanel } from '@/components/CsvExportPanel';
import {
  FileSpreadsheet,
  ChevronRight,
  Sliders,
  Stamp,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

export default function CsvExportPage() {
  const {
    lang,
    items,
    convPrefs,
    wmPrefs,
    handleExportCsv,
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
            {lang === 'bn' ? 'সিএসভি মেটাডেটা টুল' : 'CSV Metadata Tool'}
          </span>
        </div>

        {/* Page Banner Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
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
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileSpreadsheet size={18} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'সিএসভি মেটাডেটা এক্সপোর্ট (CSV Metadata)' : 'CSV Metadata Export Tool'}
              </h1>
              <span className="badge badge-success">16-Column Spec • RFC 4180 BOM</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              {lang === 'bn'
                ? 'ছবির নাম, ডাইমেনশন, কম্প্রেশন রেট, ওয়াটারমার্ক স্ট্যাটাস এবং এসইও অল্ট টেক্সট স্প্রেডশিটে ডাউনলোড করুন। Shopify, WooCommerce ও Excel-এ ব্যবহারের জন্য পুরোপুরি প্রস্তুত।'
                : 'Generate and export clean 16-column CSV manifests capturing original and WebP file sizes, dimensions, watermark status, and keyword-rich SEO metadata.'}
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
            <Link href="/tools/seo-generator" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Sparkles size={15} />
              <span>{lang === 'bn' ? 'এসইও স্টুডিও' : 'SEO Studio'}</span>
            </Link>
          </div>
        </div>

        {/* Shared Session Queue Status */}
        <SessionQueueBanner />

        {/* Empty state prompt if no images */}
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
                ? 'সিএসভিতে এক্সপোর্ট করার জন্য কোনো ছবি নেই। ডেমো ইমেজ লোড করুন অথবা নিজের ছবি যোগ করুন।'
                : 'No images in current session to export. Load 6 demo images to preview the 16-column CSV table or upload files.'}
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

        {/* Dedicated 16-Column CSV Panel */}
        <CsvExportPanel
          lang={lang}
          items={items}
          convPrefs={convPrefs}
          wmPrefs={wmPrefs}
          onExportCsv={handleExportCsv}
        />
      </main>

      <Footer />
    </div>
  );
}
