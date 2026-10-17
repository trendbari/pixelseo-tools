import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePixelSeoStore } from '@/store/usePixelSeoStore';
import { useImageStore } from '@/stores/image-store';
import { useSettingsStore } from '@/stores/settings-store';
import { generateUniqueImageId } from '@/types';

class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
  get length() { return Object.keys(this.store).length; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
}

const mockStorage = new LocalStorageMock();
Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  writable: true,
  configurable: true,
});

if (!URL.createObjectURL) {
  URL.createObjectURL = (blob: any) => `blob:mock-${Math.random().toString(36).substring(2, 8)}`;
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = (_url: string) => {};
}

describe('Unit Test: Zustand Store Architecture & State Lifecycle', () => {
  beforeEach(() => {
    mockStorage.clear();

    // Reset stores
    usePixelSeoStore.setState({
      items: [],
      isProcessing: false,
      previewItem: null,
      convPrefs: {
        format: 'webp',
        quality: 85,
        resizeEnabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        preserveAspectRatio: true,
        namingPattern: 'original',
        prefix: '',
        suffix: '',
      },
      wmPrefs: {
        enabled: false,
        type: 'text',
        text: '© My Brand',
        textColor: '#ffffff',
        fontFamily: 'Inter',
        fontSize: 28,
        position: 'bottom-right',
        opacity: 0.55,
        logoBlob: null,
        logoUrl: null,
        logoScale: 0.2,
        rotation: 0,
        margin: 24,
        hasShadow: true,
        shadowColor: 'rgba(0, 0, 0, 0.7)',
        shadowBlur: 6,
        applyScope: 'all',
        selectedImageIds: [],
      },
    });

    useImageStore.setState({
      items: [],
      activeItemId: null,
      isProcessing: false,
      totalProgress: 0,
    });
  });

  it('generates unique IDs for every image item preventing filename collisions', async () => {
    const file1 = new File(['content1'], 'photo.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'photo.jpg', { type: 'image/jpeg' });

    await usePixelSeoStore.getState().handleUploadFiles([file1, file2]);

    const items = usePixelSeoStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].name).toBe('photo.jpg');
    expect(items[1].name).toBe('photo.jpg');
    expect(items[0].id).not.toBe(items[1].id);
    expect(items[0].previewUrl).toBeDefined();
    expect(items[1].previewUrl).toBeDefined();
  });

  it('revokes Object URLs on single removal and clear all', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    const file1 = new File(['1'], 'a.png', { type: 'image/png' });
    const file2 = new File(['2'], 'b.png', { type: 'image/png' });

    await usePixelSeoStore.getState().handleUploadFiles([file1, file2]);
    const items = usePixelSeoStore.getState().items;
    const item1 = items[0];
    const item2 = items[1];

    // Remove single item
    usePixelSeoStore.getState().handleRemoveItem(item1.id);
    expect(revokeSpy).toHaveBeenCalledWith(item1.previewUrl);
    expect(usePixelSeoStore.getState().items).toHaveLength(1);

    // Clear all
    usePixelSeoStore.getState().handleClearAll();
    expect(revokeSpy).toHaveBeenCalledWith(item2.previewUrl);
    expect(usePixelSeoStore.getState().items).toHaveLength(0);

    revokeSpy.mockRestore();
  });

  it('marks converted items as stale and revokes convertedUrl when settings change', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

    const fakeConvertedUrl = 'blob:http://localhost/converted-webp-123';
    usePixelSeoStore.setState({
      items: [
        {
          id: 'test-1',
          file: new File([''], 'test.jpg', { type: 'image/jpeg' }),
          name: 'test.jpg',
          originalSize: 1000,
          originalWidth: 100,
          originalHeight: 100,
          previewUrl: 'blob:preview-1',
          convertedBlob: new Blob(['webp'], { type: 'image/webp' }),
          convertedUrl: fakeConvertedUrl,
          convertedSize: 500,
          status: 'done',
          progress: 100,
          isStale: false,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
      ],
    });

    // Change quality setting from 85 to 60
    usePixelSeoStore.getState().setConvPrefs((prev) => ({ ...prev, quality: 60 }));

    const updated = usePixelSeoStore.getState().items[0];
    expect(updated.status).toBe('idle');
    expect(updated.progress).toBe(0);
    expect(updated.isStale).toBe(true);
    expect(updated.convertedBlob).toBeNull();
    expect(updated.convertedUrl).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith(fakeConvertedUrl);

    revokeSpy.mockRestore();
  });

  it('marks converted items stale when watermark settings change', () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const fakeConvertedUrl = 'blob:http://localhost/converted-wm-456';

    usePixelSeoStore.setState({
      items: [
        {
          id: 'test-2',
          file: new File([''], 'test2.jpg', { type: 'image/jpeg' }),
          name: 'test2.jpg',
          originalSize: 1000,
          originalWidth: 100,
          originalHeight: 100,
          previewUrl: 'blob:preview-2',
          convertedBlob: new Blob(['webp'], { type: 'image/webp' }),
          convertedUrl: fakeConvertedUrl,
          convertedSize: 450,
          status: 'done',
          progress: 100,
          isStale: false,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
      ],
    });

    // Toggle watermark enabled
    usePixelSeoStore.getState().setWmPrefs((prev) => ({ ...prev, enabled: true }));

    const updated = usePixelSeoStore.getState().items[0];
    expect(updated.status).toBe('idle');
    expect(updated.isStale).toBe(true);
    expect(updated.convertedBlob).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith(fakeConvertedUrl);

    revokeSpy.mockRestore();
  });

  it('persists preferences to localStorage without writing large Blobs or image items', () => {
    usePixelSeoStore.getState().setTheme('dark');
    usePixelSeoStore.getState().setLang('bn');
    usePixelSeoStore.getState().setConvPrefs((prev) => ({ ...prev, quality: 75, format: 'webp' }));

    expect(localStorage.getItem('pixelseo_theme')).toBe('dark');
    expect(localStorage.getItem('pixelseo_lang')).toBe('bn');
    expect(localStorage.getItem('pixelseo_quality')).toBe('75');

    const convPrefsSaved = JSON.parse(localStorage.getItem('pixelseo_conv_prefs') || '{}');
    expect(convPrefsSaved.quality).toBe(75);
    expect(convPrefsSaved.format).toBe('webp');

    // Verify localStorage NEVER contains image items or Blobs
    const allStoredKeys = Object.keys(localStorage);
    expect(allStoredKeys).not.toContain('items');
    expect(allStoredKeys).not.toContain('images');
    expect(allStoredKeys).not.toContain('blobs');
  });

  it('coordinates stale invalidation between useSettingsStore and useImageStore', () => {
    const fakeUrl = 'blob:image-store-123';
    useImageStore.setState({
      items: [
        {
          id: 'img-1',
          file: new File([''], 'pic.png', { type: 'image/png' }),
          name: 'pic.png',
          originalSize: 2000,
          originalWidth: 200,
          originalHeight: 200,
          previewUrl: 'blob:preview-img-1',
          convertedBlob: new Blob(['result']),
          convertedUrl: fakeUrl,
          status: 'done',
          progress: 100,
          isStale: false,
          seo: { title: '', alt: '', description: '', tags: [], keywords: [] },
        },
      ],
    });

    // Trigger settings change via settingsStore
    useSettingsStore.getState().setConvPrefs({ quality: 40 });

    const updated = useImageStore.getState().items[0];
    expect(updated.status).toBe('idle');
    expect(updated.isStale).toBe(true);
    expect(updated.convertedBlob).toBeNull();
    expect(updated.convertedUrl).toBeNull();
  });
});
