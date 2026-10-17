'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  AppLanguage,
  WatermarkPreferences,
  WatermarkPosition,
  ProcessedImageItem,
} from '@/types';
import { translations } from '@/locales/dictionary';
import { sanitizeAndLoadSvgFile } from '@/lib/svgSanitizer';
import { applyWatermarkToCanvas } from '@/lib/image/watermark';
import {
  Stamp,
  Upload,
  Eye,
  Grid,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Type,
  ImageIcon,
  Layers,
  CheckCircle,
  Sliders,
  Sun,
  ShieldAlert,
} from 'lucide-react';

interface WatermarkStudioPanelProps {
  lang: AppLanguage;
  prefs: WatermarkPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<WatermarkPreferences>>;
  queueItems?: ProcessedImageItem[];
}

export const WatermarkStudioPanel: React.FC<WatermarkStudioPanelProps> = ({
  lang,
  prefs,
  setPrefs,
  queueItems = [],
}) => {
  const t = translations[lang];
  const logoInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Selected preview background image
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);
  const [svgSecurityNotice, setSvgSecurityNotice] = useState<string | null>(null);

  // Web-Safe Fonts List
  const fonts = [
    { label: 'Inter (Modern Sans)', value: 'Inter' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Montserrat', value: 'Montserrat' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
    { label: 'Georgia (Editorial Serif)', value: 'Georgia' },
    { label: 'Courier New (Monospace)', value: 'Courier New' },
  ];

  // Preset Colors
  const presetColors = ['#FFFFFF', '#0F172A', '#2563EB', '#10B981', '#F59E0B', '#EF4444'];

  // 9-point grid layout positions
  const gridPositions: { key: WatermarkPosition; label: string }[] = [
    { key: 'top-left', label: 'Top Left' },
    { key: 'top-center', label: 'Top Center' },
    { key: 'top-right', label: 'Top Right' },
    { key: 'middle-left', label: 'Mid Left' },
    { key: 'center', label: 'Center' },
    { key: 'middle-right', label: 'Mid Right' },
    { key: 'bottom-left', label: 'Bottom Left' },
    { key: 'bottom-center', label: 'Bottom Center' },
    { key: 'bottom-right', label: 'Bottom Right' },
  ];

  // Restore Defaults
  const handleRestoreDefaults = () => {
    setPrefs({
      enabled: true,
      type: 'text',
      text: '© My Brand',
      textColor: '#FFFFFF',
      fontFamily: 'Inter',
      fontSize: 28,
      position: 'bottom-right',
      opacity: 0.55, // Default 55% as per wireframe
      logoBlob: null,
      logoUrl: null,
      logoScale: 0.2, // 20%
      rotation: 0,
      margin: 24,
      hasShadow: true,
      shadowColor: 'rgba(0, 0, 0, 0.7)',
      shadowBlur: 6,
      applyScope: 'all',
      selectedImageIds: [],
    });
  };

  // Safe Logo Upload with SVG Sanitization
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (prefs.logoUrl) {
      URL.revokeObjectURL(prefs.logoUrl);
    }

    try {
      if (file.type === 'image/svg+xml') {
        // Run safe client-side SVG sanitizer
        const { sanitizedBlob, objectUrl } = await sanitizeAndLoadSvgFile(file);
        setPrefs((p) => ({
          ...p,
          logoBlob: sanitizedBlob,
          logoUrl: objectUrl,
        }));
        setSvgSecurityNotice('SVG successfully sanitized & safe from remote scripts');
        setTimeout(() => setSvgSecurityNotice(null), 4000);
      } else {
        const url = URL.createObjectURL(file);
        setPrefs((p) => ({
          ...p,
          logoBlob: file,
          logoUrl: url,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid image file';
      alert(`Logo upload failed: ${msg}`);
    }
  };

  // Real-Time Canvas Rendering in Live Preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isMounted = true;
    const width = 800;
    const height = 500;
    canvas.width = width;
    canvas.height = height;

    const activeItem = queueItems[selectedPreviewIndex];
    const previewSrc = activeItem ? (activeItem.convertedUrl || activeItem.previewUrl) : null;

    const renderWatermarkOnCanvas = async (bgImg?: HTMLImageElement) => {
      if (!isMounted) return;

      // Draw background
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, width, height);
      } else {
        // Draw elegant default demo product card
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1E293B');
        grad.addColorStop(1, '#0F172A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 40; x < width; x += 40) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = 40; y < height; y += 40) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();

        // Product mockup placeholder shape
        ctx.fillStyle = '#2563EB';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 140, height / 2 - 100, 280, 200, 16);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sample Product Showcase', width / 2, height / 2 - 10);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#93C5FD';
        ctx.fillText('1200 × 800 px High-Res', width / 2, height / 2 + 24);
      }

      // Draw Watermark using the exact unified rendering function as export
      if (prefs.enabled && isMounted) {
        await applyWatermarkToCanvas(ctx, width, height, prefs, logoImg);
      }
    };

    let logoImg: HTMLImageElement | null = null;
    if ((prefs.type === 'logo' || prefs.type === 'both') && prefs.logoUrl) {
      logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        if (previewSrc) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => renderWatermarkOnCanvas(bgImg);
          bgImg.src = previewSrc;
        } else {
          renderWatermarkOnCanvas();
        }
      };
      logoImg.src = prefs.logoUrl;
    } else {
      if (previewSrc) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = () => renderWatermarkOnCanvas(bgImg);
        bgImg.src = previewSrc;
      } else {
        renderWatermarkOnCanvas();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [prefs, queueItems, selectedPreviewIndex]);

  // Current Settings Summary String (e.g. Text: © My Brand · Opacity: 55% · bottom-right)
  const currentSettingsSummary = `${
    prefs.type === 'text'
      ? `Text: ${prefs.text || '© My Brand'}`
      : prefs.type === 'logo'
      ? `Logo: ${prefs.logoBlob ? 'Custom Logo' : 'Uploaded'}`
      : `Logo + Text: ${prefs.text || '© My Brand'}`
  } · Opacity: ${Math.round(prefs.opacity * 100)}% · ${prefs.position} · Size: ${Math.round(
    (prefs.logoScale || 0.2) * 100
  )}% · Rotation: ${prefs.rotation || 0}°`;

  return (
    <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* 1. Header with Title & Reset Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="brand-icon-box" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
            <Stamp size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {lang === 'bn' ? 'ওয়াটারমার্ক এডিটর' : 'Watermark Editor'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {lang === 'bn'
                ? 'রিয়েল-টাইম প্রিভিউ এবং ব্যাচ ওয়াটারমার্ক সেটিংস'
                : 'Live Preview & Batch Watermarking Studio'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Enable Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
            <input
              type="checkbox"
              id="watermarkMasterToggle"
              checked={prefs.enabled}
              onChange={(e) => setPrefs((p) => ({ ...p, enabled: e.target.checked }))}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
            />
            <label htmlFor="watermarkMasterToggle" style={{ fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
              {t.watermarkEnable}
            </label>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRestoreDefaults}
            title="Restore Defaults"
            style={{ padding: '7px 12px', fontSize: '0.82rem' }}
          >
            <RotateCcw size={14} />
            <span>{lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Restore Defaults'}</span>
          </button>
        </div>
      </div>

      {/* SVG Security Notification Banner */}
      {svgSecurityNotice && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 16px',
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.84rem',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={16} />
          <span>{svgSecurityNotice}</span>
        </div>
      )}

      {/* Main Studio Grid: Left Live Preview | Right Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Live Preview Box */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700 }}>
              <Eye size={18} style={{ color: 'var(--primary-blue)' }} />
              <span>{lang === 'bn' ? 'লাইভ প্রিভিউ (Live Preview)' : 'Live Preview'}</span>
            </div>

            {/* Queue Item Switcher for preview */}
            {queueItems.length > 0 && (
              <select
                className="form-select"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.78rem' }}
                value={selectedPreviewIndex}
                onChange={(e) => setSelectedPreviewIndex(Number(e.target.value))}
              >
                {queueItems.map((item, idx) => (
                  <option key={item.id} value={idx}>
                    Preview: {item.name.substring(0, 20)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)',
              background: '#0F172A',
            }}
          >
            {/* Live Canvas */}
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '420px',
                objectFit: 'contain',
              }}
            />

            {/* Wireframe Tagline overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '12px',
                fontSize: '0.74rem',
                color: 'rgba(255, 255, 255, 0.75)',
                background: 'rgba(15, 23, 42, 0.75)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {lang === 'bn'
                ? 'Product preview — এখানে আপলোড করা ছবিতে Watermark দেখা যাবে'
                : 'Product preview — Live watermark rendering'}
            </div>
          </div>

          {/* Current Settings Summary Strip (Wireframe Requirement) */}
          <div
            style={{
              marginTop: '14px',
              padding: '12px 16px',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Current Settings
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--primary-blue)', wordBreak: 'break-all' }}>
              {currentSettingsSummary}
            </div>
          </div>
        </div>

        {/* Right Column: Watermark Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Type Selector: Text Watermark | Logo Watermark | Both */}
          <div>
            <label className="form-label" style={{ fontWeight: 700 }}>
              {t.watermarkType}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${prefs.type === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                onClick={() => setPrefs((p) => ({ ...p, type: 'text' }))}
              >
                <Type size={16} />
                <span>Text Watermark</span>
              </button>

              <button
                type="button"
                className={`btn ${prefs.type === 'logo' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                onClick={() => setPrefs((p) => ({ ...p, type: 'logo' }))}
              >
                <ImageIcon size={16} />
                <span>Logo Watermark</span>
              </button>

              <button
                type="button"
                className={`btn ${prefs.type === 'both' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                onClick={() => setPrefs((p) => ({ ...p, type: 'both' }))}
              >
                <Layers size={16} />
                <span>Both</span>
              </button>
            </div>
          </div>

          {/* Text Controls (if text or both) */}
          {(prefs.type === 'text' || prefs.type === 'both') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Text Input */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{lang === 'bn' ? 'ওয়াটারমার্ক টেক্সট' : 'Watermark Text'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="© My Brand"
                  value={prefs.text}
                  onChange={(e) => setPrefs((p) => ({ ...p, text: e.target.value }))}
                />
                {/* Bangla & Unicode Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Presets:</span>
                  {[
                    { label: '© My Brand', value: '© My Brand' },
                    { label: 'গোপনীয়', value: 'গোপনীয় (CONFIDENTIAL)' },
                    { label: 'নমুনা ছবি', value: 'নমুনা ছবি (SAMPLE)' },
                    { label: 'কপিরাইট সংরক্ষিত', value: '© কপিরাইট সংরক্ষিত' },
                    { label: 'DO NOT COPY', value: 'DO NOT COPY' },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
                      onClick={() => setPrefs((p) => ({ ...p, text: preset.value }))}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family & Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Font Family</label>
                  <select
                    className="form-select"
                    value={prefs.fontFamily}
                    onChange={(e) => setPrefs((p) => ({ ...p, fontFamily: e.target.value }))}
                  >
                    {fonts.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={prefs.textColor}
                      onChange={(e) => setPrefs((p) => ({ ...p, textColor: e.target.value }))}
                      style={{ width: '38px', height: '38px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </div>

              {/* Preset Colors Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
                {presetColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, textColor: c }))}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: prefs.textColor === c ? '2px solid var(--primary-blue)' : '1px solid var(--border-medium)',
                      cursor: 'pointer',
                    }}
                    title={c}
                  />
                ))}
              </div>

              {/* Shadow Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="wmShadowToggle"
                  checked={prefs.hasShadow}
                  onChange={(e) => setPrefs((p) => ({ ...p, hasShadow: e.target.checked }))}
                  style={{ accentColor: 'var(--primary-blue)', cursor: 'pointer' }}
                />
                <label htmlFor="wmShadowToggle" style={{ fontSize: '0.84rem', cursor: 'pointer', fontWeight: 600 }}>
                  Enable Drop Shadow (Contrast on any photo)
                </label>
              </div>
            </div>
          )}

          {/* Logo Controls (if logo or both) */}
          {(prefs.type === 'logo' || prefs.type === 'both') && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Logo Image (PNG, JPG, WEBP, SVG)</label>
              <input
                type="file"
                ref={logoInputRef}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <Upload size={16} />
                  <span>{prefs.logoUrl ? t.changeLogo : 'Upload Logo (PNG/JPG/WEBP/SVG)'}</span>
                </button>

                {prefs.logoUrl && (
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      background: '#0F172A',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prefs.logoUrl}
                      alt="Logo preview"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                SVG files are automatically sanitized client-side to ensure zero malicious scripts.
              </div>
            </div>
          )}

          {/* Opacity Slider: 0–100% (Wireframe: 55%) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label" style={{ fontWeight: 700 }}>
              <span>{t.watermarkOpacity}</span>
              <span className="slider-val-badge">{Math.round(prefs.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={prefs.opacity}
              className="range-slider"
              onChange={(e) => setPrefs((p) => ({ ...p, opacity: Number(e.target.value) }))}
            />
          </div>

          {/* Size / Scale Slider: 5%–60% */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label" style={{ fontWeight: 700 }}>
              <span>Size / Scale (5–60% of image width)</span>
              <span className="slider-val-badge">{Math.round((prefs.logoScale || 0.2) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.05}
              max={0.6}
              step={0.01}
              value={prefs.logoScale || 0.2}
              className="range-slider"
              onChange={(e) => setPrefs((p) => ({ ...p, logoScale: Number(e.target.value) }))}
            />
          </div>

          {/* Rotation Slider: -180° to +180° */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label" style={{ fontWeight: 700 }}>
              <span>Rotation (-180° to +180°)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="slider-val-badge">{prefs.rotation || 0}°</span>
                {prefs.rotation !== 0 && (
                  <button
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, rotation: 0 }))}
                    style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer' }}
                  >
                    Reset 0°
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={prefs.rotation || 0}
              className="range-slider"
              onChange={(e) => setPrefs((p) => ({ ...p, rotation: Number(e.target.value) }))}
            />
          </div>

          {/* Margin Slider: 0–100px */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label" style={{ fontWeight: 700 }}>
              <span>Edge Margin (0–100px)</span>
              <span className="slider-val-badge">{prefs.margin ?? 24}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={2}
              value={prefs.margin ?? 24}
              className="range-slider"
              onChange={(e) => setPrefs((p) => ({ ...p, margin: Number(e.target.value) }))}
            />
          </div>

          {/* Position 9-Point Grid + Tile (Wireframe) */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 700 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Grid size={16} />
                Position (9-Point Grid)
              </span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              {gridPositions.map((pos) => (
                <button
                  key={pos.key}
                  type="button"
                  className={`btn ${prefs.position === pos.key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px', fontSize: '0.76rem', fontWeight: 600 }}
                  onClick={() => setPrefs((p) => ({ ...p, position: pos.key }))}
                >
                  {pos.label}
                </button>
              ))}
            </div>

            {/* Tile Pattern Button */}
            <button
              type="button"
              className={`btn ${prefs.position === 'tile' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', padding: '8px', fontSize: '0.82rem' }}
              onClick={() => setPrefs((p) => ({ ...p, position: 'tile' }))}
            >
              Repeating Pattern Tiling (Copyright Guard)
            </button>
          </div>

          {/* Apply Scope: All Images vs Selected */}
          <div
            style={{
              padding: '14px',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Apply Scope</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                {prefs.applyScope === 'all' ? 'Applied to all uploaded images in batch' : 'Applied to selected queue items'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${prefs.applyScope === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => setPrefs((p) => ({ ...p, applyScope: 'all' }))}
              >
                All Images
              </button>
              <button
                type="button"
                className={`btn ${prefs.applyScope === 'selected' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                onClick={() => setPrefs((p) => ({ ...p, applyScope: 'selected' }))}
              >
                Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
