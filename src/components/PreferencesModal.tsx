'use client';

import React from 'react';
import { AppLanguage, AppTheme, ConversionPreferences } from '@/types';
import { translations } from '@/locales/dictionary';
import { Settings, X, Moon, Sun, Globe, Sliders, Shield } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  convPrefs: ConversionPreferences;
  setConvPrefs: React.Dispatch<React.SetStateAction<ConversionPreferences>>;
}

export const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  lang,
  setLang,
  theme,
  setTheme,
  convPrefs,
  setConvPrefs,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
              <Settings size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {lang === 'bn' ? 'ব্যবহারকারীর পছন্দ ও সেটিংস' : 'Application Preferences'}
            </h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Theme Option */}
          <div className="form-group">
            <label className="form-label">{t.themeMode}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setTheme('light')}
              >
                <Sun size={16} />
                <span>{t.lightMode}</span>
              </button>
              <button
                type="button"
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setTheme('dark')}
              >
                <Moon size={16} />
                <span>{t.darkMode}</span>
              </button>
            </div>
          </div>

          {/* Language Option */}
          <div className="form-group">
            <label className="form-label">{t.language}</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={`btn ${lang === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setLang('en')}
              >
                <Globe size={16} />
                <span>English (US)</span>
              </button>
              <button
                type="button"
                className={`btn ${lang === 'bn' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setLang('bn')}
              >
                <Globe size={16} />
                <span>বাংলা (Bengali)</span>
              </button>
            </div>
          </div>

          {/* Quick Quality Presets */}
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={16} />
                Compression Mode Presets
              </span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${convPrefs.quality === 90 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', fontSize: '0.82rem' }}
                onClick={() => setConvPrefs((p) => ({ ...p, quality: 90 }))}
              >
                High Fidelity (90%)
              </button>
              <button
                type="button"
                className={`btn ${convPrefs.quality === 80 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', fontSize: '0.82rem' }}
                onClick={() => setConvPrefs((p) => ({ ...p, quality: 80 }))}
              >
                Balanced (80%)
              </button>
              <button
                type="button"
                className={`btn ${convPrefs.quality === 60 ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '8px', fontSize: '0.82rem' }}
                onClick={() => setConvPrefs((p) => ({ ...p, quality: 60 }))}
              >
                Max Savings (60%)
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <Shield size={20} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <strong>Zero-Server Architecture:</strong> PixelSEO Tools processes all images, watermarks, metadata, and ZIP archives locally in your browser memory. No files or personal data ever touch any remote server.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button className="btn btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
