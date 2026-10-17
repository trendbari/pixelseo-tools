import { describe, it, expect } from 'vitest';
import {
  WatermarkPosition,
  WatermarkSettings,
  WatermarkPreferences,
  toWatermarkSettings,
  fromWatermarkSettings,
} from '@/types';

describe('Unit Test: Watermark Types & Model Adapters', () => {
  it('validates WatermarkSettings contract', () => {
    const settings: WatermarkSettings = {
      enabled: true,
      type: 'text',
      text: '© My Brand',
      position: 'bottom-right',
      opacity: 55,
      sizePercent: 20,
      rotation: 0,
      margin: 24,
      fontFamily: 'Inter',
      fontColor: '#FFFFFF',
      shadowEnabled: true,
    };

    expect(settings.enabled).toBe(true);
    expect(settings.type).toBe('text');
    expect(settings.position).toBe('bottom-right');
    expect(settings.opacity).toBe(55);
    expect(settings.sizePercent).toBe(20);
    expect(settings.fontColor).toBe('#FFFFFF');
  });

  it('converts WatermarkPreferences to WatermarkSettings accurately', () => {
    const prefs: WatermarkPreferences = {
      enabled: true,
      type: 'logo',
      text: 'Brand Text',
      textColor: '#10B981',
      fontFamily: 'Roboto',
      fontSize: 28,
      position: 'center',
      opacity: 0.75,
      logoBlob: new Blob(['logo'], { type: 'image/png' }),
      logoUrl: 'blob:logo',
      logoScale: 0.35,
      rotation: 15,
      margin: 32,
      hasShadow: true,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 5,
      applyScope: 'all',
      selectedImageIds: [],
    };

    const settings = toWatermarkSettings(prefs);
    expect(settings.enabled).toBe(true);
    expect(settings.type).toBe('logo');
    expect(settings.position).toBe('center');
    expect(settings.opacity).toBe(75);
    expect(settings.sizePercent).toBe(35);
    expect(settings.rotation).toBe(15);
    expect(settings.margin).toBe(32);
    expect(settings.fontColor).toBe('#10B981');
    expect(settings.shadowEnabled).toBe(true);
  });

  it('converts WatermarkSettings to WatermarkPreferences accurately', () => {
    const settings: WatermarkSettings = {
      enabled: false,
      type: 'text',
      text: 'Watermark Preview',
      position: 'top-left',
      opacity: 40,
      sizePercent: 25,
      rotation: -10,
      margin: 16,
      fontFamily: 'Inter',
      fontColor: '#F59E0B',
      shadowEnabled: false,
    };

    const prefs = fromWatermarkSettings(settings);
    expect(prefs.enabled).toBe(false);
    expect(prefs.position).toBe('top-left');
    expect(prefs.opacity).toBe(0.4);
    expect(prefs.logoScale).toBe(0.25);
    expect(prefs.rotation).toBe(-10);
    expect(prefs.margin).toBe(16);
    expect(prefs.textColor).toBe('#F59E0B');
    expect(prefs.hasShadow).toBe(false);
  });

  it('calculates 9-point coordinates accurately', async () => {
    const { calculateWatermarkCoordinates } = await import('@/lib/image/watermark');
    const w = 1000;
    const h = 800;
    const itemW = 200;
    const itemH = 60;
    const margin = 20;

    // Top row
    expect(calculateWatermarkCoordinates('top-left', w, h, itemW, itemH, margin)).toEqual({ x: 20, y: 80 });
    expect(calculateWatermarkCoordinates('top-center', w, h, itemW, itemH, margin)).toEqual({ x: 400, y: 80 });
    expect(calculateWatermarkCoordinates('top-right', w, h, itemW, itemH, margin)).toEqual({ x: 780, y: 80 });

    // Middle row
    expect(calculateWatermarkCoordinates('middle-left', w, h, itemW, itemH, margin)).toEqual({ x: 20, y: 430 });
    expect(calculateWatermarkCoordinates('center-left', w, h, itemW, itemH, margin)).toEqual({ x: 20, y: 430 });
    expect(calculateWatermarkCoordinates('center', w, h, itemW, itemH, margin)).toEqual({ x: 400, y: 430 });
    expect(calculateWatermarkCoordinates('middle-right', w, h, itemW, itemH, margin)).toEqual({ x: 780, y: 430 });
    expect(calculateWatermarkCoordinates('center-right', w, h, itemW, itemH, margin)).toEqual({ x: 780, y: 430 });

    // Bottom row
    expect(calculateWatermarkCoordinates('bottom-left', w, h, itemW, itemH, margin)).toEqual({ x: 20, y: 780 });
    expect(calculateWatermarkCoordinates('bottom-center', w, h, itemW, itemH, margin)).toEqual({ x: 400, y: 780 });
    expect(calculateWatermarkCoordinates('bottom-right', w, h, itemW, itemH, margin)).toEqual({ x: 780, y: 780 });
  });

  it('verifies Bangla Unicode font stack contains Noto Sans Bengali and SolaimanLipi', async () => {
    const { BANGLA_UNICODE_FONT_STACK } = await import('@/lib/image/watermark');
    expect(BANGLA_UNICODE_FONT_STACK).toContain('Noto Sans Bengali');
    expect(BANGLA_UNICODE_FONT_STACK).toContain('SolaimanLipi');
    expect(BANGLA_UNICODE_FONT_STACK).toContain('Kalpurush');
  });

  it('applies Unicode Bangla text watermark to mock canvas with correct rotation and opacity', async () => {
    const { applyWatermarkToCanvas } = await import('@/lib/image/watermark');

    const fillTextCalls: Array<{ text: string; x: number; y: number }> = [];
    const translates: Array<{ x: number; y: number }> = [];
    let rotatedAngle = 0;

    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: (x: number, y: number) => {
        translates.push({ x, y });
      },
      rotate: (rad: number) => {
        rotatedAngle = rad;
      },
      measureText: (txt: string) => ({ width: txt.length * 15 }),
      fillText: (text: string, x: number, y: number) => {
        fillTextCalls.push({ text, x, y });
      },
      drawImage: () => {},
      globalAlpha: 1,
      font: '',
      fillStyle: '',
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      textAlign: '',
      textBaseline: '',
    } as unknown as CanvasRenderingContext2D;

    const banglaPrefs: WatermarkPreferences = {
      enabled: true,
      type: 'text',
      text: '© কপিরাইট সংরক্ষিত ২০২৬',
      textColor: '#FF0000',
      fontFamily: 'Inter',
      fontSize: 28,
      position: 'bottom-right',
      opacity: 0.65,
      logoBlob: null,
      logoUrl: null,
      logoScale: 0.2,
      rotation: -15,
      margin: 24,
      hasShadow: true,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 4,
      applyScope: 'all',
      selectedImageIds: [],
    };

    await applyWatermarkToCanvas(mockCtx, 1000, 800, banglaPrefs);

    expect(mockCtx.globalAlpha).toBe(0.65);
    expect(mockCtx.fillStyle).toBe('#FF0000');
    expect(mockCtx.font).toContain('Noto Sans Bengali');
    expect(rotatedAngle).toBeCloseTo((-15 * Math.PI) / 180);
    expect(fillTextCalls.length).toBe(1);
    expect(fillTextCalls[0].text).toBe('© কপিরাইট সংরক্ষিত ২০২৬');
  });

  it('filters watermark application based on applyScope: all vs selected', () => {
    const basePrefs: WatermarkPreferences = {
      enabled: true,
      type: 'text',
      text: 'Watermark',
      textColor: '#FFFFFF',
      fontFamily: 'Inter',
      fontSize: 24,
      position: 'bottom-right',
      opacity: 0.5,
      logoBlob: null,
      logoUrl: null,
      logoScale: 0.2,
      rotation: 0,
      margin: 20,
      hasShadow: false,
      shadowColor: '',
      shadowBlur: 0,
      applyScope: 'selected',
      selectedImageIds: ['img-1', 'img-3'],
    };

    // Helper simulating queue condition
    const isApplicable = (item: { id: string }, prefs: WatermarkPreferences) =>
      prefs.enabled &&
      (prefs.applyScope === 'all' ||
        (prefs.applyScope === 'selected' && prefs.selectedImageIds.includes(item.id)));

    expect(isApplicable({ id: 'img-1' }, basePrefs)).toBe(true);
    expect(isApplicable({ id: 'img-2' }, basePrefs)).toBe(false);
    expect(isApplicable({ id: 'img-3' }, basePrefs)).toBe(true);

    const allPrefs: WatermarkPreferences = { ...basePrefs, applyScope: 'all' };
    expect(isApplicable({ id: 'img-1' }, allPrefs)).toBe(true);
    expect(isApplicable({ id: 'img-2' }, allPrefs)).toBe(true);
  });
});

