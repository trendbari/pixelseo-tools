export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center-left'
  | 'center'
  | 'middle-right'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ExtendedWatermarkPosition = WatermarkPosition | 'tile';

export type WatermarkType = 'text' | 'logo' | 'both';

export interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'logo' | 'both';

  text?: string;
  logoBlob?: Blob;

  position: WatermarkPosition;
  opacity: number; // 0-100
  sizePercent: number; // 5-60
  rotation: number; // -180 to 180
  margin: number;

  fontFamily: string;
  fontColor: string;
  shadowEnabled: boolean;
}

export interface WatermarkPreferences {
  enabled: boolean;
  type: WatermarkType;
  text: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  position: ExtendedWatermarkPosition;
  opacity: number; // 0 to 1, default 0.55
  logoBlob: Blob | null;
  logoUrl: string | null;
  logoScale: number; // 0.05 to 0.60
  rotation: number; // -180 to +180
  margin: number; // 0 to 100 px
  hasShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  applyScope: 'all' | 'selected';
  selectedImageIds: string[];
}

/**
 * Adapter: Convert WatermarkPreferences to WatermarkSettings
 */
export function toWatermarkSettings(prefs: WatermarkPreferences): WatermarkSettings {
  const safePosition: WatermarkPosition =
    prefs.position === 'tile' ? 'bottom-right' : prefs.position;

  return {
    enabled: prefs.enabled,
    type: prefs.type === 'both' ? 'text' : prefs.type,
    text: prefs.text,
    logoBlob: prefs.logoBlob || undefined,
    position: safePosition,
    opacity: Math.round(prefs.opacity * 100),
    sizePercent: Math.round((prefs.logoScale || 0.2) * 100),
    rotation: prefs.rotation,
    margin: prefs.margin,
    fontFamily: prefs.fontFamily,
    fontColor: prefs.textColor,
    shadowEnabled: prefs.hasShadow,
  };
}

/**
 * Adapter: Convert WatermarkSettings to WatermarkPreferences
 */
export function fromWatermarkSettings(settings: WatermarkSettings): WatermarkPreferences {
  return {
    enabled: settings.enabled,
    type: settings.type,
    text: settings.text || '© My Brand',
    textColor: settings.fontColor || '#FFFFFF',
    fontFamily: settings.fontFamily || 'Inter',
    fontSize: 24,
    position: settings.position,
    opacity: Math.max(0, Math.min(1, settings.opacity / 100)),
    logoBlob: settings.logoBlob || null,
    logoUrl: settings.logoBlob ? URL.createObjectURL(settings.logoBlob) : null,
    logoScale: Math.max(0.05, Math.min(0.6, settings.sizePercent / 100)),
    rotation: settings.rotation,
    margin: settings.margin,
    hasShadow: settings.shadowEnabled,
    shadowColor: 'rgba(0,0,0,0.6)',
    shadowBlur: 4,
    applyScope: 'all',
    selectedImageIds: [],
  };
}
