'use client';

import React from 'react';
import { AppLanguage, ProcessedImageItem } from '@/types';
import { translations } from '@/locales/dictionary';
import { Images, CheckCircle2, HardDrive, Zap, TrendingDown } from 'lucide-react';

interface StatsBarProps {
  items: ProcessedImageItem[];
  lang: AppLanguage;
}

export const StatsBar: React.FC<StatsBarProps> = ({ items, lang }) => {
  const t = translations[lang];

  if (items.length === 0) return null;

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'done').length;

  const totalOrigBytes = items.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalConvBytes = items.reduce(
    (acc, curr) => acc + (curr.convertedSize || curr.originalSize),
    0
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const savedBytes = Math.max(0, totalOrigBytes - totalConvBytes);
  const savedPercent =
    totalOrigBytes > 0 ? Math.round((savedBytes / totalOrigBytes) * 100) : 0;

  return (
    <div className="stats-strip">
      <div className="stat-item">
        <div className="stat-icon" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
          <Images size={22} />
        </div>
        <div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">{t.totalImages}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="stat-value">{completedCount} / {totalCount}</div>
          <div className="stat-label">{t.completedImages}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" style={{ background: 'rgba(100, 116, 139, 0.12)', color: 'var(--text-secondary)' }}>
          <HardDrive size={22} />
        </div>
        <div>
          <div className="stat-value">{formatSize(totalOrigBytes)}</div>
          <div className="stat-label">{t.originalTotalSize}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
          <Zap size={22} />
        </div>
        <div>
          <div className="stat-value">{formatSize(totalConvBytes)}</div>
          <div className="stat-label">{t.convertedTotalSize}</div>
        </div>
      </div>

      <div className="stat-item">
        <div className="stat-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
          <TrendingDown size={22} />
        </div>
        <div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>
            {savedPercent}%
          </div>
          <div className="stat-label">{t.totalSavings}</div>
        </div>
      </div>
    </div>
  );
};
