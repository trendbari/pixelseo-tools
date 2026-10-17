'use client';

import React, { useState } from 'react';
import { AppLanguage } from '@/types';
import { translations } from '@/locales/dictionary';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqSectionProps {
  lang: AppLanguage;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: t.faq1Q,
      a: t.faq1A,
      tag: 'Format',
    },
    {
      q: t.faq2Q,
      a: t.faq2A,
      tag: 'Watermark',
    },
    {
      q: t.faq3Q,
      a: t.faq3A,
      tag: 'File Size & Limits',
    },
    {
      q: t.faq4Q,
      a: t.faq4A,
      tag: 'Privacy & Security',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="section-block" id="faq" style={{ padding: '48px 0 36px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {t.faqTitle}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          {t.faqSubtitle}
        </p>
      </div>

      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="card"
              style={{
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                border: isOpen ? '1px solid var(--primary-blue)' : '1px solid var(--border-subtle)',
              }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {faq.tag}
                  </span>
                  <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {faq.q}
                  </h3>
                </div>

                <div
                  style={{
                    color: 'var(--text-secondary)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                    flexShrink: 0,
                  }}
                >
                  <ChevronDown size={20} />
                </div>
              </div>

              {isOpen && (
                <div
                  style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
