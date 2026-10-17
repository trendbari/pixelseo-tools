'use client';

import React from 'react';
import { AppLanguage, ConversionPreferences } from '@/types';
import { translations } from '@/locales/dictionary';
import { Sliders, Maximize2, Tag } from 'lucide-react';

interface BulkConverterPanelProps {
  lang: AppLanguage;
  prefs: ConversionPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<ConversionPreferences>>;
  isProcessing?: boolean;
}

export const BulkConverterPanel: React.FC<BulkConverterPanelProps> = ({
  lang,
  prefs,
  setPrefs,
  isProcessing = false,
}) => {
  const t = translations[lang];

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
          <Sliders size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {lang === 'bn' ? 'বাল্ক কনভার্টার কনফিগারেশন' : 'Bulk Converter Settings'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {lang === 'bn'
              ? 'WebP ফরম্যাট, কম্প্রেশন কোয়ালিটি, রিসাইজ এবং ফাইলের নাম সেট করুন'
              : 'Tune WebP output format, compression ratio, dimension constraints, and filename patterns'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: '20px' }}>
        {/* Output Format */}
        <div className="form-group">
          <label className="form-label">{t.outputFormat}</label>
          <select
            className="form-select"
            value={prefs.format}
            disabled={isProcessing}
            aria-label={t.outputFormat}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                format: e.target.value as ConversionPreferences['format'],
              }))
            }
          >
            <option value="webp">WEBP (Recommended - Max Speed & Smallest Size)</option>
            <option value="png">PNG (Lossless & High Quality)</option>
            <option value="jpeg">JPEG (Standard Compatibility)</option>
          </select>
        </div>

        {/* Compression Quality */}
        <div className="form-group">
          <div className="form-label">
            <span>{t.compressionQuality}</span>
            <span className="slider-val-badge">{prefs.quality}%</span>
          </div>
          <div className="range-slider-wrapper">
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={prefs.quality}
              disabled={isProcessing}
              aria-label={t.compressionQuality}
              aria-valuemin={1}
              aria-valuemax={100}
              aria-valuenow={prefs.quality}
              className="range-slider"
              onChange={(e) =>
                setPrefs((p) => ({ ...p, quality: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        {/* Naming Pattern */}
        <div className="form-group">
          <label className="form-label">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={15} />
              {t.namingPattern}
            </span>
          </label>
          <select
            className="form-select"
            value={prefs.namingPattern}
            disabled={isProcessing}
            aria-label={t.namingPattern}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                namingPattern: e.target.value as ConversionPreferences['namingPattern'],
              }))
            }
          >
            <option value="original">Keep Original Filename ({'{name}.webp'})</option>
            <option value="kebab">Clean Kebab-Case ({'{clean-name}.webp'})</option>
            <option value="seo-slug">SEO Keyword Slug ({'{name}-seo-optimized.webp'})</option>
            <option value="custom">Custom Prefix & Suffix</option>
          </select>
        </div>
      </div>

      {/* Custom Prefix & Suffix Fields */}
      {prefs.namingPattern === 'custom' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '8px',
            padding: '16px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t.customPrefix}</label>
            <input
              type="text"
              className="form-input"
              disabled={isProcessing}
              placeholder="e.g., store-brand"
              value={prefs.prefix}
              onChange={(e) => setPrefs((p) => ({ ...p, prefix: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t.customSuffix}</label>
            <input
              type="text"
              className="form-input"
              disabled={isProcessing}
              placeholder="e.g., 2026-edition"
              value={prefs.suffix}
              onChange={(e) => setPrefs((p) => ({ ...p, suffix: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Resize Constraints */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <input
            type="checkbox"
            id="resizeToggle"
            checked={prefs.resizeEnabled}
            disabled={isProcessing}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, resizeEnabled: e.target.checked }))
            }
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
          />
          <label
            htmlFor="resizeToggle"
            style={{ fontWeight: 600, fontSize: '0.92rem', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Maximize2 size={16} />
            {t.enableResize}
          </label>
        </div>

        {prefs.resizeEnabled && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
              gap: '16px',
              padding: '16px',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.maxWidth}</label>
              <input
                type="number"
                min={100}
                max={8000}
                className="form-input"
                disabled={isProcessing}
                value={prefs.maxWidth || ''}
                placeholder="1920"
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, maxWidth: Number(e.target.value) }))
                }
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t.maxHeight}</label>
              <input
                type="number"
                min={100}
                max={8000}
                className="form-input"
                disabled={isProcessing}
                value={prefs.maxHeight || ''}
                placeholder="1080"
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, maxHeight: Number(e.target.value) }))
                }
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-end', height: '42px' }}>
              <input
                type="checkbox"
                id="aspectRatio"
                checked={prefs.preserveAspectRatio}
                disabled={isProcessing}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, preserveAspectRatio: e.target.checked }))
                }
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary-blue)', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="aspectRatio" style={{ fontSize: '0.85rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}>
                {t.preserveAspect}
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
