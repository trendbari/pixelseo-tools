'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { translations } from '@/locales/dictionary';
import { Sparkles, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { lang } = usePixelSeo();
  const t = translations[lang];

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        padding: '52px 0 36px 0',
        transition: 'background-color var(--transition-normal)',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* About Column */}
          <div>
            <Link href="/" className="brand-wrapper" style={{ marginBottom: '14px', textDecoration: 'none' }}>
              <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
                <Sparkles size={18} />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t.appTitle}
              </span>
              <span className="brand-version">v3.1</span>
            </Link>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
              {t.footerAboutDesc}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--color-success)' }}>
              <Shield size={14} />
              <span>{lang === 'bn' ? '১০০% ক্লায়েন্ট-সাইড প্রাইভেসি গ্যারান্টি' : '100% Client-Side Privacy Guaranteed'}</span>
            </div>
          </div>

          {/* Tools Suite Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'টুলকিট মডিউল' : 'Optimization Tools'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <li>
                <Link href="/tools/image-converter" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'WEBP কনভার্টার (১০০ ফাইল)' : 'Bulk WEBP Converter (100 Files)'}
                </Link>
              </li>
              <li>
                <Link href="/tools/watermark" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'ওয়াটারমার্ক স্টুডিও' : 'Watermark Studio'}
                </Link>
              </li>
              <li>
                <Link href="/tools/image-compressor" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'ইমেজ কম্প্রেসর' : 'Image Compressor'}
                </Link>
              </li>
              <li>
                <Link href="/tools/csv-export" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'সিএসভি মেটাডেটা টুল' : 'CSV Metadata Tool'}
                </Link>
              </li>
              <li>
                <Link href="/tools/seo-generator" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'এসইও কনটেন্ট স্টুডিও' : 'SEO Content Studio (Bangla + EN)'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Platform Links */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              {t.footerQuickLinks}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <li>
                <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'হোমপেইজ' : 'Homepage'}
                </Link>
              </li>
              <li>
                <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Platform'}
                </Link>
              </li>
              <li>
                <Link href="/faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {t.navFaq}
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {lang === 'bn' ? 'যোগাযোগ ও ফিডব্যাক' : 'Contact & Feedback'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              {t.footerLegal}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <li>
                <Link href="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {t.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {t.termsOfService}
                </Link>
              </li>
              <li>
                <Link href="/contact" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  {t.contactSupport}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Guarantee */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            {t.copyright}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Built with local browser Canvas processing</span>
            <span>•</span>
            <span>Zero server upload</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
