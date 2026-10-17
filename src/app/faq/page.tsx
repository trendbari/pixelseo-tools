'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sliders,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'format' | 'watermark' | 'limits' | 'privacy' | 'seo';
  qEn: string;
  qBn: string;
  aEn: string;
  aBn: string;
}

export default function FaqPage() {
  const { lang } = usePixelSeo();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'item-1': true,
    'item-4': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const faqData: FaqItem[] = [
    {
      id: 'item-1',
      category: 'format',
      qEn: 'Which image formats are supported for input and output?',
      qBn: 'কোন কোন ইমেজ ফরম্যাট কনভার্সনের জন্য সমর্থিত?',
      aEn: 'PixelSEO Tools accepts JPG, JPEG, PNG, and AVIF image formats. All input files are transcoded into Google Next-Gen WebP format (or preserved in their native quality if custom export is selected), reducing file size by up to 85% while preserving visual clarity.',
      aBn: 'PixelSEO Tools-এ আপনি JPG, JPEG, PNG এবং AVIF ফরম্যাটের ছবি আপলোড করতে পারেন। এগুলো স্বয়ংক্রিয়ভাবে গুগলের আধুনিক Next-Gen WebP ফরম্যাটে কনভার্ট হয়, যা ছবির কোয়ালিটি অক্ষুণ্ণ রেখে সাইজ সর্বোচ্চ ৮৫% পর্যন্ত কমিয়ে দেয়।',
    },
    {
      id: 'item-2',
      category: 'watermark',
      qEn: 'Can I apply both a logo and text watermark together?',
      qBn: 'আমি কি একই সাথে লোগো এবং টেক্সট ওয়াটারমার্ক উভয়ই ব্যবহার করতে পারি?',
      aEn: 'Yes! In the Watermark Studio, you can choose Text Watermark, Logo Watermark (PNG, SVG, WEBP), or Logo + Text mode. You can independently position your watermark across a 9-point grid or repeat it as a diagonal security tile pattern.',
      aBn: 'হ্যাঁ! ওয়াটারমার্ক স্টুডিওতে আপনি টেক্সট ওয়াটারমার্ক, লোগো ওয়াটারমার্ক (PNG, SVG, WEBP) অথবা লোগো + টেক্সট উভয় মোড বেছে নিতে পারেন। এটি ৯-পয়েন্ট গ্রিডের যেকোনো স্থানে বা পুরো ছবিতে ডায়াগোনাল টাইল প্যাটার্নে বসানো যায়।',
    },
    {
      id: 'item-3',
      category: 'limits',
      qEn: 'What is the maximum file size and how many images can I process at once?',
      qBn: 'ফাইলের সর্বোচ্চ সাইজ কত এবং একসঙ্গে কতগুলো ছবি প্রসেস করা যায়?',
      aEn: 'You can upload up to 100 images per batch. Individual image files can be up to 20 MB each. Because memory processing is bounded sequentially, even low-spec laptops and mobile browsers can convert 100 images smoothly without browser crashes.',
      aBn: 'আপনি একবারে সর্বোচ্চ ১০০টি ছবি আপলোড করতে পারবেন। প্রতিটি ছবির সাইজ সর্বোচ্চ ২০ মেগাবাইট পর্যন্ত হতে পারে। সিকোয়েনশিয়াল মেমরি অপ্টিমাইজেশনের কারণে যেকোনো ল্যাপটপ বা মোবাইলেই এটি নির্বিঘ্নে কাজ করে।',
    },
    {
      id: 'item-4',
      category: 'privacy',
      qEn: 'Are my images stored, logged, or uploaded to any cloud server?',
      qBn: 'আমার ছবিগুলো কি কোনো ক্লাউড সার্ভারে আপলোড বা সংরক্ষণ করা হয়?',
      aEn: 'No! Absolutely zero images are uploaded to any server. All image conversion, watermarking, and ZIP archiving take place locally inside your browser using client-side HTML5 Canvas. Your unreleased catalog photos remain 100% confidential.',
      aBn: 'না! আপনার কোনো ছবিই কোনো রিমোট সার্ভারে আপলোড করা হয় না। সম্পূর্ণ প্রসেসিং আপনার ব্রাউজারের মেমরিতে সম্পন্ন হয়। ফলে আপনার অপ্রকাশিত পণ্যের ছবি বা ব্যক্তিগত ক্যাটালগ ১০০% নিরাপদ থাকে।',
    },
    {
      id: 'item-5',
      category: 'seo',
      qEn: 'How does the Rule-Based SEO Content Studio work without API keys?',
      qBn: 'কোনো API key ছাড়াই রুল-বেসড এসইও কনটেন্ট স্টুডিও কীভাবে কাজ করে?',
      aEn: 'PixelSEO Tools v3.1 utilizes a deterministic client-side Natural Language Processing (NLP) algorithm. It tokenizes words, filters English and Bengali stop words, extracts n-grams, and formats Meta Titles (50–60 chars) and Meta Descriptions (140–160 chars) with 0ms latency and 0 cost.',
      aBn: 'PixelSEO Tools v3.1 একটি সম্পূর্ণ ক্লায়েন্ট-সাইড ডিটারমিনিস্টিক এনএলপি ইঞ্জিন ব্যবহার করে। এটি বাংলা ও ইংরেজি স্টপ-ওয়ার্ড ফিল্টার করে কিওয়ার্ড বের করে এবং গুগল সার্চের উপযোগী মেটা টাইটেল ও ডেসক্রিপশন তৈরি করে—যা সম্পূর্ণ বিনামূল্যে ও দ্রুত কাজ করে।',
    },
    {
      id: 'item-6',
      category: 'seo',
      qEn: 'What is included in the 16-Column CSV Metadata export?',
      qBn: '১৬ কলামের সিএসভি মেটাডেটা ফাইলে কী কী তথ্য থাকে?',
      aEn: 'The exported CSV includes: original_filename, output_filename, original_format, output_format, original_size_bytes, output_size_bytes, width, height, quality, compression_percent, watermark_applied, alt_text, seo_title, meta_description, keywords, and status. It is encoded with UTF-8 BOM for direct compatibility with Microsoft Excel, Shopify, and WooCommerce.',
      aBn: 'এক্সপোর্টকৃত CSV-তে মূল ও আউটপুট ফাইলের নাম, সাইজ, ডাইমেনশন, কম্প্রেশন শতাংশ, ওয়াটারমার্ক স্ট্যাটাস, এসইও অল্ট টেক্সট, টাইটেল, ডেসক্রিপশন ও কিওয়ার্ড সংরক্ষিত থাকে। এতে UTF-8 BOM যুক্ত থাকে যাতে Excel ও Shopify-তে বাংলা লেখা পরিষ্কারভাবে দেখা যায়।',
    },
    {
      id: 'item-7',
      category: 'format',
      qEn: 'Can I download all processed images in a single ZIP file?',
      qBn: 'আমি কি সবগুলো কনভার্ট হওয়া ছবি এক ক্লিকে জিপ (ZIP) ফাইলে ডাউনলোড করতে পারব?',
      aEn: 'Yes! The Download ZIP button bundles all successful WebP images into a structured package with an images/ directory, metadata/ CSV manifest, Schema.org JSON-LD snippet, and a README.txt file.',
      aBn: 'হ্যাঁ! "Download ZIP" বাটনে ক্লিক করলে সব সফল WebP ছবি, সিএসভি স্প্রেডশিট এবং Schema.org JSON-LD ফাইল একসাথে একটি গোছানো জিপ প্যাকেজে ডাউনলোড হয়ে যায়।',
    },
  ];

  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.qEn.toLowerCase().includes(query) ||
      item.qBn.toLowerCase().includes(query) ||
      item.aEn.toLowerCase().includes(query) ||
      item.aBn.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app-layout">
      <Header />

      <main className="container" style={{ paddingBottom: '70px', paddingTop: '32px' }}>
        <SessionQueueBanner />

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            {lang === 'bn' ? 'হোম' : 'Home'}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
            {lang === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ' : 'FAQ'}
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 36px auto' }}>
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
              marginBottom: '12px',
            }}
          >
            <HelpCircle size={14} />
            <span>Help & Documentation</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
            {lang === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী (FAQ)' : 'Frequently Asked Questions'}
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {lang === 'bn'
              ? 'PixelSEO Tools-এর ইমেজ কনভার্সন, ওয়াটারমার্কিং, সিএসভি এক্সপোর্ট ও প্রাইভেসি সম্পর্কিত তথ্য।'
              : 'Everything you need to know about local browser conversion, watermarking, and privacy architecture.'}
          </p>

          {/* Search Filter Box */}
          <div style={{ position: 'relative', marginTop: '24px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder={
                lang === 'bn'
                  ? 'প্রশ্ন বা কিওয়ার্ড লিখে খুঁজুন (যেমন: WebP, ওয়াটারমার্ক, প্রাইভেসি)...'
                  : 'Search questions or keywords (e.g. WebP, Watermark, Privacy, Limits)...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '44px',
                paddingTop: '12px',
                paddingBottom: '12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.95rem',
              }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          {[
            { id: 'all', labelEn: 'All Questions', labelBn: 'সব প্রশ্ন' },
            { id: 'format', labelEn: 'Formats & Quality', labelBn: 'ফরম্যাট ও কোয়ালিটি' },
            { id: 'watermark', labelEn: 'Watermarks', labelBn: 'ওয়াটারমার্ক' },
            { id: 'limits', labelEn: 'Limits & Capacity', labelBn: 'সীমাবদ্ধতা ও ফাইল সাইজ' },
            { id: 'privacy', labelEn: 'Security & Privacy', labelBn: 'নিরাপত্তা ও প্রাইভেসি' },
            { id: 'seo', labelEn: 'SEO & Metadata', labelBn: 'এসইও ও মেটাডেটা' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '6px 16px',
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {lang === 'bn' ? cat.labelBn : cat.labelEn}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredFaqs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                {lang === 'bn'
                  ? 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো প্রশ্ন পাওয়া যায়নি।'
                  : 'No matching questions found. Try refining your search query.'}
              </p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id];
              return (
                <div
                  key={faq.id}
                  className="card"
                  style={{
                    padding: '0',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    style={{
                      width: '100%',
                      padding: '18px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      gap: '16px',
                    }}
                  >
                    <span style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                      {lang === 'bn' ? faq.qBn : faq.qEn}
                    </span>
                    <span style={{ color: 'var(--primary-blue)', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 20px 24px',
                        fontSize: '0.9rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.65,
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '14px',
                      }}
                    >
                      {lang === 'bn' ? faq.aBn : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions CTA */}
        <div
          style={{
            maxWidth: '820px',
            margin: '48px auto 0 auto',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'আরও কোনো প্রশ্ন আছে?' : 'Still have questions?'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {lang === 'bn'
                ? 'আমাদের সাপোর্ট টিমের সাথে সরাসরি যোগাযোগ করুন।'
                : 'Reach out directly to our engineering team with your feedback.'}
            </p>
          </div>

          <Link href="/contact" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
            <span>{lang === 'bn' ? 'যোগাযোগ করুন' : 'Contact Support'}</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
