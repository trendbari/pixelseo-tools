'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Globe2,
  Lock,
  Layers,
  ArrowRight,
  Code2,
  CheckCircle2,
} from 'lucide-react';

export default function AboutPage() {
  const { lang, items } = usePixelSeo();

  return (
    <div className="app-layout">
      <Header />

      <main className="container" style={{ paddingBottom: '70px', paddingTop: '32px' }}>
        <SessionQueueBanner />

        {/* Hero Banner */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--primary-blue-light)',
              color: 'var(--primary-blue)',
              fontSize: '0.82rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} />
            <span>PixelSEO Tools v3.1 Platform</span>
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              marginBottom: '16px',
            }}
          >
            {lang === 'bn'
              ? 'প্রাইভেসি-ফার্স্ট ইমেজ ও এসইও অপ্টিমাইজেশন প্ল্যাটফর্ম'
              : 'Privacy-First Image Optimization & SEO Intelligence'}
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {lang === 'bn'
              ? 'PixelSEO Tools হলো একটি আধুনিক ও শক্তিশালী ব্রাউজার-নেটিভ টুলকিট যা ই-কমার্স বিক্রেতা, মার্কেটার ও ব্লগারদের কোনো সাইনআপ ছাড়াই একসাথে ১০০টি ছবি অপ্টিমাইজ করতে সহায়তা করে।'
              : 'PixelSEO Tools is a high-velocity, client-side web utility engineered for e-commerce sellers, digital agencies, and content publishers. Process up to 100 images simultaneously with zero server uploads and zero privacy risks.'}
          </p>
        </div>

        {/* Core Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '48px',
          }}
        >
          {/* Pillar 1 */}
          <div className="card" style={{ padding: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? '১০০% লোকাল ক্লায়েন্ট-সাইড প্রসেসিং' : '100% Client-Side Architecture'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'আপনার ছবিগুলো কখনো কোনো রিমোট ক্লাউড সার্ভারে আপলোড হয় না। HTML5 Canvas এবং আধুনিক ব্রাউজার ইঞ্জিনের সাহায্যে প্রসেসিং ঘটে সম্পূর্ণ আপনার ডিভাইসে।'
                : 'Your confidential unreleased product photography never touches an external server. All image decoding, WebP compression, watermarking, and ZIP bundling occur in your browser memory.'}
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="card" style={{ padding: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'জিরো লেটেন্সি ও হাই-স্পিড পারফরম্যান্স' : 'Zero Network Latency'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'সার্ভারে ফাইল আপলোড বা ডাউনলোডের দীর্ঘ সময় অপেক্ষা করার কোনো প্রয়োজন নেই। ১০০টি ছবি সেকেন্ডের মধ্যে কনভার্ট ও প্যাকেজ করা সম্ভব।'
                : 'Traditional image optimizers upload multi-megabyte payloads to cloud buckets. PixelSEO eliminates network bottlenecks, transforming dozens of high-res photos in sub-second cycles.'}
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="card" style={{ padding: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Globe2 size={22} />
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'দ্বিভাষিক এসইও ইঞ্জিন (বাংলা + ইংরেজি)' : 'Bilingual SEO Engine'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {lang === 'bn'
                ? 'ইংরেজি ও বাংলায় পণ্য বা আর্টিকেলের জন্য সঠিক মেটা টাইটেল (৫০-৬০ অক্ষর) ও মেটা ডেসক্রিপশন (১৪০-১৬০ অক্ষর) তৈরি করার রুল-বেসড ফ্রি এনএলপি প্রযুক্তি।'
                : 'Engineered specifically for global and South Asian digital commerce with native Bangla and English NLP keyword extractors, SERP length evaluators, and WCAG accessibility alt texts.'}
            </p>
          </div>
        </div>

        {/* Technical Highlights Section */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            marginBottom: '40px',
          }}
        >
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>
            {lang === 'bn' ? 'প্রযুক্তিগত বৈশিষ্ট্যসমূহ' : 'Technical Specifications & Architecture'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>Next-Gen WebP Engine</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>85% baseline compression with visual lossless reproduction.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>60fps Watermark Canvas</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Live interactive 9-point grid and repeating pattern tiling.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>RFC 4180 CSV Specification</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>16-column metadata manifest with UTF-8 BOM for Excel and Shopify.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-success)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>Client-Side ZIP Bundler</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Hierarchical folders containing WebP assets and Schema.org JSON-LD.</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Launch Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>
            {lang === 'bn' ? 'আপনার ছবি অপ্টিমাইজ করতে প্রস্তুত?' : 'Ready to Optimize Your Image Catalog?'}
          </h2>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, maxWidth: '580px', margin: '0 auto 24px auto' }}>
            {lang === 'bn'
              ? 'কোনো অ্যাকাউন্ট বা সফটওয়্যার ইনস্টল ছাড়াই সরাসরি ব্রাউজারে কাজ শুরু করুন।'
              : 'Zero registration, zero credit card, and zero telemetry. Launch the workspace now.'}
          </p>
          <Link
            href="/tools/image-converter"
            className="btn"
            style={{
              backgroundColor: '#FFFFFF',
              color: 'var(--primary-blue)',
              fontWeight: 700,
              padding: '12px 28px',
              fontSize: '1rem',
              display: 'inline-flex',
            }}
          >
            <span>{lang === 'bn' ? 'ওয়ার্কস্পেস খুলুন' : 'Open Workspace'}</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
