'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toolsCatalog } from '@/config/navigation';
import { usePixelSeo } from '@/context/PixelSeoContext';
import { cn } from '@/lib/utils';
import {
  FileImage,
  Stamp,
  Minimize2,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

const toolIcons: Record<string, React.ReactNode> = {
  '/tools/image-converter': <FileImage className="w-4 h-4" />,
  '/tools/watermark': <Stamp className="w-4 h-4" />,
  '/tools/image-compressor': <Minimize2 className="w-4 h-4" />,
  '/tools/csv-export': <FileSpreadsheet className="w-4 h-4" />,
  '/tools/seo-generator': <Sparkles className="w-4 h-4" />,
};

export function ToolSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { items, lang } = usePixelSeo();

  return (
    <aside className={cn('w-64 shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 space-y-6', className)}>
      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3">
          {lang === 'bn' ? 'টুলস ডিরেক্টরি' : 'Tools Directory'}
        </h3>
        <nav className="space-y-1 pt-1">
          {toolsCatalog.map((tool) => {
            const isActive = pathname === tool.href;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {toolIcons[tool.href] || <FileImage className="w-4 h-4" />}
                <span className="truncate">{lang === 'bn' ? tool.bnName : tool.name}</span>
                {tool.href === '/tools/image-converter' && items.length > 0 && (
                  <span className={cn(
                    'ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                  )}>
                    {items.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export default ToolSidebar;
