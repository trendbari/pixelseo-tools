'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import { BulkConverterPanel } from '@/components/BulkConverterPanel';
import { StatsBar } from '@/components/StatsBar';
import { MainWorkspace } from '@/components/MainWorkspace';
import {
  Minimize2,
  ChevronRight,
  Sliders,
  FileSpreadsheet,
  Zap,
  TrendingDown,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

export default function ImageCompressorPage() {
  const {
    lang,
    items,
    setItems,
    convPrefs,
    setConvPrefs,
    wmPrefs,
    setWmPrefs,
    seoConfig,
    handleUploadFiles,
    handleLoadDemoImages,
    handleConvertAll,
    handleDownloadZip,
    handleExportCsv,
    previewItem,
    setPreviewItem,
  } = usePixelSeo();

  const totalOriginalBytes = items.reduce((sum, it) => sum + it.originalSize, 0);
  const totalConvertedBytes = items.reduce(
    (sum, it) => sum + (it.convertedSize || it.originalSize),
    0
  );
  const savedBytes = Math.max(0, totalOriginalBytes - totalConvertedBytes);
  const savedPercent =
    totalOriginalBytes > 0 ? Math.round((savedBytes / totalOriginalBytes) * 100) : 0;

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
            {lang === 'bn' ? 'ইমেজ কম্প্রেসর' : 'Image Compressor'}
          </span>
        </div>

        {/* Page Banner Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)',
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
                  backgroundColor: '#8B5CF6',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Minimize2 size={18} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'ইমেজ কম্প্রেসর (Image Compressor)' : 'Smart Image Compressor & Resizer'}
              </h1>
              <span className="badge badge-primary">Save up to 85%</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              {lang === 'bn'
                ? 'ছবির রেজোলিউশন ও কোয়ালিটি নিয়ন্ত্রণ করে ফাইলের আকার উল্লেখযোগ্যভাবে কমান। গুগল পেজস্পিড ও কোর ওয়েব ভাইটালস অপ্টিমাইজেশনের জন্য উপযুক্ত।'
                : 'Shrink massive photo payloads by up to 85% without noticeable visual fidelity loss using browser-native WebP compression and dimension downscaling.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/tools/image-converter" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <Sliders size={15} />
              <span>{lang === 'bn' ? 'কনভার্টার' : 'Converter'}</span>
            </Link>
            <Link href="/tools/csv-export" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <FileSpreadsheet size={15} />
              <span>{lang === 'bn' ? 'সিএসভি' : 'CSV'}</span>
            </Link>
          </div>
        </div>

        {/* Shared Session Queue Status */}
        <SessionQueueBanner />

        {/* Compression Quality & Sizing Controls */}
        <div style={{ marginBottom: '24px' }}>
          <BulkConverterPanel
            lang={lang}
            prefs={convPrefs}
            setPrefs={setConvPrefs}
          />
        </div>

        {/* Savings Metric Cards if images in session */}
        {items.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'মূল ফাইলের মোট সাইজ' : 'Original Payload'}
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'অপ্টিমাইজড WebP সাইজ' : 'Optimized Payload'}
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                {(totalConvertedBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                {lang === 'bn' ? 'মোট ডাটা সঞ্চয়' : 'Data Saved'}
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {savedPercent}% ({(savedBytes / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          </div>
        )}

        {/* Empty state prompt */}
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
                ? 'কম্প্রেশন টেস্ট করার জন্য কোনো ছবি নেই। ডেমো ছবি লোড করুন অথবা নিজের ছবি ড্রপ করুন।'
                : 'No images in session. Load 6 demo images to test compression ratios or upload photos.'}
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

        {/* Full Image Grid/List with Compression Action */}
        {items.length > 0 && (
          <MainWorkspace
            lang={lang}
            items={items}
            setItems={setItems}
            convPrefs={convPrefs}
            setConvPrefs={setConvPrefs}
            wmPrefs={wmPrefs}
            setWmPrefs={setWmPrefs}
            seoConfig={seoConfig}
            onDownloadZip={handleDownloadZip}
            onExportCsv={handleExportCsv}
            onPreviewItem={(item) => setPreviewItem(item)}
            onOpenWatermarkTab={() => {
              window.location.href = '/tools/watermark';
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
