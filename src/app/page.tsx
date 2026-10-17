'use client';

import React from 'react';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import { HeroUpload } from '@/components/HeroUpload';
import { StatsBar } from '@/components/StatsBar';
import { MainWorkspace } from '@/components/MainWorkspace';
import { PopularToolsSection } from '@/components/PopularToolsSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { BenefitsSection } from '@/components/BenefitsSection';
import { FaqSection } from '@/components/FaqSection';
import { Footer } from '@/components/Footer';
import dynamic from 'next/dynamic';

const PreferencesModal = dynamic(
  () => import('@/components/PreferencesModal').then((m) => m.PreferencesModal),
  { ssr: false }
);

const ImageDetailModal = dynamic(
  () => import('@/components/ImageDetailModal').then((m) => m.ImageDetailModal),
  { ssr: false }
);

export default function Home() {
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
    <div className="app-layout" suppressHydrationWarning>
      {/* 1. Sticky Header */}
      <Header />

      <main className="container" style={{ paddingBottom: '60px' }}>
        {/* Active Session Queue Banner (appears when images exist) */}
        <SessionQueueBanner />

        {/* 2. Hero Upload Section */}
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

        {/* Real-time Workspace Statistics */}
        <StatsBar lang={lang} items={items} />

        {/* 3. Processing Workspace (Grid / List, 24/100 badge, Convert All, Download ZIP, Settings) */}
        <div id="tools-section">
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
        </div>

        {/* 4. Popular Optimization Tools Section */}
        <PopularToolsSection />

        {/* 5. How It Works Section */}
        <HowItWorksSection lang={lang} />

        {/* 6. Benefits & Privacy Guarantees */}
        <BenefitsSection lang={lang} />

        {/* 7. Interactive FAQ Section */}
        <FaqSection lang={lang} />
      </main>

      {/* 8. Global Footer */}
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

      {/* Image Detail & Side-by-Side Comparison Modal */}
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
