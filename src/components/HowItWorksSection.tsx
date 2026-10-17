'use client';

import React from 'react';
import { AppLanguage } from '@/types';
import { translations } from '@/locales/dictionary';
import { UploadCloud, Sliders, Zap, DownloadCloud } from 'lucide-react';

interface HowItWorksSectionProps {
  lang: AppLanguage;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ lang }) => {
  const t = translations[lang];

  const steps = [
    {
      num: '01',
      title: t.step1Title,
      desc: t.step1Desc,
      icon: <UploadCloud size={24} />,
      color: '#2563EB',
    },
    {
      num: '02',
      title: t.step2Title,
      desc: t.step2Desc,
      icon: <Sliders size={24} />,
      color: '#10B981',
    },
    {
      num: '03',
      title: t.step3Desc ? t.step3Title : '3. Convert in Browser',
      desc: t.step3Desc,
      icon: <Zap size={24} />,
      color: '#F59E0B',
    },
    {
      num: '04',
      title: t.step4Title,
      desc: t.step4Desc,
      icon: <DownloadCloud size={24} />,
      color: '#8B5CF6',
    },
  ];

  return (
    <section className="section-block" id="how-it-works" style={{ padding: '48px 0 24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {t.howItWorksTitle}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          {t.howItWorksSubtitle}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          position: 'relative',
        }}
      >
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              padding: '28px 24px',
            }}
          >
            {/* Step Watermark Number */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                fontSize: '2.4rem',
                fontWeight: 900,
                color: 'var(--border-subtle)',
                userSelect: 'none',
                opacity: 0.6,
              }}
            >
              {step.num}
            </div>

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card-subtle)',
                color: step.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px',
              }}
            >
              {step.icon}
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {step.title}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
