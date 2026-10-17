'use client';

import React from 'react';
import { useWatermark } from '@/hooks/use-watermark';
import { WatermarkPosition } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, Type, Image as ImageIcon, Grid, Layers, RotateCcw } from 'lucide-react';

const positions: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'TL' },
  { id: 'top-center', label: 'TC' },
  { id: 'top-right', label: 'TR' },
  { id: 'middle-left', label: 'ML' },
  { id: 'center', label: 'C' },
  { id: 'middle-right', label: 'MR' },
  { id: 'bottom-left', label: 'BL' },
  { id: 'bottom-center', label: 'BC' },
  { id: 'bottom-right', label: 'BR' },
];

export function WatermarkControls({ className }: { className?: string }) {
  const {
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
  } = useWatermark();

  return (
    <div className={cn('space-y-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800', className)}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Watermark Settings</h3>
          <p className="text-xs text-slate-500">Apply logo or copyright text with Bangla & Unicode support</p>
        </div>
        <input
          type="checkbox"
          checked={wmPrefs.enabled}
          onChange={(e) => toggleWatermark(e.target.checked)}
          className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
        />
      </div>

      {wmPrefs.enabled && (
        <div className="space-y-5">
          {/* Watermark Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setWmPrefs({ type: 'text' })}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                wmPrefs.type === 'text'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              )}
            >
              <Type className="w-4 h-4" />
              Text
            </button>
            <button
              type="button"
              onClick={() => setWmPrefs({ type: 'logo' })}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                wmPrefs.type === 'logo'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Logo
            </button>
            <button
              type="button"
              onClick={() => setWmPrefs({ type: 'both' })}
              className={cn(
                'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                wmPrefs.type === 'both'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              )}
            >
              <Layers className="w-4 h-4" />
              Both
            </button>
          </div>

          {/* Text input */}
          {(wmPrefs.type === 'text' || wmPrefs.type === 'both') && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Watermark Text (Bangla / Unicode)
              </label>
              <input
                type="text"
                value={wmPrefs.text}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="© Your Brand"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Bangla & Unicode Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400">Presets:</span>
                {[
                  { label: '© My Brand', value: '© My Brand' },
                  { label: 'গোপনীয়', value: 'গোপনীয় (CONFIDENTIAL)' },
                  { label: 'নমুনা ছবি', value: 'নমুনা ছবি (SAMPLE)' },
                  { label: 'কপিরাইট', value: '© কপিরাইট সংরক্ষিত' },
                  { label: 'DO NOT COPY', value: 'DO NOT COPY' },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setWatermarkText(p.value)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Logo input */}
          {(wmPrefs.type === 'logo' || wmPrefs.type === 'both') && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Logo Image (PNG, JPG, WEBP, SVG)
              </label>
              {wmPrefs.logoUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <span className="text-xs font-medium truncate max-w-[180px]">Logo Uploaded</span>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 transition-colors text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Upload Logo File (PNG/JPG/WEBP/SVG)</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Opacity Slider */}
          <Slider
            label="Opacity"
            value={Math.round(wmPrefs.opacity * 100)}
            valueDisplay={`${Math.round(wmPrefs.opacity * 100)}%`}
            min={0}
            max={100}
            onChange={(val) => setWatermarkOpacity(val / 100)}
          />

          {/* Size / Scale Slider */}
          <Slider
            label="Size / Scale"
            value={Math.round((wmPrefs.logoScale || 0.2) * 100)}
            valueDisplay={`${Math.round((wmPrefs.logoScale || 0.2) * 100)}%`}
            min={5}
            max={60}
            onChange={(val) => setWatermarkScale(val / 100)}
          />

          {/* Rotation Slider */}
          <Slider
            label="Rotation"
            value={wmPrefs.rotation || 0}
            valueDisplay={`${wmPrefs.rotation || 0}°`}
            min={-180}
            max={180}
            onChange={(val) => setWatermarkRotation(val)}
          />

          {/* Margin Slider */}
          <Slider
            label="Edge Margin"
            value={wmPrefs.margin ?? 24}
            valueDisplay={`${wmPrefs.margin ?? 24}px`}
            min={0}
            max={100}
            onChange={(val) => setWatermarkMargin(val)}
          />

          {/* 9-Point Grid Positioning */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5" />
              <span>Positioning (9-Point Grid)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 max-w-[200px]">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setWatermarkPosition(pos.id)}
                  className={cn(
                    'py-2 rounded-lg text-xs font-bold transition-all',
                    wmPrefs.position === pos.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setWatermarkPosition('tile')}
              className={cn(
                'w-full py-1.5 rounded-lg text-xs font-semibold border transition-all mt-1',
                wmPrefs.position === 'tile'
                  ? 'border-blue-600 bg-blue-50 text-blue-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600'
              )}
            >
              Repeat Tile Pattern
            </button>
          </div>

          {/* Batch Apply Scope */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Batch Apply</span>
              <span className="text-[11px] text-slate-400">
                {wmPrefs.applyScope === 'all' ? 'All Images' : 'Selected Only'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setWatermarkApplyScope('all')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all',
                  wmPrefs.applyScope === 'all'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                All Images
              </button>
              <button
                type="button"
                onClick={() => setWatermarkApplyScope('selected')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all',
                  wmPrefs.applyScope === 'selected'
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                )}
              >
                Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatermarkControls;
