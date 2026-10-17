'use client';

import React, { useState } from 'react';
import { AppLanguage, ProcessedImageItem, ConversionPreferences } from '@/types';
import { translations } from '@/locales/dictionary';
import { formatOutputFilename } from '@/lib/imageProcessor';
import {
  Download,
  Trash2,
  Maximize2,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  Clock,
  RotateCcw,
  Tag,
  FileText,
} from 'lucide-react';

interface ImageCardProps {
  item: ProcessedImageItem;
  lang: AppLanguage;
  convPrefs: ConversionPreferences;
  onRemove: (id: string) => void;
  onPreview: (item: ProcessedImageItem) => void;
  onUpdateSeo: (id: string, alt: string, title: string) => void;
  onRetry?: (id: string) => void;
  uniqueOutputName?: string;
  index: number;
  isProcessing?: boolean;
}

const ImageCardComponent: React.FC<ImageCardProps> = ({
  item,
  lang,
  convPrefs,
  onRemove,
  onPreview,
  onUpdateSeo,
  onRetry,
  uniqueOutputName,
  index,
  isProcessing = false,
}) => {
  const t = translations[lang];
  const [altText, setAltText] = useState(item.seo.alt);
  const [metaTitle, setMetaTitle] = useState(item.seo.title);
  const [isEditingSeo, setIsEditingSeo] = useState(false);

  const formattedName = uniqueOutputName || formatOutputFilename(item.name, convPrefs, index);
  const isDuplicateResolved = uniqueOutputName && uniqueOutputName !== formatOutputFilename(item.name, convPrefs, index);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const savedPct =
    item.convertedSize && item.originalSize > item.convertedSize
      ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
      : null;

  const handleDownloadSingle = () => {
    if (!item.convertedUrl || isProcessing) return;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = formattedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveSeo = () => {
    onUpdateSeo(item.id, altText, metaTitle);
    setIsEditingSeo(false);
  };

  return (
    <div className="image-card" data-testid={`image-card-${item.id}`}>
      {/* Thumbnail Area */}
      <div
        className="image-preview-area"
        role="button"
        tabIndex={0}
        aria-label={lang === 'bn' ? `${item.name} এর প্রিভিউ দেখুন` : `Preview ${item.name}`}
        onClick={() => onPreview(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPreview(item);
          }
        }}
      >
        <img
          src={item.convertedUrl || item.thumbnailUrl || item.previewUrl}
          alt={item.seo.alt || item.name}
          className="image-preview-img"
          loading="lazy"
          decoding="async"
        />

        {/* Status Tag */}
        <div className="image-status-tag">
          {item.isStale && (
            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <RotateCcw size={12} /> {lang === 'bn' ? 'পুনরায় কনভার্ট প্রয়োজন' : 'Needs Re-convert'}
            </span>
          )}
          {!item.isStale && item.status === 'done' && (
            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> {lang === 'bn' ? 'সম্পন্ন (WEBP)' : 'Ready (WEBP)'}
            </span>
          )}
          {item.status === 'processing' && (
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={12} className="animate-spin" />
              {item.stage === 'decoding'
                ? (lang === 'bn' ? 'ডিকোড... ২৫%' : 'Decoding... 25%')
                : item.stage === 'resizing'
                ? (lang === 'bn' ? 'রিসাইজ... ৫০%' : 'Resizing... 50%')
                : item.stage === 'watermarking'
                ? (lang === 'bn' ? 'ওয়াটারমার্ক... ৭৫%' : 'Watermarking... 75%')
                : item.stage === 'encoding'
                ? (lang === 'bn' ? 'এনকোড... ৯০%' : 'Encoding... 90%')
                : (lang === 'bn' ? 'প্রসেসিং...' : 'Processing...')}
            </span>
          )}
          {item.status === 'error' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }} title={item.errorMessage}>
                <AlertCircle size={12} /> {lang === 'bn' ? 'ব্যর্থ' : 'Failed'}
              </span>
              {onRetry && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetry(item.id);
                  }}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.7rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    borderRadius: '4px',
                  }}
                  title={lang === 'bn' ? 'ছবিটি পুনরায় চেষ্টা করুন' : 'Retry conversion'}
                  aria-label={`Retry ${item.name}`}
                >
                  <RotateCcw size={10} />
                  <span>{lang === 'bn' ? 'চেষ্টা' : 'Retry'}</span>
                </button>
              )}
            </div>
          )}
          {item.status === 'cancelled' && (
            <span className="badge badge-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={12} /> {lang === 'bn' ? 'বাতিল' : 'Cancelled'}
            </span>
          )}
          {!item.isStale && item.status === 'idle' && (
            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
              <Clock size={12} /> {item.stage === 'queued' ? (lang === 'bn' ? 'অপেক্ষমাণ' : 'Queued') : (lang === 'bn' ? 'প্রস্তুত' : 'Ready')}
            </span>
          )}
        </div>

        {/* Stage Progress Bar on Preview Thumbnail */}
        {item.status === 'processing' && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: 'rgba(0,0,0,0.35)', zIndex: 2 }}>
            <div
              style={{
                height: '100%',
                width: `${item.progress || 25}%`,
                background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                transition: 'width 250ms ease',
              }}
            />
          </div>
        )}

        {/* Action icons on preview */}
        <button
          type="button"
          className="btn-icon"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(item);
          }}
          style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(15, 23, 42, 0.7)', color: '#fff', border: 'none' }}
          title={t.actionPreview}
          aria-label={lang === 'bn' ? `${item.name} পরীক্ষা করুন` : `Inspect ${item.name}`}
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Card Content */}
      <div className="image-card-body">
        <div>
          <div className="image-filename" title={item.name}>
            {item.name}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--primary-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>➔ {formattedName}</span>
            {isDuplicateResolved && (
              <span
                className="badge badge-secondary"
                style={{ fontSize: '0.68rem', marginLeft: '6px' }}
                title={
                  lang === 'bn'
                    ? 'একই নামের ফাইল থাকায় অনন্য নাম দেওয়া হয়েছে'
                    : 'Unique output name assigned to prevent ZIP file collision'
                }
              >
                {lang === 'bn' ? 'অনন্য নাম' : 'Unique Name'}
              </span>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="image-meta-row">
          <span>
            {formatSize(item.originalSize)}
            {item.convertedSize ? ` → ${formatSize(item.convertedSize)}` : ''}
          </span>
          {savedPct !== null && (
            <span className="savings-pill">-{savedPct}%</span>
          )}
        </div>

        {/* Dimensions */}
        <div className="image-meta-row" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          <span>
            {item.originalWidth > 0 ? `${item.originalWidth} × ${item.originalHeight} px` : 'Analyzing...'}
          </span>
          <span>{convPrefs.format.toUpperCase()}</span>
        </div>

        {/* Failure Error Message Notice (Requirement 4) */}
        {(item.status === 'error' || item.stage === 'failed') && item.errorMessage && (
          <div
            className="image-error-notice"
            style={{
              fontSize: '0.74rem',
              color: 'var(--color-error)',
              backgroundColor: 'var(--color-error-bg)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              wordBreak: 'break-word',
              lineHeight: 1.35,
            }}
            role="alert"
          >
            <strong>{lang === 'bn' ? 'ব্যর্থতার কারণ: ' : 'Error: '}</strong>
            {item.errorMessage}
          </div>
        )}

        {/* SEO Metadata preview or inline edit */}
        <div style={{ marginTop: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
          {!isEditingSeo ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Alt Text:</span>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setIsEditingSeo(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isProcessing ? 'var(--text-muted)' : 'var(--primary-blue)',
                    fontSize: '0.72rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                  aria-label={`Edit SEO for ${item.name}`}
                >
                  Edit SEO
                </button>
              </div>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic', marginTop: '2px' }}>
                {item.seo.alt || 'No alt text set'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                disabled={isProcessing}
                style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                placeholder="Alt Text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                aria-label={`Alt text for ${item.name}`}
              />
              <input
                type="text"
                className="form-input"
                disabled={isProcessing}
                style={{ padding: '6px 8px', fontSize: '0.78rem' }}
                placeholder="SEO Title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                aria-label={`SEO title for ${item.name}`}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isProcessing}
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  onClick={() => setIsEditingSeo(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isProcessing}
                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                  onClick={handleSaveSeo}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="image-card-actions">
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, padding: '7px 12px', fontSize: '0.82rem' }}
            disabled={!item.convertedUrl || isProcessing}
            onClick={handleDownloadSingle}
            aria-label={lang === 'bn' ? `${item.name} ডাউনলোড করুন` : `Download ${formattedName}`}
          >
            <Download size={14} />
            <span>{t.actionDownload}</span>
          </button>

          <button
            type="button"
            className="btn-icon"
            disabled={isProcessing}
            onClick={() => onRemove(item.id)}
            title={t.actionRemove}
            aria-label={lang === 'bn' ? `${item.name} মুছে ফেলুন` : `Remove ${item.name}`}
            style={{
              color: isProcessing ? 'var(--text-muted)' : 'var(--color-error)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Optimization 8: React.memo prevents unnecessary re-rendering of 100 cards during batch queue progress updates
export const ImageCard = React.memo(ImageCardComponent);

