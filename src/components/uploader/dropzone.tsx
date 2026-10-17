'use client';

import React, { useRef } from 'react';
import { UploadCloud, FolderUp } from 'lucide-react';
import { useImageUpload } from '@/hooks/use-image-upload';
import { cn } from '@/lib/utils';

export interface DropzoneProps {
  className?: string;
  maxFiles?: number;
}

export function Dropzone({ className, maxFiles = 100 }: DropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { isDragging, handleDragOver, handleDragLeave, handleDrop, handleFileInput } = useImageUpload();

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={cn(
        'relative border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all',
        isDragging
          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-900 shadow-sm',
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory="true"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Drag & Drop Your Images
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload up to {maxFiles} JPG, PNG, WEBP, or AVIF images at once
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Choose Images
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
          >
            <FolderUp className="w-3.5 h-3.5" />
            Upload Folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dropzone;
