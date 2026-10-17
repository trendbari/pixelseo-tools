import { describe, it, expect } from 'vitest';
import { useImageStore } from '@/stores/image-store';
import { useSettingsStore } from '@/stores/settings-store';

describe('Integration Test: Queue State & Settings Store', () => {
  it('manages image addition and clearing properly', () => {
    const { addFiles, clearAllImages } = useImageStore.getState();

    const mockFiles = [
      new File(['test1'], 'image1.png', { type: 'image/png' }),
      new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
    ];

    addFiles(mockFiles);
    expect(useImageStore.getState().items.length).toBe(2);

    clearAllImages();
    expect(useImageStore.getState().items.length).toBe(0);
  });

  it('updates conversion preferences correctly', () => {
    const { setConvPrefs } = useSettingsStore.getState();

    setConvPrefs({ quality: 90, format: 'webp' });
    expect(useSettingsStore.getState().convPrefs.quality).toBe(90);
    expect(useSettingsStore.getState().convPrefs.format).toBe('webp');
  });
});
