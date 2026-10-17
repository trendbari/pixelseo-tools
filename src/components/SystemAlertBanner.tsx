'use client';

import React, { useState, useEffect } from 'react';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { isWebpEncoderSupported } from '@/lib/image/webpSupport';
import { getScenarioGuidance, ScenarioType } from '@/lib/errorGuidance';
import {
  WifiOff,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Cpu,
  Archive,
  X,
  Sparkles,
} from 'lucide-react';

interface SystemAlertBannerProps {
  onRetryZip?: () => void;
  zipError?: string | null;
  onClearZipError?: () => void;
  memoryNotice?: string | null;
  onClearMemoryNotice?: () => void;
}

export const SystemAlertBanner: React.FC<SystemAlertBannerProps> = ({
  onRetryZip,
  zipError,
  onClearZipError,
  memoryNotice,
  onClearMemoryNotice,
}) => {
  const { lang, convPrefs, items, handleLoadDemoImages } = usePixelSeo();
  const [isOnline, setIsOnline] = useState(true);
  const [isWebpSupported, setIsWebpSupported] = useState(true);
  const [sessionNoticeDismissed, setSessionNoticeDismissed] = useState(false);
  const [showSessionNotice, setShowSessionNotice] = useState(false);

  // 1. Detect Offline / Online events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // 2. Feature detection: WebP encoder support
  useEffect(() => {
    isWebpEncoderSupported().then((supported) => {
      setIsWebpSupported(supported);
    });
  }, []);

  // 3. Detect Browser Refresh with prior active session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hadActiveSession = sessionStorage.getItem('pixelseo_session_active') === 'true';
        if (hadActiveSession && items.length === 0) {
          setShowSessionNotice(true);
        }
      } catch {}
    }
  }, [items.length]);

  // Mark session active when images exist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (items.length > 0) {
          sessionStorage.setItem('pixelseo_session_active', 'true');
        }
      } catch {}
    }
  }, [items.length]);

  const offlineGuidance = getScenarioGuidance('offline_mode', lang);
  const webpGuidance = getScenarioGuidance('webp_unsupported', lang);
  const sessionGuidance = getScenarioGuidance('session_refresh', lang, { quality: convPrefs.quality });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
      {/* 1. Offline Mode Indicator */}
      {!isOnline && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid var(--primary-blue)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <WifiOff size={20} style={{ color: 'var(--primary-blue)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '2px' }}>
              {offlineGuidance.title} — {offlineGuidance.whatHappened}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {offlineGuidance.nextStep}
            </div>
          </div>
        </div>
      )}

      {/* 2. WebP Unsupported Browser Warning */}
      {!isWebpSupported && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid #F59E0B',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <AlertTriangle size={20} style={{ color: '#F59E0B', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: '#D97706', marginBottom: '2px' }}>
              {webpGuidance.title} — {webpGuidance.whatHappened}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {webpGuidance.nextStep}
            </div>
          </div>
        </div>
      )}

      {/* 3. Memory Pressure Notification */}
      {memoryNotice && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 18px',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid #8B5CF6',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <Cpu size={20} style={{ color: '#8B5CF6', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: '#7C3AED', marginBottom: '2px' }}>
              {lang === 'bn' ? 'উচ্চ মেমরি চাপ সনাক্ত হয়েছে' : 'Memory Pressure Detected'}: {memoryNotice}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'ব্রাউজার ক্র্যাশ এড়াতে স্বয়ংক্রিয়ভাবে কনকারেন্সি ১-এ নামিয়ে আনা হয়েছে এবং গার্বেজ কালেকশন পজ দেওয়া হচ্ছে।'
                : 'Concurrency automatically reduced to 1 worker to ensure stable, crash-free conversion.'}
            </div>
          </div>
          {onClearMemoryNotice && (
            <button
              type="button"
              onClick={onClearMemoryNotice}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* 4. ZIP Generation Failure Alert with Retry */}
      {zipError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <Archive size={20} style={{ color: 'var(--color-error)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-error)', marginBottom: '2px' }}>
              {lang === 'bn' ? 'জিপ তৈরি ব্যর্থ হয়েছে' : 'ZIP Generation Failed'}: {zipError}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {lang === 'bn'
                ? 'পুনরায় চেষ্টা করতে "Retry Export" বাটনে ক্লিক করুন অথবা প্রতিটি ছবি আলাদাভাবে ডাউনলোড করুন।'
                : 'Click "Retry Export" to rebuild the archive, or download converted WebP images individually using the WEBP buttons below.'}
            </div>
            {onRetryZip && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onRetryZip}
                style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>{lang === 'bn' ? 'পুনরায় এক্সপোর্ট করুন (Retry Export)' : 'Retry Export'}</span>
              </button>
            )}
          </div>
          {onClearZipError && (
            <button
              type="button"
              onClick={onClearZipError}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* 5. Session Recovery Notice (Browser Refresh) */}
      {showSessionNotice && !sessionNoticeDismissed && items.length === 0 && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          <RefreshCw size={18} style={{ color: 'var(--primary-blue)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.86rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {sessionGuidance.title} — {sessionGuidance.whatHappened}
            </div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
              {sessionGuidance.nextStep}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadDemoImages}
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} style={{ color: 'var(--primary-blue)' }} />
                <span>{lang === 'bn' ? 'ডেমো ছবি লোড করুন (Demo Images)' : 'Load Demo Images'}</span>
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setSessionNoticeDismissed(true);
                  try { sessionStorage.removeItem('pixelseo_session_active'); } catch {}
                }}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <span>{lang === 'bn' ? 'বুঝেছি' : 'Dismiss'}</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSessionNoticeDismissed(true);
              try { sessionStorage.removeItem('pixelseo_session_active'); } catch {}
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
