'use client';

import React, { useEffect } from 'react';
import { usePixelSeoStore, PixelSeoState } from '@/store/usePixelSeoStore';

export const PixelSeoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme, setLang, setConvPrefs, setWmPrefs } = usePixelSeoStore();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pixelseo_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
      const savedLang = localStorage.getItem('pixelseo_lang');
      if (savedLang === 'en' || savedLang === 'bn') {
        setLang(savedLang);
      }

      // Restore user conversion preferences (e.g. quality, format)
      const savedConv = localStorage.getItem('pixelseo_conv_prefs');
      if (savedConv) {
        const parsed = JSON.parse(savedConv);
        if (parsed && typeof parsed === 'object') {
          setConvPrefs((prev) => ({ ...prev, ...parsed }));
        }
      } else {
        const savedQuality = localStorage.getItem('pixelseo_quality');
        if (savedQuality) {
          const q = parseInt(savedQuality, 10);
          if (!isNaN(q) && q >= 1 && q <= 100) {
            setConvPrefs((prev) => ({ ...prev, quality: q }));
          }
        }
      }

      // Restore user watermark preferences (NEVER restore Blobs or URLs)
      const savedWm = localStorage.getItem('pixelseo_wm_prefs');
      if (savedWm) {
        const parsed = JSON.parse(savedWm);
        if (parsed && typeof parsed === 'object') {
          setWmPrefs((prev) => ({
            ...prev,
            ...parsed,
            logoBlob: null,
            logoUrl: null,
          }));
        }
      }
    } catch {
      // Ignore localStorage access restrictions in private browsing
    }
  }, [setTheme, setLang, setConvPrefs, setWmPrefs]);

  return <>{children}</>;
};

export const usePixelSeo = (): PixelSeoState => {
  return usePixelSeoStore();
};
