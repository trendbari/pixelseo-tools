'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { translations } from '@/locales/dictionary';
import {
  Sparkles,
  Moon,
  Sun,
  Globe,
  ShieldCheck,
  Menu,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, setTheme, lang, setLang, items } = usePixelSeo();
  const t = translations[lang];
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="container header-inner">
        {/* Brand Logo */}
        <Link href="/" className="brand-wrapper">
          <div className="brand-icon-box">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="brand-title">
              <span>{t.appTitle}</span>
              <span className="brand-version">v3.1</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {lang === 'bn' ? 'ইমেজ ও এসইও টুলকিট' : 'Image & SEO Toolkit'}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            href="/"
            className="nav-link-btn"
            style={{
              color: pathname === '/' ? 'var(--primary-blue)' : undefined,
              fontWeight: pathname === '/' ? 700 : 500,
            }}
          >
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>

          {/* Tools Menu with Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setToolsDropdownOpen(true)}
            onMouseLeave={() => setToolsDropdownOpen(false)}
          >
            <Link
              href="/tools/image-converter"
              className="nav-link-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: pathname.startsWith('/tools') ? 'var(--primary-blue)' : undefined,
                fontWeight: pathname.startsWith('/tools') ? 700 : 500,
              }}
            >
              <span>{t.navTools}</span>
              <ChevronDown size={14} />
            </Link>

            {toolsDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '240px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <Link
                  href="/tools/image-converter"
                  className="nav-link-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: pathname === '/tools/image-converter' ? 'var(--primary-blue)' : 'var(--text-primary)',
                    backgroundColor: pathname === '/tools/image-converter' ? 'var(--bg-card-subtle)' : 'transparent',
                  }}
                  onClick={() => setToolsDropdownOpen(false)}
                >
                  <strong>{lang === 'bn' ? 'WEBP কনভার্টার' : 'Bulk WEBP Converter'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'সর্বোচ্চ ১০০ ছবি ব্যাচ প্রসেসিং' : 'Batch convert up to 100 images'}
                  </div>
                </Link>

                <Link
                  href="/tools/watermark"
                  className="nav-link-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: pathname === '/tools/watermark' ? 'var(--primary-blue)' : 'var(--text-primary)',
                    backgroundColor: pathname === '/tools/watermark' ? 'var(--bg-card-subtle)' : 'transparent',
                  }}
                  onClick={() => setToolsDropdownOpen(false)}
                >
                  <strong>{lang === 'bn' ? 'ওয়াটারমার্ক স্টুডিও' : 'Watermark Studio'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'লোগো বা টেক্সট লাইভ প্রিভিউ' : 'Logo or text live 60fps preview'}
                  </div>
                </Link>

                <Link
                  href="/tools/image-compressor"
                  className="nav-link-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: pathname === '/tools/image-compressor' ? 'var(--primary-blue)' : 'var(--text-primary)',
                    backgroundColor: pathname === '/tools/image-compressor' ? 'var(--bg-card-subtle)' : 'transparent',
                  }}
                  onClick={() => setToolsDropdownOpen(false)}
                >
                  <strong>{lang === 'bn' ? 'ইমেজ কম্প্রেসর' : 'Image Compressor'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'সর্বোচ্চ ৮৫% পর্যন্ত সাইজ কমান' : 'Reduce payload up to 85%'}
                  </div>
                </Link>

                <Link
                  href="/tools/csv-export"
                  className="nav-link-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: pathname === '/tools/csv-export' ? 'var(--primary-blue)' : 'var(--text-primary)',
                    backgroundColor: pathname === '/tools/csv-export' ? 'var(--bg-card-subtle)' : 'transparent',
                  }}
                  onClick={() => setToolsDropdownOpen(false)}
                >
                  <strong>{lang === 'bn' ? 'সিএসভি মেটাডেটা' : 'CSV Metadata Tool'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? '১৬ কলামের এক্সপোর্ট টেবিল' : '16-column Shopify & Woo export'}
                  </div>
                </Link>

                <Link
                  href="/tools/seo-generator"
                  className="nav-link-btn"
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: pathname === '/tools/seo-generator' ? 'var(--primary-blue)' : 'var(--text-primary)',
                    backgroundColor: pathname === '/tools/seo-generator' ? 'var(--bg-card-subtle)' : 'transparent',
                  }}
                  onClick={() => setToolsDropdownOpen(false)}
                >
                  <strong>{lang === 'bn' ? 'এসইও কনটেন্ট স্টুডিও' : 'SEO Content Studio'}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {lang === 'bn' ? 'বাংলা + ইংরেজি মেটা জেনারেটর' : 'Bangla + English SERP metadata'}
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/tools/seo-generator"
            className="nav-link-btn"
            style={{
              color: pathname === '/tools/seo-generator' ? 'var(--primary-blue)' : undefined,
              fontWeight: pathname === '/tools/seo-generator' ? 700 : 500,
            }}
          >
            {t.navSeo}
          </Link>

          <Link
            href="/faq"
            className="nav-link-btn"
            style={{
              color: pathname === '/faq' ? 'var(--primary-blue)' : undefined,
              fontWeight: pathname === '/faq' ? 700 : 500,
            }}
          >
            {t.navFaq}
          </Link>

          <Link
            href="/about"
            className="nav-link-btn"
            style={{
              color: pathname === '/about' ? 'var(--primary-blue)' : undefined,
              fontWeight: pathname === '/about' ? 700 : 500,
            }}
          >
            {lang === 'bn' ? 'সম্পর্কে' : 'About'}
          </Link>
        </nav>

        {/* Header Controls (Active Queue, Theme, Language, Privacy) */}
        <div className="header-actions">
          {/* Active Queue pill indicator if images in memory */}
          {items.length > 0 && (
            <Link
              href="/tools/image-converter"
              className="badge badge-primary"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                cursor: 'pointer',
              }}
              title="View shared workspace images"
            >
              <Layers size={13} />
              <span>
                {items.length} {lang === 'bn' ? 'ছবি কিউতে' : 'In Queue'}
              </span>
            </Link>
          )}

          {/* Privacy badge */}
          <div className="badge badge-success desktop-only-badge" style={{ display: 'inline-flex' }}>
            <ShieldCheck size={14} />
            <span>{lang === 'bn' ? '১০০% ক্লায়েন্ট-সাইড' : '100% Client-Side'}</span>
          </div>

          {/* Language Switcher */}
          <button
            className="btn btn-secondary"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            title="Switch Language / ভাষা পরিবর্তন"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <Globe size={16} />
            <span style={{ fontWeight: 600 }}>{lang === 'en' ? 'বাংলা' : 'English'}</span>
          </button>

          {/* Theme Switcher */}
          <button
            className="btn-icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? t.darkMode : t.lightMode}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            className="btn-icon mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>
          <Link
            href="/tools/image-converter"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.toolWebpTitle}
          </Link>
          <Link
            href="/tools/watermark"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.toolWatermarkTitle}
          </Link>
          <Link
            href="/tools/image-compressor"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.toolCompressorTitle}
          </Link>
          <Link
            href="/tools/csv-export"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.toolCsvTitle}
          </Link>
          <Link
            href="/tools/seo-generator"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.navSeo}
          </Link>
          <Link
            href="/faq"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t.navFaq}
          </Link>
          <Link
            href="/about"
            className="btn btn-secondary"
            style={{ justifyContent: 'flex-start' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            {lang === 'bn' ? 'আমাদের সম্পর্কে' : 'About Platform'}
          </Link>
        </div>
      )}
    </header>
  );
};
