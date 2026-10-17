'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePixelSeo } from '@/context/PixelSeoContext';
import {
  Layers,
  Sparkles,
  Sliders,
  Stamp,
  FileSpreadsheet,
  Archive,
  Download,
  Trash2,
  ArrowRight,
  Minimize2,
} from 'lucide-react';

export const SessionQueueBanner: React.FC = () => {
  const {
    items,
    isProcessing,
    handleConvertAll,
    handleDownloadZip,
    handleExportCsv,
    handleClearAll,
    lang,
  } = usePixelSeo();
  const pathname = usePathname();

  if (items.length === 0) return null;

  const completedCount = items.filter((it) => it.status === 'done').length;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--primary-blue)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
          }}
        >
          <Layers size={18} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'সক্রিয় সেশন কিউ' : 'Active Session Queue'}:
            </span>
            <span className="badge badge-primary" style={{ fontWeight: 700 }}>
              {items.length} / 100 {lang === 'bn' ? 'ছবি' : 'Images'}
            </span>
            {completedCount > 0 && (
              <span className="badge badge-success" style={{ fontWeight: 600 }}>
                {completedCount} {lang === 'bn' ? 'কনভার্ট হয়েছে' : 'Converted'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            {lang === 'bn'
              ? 'ব্রাউজার ট্যাবে ছবিগুলো সংরক্ষিত আছে — যেকোনো পেজে গিয়ে এডিটিং ও এক্সপোর্ট করুন।'
              : 'Preserved in active browser session. Access your images across any tool page without re-uploading.'}
          </p>
        </div>
      </div>

      {/* Cross-Tool Quick Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Link
          href="/tools/image-converter"
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: pathname === '/tools/image-converter' ? 'var(--primary-blue)' : undefined,
            color: pathname === '/tools/image-converter' ? 'var(--primary-blue)' : undefined,
          }}
        >
          <Sliders size={14} />
          <span>{lang === 'bn' ? 'কনভার্টার' : 'Converter'}</span>
        </Link>

        <Link
          href="/tools/watermark"
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: pathname === '/tools/watermark' ? 'var(--primary-blue)' : undefined,
            color: pathname === '/tools/watermark' ? 'var(--primary-blue)' : undefined,
          }}
        >
          <Stamp size={14} />
          <span>{lang === 'bn' ? 'ওয়াটারমার্ক' : 'Watermark'}</span>
        </Link>

        <Link
          href="/tools/image-compressor"
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: pathname === '/tools/image-compressor' ? 'var(--primary-blue)' : undefined,
            color: pathname === '/tools/image-compressor' ? 'var(--primary-blue)' : undefined,
          }}
        >
          <Minimize2 size={14} />
          <span>{lang === 'bn' ? 'কম্প্রেসর' : 'Compressor'}</span>
        </Link>

        <Link
          href="/tools/csv-export"
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: pathname === '/tools/csv-export' ? 'var(--primary-blue)' : undefined,
            color: pathname === '/tools/csv-export' ? 'var(--primary-blue)' : undefined,
          }}
        >
          <FileSpreadsheet size={14} />
          <span>{lang === 'bn' ? 'সিএসভি' : 'CSV'}</span>
        </Link>

        <Link
          href="/tools/seo-generator"
          className="btn btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderColor: pathname === '/tools/seo-generator' ? 'var(--primary-blue)' : undefined,
            color: pathname === '/tools/seo-generator' ? 'var(--primary-blue)' : undefined,
          }}
        >
          <Sparkles size={14} />
          <span>{lang === 'bn' ? 'এসইও' : 'SEO'}</span>
        </Link>

        {completedCount > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadZip}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>ZIP</span>
          </button>
        )}

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleClearAll}
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          title={lang === 'bn' ? 'কিউ খালি করুন' : 'Clear Queue'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
