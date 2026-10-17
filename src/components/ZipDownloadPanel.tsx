'use client';

import React from 'react';
import { AppLanguage, ProcessedImageItem } from '@/types';
import { translations } from '@/locales/dictionary';
import { estimateZipMemoryUsage } from '@/lib/zipExporter';
import { Download, Archive, AlertTriangle, ShieldCheck, FileText, Folder, FileCode2, Layers } from 'lucide-react';

interface ZipDownloadPanelProps {
  lang: AppLanguage;
  items: ProcessedImageItem[];
  onDownloadZip: () => void;
  onDownloadBatches?: () => void;
  zipProgress: number | null;
  isProcessing: boolean;
}

export const ZipDownloadPanel: React.FC<ZipDownloadPanelProps> = ({
  lang,
  items,
  onDownloadZip,
  onDownloadBatches,
  zipProgress,
  isProcessing,
}) => {
  const t = translations[lang];
  const memEstimate = estimateZipMemoryUsage(items);
  const completedCount = memEstimate.validCount;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon-box" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}>
            <Archive size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'জিপ (ZIP) প্যাকেজ ডাউনলোড' : 'ZIP Bundle Packaging'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'স্ট্রাকচার্ড ডিরেক্টরি (images/, metadata/, README.txt) সহ নির্ভরযোগ্য ডাউনলোড'
                : 'Download converted images alongside metadata CSV & README manifest in a clean ZIP directory'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* If High Memory: Offer Smaller-Batch Export */}
          {memEstimate.isHighMemory && onDownloadBatches && (
            <button
              className="btn btn-primary"
              onClick={onDownloadBatches}
              disabled={isProcessing || completedCount === 0 || zipProgress !== null}
              style={{
                padding: '10px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                borderColor: '#059669',
              }}
              title="Downloads safely in smaller batches to prevent browser memory limit tab crashes"
            >
              <Layers size={17} />
              <span>
                {lang === 'bn'
                  ? `ছোট ব্যাচে ডাউনলোড (${memEstimate.totalBatches}টি পার্ট)`
                  : `Export in Batches (${memEstimate.totalBatches} parts)`}
              </span>
            </button>
          )}

          {/* Standard Single ZIP Download Button */}
          <button
            className={`btn ${memEstimate.isHighMemory ? 'btn-secondary' : 'btn-primary'}`}
            onClick={onDownloadZip}
            disabled={isProcessing || completedCount === 0 || zipProgress !== null}
            style={{ padding: '10px 20px', fontSize: '0.95rem', fontWeight: 700 }}
          >
            <Download size={18} />
            <span>
              {zipProgress !== null
                ? `${lang === 'bn' ? 'জিপ তৈরি হচ্ছে...' : 'Compressing ZIP...'} ${zipProgress}%`
                : memEstimate.isHighMemory
                ? (lang === 'bn' ? 'একক জিপে ডাউনলোড' : 'Download Single ZIP')
                : 'Download pixelseo-export.zip'}
            </span>
          </button>
        </div>
      </div>

      {/* Memory Budget Warning Banner if High Memory */}
      {memEstimate.isHighMemory && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '3px' }}>
              {lang === 'bn'
                ? `বড় আর্কাইভ মেমোরি সতর্কতা (${memEstimate.formattedTotal} পে-লোড)`
                : `High Archive Memory Alert (${memEstimate.formattedTotal} total payload)`}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {lang === 'bn'
                ? `একসঙ্গে ${completedCount}টি বড় ছবি একক জিপে প্যাক করার সময় ব্রাউজারের মেমোরি সীমা (RAM budget) অতিক্রম করার ঝুঁকি রয়েছে। ক্র্যাশ এড়াতে "ছোট ব্যাচে ডাউনলোড (${memEstimate.totalBatches}টি পার্ট)" বাটনটি ব্যবহার করার পরামর্শ দেওয়া হচ্ছে।`
                : `Packaging ${completedCount} images into a single large ZIP in-memory may strain browser RAM limits. To guarantee zero crashes, downloading in smaller sequential parts (${memEstimate.suggestedBatchSize} images/part) is recommended.`}
            </div>
          </div>
        </div>
      )}

      {/* Corrupted Output Safeguard Notice */}
      {memEstimate.corruptedCount > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <ShieldCheck size={16} style={{ color: '#10B981' }} />
          <span>
            {lang === 'bn'
              ? `${memEstimate.corruptedCount}টি অসম্পূর্ণ বা ত্রুটিপূর্ণ ছবি স্বয়ংক্রিয়ভাবে বাদ দিয়ে শুধুমাত্র বৈধ WebP ছবিগুলো জিপে রাখা হয়েছে।`
              : `${memEstimate.corruptedCount} corrupted/failed items were safely excluded; only valid outputs are archived.`}
          </span>
        </div>
      )}

      {/* Progress bar if active */}
      {zipProgress !== null && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
            <span>Packaging archive with STORE compression for WebP</span>
            <span style={{ fontWeight: 700 }}>{zipProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${zipProgress}%`,
                height: '100%',
                background: 'var(--primary-blue)',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Structured ZIP Directory Visual Box */}
      <div
        style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-md)',
          padding: '18px',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
          ZIP Archive Structure (pixelseo-export.zip)
        </div>
        <pre
          style={{
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.86rem',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            margin: 0,
            overflowX: 'auto',
          }}
        >{`pixelseo-export.zip
├── images/
│   ├── image-001.webp
│   ├── image-002.webp
│   └── image-003.webp (${completedCount} valid WebP files)
├── metadata/
│   └── image-metadata.csv (13-column ImageCsvRecord contract)
└── README.txt (Import guide for Shopify & WooCommerce)`}</pre>
      </div>

      {/* Package Contents Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Folder size={22} style={{ color: 'var(--primary-blue)', marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>images/</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {completedCount} converted WebP files (corrupted outputs strictly excluded)
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <FileText size={22} style={{ color: '#10B981', marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>metadata/image-metadata.csv</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              RFC 4180 compliant CSV conforming to ImageCsvRecord with UTF-8 BOM
            </div>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <FileCode2 size={22} style={{ color: '#F59E0B', marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>README.txt</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Shopify, WooCommerce, and Google Image Search import instructions & manifest
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZipDownloadPanel;
