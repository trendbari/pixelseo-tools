'use client';

import React from 'react';
import { useSeoStore } from '@/stores/seo-store';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function SeoForm() {
  const { input, setInput, generate } = useSeoStore();

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-white">Content Input</h3>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Product / Article Description
        </label>
        <textarea
          rows={4}
          value={input.contentText}
          onChange={(e) => setInput({ contentText: e.target.value })}
          placeholder="Enter product details, material, features, or article summary..."
          className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Keyword</label>
          <input
            type="text"
            value={input.targetKeyword}
            onChange={(e) => setInput({ targetKeyword: e.target.value })}
            placeholder="e.g. cotton t-shirt"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brand Name</label>
          <input
            type="text"
            value={input.brandName}
            onChange={(e) => setInput({ brandName: e.target.value })}
            placeholder="e.g. PixelSEO"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Button onClick={generate} className="w-full">
        <Sparkles className="w-4 h-4 mr-2" />
        Generate SEO Content
      </Button>
    </div>
  );
}

export default SeoForm;
