'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import { HeroUpload } from '@/components/HeroUpload';
import { StatsBar } from '@/components/StatsBar';
import { MainWorkspace } from '@/components/MainWorkspace';
import { PreferencesModal } from '@/components/PreferencesModal';
import { ImageDetailModal } from '@/components/ImageDetailModal';
import {
  Sliders,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function ImageConverterPage() {
  const {
    lang,
    setLang,
    theme,
    setTheme,
    items,
    setItems,
    convPrefs,
    setConvPrefs,
    wmPrefs,
    setWmPrefs,
    seoConfig,
    handleUploadFiles,
    handleLoadDemoImages,
    handleDownloadZip,
    handleExportCsv,
    handleConvertAll,
    isProcessing,
    previewItem,
    setPreviewItem,
    isPreferencesOpen,
    setIsPreferencesOpen,
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
            {lang === 'bn' ? 'বাল্ক ওয়েবপি কনভার্টার' : 'Bulk WEBP Converter'}
          </span>
        </div>

        {/* Page Banner Title */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%)',
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
                  backgroundColor: 'var(--primary-blue)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sliders size={18} />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'বাল্ক ওয়েবপি কনভার্টার (WEBP Converter)' : 'Bulk WEBP Converter Workspace'}
              </h1>
              <span className="badge badge-primary">Up to 100 Images</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '680px' }}>
              {lang === 'bn'
                ? 'একসঙ্গে সর্বোচ্চ ১০০টি JPG, PNG বা AVIF ছবি হালকা Next-Gen WebP ফরম্যাটে রূপান্তর করুন। কোনো ফাইল সার্ভারে আপলোড হয় না।'
                : 'Batch process up to 100 JPG, JPEG, and PNG images directly in your browser with fine-tuned 85% WebP quality, optional watermarking, and instant ZIP download.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link href="/tools/watermark" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <span>{lang === 'bn' ? 'ওয়াটারমার্ক স্টুডিও' : 'Watermark Studio'}</span>
            </Link>
            <Link href="/tools/csv-export" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              <span>{lang === 'bn' ? 'সিএসভি এক্সপোর্ট' : 'CSV Metadata'}</span>
            </Link>
          </div>
        </div>

        {/* Shared Session Queue Status */}
        <SessionQueueBanner />

        {/* Upload Zone (If queue is empty or to add more) */}
        {items.length === 0 && (
          <HeroUpload
            lang={lang}
            items={items}
            setItems={setItems}
            onProcessAll={handleConvertAll}
            onDownloadZip={handleDownloadZip}
            onExportCsv={handleExportCsv}
            isProcessing={isProcessing}
            seoConfig={seoConfig}
          />
        )}

        {/* Metrics & Processing Workspace */}
        {items.length > 0 && (
          <>
            <StatsBar lang={lang} items={items} />

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
              isProcessing={isProcessing}
              onConvertAll={handleConvertAll}
            />
          </>
        )}
      </main>

      <Footer />

      {/* Preferences Modal */}
      {isPreferencesOpen && (
        <PreferencesModal
          isOpen={isPreferencesOpen}
          onClose={() => setIsPreferencesOpen(false)}
          lang={lang}
          setLang={setLang}
          theme={theme}
          setTheme={setTheme}
          convPrefs={convPrefs}
          setConvPrefs={setConvPrefs}
        />
      )}

      {/* Image Detail Modal */}
      {previewItem && (
        <ImageDetailModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          lang={lang}
          convPrefs={convPrefs}
        />
      )}
    </div>
  );
}
