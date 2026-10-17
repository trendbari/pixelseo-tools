'use client';

import React from 'react';
import { useProcessingQueue } from '@/hooks/use-processing-queue';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function ProgressPanel({ className }: { className?: string }) {
  const { totalProgress, isProcessing, completedCount, errorCount, pendingCount, items } =
    useProcessingQueue();

  if (items.length === 0) return null;

  return (
    <div className={cn('p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Batch Progress</span>
          {isProcessing && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-medium animate-pulse">
              Converting...
            </span>
          )}
        </div>
        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
          {totalProgress}%
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{completedCount} Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span>{pendingCount} Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
          <span>{errorCount} Errored</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressPanel;
