'use client';

import React from 'react';
import { AppLanguage, ProcessedImageItem, ConversionPreferences, WatermarkPreferences } from '@/types';
import { translations } from '@/locales/dictionary';
import { formatOutputFilename } from '@/lib/imageProcessor';
import { FileSpreadsheet, Download, ShieldCheck, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CsvExportPanelProps {
  lang: AppLanguage;
  items: ProcessedImageItem[];
  convPrefs: ConversionPreferences;
  wmPrefs?: WatermarkPreferences;
  onExportCsv: () => void;
}

export const CsvExportPanel: React.FC<CsvExportPanelProps> = ({
  lang,
  items,
  convPrefs,
  wmPrefs,
  onExportCsv,
}) => {
  const t = translations[lang];

  const isWatermarkApplied = Boolean(
    wmPrefs?.enabled && (wmPrefs.type === 'text' ? Boolean(wmPrefs.text) : true)
  );

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon-box" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'সিএসভি মেটাডেটা ও ফাইল ডিটেইলস' : 'CSV Metadata & File Details'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'ছবির তথ্য, ওয়াটারমার্ক স্ট্যাটাস এবং SEO ডেটা সমৃদ্ধ স্প্রেডশীট এক্সপোর্ট'
                : 'Export complete metadata, watermark status, Alt text, and SEO keywords for e-commerce'}
            </p>
          </div>
        </div>

        <button
          className="btn btn-success"
          onClick={onExportCsv}
          disabled={items.length === 0}
          style={{ padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <Download size={18} />
          <span>{t.exportCsv}</span>
        </button>
      </div>

      {items.length > 0 ? (
        <>
          {/* Wireframe Preview Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>original_filename</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>output_filename</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>size_bytes (orig → out)</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>quality</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>watermark_applied</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>alt_text</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>status</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 6).map((item, idx) => {
                  const optName = formatOutputFilename(item.name, convPrefs, idx);
                  const statusLabel =
                    item.status === 'done'
                      ? 'completed'
                      : item.status === 'error'
                      ? 'failed'
                      : 'ready';

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--bg-card-subtle)',
                      }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--primary-blue)', fontWeight: 600 }}>
                        {optName}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {item.originalSize} → {item.convertedSize ?? '-'} B
                      </td>
                      <td style={{ padding: '10px 12px' }}>{convPrefs.quality}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span className={`badge ${isWatermarkApplied ? 'badge-success' : 'badge-primary'}`}>
                          {String(isWatermarkApplied)}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.seo.alt || `"${item.name.replace(/\.[^.]+$/, '')}"`}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          className={`badge ${
                            item.status === 'done'
                              ? 'badge-success'
                              : item.status === 'error'
                              ? 'badge-warning'
                              : 'badge-primary'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {items.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing first 6 of {items.length} items. The full CSV export contains all {items.length} records.
            </div>
          )}

          {/* Security & Encoding Specifications Banner */}
          <div
            style={{
              marginTop: '18px',
              padding: '14px 18px',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>
              <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
              <span>CSV Security & Specification Conformance:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              <div>
                • <strong>UTF-8 BOM Encoded:</strong> Ensures Bengali (বাংলা) and international Unicode text render flawlessly in Microsoft Excel.
              </div>
              <div>
                • <strong>Formula Injection Defense (CWE-1236):</strong> All inputs starting with <code>=</code>, <code>+</code>, <code>-</code>, or <code>@</code> are safely sanitized.
              </div>
              <div>
                • <strong>ImageCsvRecord Schema (13 Columns):</strong> original_filename, output_filename, original_size_bytes, output_size_bytes, width, height, quality, watermark_applied, alt_text, seo_title, meta_description, keywords, status.
              </div>
              <div>
                • <strong>Failed Status Logging:</strong> Logs failed files with error reasons alongside completed images.
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
          <FileSpreadsheet size={40} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
          <p>{t.emptyNotice}</p>
        </div>
      )}
    </div>
  );
};
