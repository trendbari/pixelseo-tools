'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SessionQueueBanner } from '@/components/SessionQueueBanner';
import {
  Mail,
  Send,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Globe,
  Sparkles,
} from 'lucide-react';

export default function ContactPage() {
  const { lang } = usePixelSeo();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে সব প্রয়োজনীয় ঘর পূরণ করুন।' : 'Please fill in all required fields.');
      return;
    }
    setSubmitted(true);
  };

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
            {lang === 'bn' ? 'যোগাযোগ ও ফিডব্যাক' : 'Contact & Feedback'}
          </span>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
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
              <MessageSquare size={14} />
              <span>We value your feedback</span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              {lang === 'bn' ? 'আমাদের সাথে যোগাযোগ করুন' : 'Get in Touch with PixelSEO'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto' }}>
              {lang === 'bn'
                ? 'PixelSEO Tools নিয়ে কোনো প্রশ্ন, বাগ রিপোর্ট বা নতুন ফিচার আইডিয়া থাকলে আমাদের বার্তা পাঠান।'
                : 'Have questions, bug reports, feature suggestions, or agency partnership inquiries? Send us a message.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
            {/* Contact Form */}
            <div className="card" style={{ padding: '28px' }}>
              {submitted ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {lang === 'bn' ? 'বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Message Received!'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {lang === 'bn'
                      ? 'আপনার মতামতের জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।'
                      : 'Thank you for contacting PixelSEO Tools. Our product engineering team has received your feedback.'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', category: 'general', subject: '', message: '' });
                    }}
                  >
                    <span>{lang === 'bn' ? 'আরেকটি বার্তা পাঠান' : 'Send Another Message'}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'আপনার নাম' : 'Your Name'} *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Alex Rahman"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. alex@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'বার্তার বিষয়শ্রেণী' : 'Inquiry Category'}</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">{lang === 'bn' ? 'সাধারণ প্রশ্ন' : 'General Inquiry'}</option>
                      <option value="bug">{lang === 'bn' ? 'বাগ রিপোর্ট' : 'Bug Report'}</option>
                      <option value="feature">{lang === 'bn' ? 'নতুন ফিচার প্রস্তাব' : 'Feature Request'}</option>
                      <option value="partnership">{lang === 'bn' ? 'এজেন্সি পার্টনারশিপ' : 'Agency Partnership'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'বিষয়' : 'Subject'}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Suggestion for batch watermarks"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{lang === 'bn' ? 'আপনার বার্তা' : 'Message'} *</label>
                    <textarea
                      required
                      rows={4}
                      className="form-textarea"
                      placeholder="How can we help your optimization workflow?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                  >
                    <Send size={16} />
                    <span>{lang === 'bn' ? 'বার্তা পাঠান' : 'Submit Message'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Support Info & FAQ Quick Link */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
                  {lang === 'bn' ? 'সরাসরি সাপোর্ট চ্যানেল' : 'Direct Support Channels'}
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary-blue)' }}><Mail size={18} /></div>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Email Support</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>support@pixelseo.tools</span>
                    </div>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--color-success)' }}><Globe size={18} /></div>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>Global Availability</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>24/7 client-side serverless uptime</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Need Quick Answers Banner */}
              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary-blue)' }}>
                  <HelpCircle size={20} />
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {lang === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ' : 'Frequently Asked Questions'}
                  </strong>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  {lang === 'bn'
                    ? 'সর্বোচ্চ ফাইলের সাইজ, ফরম্যাট সাপোর্ট ও প্রাইভেসি সম্পর্কিত উত্তরের জন্য আমাদের FAQ পেজ দেখুন।'
                    : 'Check out our FAQ directory covering format support, watermark rendering, file size limits, and security guarantees.'}
                </p>
                <Link href="/faq" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                  <span>{lang === 'bn' ? 'FAQ ডিরেক্টরি দেখুন' : 'Explore FAQ Directory'}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
