import { create } from 'zustand';
import {
  ConversionPreferences,
  WatermarkPreferences,
  AppTheme,
  AppLanguage,
} from '@/types';
import { useImageStore } from './image-store';

interface SettingsState {
  theme: AppTheme;
  lang: AppLanguage;
  convPrefs: ConversionPreferences;
  wmPrefs: WatermarkPreferences;
  setTheme: (theme: AppTheme) => void;
  setLang: (lang: AppLanguage) => void;
  setConvPrefs: (prefs: Partial<ConversionPreferences>) => void;
  setWmPrefs: (prefs: Partial<WatermarkPreferences>) => void;
}

const defaultConvPrefs: ConversionPreferences = {
  format: 'webp',
  quality: 85,
  resizeEnabled: false,
  maxWidth: 1920,
  maxHeight: 1080,
  preserveAspectRatio: true,
  namingPattern: 'original',
  prefix: '',
  suffix: '',
};

const defaultWmPrefs: WatermarkPreferences = {
  enabled: false,
  type: 'text',
  text: '© My Brand',
  textColor: '#FFFFFF',
  fontFamily: 'Inter',
  fontSize: 24,
  position: 'bottom-right',
  opacity: 0.55,
  logoBlob: null,
  logoUrl: null,
  logoScale: 0.2,
  rotation: 0,
  margin: 24,
  hasShadow: true,
  shadowColor: 'rgba(0,0,0,0.6)',
  shadowBlur: 4,
  applyScope: 'all',
  selectedImageIds: [],
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  lang: 'en',
  convPrefs: defaultConvPrefs,
  wmPrefs: defaultWmPrefs,

  setTheme: (theme) => {
    set({ theme });
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('pixelseo_theme', theme); } catch {}
    }
  },

  setLang: (lang) => {
    set({ lang });
    if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('pixelseo_lang', lang); } catch {}
    }
  },

  setConvPrefs: (prefs) => {
    set((state) => {
      const updated = { ...state.convPrefs, ...prefs };
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('pixelseo_quality', String(updated.quality));
          localStorage.setItem('pixelseo_conv_prefs', JSON.stringify(updated));
        } catch {}
      }
      // Settings changed: mark existing conversion results stale
      useImageStore.getState().markAllStale();
      return { convPrefs: updated };
    });
  },

  setWmPrefs: (prefs) => {
    set((state) => {
      const updated = { ...state.wmPrefs, ...prefs };
      if (typeof localStorage !== 'undefined') {
        try {
          const serializable = {
            enabled: updated.enabled,
            type: updated.type,
            text: updated.text,
            textColor: updated.textColor,
            fontFamily: updated.fontFamily,
            fontSize: updated.fontSize,
            position: updated.position,
            opacity: updated.opacity,
            logoScale: updated.logoScale,
            rotation: updated.rotation,
            margin: updated.margin,
            hasShadow: updated.hasShadow,
            shadowColor: updated.shadowColor,
            shadowBlur: updated.shadowBlur,
            applyScope: updated.applyScope,
          };
          localStorage.setItem('pixelseo_wm_prefs', JSON.stringify(serializable));
        } catch {}
      }
      // Watermark changed: mark existing conversion results stale
      useImageStore.getState().markAllStale();
      return { wmPrefs: updated };
    });
  },
}));
