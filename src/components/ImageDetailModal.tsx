'use client';

import React, { useState } from 'react';
import { AppLanguage, ProcessedImageItem, ConversionPreferences } from '@/types';
import { translations } from '@/locales/dictionary';
import { formatOutputFilename } from '@/lib/imageProcessor';
import { X, Download, Eye, FileText, Check } from 'lucide-react';

interface ImageDetailModalProps {
  item: ProcessedImageItem | null;
  onClose: () => void;
  lang: AppLanguage;
  convPrefs: ConversionPreferences;
}

export const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  item,
  onClose,
  lang,
  convPrefs,
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'converted' | 'original'>('converted');

  if (!item) return null;

  const formattedName = formatOutputFilename(item.name, convPrefs, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = () => {
    if (!item.convertedUrl) return;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = formattedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.name}</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)' }}>
              ➔ {formattedName}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`btn ${viewMode === 'converted' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setViewMode('converted')}
            disabled={!item.convertedUrl}
          >
            Optimized {convPrefs.format.toUpperCase()}
          </button>
          <button
            type="button"
            className={`btn ${viewMode === 'original' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
            onClick={() => setViewMode('original')}
          >
            Original File
          </button>
        </div>

        {/* Image Preview Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '380px',
            background: '#0B1120',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: '20px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewMode === 'converted' && item.convertedUrl ? item.convertedUrl : item.previewUrl}
            alt={item.seo.alt || item.name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Original Size</div>
            <div style={{ fontWeight: 700 }}>{formatSize(item.originalSize)}</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Optimized Size</div>
            <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
              {item.convertedSize ? formatSize(item.convertedSize) : 'Not converted yet'}
            </div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Resolution</div>
            <div style={{ fontWeight: 700 }}>
              {item.convertedWidth || item.originalWidth} × {item.convertedHeight || item.originalHeight} px
            </div>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Bandwidth Saved</div>
            <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
              {item.convertedSize
                ? `${Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)}%`
                : '0%'}
            </div>
          </div>
        </div>

        {/* SEO Data Inspection */}
        <div style={{ padding: '16px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>SEO Meta Title: </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.seo.title || '-'}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Image Alt Text: </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.seo.alt || '-'}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Description: </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.seo.description || '-'}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Keywords: </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--primary-blue)' }}>{item.seo.keywords.join(', ') || '-'}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!item.convertedUrl}
          >
            <Download size={16} />
            <span>Download {convPrefs.format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
