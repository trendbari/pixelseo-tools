import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settings-store';
import { WatermarkPreferences, ExtendedWatermarkPosition } from '@/types';
import { toast } from 'sonner';

export function useWatermark() {
  const { wmPrefs, setWmPrefs } = useSettingsStore();

  const setWatermarkText = useCallback(
    (text: string) => setWmPrefs({ text }),
    [setWmPrefs]
  );

  const setWatermarkOpacity = useCallback(
    (opacity: number) => setWmPrefs({ opacity: Math.max(0, Math.min(1, opacity)) }),
    [setWmPrefs]
  );

  const setWatermarkPosition = useCallback(
    (position: ExtendedWatermarkPosition) => setWmPrefs({ position }),
    [setWmPrefs]
  );

  const toggleWatermark = useCallback(
    (enabled: boolean) => setWmPrefs({ enabled }),
    [setWmPrefs]
  );

  const setLogoFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setWmPrefs({
        logoBlob: file,
        logoUrl: url,
        type: wmPrefs.type === 'text' ? 'both' : wmPrefs.type,
      });
      toast.success('Watermark logo uploaded');
    },
    [setWmPrefs, wmPrefs.type]
  );

  const removeLogo = useCallback(() => {
    if (wmPrefs.logoUrl) URL.revokeObjectURL(wmPrefs.logoUrl);
    setWmPrefs({
      logoBlob: null,
      logoUrl: null,
      type: 'text',
    });
    toast.info('Watermark logo removed');
  }, [setWmPrefs, wmPrefs.logoUrl]);

  const setWatermarkRotation = useCallback(
    (rotation: number) => setWmPrefs({ rotation }),
    [setWmPrefs]
  );

  const setWatermarkScale = useCallback(
    (logoScale: number) => setWmPrefs({ logoScale: Math.max(0.05, Math.min(0.6, logoScale)) }),
    [setWmPrefs]
  );

  const setWatermarkMargin = useCallback(
    (margin: number) => setWmPrefs({ margin }),
    [setWmPrefs]
  );

  const setWatermarkApplyScope = useCallback(
    (applyScope: 'all' | 'selected') => setWmPrefs({ applyScope }),
    [setWmPrefs]
  );

  return {
    wmPrefs,
    setWmPrefs,
    setWatermarkText,
    setWatermarkOpacity,
    setWatermarkPosition,
    setWatermarkRotation,
    setWatermarkScale,
    setWatermarkMargin,
    setWatermarkApplyScope,
    toggleWatermark,
    setLogoFile,
    removeLogo,
  };
}
