'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Eye } from 'lucide-react';

export interface WatermarkPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  className?: string;
  hasImage?: boolean;
}

export function WatermarkPreview({ canvasRef, className, hasImage }: WatermarkPreviewProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center min-h-[360px] rounded-2xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 overflow-hidden p-4',
        className
      )}
    >
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/70 backdrop-blur-md text-white text-xs font-medium">
        <Eye className="w-3.5 h-3.5" />
        <span>Live Canvas Preview (60fps)</span>
      </div>

      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[480px] object-contain rounded-lg shadow-md"
      />

      {!hasImage && (
        <div className="text-center p-6 text-slate-400">
          <p className="text-sm">Upload images to preview watermark placement</p>
        </div>
      )}
    </div>
  );
}

export default WatermarkPreview;
