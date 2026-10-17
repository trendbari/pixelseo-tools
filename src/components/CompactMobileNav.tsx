'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePixelSeo } from '@/context/PixelSeoContext';
import {
  FileImage,
  Stamp,
  Sparkles,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

export const CompactMobileNav: React.FC = () => {
  const pathname = usePathname();
  const { lang, items, setIsPreferencesOpen } = usePixelSeo();

  const isBn = lang === 'bn';

  const navItems = [
    {
      href: '/tools/image-converter',
      label: isBn ? 'কনভার্টার' : 'Converter',
      icon: <FileImage size={18} aria-hidden="true" />,
      badge: items.length > 0 ? items.length : undefined,
    },
    {
      href: '/tools/watermark',
      label: isBn ? 'ওয়াটারমার্ক' : 'Watermark',
      icon: <Stamp size={18} aria-hidden="true" />,
    },
    {
      href: '/tools/seo-generator',
      label: isBn ? 'এসইও স্টুডিও' : 'SEO Studio',
      icon: <Sparkles size={18} aria-hidden="true" />,
    },
    {
      href: '/tools/csv-export',
      label: isBn ? 'সিএসভি' : 'CSV Export',
      icon: <FileSpreadsheet size={18} aria-hidden="true" />,
    },
  ];

  return (
    <nav
      className="mobile-compact-nav"
      role="navigation"
      aria-label={isBn ? 'মোবাইল নেভিগেশন' : 'Mobile Navigation'}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`compact-nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              position: 'relative',
              touchAction: 'manipulation',
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '6px',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--primary-blue)',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '1px 5px',
                  lineHeight: 1.2,
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      {/* Settings / Preferences Trigger */}
      <button
        type="button"
        className="compact-nav-item"
        onClick={() => setIsPreferencesOpen(true)}
        aria-label={isBn ? 'সেটিংস ও ভাষা কনফিগারেশন' : 'Open settings and preferences'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          touchAction: 'manipulation',
        }}
      >
        <Settings size={18} aria-hidden="true" />
        <span>{isBn ? 'সেটিংস' : 'Settings'}</span>
      </button>
    </nav>
  );
};

export default CompactMobileNav;
