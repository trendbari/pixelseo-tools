'use client';

import React from 'react';
import { useSeoStore } from '@/stores/seo-store';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function SeoResults() {
  const { output } = useSeoStore();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!output) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Generated Results</h3>

      {/* Meta Title */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Meta Title ({output.metaTitle.length} chars)</span>
          <button
            onClick={() => handleCopy(output.metaTitle, 'Meta Title')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            {copiedField === 'Meta Title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-100">
          {output.metaTitle}
        </div>
      </div>

      {/* Meta Description */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Meta Description ({output.metaDescription.length} chars)</span>
          <button
            onClick={() => handleCopy(output.metaDescription, 'Meta Description')}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            {copiedField === 'Meta Description' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300">
          {output.metaDescription}
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">Keywords & Tags</span>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {output.secondaryKeywords.map((kw, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
            >
              #{kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SeoResults;
