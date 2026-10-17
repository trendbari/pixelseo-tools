'use client';

import React from 'react';
import { AppLanguage } from '@/types';
import { translations } from '@/locales/dictionary';
import { ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface BenefitsSectionProps {
  lang: AppLanguage;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ lang }) => {
  const t = translations[lang];

  const benefits = [
    {
      title: t.benefitPrivacyTitle,
      desc: t.benefitPrivacyDesc,
      icon: <ShieldCheck size={28} />,
      badge: 'Zero Server Logs',
      points: [
        'Browser-memory sandbox execution',
        'Confidential e-commerce catalogs safe',
        'No cookies or tracking trackers',
      ],
      pointsBn: [
        'ব্রাউজার মেমোরির ভেতর সুরক্ষিত প্রসেসিং',
        'গোপন প্রোডাক্ট ফটো ও লোগো সুরক্ষিত',
        'কোনো কুকি বা ট্র্যাকিং স্ক্রিপ্ট নেই',
      ],
    },
    {
      title: t.benefitSpeedTitle,
      desc: t.benefitSpeedDesc,
      icon: <Zap size={28} />,
      badge: 'Hardware Accelerated',
      points: [
        'Instant Canvas & WebGL pipeline',
        'Zero network upload/download lag',
        'Converts 100 images in seconds',
      ],
      pointsBn: [
        'ক্যানভাস ও ওয়েবজিএল স্পিড ইঞ্জিন',
        'সার্ভার আপলোডের কোনো বিলম্ব নেই',
        'মুহূর্তেই ১০০টি ছবি অপ্টিমাইজড',
      ],
    },
    {
      title: t.benefitFreeTitle,
      desc: t.benefitFreeDesc,
      icon: <Sparkles size={28} />,
      badge: 'Unrestricted Access',
      points: [
        'No registration or account needed',
        'No hidden paywalls or watermark stamps',
        '100% Free & Open Source MIT',
      ],
      pointsBn: [
        'কোনো সাইন-আপ বা লগইন প্রয়োজন নেই',
        'কোনো লুকায়িত সাবস্ক্রিপশন ফি নেই',
        'এমআইটি লাইসেন্সে চিরদিনের জন্য ফ্রি',
      ],
    },
  ];

  return (
    <section className="section-block" id="benefits" style={{ padding: '48px 0 24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {t.benefitsTitle}
        </h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '8px auto 0 auto' }}>
          {t.benefitsSubtitle}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {benefits.map((b, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              padding: '32px 26px',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-blue-light)',
                  color: 'var(--primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {b.icon}
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                {b.badge}
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
              {b.title}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {b.desc}
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(lang === 'bn' ? b.pointsBn : b.points).map((pt, pIdx) => (
                <li
                  key={pIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <CheckCircle2 size={15} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};
