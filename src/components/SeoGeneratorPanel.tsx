'use client';

import React, { useState, useId } from 'react';
import {
  AppLanguage,
  SeoGeneratorConfig,
  ProcessedImageItem,
  SeoStudioInput,
  SeoStudioOutput,
  SeoContentType,
} from '@/types';
import { translations } from '@/locales/dictionary';
import {
  generateSeoForItem,
  generateSchemaOrgJsonLd,
  generateSeoContentStudio,
  getCharacterGuidance,
  exportSeoStudioCsvFile,
} from '@/lib/seoEngine';
import {
  Sparkles,
  Code2,
  Copy,
  Check,
  ShoppingBag,
  Globe2,
  Tag,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Laptop,
  Smartphone,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SeoGeneratorPanelProps {
  lang: AppLanguage;
  seoConfig: SeoGeneratorConfig;
  setSeoConfig: React.Dispatch<React.SetStateAction<SeoGeneratorConfig>>;
  items: ProcessedImageItem[];
  setItems: React.Dispatch<React.SetStateAction<ProcessedImageItem[]>>;
}

export const SeoGeneratorPanel: React.FC<SeoGeneratorPanelProps> = ({
  lang,
  seoConfig,
  setSeoConfig,
  items,
  setItems,
}) => {
  const t = translations[lang];

  // Studio Sub-tab toggle: 'studio' | 'batch'
  const [activeSubTab, setActiveSubTab] = useState<'studio' | 'batch'>('studio');

  // SEO Studio State - Initialized with prompt's exact example
  const [studioInput, setStudioInput] = useState<SeoStudioInput>({
    contentText:
      'Premium cotton t-shirt for men. Comfortable fabric, modern fit, available in multiple colors.',
    targetKeyword: 'cotton t-shirt',
    contentType: 'product',
    language: 'en',
    brandName: seoConfig.brandName || 'PixelSEO',
    targetAudience: 'Men, Everyday Casual Wear',
  });

  // Generated Studio Output State (initialized with sample result)
  const [studioOutput, setStudioOutput] = useState<SeoStudioOutput>(() =>
    generateSeoContentStudio({
      contentText:
        'Premium cotton t-shirt for men. Comfortable fabric, modern fit, available in multiple colors.',
      targetKeyword: 'cotton t-shirt',
      contentType: 'product',
      language: 'en',
      brandName: seoConfig.brandName || 'PixelSEO',
      targetAudience: 'Men, Everyday Casual Wear',
    })
  );

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [serpView, setSerpView] = useState<'desktop' | 'mobile'>('desktop');
  const [appliedToQueue, setAppliedToQueue] = useState(false);

  // Batch Image SEO State
  const [showSchema, setShowSchema] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateStudio = () => {
    const result = generateSeoContentStudio(studioInput);
    setStudioOutput(result);
  };

  const handleCopyAll = () => {
    const report = `=== PixelSEO Content Studio Report ===
Language: ${studioInput.language === 'bn' ? 'বাংলা' : 'English'}
Content Type: ${studioInput.contentType.toUpperCase()}

[Meta Title] (${studioOutput.metaTitle.length} chars)
${studioOutput.metaTitle}

[Meta Description] (${studioOutput.metaDescription.length} chars)
${studioOutput.metaDescription}

[Focus Keyword]
${studioOutput.focusKeyword}

[Secondary Keywords]
${studioOutput.secondaryKeywords.map((k) => `• ${k}`).join('\n')}

[URL Slug]
${studioOutput.urlSlug}

[Image Alt Text]
${studioOutput.imageAltText}

[Open Graph Title]
${studioOutput.ogTitle}

[Open Graph Description]
${studioOutput.ogDescription}

[SEO Tags]
${studioOutput.seoTags.join(', ')}
`;

    navigator.clipboard.writeText(report);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    exportSeoStudioCsvFile(studioOutput, studioInput);
  };

  const handleApplyToQueue = () => {
    if (items.length === 0) {
      alert(
        lang === 'bn'
          ? 'কোনো ছবি আপলোড করা হয়নি! প্রথমে ছবিতে ওয়াটারমার্ক বা কনভার্সনের জন্য ছবি আপলোড করুন।'
          : 'No images in queue! Upload images above in the workspace first.'
      );
      return;
    }

    setItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        seo: {
          ...item.seo,
          title: `${studioOutput.metaTitle} - View ${idx + 1}`,
          alt: `${studioOutput.imageAltText} - Angle ${idx + 1}`,
          description: studioOutput.metaDescription,
          keywords: [
            studioOutput.focusKeyword,
            ...studioOutput.secondaryKeywords,
            ...item.seo.keywords,
          ],
        },
      }))
    );

    setAppliedToQueue(true);
    setTimeout(() => setAppliedToQueue(false), 3000);
  };

  // Batch Image SEO Regenerator
  const handleBatchSeoRegen = () => {
    if (items.length === 0) return;
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        seo: generateSeoForItem(item, seoConfig),
      }))
    );
    alert(
      lang === 'bn'
        ? 'সবগুলো ছবির জন্য এসইও মেটাডেটা সফলভাবে আপডেট করা হয়েছে!'
        : 'SEO metadata regenerated for all images successfully!'
    );
  };

  const schemaJson = generateSchemaOrgJsonLd(items, seoConfig.brandName);

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaJson);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const titleGuidance = getCharacterGuidance(studioOutput.metaTitle.length, 50, 60);
  const descGuidance = getCharacterGuidance(studioOutput.metaDescription.length, 140, 160);

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Studio Header & Sub-Tab Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '14px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            className="brand-icon-box"
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                {lang === 'bn' ? 'এসইও কনটেন্ট স্টুডিও' : 'SEO Content Studio'}
              </h3>
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                Bangla + English
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                Rule-Based NLP • Free
              </span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {lang === 'bn'
                ? 'পণ্য, ব্লগ এবং সার্ভিসের জন্য রুল-বেসড টাইটেল, ডেসক্রিপশন, স্লাগ এবং কিওয়ার্ড জেনারেটর।'
                : 'Instant rule-based SEO metadata, SERP snippets, tags, and URL slugs without external API keys.'}
            </p>
          </div>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSubTab('studio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeSubTab === 'studio' ? 'var(--primary-blue)' : 'transparent',
              color: activeSubTab === 'studio' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Sparkles size={15} />
            <span>{lang === 'bn' ? 'কনটেন্ট স্টুডিও' : 'Content Studio'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('batch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.84rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: activeSubTab === 'batch' ? 'var(--primary-blue)' : 'transparent',
              color: activeSubTab === 'batch' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <ShoppingBag size={15} />
            <span>{lang === 'bn' ? 'ইমেজ ব্যাচ এসইও' : 'Queue Images & Schema'}</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: SEO CONTENT STUDIO */}
      {activeSubTab === 'studio' && (
        <div>
          {/* Input Form Grid */}
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              marginBottom: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} style={{ color: 'var(--primary-blue)' }} />
                {lang === 'bn' ? 'ইনপুট ফিল্ডস (Input Fields)' : 'SEO Generator Inputs'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {lang === 'bn' ? 'API Key ছাড়াই রুল-বেসড ফ্রি এনএলপি' : 'Rule-Based Local Generator • 0ms Latency'}
              </span>
            </div>

            {/* Content Input Textarea */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                <span>{lang === 'bn' ? 'কনটেন্ট টেক্সট (Content Input)' : 'Content Input'}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {studioInput.contentText.length} {lang === 'bn' ? 'অক্ষর' : 'characters'}
                </span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={
                  lang === 'bn'
                    ? 'আপনার পণ্যের বিবরণ, ব্লগের সংক্ষিপ্ত অংশ বা সার্ভিসের কনটেন্ট পেস্ট করুন...'
                    : 'Paste product features, blog snippet, or service details here...'
                }
                value={studioInput.contentText}
                onChange={(e) =>
                  setStudioInput((prev) => ({ ...prev, contentText: e.target.value }))
                }
                style={{ resize: 'vertical', minHeight: '80px', fontSize: '0.92rem' }}
              />
            </div>

            {/* Config Fields Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '16px',
              }}
            >
              {/* Content Type */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'bn' ? 'কনটেন্টের ধরন (Content Type)' : 'Content Type'}</label>
                <select
                  className="form-select"
                  value={studioInput.contentType}
                  onChange={(e) =>
                    setStudioInput((prev) => ({
                      ...prev,
                      contentType: e.target.value as SeoContentType,
                    }))
                  }
                >
                  <option value="product">Product (পণ্য / ই-কমার্স)</option>
                  <option value="blog">Blog Post (ব্লগ ও আর্টিকেল)</option>
                  <option value="service">Service (সার্ভিস ও ব্যবসা)</option>
                  <option value="website">Website (ওয়েবসাইট)</option>
                  <option value="category">Category (ক্যাটেগরি পেইজ)</option>
                  <option value="article">Article (নিবন্ধ)</option>
                </select>
              </div>

              {/* Language */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'bn' ? 'ভাষা (Language)' : 'Language'}</label>
                <select
                  className="form-select"
                  value={studioInput.language}
                  onChange={(e) =>
                    setStudioInput((prev) => ({
                      ...prev,
                      language: e.target.value as 'en' | 'bn',
                    }))
                  }
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>

              {/* Target / Focus Keyword */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>{lang === 'bn' ? 'টার্গেট কিওয়ার্ড' : 'Target Keyword'}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Optional</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. cotton t-shirt"
                  value={studioInput.targetKeyword}
                  onChange={(e) =>
                    setStudioInput((prev) => ({ ...prev, targetKeyword: e.target.value }))
                  }
                />
              </div>

              {/* Brand Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>{lang === 'bn' ? 'ব্র্যান্ডের নাম' : 'Brand Name'}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Optional</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PixelSEO / Apex"
                  value={studioInput.brandName}
                  onChange={(e) =>
                    setStudioInput((prev) => ({ ...prev, brandName: e.target.value }))
                  }
                />
              </div>

              {/* Target Audience */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span>{lang === 'bn' ? 'টার্গেট অডিয়েন্স' : 'Target Audience'}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Optional</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Men, Daily Wear"
                  value={studioInput.targetAudience}
                  onChange={(e) =>
                    setStudioInput((prev) => ({ ...prev, targetAudience: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Generate CTA Button (Disabled when no SEO input provided) */}
            {(() => {
              const hasSeoInput = Boolean(
                studioInput.contentText.trim() || studioInput.targetKeyword.trim()
              );
              return (
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleGenerateStudio}
                    disabled={!hasSeoInput}
                    style={{
                      padding: '12px 28px',
                      fontSize: '0.98rem',
                      fontWeight: 700,
                      boxShadow: hasSeoInput ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                      opacity: hasSeoInput ? 1 : 0.5,
                      cursor: hasSeoInput ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Sparkles size={18} />
                    <span>{lang === 'bn' ? 'এসইও কনটেন্ট তৈরি করুন' : 'Generate SEO Content'}</span>
                  </button>
                  {!hasSeoInput && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={13} />
                      <span>
                        {lang === 'bn'
                          ? 'কোনো ইনপুট দেওয়া হয়নি: এসইও জেনারেট করতে উপরে কনটেন্ট বিবরণ বা ফোকাস কিওয়ার্ড লিখুন।'
                          : 'No SEO input provided: Enter content text or a target keyword to enable generation.'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* GENERATED RESULTS SECTION */}
          <div style={{ marginTop: '30px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'bn' ? 'জেনারেটকৃত এসইও ফলাফল' : 'Generated Results'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {lang === 'bn'
                    ? 'এসইও জেনারেটরের প্রস্তাবিত রেজাল্ট লেআউট ও মেটা কন্টেন্ট'
                    : 'Optimal SERP-ready metadata tailored for high CTR and search engine indexing.'}
                </p>
              </div>

              {/* Global Studio Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCopyAll}
                  style={{ fontSize: '0.84rem', padding: '7px 14px' }}
                >
                  {copiedAll ? <Check size={15} style={{ color: 'var(--color-success)' }} /> : <Copy size={15} />}
                  <span>{copiedAll ? (lang === 'bn' ? 'সব কপি হয়েছে!' : 'All Copied!') : (lang === 'bn' ? 'সব কপি করুন' : 'Copy All')}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportCsv}
                  style={{ fontSize: '0.84rem', padding: '7px 14px' }}
                >
                  <Download size={15} />
                  <span>{lang === 'bn' ? 'সিএসভি ডাউনলোড' : 'Export CSV'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleApplyToQueue}
                  style={{ fontSize: '0.84rem', padding: '7px 14px' }}
                >
                  {appliedToQueue ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  <span>
                    {appliedToQueue
                      ? (lang === 'bn' ? 'প্রয়োগ সম্পন্ন!' : 'Applied to Images!')
                      : `${lang === 'bn' ? 'কিউয়ের ছবিতে প্রয়োগ' : 'Apply to Queue'} (${items.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Results Cards Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* 1. Meta Title Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Meta Title
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${titleGuidance.color}15`,
                        color: titleGuidance.color,
                        border: `1px solid ${titleGuidance.color}40`,
                      }}
                    >
                      {titleGuidance.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>{studioOutput.metaTitle.length}</strong> / 60 characters
                    </span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleCopyText(studioOutput.metaTitle, 'title')}
                      title="Copy Meta Title"
                    >
                      {copiedKey === 'title' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--primary-blue)',
                    padding: '10px 14px',
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {studioOutput.metaTitle}
                </div>

                {/* Progress bar for 50-60 character guideline */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (studioOutput.metaTitle.length / 60) * 100)}%`,
                        backgroundColor: titleGuidance.color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Guideline: 50–60 chars
                  </span>
                </div>
              </div>

              {/* 2. Meta Description Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Meta Description
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: `${descGuidance.color}15`,
                        color: descGuidance.color,
                        border: `1px solid ${descGuidance.color}40`,
                      }}
                    >
                      {descGuidance.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>{studioOutput.metaDescription.length}</strong> / 160 characters
                    </span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleCopyText(studioOutput.metaDescription, 'desc')}
                      title="Copy Meta Description"
                    >
                      {copiedKey === 'desc' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.55,
                    padding: '10px 14px',
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {studioOutput.metaDescription}
                </div>

                {/* Progress bar for 140-160 character guideline */}
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1, height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, (studioOutput.metaDescription.length / 160) * 100)}%`,
                        backgroundColor: descGuidance.color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Guideline: 140–160 chars
                  </span>
                </div>
              </div>

              {/* 3. SEO Keywords & URL Slug Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '18px',
                }}
              >
                {/* SEO Keywords (Wireframe representation) */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      SEO Keywords
                    </span>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() =>
                        handleCopyText(
                          [studioOutput.focusKeyword, ...studioOutput.secondaryKeywords].join('\n'),
                          'keywords'
                        )
                      }
                      title="Copy all keywords"
                    >
                      {copiedKey === 'keywords' ? (
                        <Check size={14} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* Primary Focus Keyword */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      FOCUS KEYWORD
                    </span>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        border: '1px solid #FCD34D',
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={13} />
                      <span>{studioOutput.focusKeyword}</span>
                    </div>
                  </div>

                  {/* Secondary Keywords List */}
                  <div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      SECONDARY & LSI KEYWORDS
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {studioOutput.secondaryKeywords.map((kw, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: '0.86rem',
                            color: 'var(--text-primary)',
                            padding: '4px 8px',
                            background: 'var(--bg-card-subtle)',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{kw}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>#{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* URL Slug & Image Alt Text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* URL Slug */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        URL Slug
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleCopyText(studioOutput.urlSlug, 'slug')}
                        title="Copy URL Slug"
                      >
                        {copiedKey === 'slug' ? (
                          <Check size={14} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: 'Consolas, Monaco, monospace',
                        fontSize: '0.88rem',
                        color: 'var(--primary-blue)',
                        padding: '8px 12px',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {studioOutput.urlSlug}
                    </div>
                  </div>

                  {/* Image Alt Text */}
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px 20px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Image Alt Text (WCAG Accessible)
                      </span>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleCopyText(studioOutput.imageAltText, 'alt')}
                        title="Copy Image Alt Text"
                      >
                        {copiedKey === 'alt' ? (
                          <Check size={14} style={{ color: 'var(--color-success)' }} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: '0.86rem',
                        color: 'var(--text-secondary)',
                        padding: '8px 12px',
                        background: 'var(--bg-card-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {studioOutput.imageAltText}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Open Graph & Social Cards Snippet */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={16} style={{ color: 'var(--primary-blue)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      Open Graph (Social Meta Tags)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() =>
                      handleCopyText(
                        `<meta property="og:title" content="${studioOutput.ogTitle}" />\n<meta property="og:description" content="${studioOutput.ogDescription}" />`,
                        'og'
                      )
                    }
                    title="Copy OG Meta Tags"
                  >
                    {copiedKey === 'og' ? (
                      <Check size={14} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-card-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      OG:TITLE
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {studioOutput.ogTitle}
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg-card-subtle)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                      OG:DESCRIPTION
                    </span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {studioOutput.ogDescription}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. LIVE GOOGLE SEARCH SERP PREVIEW BOX */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={16} style={{ color: 'var(--primary-blue)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                      Live Google Search SERP Snippet Preview
                    </span>
                  </div>

                  {/* Desktop / Mobile view toggle */}
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card-subtle)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
                    <button
                      type="button"
                      onClick={() => setSerpView('desktop')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        background: serpView === 'desktop' ? 'var(--primary-blue)' : 'transparent',
                        color: serpView === 'desktop' ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                    >
                      <Laptop size={13} />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpView('mobile')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        background: serpView === 'mobile' ? 'var(--primary-blue)' : 'transparent',
                        color: serpView === 'mobile' ? '#FFFFFF' : 'var(--text-secondary)',
                      }}
                    >
                      <Smartphone size={13} />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Google SERP Simulated Box */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#202124',
                    padding: serpView === 'mobile' ? '14px' : '18px 24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #DADCE0',
                    maxWidth: serpView === 'mobile' ? '380px' : '650px',
                    margin: '0 auto',
                    boxShadow: '0 1px 6px rgba(32, 33, 36, 0.12)',
                  }}
                >
                  {/* Google Breadcrumb */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#F1F3F4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#5F6368',
                        fontWeight: 700,
                      }}
                    >
                      P
                    </div>
                    <div style={{ fontSize: '12px', color: '#202124', lineHeight: 1.2 }}>
                      <span style={{ fontWeight: 500 }}>
                        {studioInput.brandName || 'example.com'}
                      </span>
                      <span style={{ color: '#5F6368', margin: '0 4px' }}>›</span>
                      <span style={{ color: '#5F6368' }}>
                        {studioInput.contentType}s › {studioOutput.urlSlug}
                      </span>
                    </div>
                  </div>

                  {/* Title (Blue link) */}
                  <div
                    style={{
                      fontSize: serpView === 'mobile' ? '17px' : '19px',
                      color: '#1A0DAB',
                      fontWeight: 400,
                      lineHeight: 1.3,
                      marginBottom: '4px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    {studioOutput.metaTitle}
                  </div>

                  {/* Description snippet */}
                  <div style={{ fontSize: '13px', color: '#4D5156', lineHeight: 1.55 }}>
                    {studioOutput.metaDescription}
                  </div>
                </div>
              </div>

              {/* 6. FREE ENGINE STRATEGY & AI UPGRADE ARCHITECTURE CALLOUT */}
              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div style={{ color: 'var(--color-success)', marginTop: '2px' }}>
                  <ShieldCheck size={24} />
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                    {lang === 'bn' ? 'ফ্রি রুল-বেসড ইঞ্জিন ও সিকিউর এআই আপগ্রেড স্ট্র্যাটেজি' : 'Free Rule-Based Strategy & Secure AI Upgrade'}
                  </strong>
                  <span>
                    {lang === 'bn'
                      ? 'PixelSEO Tools-এর বর্তমান সংস্করণ সম্পূর্ণ বিনামূল্যের রুল-বেসড ন্যাচারাল ল্যাঙ্গুয়েজ প্রসেসিং ব্যবহার করে কোনো থার্ড-পার্টি API key ছাড়াই ক্লায়েন্ট-সাইডে কাজ করে। পরবর্তীতে সার্ভার-সাইড AI প্রোভাইডার যুক্ত করার জন্য প্রস্তুত আর্কিটেকচার বজায় রাখা হয়েছে (যেখানে পাবলিক API-তে rate limiting, quota ও abuse protection থাকবে এবং কোনো API key কখনোই ফ্রন্টএন্ড বান্ডেলে রাখা হবে না)।'
                      : 'PixelSEO Tools v3.1 runs a 100% private, client-side rule-based NLP engine with zero third-party API keys or external server costs. The system architecture is built ready for future server-side AI provider integration via secure /api/seo/generate proxies with rate limiting, quota protection, and zero client-side secret exposure.'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BATCH QUEUE IMAGES SEO & SCHEMA.ORG */}
      {activeSubTab === 'batch' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Brand / Store Name */}
            <div className="form-group">
              <label className="form-label">{t.brandNameLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Acme Shoes / FashionNova"
                value={seoConfig.brandName}
                onChange={(e) =>
                  setSeoConfig((c) => ({ ...c, brandName: e.target.value }))
                }
              />
            </div>

            {/* Category / Niche */}
            <div className="form-group">
              <label className="form-label">{t.categoryLabel}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Running Shoes / Leather Bags"
                value={seoConfig.category}
                onChange={(e) =>
                  setSeoConfig((c) => ({ ...c, category: e.target.value }))
                }
              />
            </div>

            {/* E-commerce Preset */}
            <div className="form-group">
              <label className="form-label">{t.seoPresetType}</label>
              <select
                className="form-select"
                value={seoConfig.ecommercePreset}
                onChange={(e) =>
                  setSeoConfig((c) => ({
                    ...c,
                    ecommercePreset: e.target.value as SeoGeneratorConfig['ecommercePreset'],
                  }))
                }
              >
                <option value="standard">{t.standardWeb}</option>
                <option value="shopify">{t.shopifyPreset}</option>
                <option value="woocommerce">{t.wooPreset}</option>
                <option value="amazon">{t.amazonPreset}</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginBottom: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={handleBatchSeoRegen}
              disabled={items.length === 0}
              style={{
                opacity: items.length > 0 ? 1 : 0.5,
                cursor: items.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              <Sparkles size={16} />
              <span>{t.generateAllSeo} ({items.length})</span>
            </button>
            {items.length === 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} />
                <span>
                  {lang === 'bn'
                    ? 'কোনো ছবি নেই: ব্যাচ এসইও তৈরির পূর্বে কনভার্টারে ছবি আপলোড করুন।'
                    : 'No images in queue: Add images to workspace queue before batch SEO generation.'}
                </span>
              </div>
            )}
          </div>

          {/* Preset guidance badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShoppingBag size={14} /> E-commerce Engine:
            </span>
            <span>Includes Google Image Rank factors</span>
            <span>•</span>
            <span>WCAG Accessibility Compliant Alt Texts</span>
            <span>•</span>
            <span>Shopify & WooCommerce CSV Compatible</span>
          </div>

          {/* Schema.org JSON-LD Accordion */}
          {items.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSchema(!showSchema)}
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  <Code2 size={16} />
                  <span>{showSchema ? 'Hide Schema.org JSON-LD' : t.schemaJson}</span>
                </button>

                {showSchema && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCopySchema}
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    {copiedSchema ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
                    <span>{copiedSchema ? t.schemaCopied : t.copySchema}</span>
                  </button>
                )}
              </div>

              {showSchema && (
                <pre
                  style={{
                    backgroundColor: '#0F172A',
                    color: '#38BDF8',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    fontFamily: 'Consolas, Monaco, monospace',
                    maxHeight: '240px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {schemaJson}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
