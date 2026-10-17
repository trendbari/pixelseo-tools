'use client';

import React from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck,
  ChevronRight,
  Cpu,
  BarChart2,
  Sparkles,
} from 'lucide-react';

export default function PrivacyPage() {
  const { lang } = usePixelSeo();

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
            {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
          </span>
        </div>

        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-success)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
              </h1>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'সর্বশেষ আপডেট: অক্টোবর ২০২৬ • সংস্করণ ৩.১ • সম্পূর্ণ ক্লায়েন্ট-সাইড প্রাইভেসি'
                : 'Last Updated: October 2026 • PixelSEO Tools Platform v3.1 • 100% Client-Side Privacy'}
            </p>
          </div>

          {/* Privacy Guarantee Box */}
          <div
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div style={{ color: 'var(--color-success)', marginTop: '2px' }}>
              <Lock size={24} />
            </div>
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                {lang === 'bn'
                  ? 'মূল নীতি: User Images Remain On The Device (আপনার ছবি আপনার ডিভাইসেই থাকবে)'
                  : 'Core Principle: User Images Remain on the Device'}
              </strong>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {lang === 'bn'
                  ? 'প্রাথমিক ভার্সনে ছবিগুলো কোনো remote storage বা database-এ সংরক্ষণ করা হবে না। Browser-based conversion-এর কারণে server-side image upload API প্রয়োজন নেই। সমস্ত ফাইল ডিকোডিং, রিসাইজিং, ওয়াটারমার্কিং এবং WEBP এনকোডিং সরাসরি আপনার ব্রাউজারের ভেতর মেমরিতে সম্পন্ন হয়।'
                  : 'User images strictly remain on the device. In current and initial releases, images are never stored in any remote storage, cloud bucket, or database. Because all operations are 100% browser-based, a server-side image upload API does not even exist.'}
              </p>
            </div>
          </div>

          {/* Detailed Clauses */}
          <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Clause 1: Browser Processing & Memory Lifecycle */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--primary-blue)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'bn'
                    ? '১. ব্রাউজার প্রসেসিং ও মেমোরি লাইফসাইকেল (Browser Processing)'
                    : '1. Browser Processing & In-Memory Execution'}
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'ছবি আপলোড করলে HTML5 File API এবং URL.createObjectURL() ব্যবহার করে অস্থায়ী লোকাল রেফারেন্স তৈরি করা হয়। কনভার্সন এবং ওয়াটারমার্ক প্রসেসিং ব্রাউজারের OffscreenCanvas ও Web Worker-এর মাধ্যমে রেন্ডার হয়। ছবি ডিলিট করলে বা প্রসেসিং শেষে তৎক্ষণাৎ URL.revokeObjectURL() ও canvas.width = 0 দিয়ে র‍্যাম এবং জিপিইউ মেমোরি খালি করা হয়। ব্রাউজার ট্যাব বন্ধ বা রিফ্রেশ করলে সমস্ত ডাটা মেমোরি থেকে মুছে যায়।'
                  : 'Images are ingested strictly through the browser HTML5 File API and URL.createObjectURL(). Conversion and watermark rendering execute locally via Web Workers and OffscreenCanvas. Upon removal, download, or session clear, object URLs are immediately released via URL.revokeObjectURL() and canvas dimensions reset to 0 to clear GPU VRAM. Closing or reloading the tab immediately flushes all volatile memory.'}
              </p>
            </div>

            {/* Clause 2: Optional Analytics Policy */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <BarChart2 size={18} style={{ color: 'var(--primary-blue)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'bn'
                    ? '২. অ্যানালিটিক্স ও টেলিমেট্রি সংক্রান্ত গ্যারান্টি (Optional Analytics)'
                    : '2. Optional Analytics & Telemetry Guarantee'}
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'আমরা ব্যবহারকারীর গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেই। ভবিষ্যতে যদি কোনো অ্যানালিটিক্স যুক্ত করা হয়, তবে ব্যক্তিগত ছবি, ফাইলের নাম (filename) বা এসইও ইনপুট (SEO content/keywords) কোনোভাবেই সংগ্রহ করা হবে না। কেবল ওয়েবসাইটের সামগ্রিক কার্যক্ষমতা (যেমন পেজ লোড স্পিড বা সিস্টেম এরর রেট) অ্যানোনিমাসভাবে পর্যবেক্ষণ করা হতে পারে।'
                  : 'If analytics or telemetry are ever integrated in the future, personal images, filenames, or user SEO inputs will NEVER be collected, logged, or transmitted. Any future telemetry will be strictly limited to aggregated, non-personally identifiable operational performance metrics (e.g., page load latencies or unhandled crash counts).'}
              </p>
            </div>

            {/* Clause 3: Future AI Integration Policy */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-blue)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'bn'
                    ? '৩. ভবিষ্যতের এআই ইন্টিগ্রেশন পলিসি (Future AI Integration)'
                    : '3. Future AI Integration Architecture'}
                </h2>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'বর্তমানে এসইও জেনারেটর এবং কন্টেন্ট স্টুডিও ক্লায়েন্ট-সাইড অ্যালগরিদমের মাধ্যমে কাজ করে। ভবিষ্যতে যদি কোনো ক্লাউডভিত্তিক এআই মডেল (যেমন Google Gemini বা OpenAI) ইন্টিগ্রেশন চালু করা হয়, তা হবে সম্পূর্ণ ঐচ্ছিক (Opt-In)। ব্যবহারকারী স্পষ্ট অনুমতি না দিলে কোনো টেক্সট এআই সার্ভিসে পাঠানো হবে না এবং ইমেজ ফাইলগুলো সর্বদা ডিভাইসের ভেতরেই সংরক্ষিত থাকবে।'
                  : 'Our current SEO engine and keyword extractor operate entirely deterministically via client-side rule sets. In future releases with optional server-side or cloud AI capabilities (e.g., Google Gemini or OpenAI integrations), usage will be 100% opt-in with explicit disclosure before any prompt text is evaluated. Images will continue to remain solely on the user device.'}
              </p>
            </div>

            {/* Clause 4: Security Safeguards (SEC-01 to SEC-10) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileCheck size={18} style={{ color: 'var(--primary-blue)' }} />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {lang === 'bn'
                    ? '৪. সার্বিক নিরাপত্তা সুরক্ষা (Security Safeguards)'
                    : '4. Comprehensive Security Safeguards'}
                </h2>
              </div>
              <ul style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '20px', marginTop: '8px' }}>
                <li><strong>SEC-01:</strong> File type & size validation: Max 20MB per image, up to 100 files, genuine container decoding checks.</li>
                <li><strong>SEC-02:</strong> Safe filename normalization: Control characters, null bytes, and Windows reserved names sanitized.</li>
                <li><strong>SEC-03:</strong> SVG sanitization & safe rasterization: Dangerous scripts, foreignObjects, and XXE entities stripped before canvas rendering.</li>
                <li><strong>SEC-04:</strong> No remote image upload by default: Complete browser execution.</li>
                <li><strong>SEC-05:</strong> Object URL cleanup: Automatic URL revocation prevents browser memory leaks.</li>
                <li><strong>SEC-06:</strong> Safe CSV serialization: RFC 4180 compliance with CWE-1236 formula injection protection and UTF-8 BOM encoding.</li>
                <li><strong>SEC-07:</strong> Strict Content Security Policy (CSP), X-Frame-Options: DENY, X-Content-Type-Options: nosniff.</li>
                <li><strong>SEC-08:</strong> Zero API secrets, private keys, or tokens in client bundles.</li>
                <li><strong>SEC-09:</strong> Regular dependency vulnerability audits (zero npm audit vulnerabilities).</li>
                <li><strong>SEC-10:</strong> ZIP filename path traversal (Zip Slip) prevention.</li>
              </ul>
            </div>

            {/* Clause 5: Contact */}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                {lang === 'bn' ? '৫. যোগাযোগ ও অনুসন্ধান' : '5. Contact & Privacy Inquiries'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {lang === 'bn'
                  ? 'আমাদের প্রাইভেসি আর্কিটেকচার বা ডেটা সুরক্ষা সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের '
                  : 'If you have questions regarding our privacy architecture or security measures, please submit an inquiry via our '}
                <Link href="/contact" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>
                  {lang === 'bn' ? 'যোগাযোগ পেজ (Contact Page)' : 'Contact Page'}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
