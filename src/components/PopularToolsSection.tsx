'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { translations } from '@/locales/dictionary';
import {
  Sliders,
  Stamp,
  FileSpreadsheet,
  Minimize2,
  Sparkles,
  Archive,
  ArrowRight,
} from 'lucide-react';

export const PopularToolsSection: React.FC = () => {
  const { lang } = usePixelSeo();
  const t = translations[lang];

  const tools = [
    {
      href: '/tools/image-converter',
      title: t.toolWebpTitle,
      desc: t.toolWebpDesc,
      icon: <Sliders size={24} />,
      color: '#2563EB',
      badge: 'Batch 100 Files',
    },
    {
      href: '/tools/watermark',
      title: t.toolWatermarkTitle,
      desc: t.toolWatermarkDesc,
      icon: <Stamp size={24} />,
      color: '#10B981',
      badge: 'Logo + Text',
    },
    {
      href: '/tools/image-compressor',
      title: t.toolCompressorTitle,
      desc: t.toolCompressorDesc,
      icon: <Minimize2 size={24} />,
      color: '#8B5CF6',
      badge: 'Up to 85% Savings',
    },
    {
      href: '/tools/seo-generator',
      title: t.toolSeoTitle,
      desc: t.toolSeoDesc,
      icon: <Sparkles size={24} />,
      color: '#F59E0B',
      badge: 'Bangla + English NLP',
    },
    {
      href: '/tools/csv-export',
      title: t.toolCsvTitle,
      desc: t.toolCsvDesc,
      icon: <FileSpreadsheet size={24} />,
      color: '#059669',
      badge: 'RFC 4180 BOM',
    },
    {
      href: '/tools/image-converter',
      title: t.toolZipTitle,
      desc: t.toolZipDesc,
      icon: <Archive size={24} />,
      color: '#0EA5E9',
      badge: 'Manifest Included',
    },
  ];

  return (
    <section className="section-block" id="popular-tools" style={{ padding: '48px 0 24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {t.popularToolsTitle}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          {t.popularToolsSubtitle}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {tools.map((tool, idx) => (
          <Link
            key={idx}
            href={tool.href}
            className="card tool-feature-card"
            style={{
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'all 200ms ease',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: 'var(--radius-md)',
                    background: `rgba(37, 99, 235, 0.08)`,
                    color: tool.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {tool.icon}
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  {tool.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {tool.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {tool.desc}
              </p>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--primary-blue)',
              }}
            >
              <span>{t.launchToolBtn}</span>
              <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
