import Link from 'next/link';
import { Home, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 mb-6">
        <ImageIcon className="w-10 h-10" />
      </div>
      <span className="text-sm font-semibold tracking-wide text-blue-600 uppercase mb-2">404 Error</span>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Page Not Found</h1>
      <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
        The tool or page you are looking for doesn&apos;t exist or has moved. Return to the homepage or start optimizing your images.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back to Homepage
        </Link>
        <Link
          href="/tools/image-converter"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Open Image Converter
        </Link>
      </div>
    </div>
  );
}
