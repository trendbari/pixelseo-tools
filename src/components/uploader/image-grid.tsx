'use client';

import React from 'react';
import { ProcessedImageItem, ConversionPreferences, AppLanguage } from '@/types';
import { ImageCard } from './image-card';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

export interface ImageGridProps {
  items: ProcessedImageItem[];
  viewMode?: 'grid' | 'list';
  convPrefs?: ConversionPreferences;
  lang?: AppLanguage;
  onRemove?: (id: string) => void;
  onInspect?: (item: ProcessedImageItem) => void;
  onUpdateSeo?: (id: string, alt: string, title: string) => void;
  className?: string;
}

export function ImageGrid({
  items,
  viewMode = 'grid',
  convPrefs: propConvPrefs,
  lang: propLang,
  onRemove,
  onInspect,
  onUpdateSeo,
  className,
}: ImageGridProps) {
  const storeConvPrefs = useSettingsStore((state) => state.convPrefs);
  const storeLang = useSettingsStore((state) => state.lang);
  const convPrefs = propConvPrefs || storeConvPrefs;
  const lang = propLang || storeLang;

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
          : 'flex flex-col space-y-3',
        className
      )}
    >
      {items.map((item, idx) => (
        <ImageCard
          key={item.id}
          item={item}
          index={idx}
          lang={lang}
          convPrefs={convPrefs}
          onRemove={onRemove || (() => {})}
          onPreview={onInspect || (() => {})}
          onUpdateSeo={onUpdateSeo || (() => {})}
        />
      ))}
    </div>
  );
}

export default ImageGrid;
