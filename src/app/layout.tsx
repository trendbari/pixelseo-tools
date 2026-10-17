import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PixelSeoProvider } from '@/context/PixelSeoContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563EB',
};

export const metadata: Metadata = {
  title: 'PixelSEO Tools 2.0 - Bulk Image Converter to WebP & SEO Generator',
  description:
    'Free bulk image optimizer: Convert up to 100 JPG/PNG images to WebP, add logo or text watermarks, generate SEO Alt text, and export CSV metadata. 100% client-side secure.',
  keywords: [
    'bulk webp converter',
    'image optimizer',
    'watermark studio',
    'image seo generator',
    'alt text generator',
    'shopify image compression',
    'woocommerce image optimizer',
    'bangla image converter',
  ],
  authors: [{ name: 'PixelSEO Studio' }],
  openGraph: {
    title: 'PixelSEO Tools 2.0 - Free Bulk Image Converter & SEO Studio',
    description:
      'Fast, free, and private: Convert up to 100 images to WebP, imprint watermarks, and export SEO metadata with zero server upload.',
    url: 'https://pixelseo.tools',
    siteName: 'PixelSEO Tools',
    images: [
      {
        url: 'https://pixelseo.tools/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PixelSEO Tools 2.0 Bulk Image Optimizer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixelSEO Tools 2.0 - Bulk Image Converter to WebP',
    description:
      'Convert up to 100 images in your browser. Fast, free, watermarking, and SEO metadata CSV export.',
  },
};

import { Toaster } from 'sonner';
import { CompactMobileNav } from '@/components/CompactMobileNav';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <PixelSeoProvider>
          {children}
          <CompactMobileNav />
          <Toaster richColors position="bottom-right" closeButton />
        </PixelSeoProvider>
      </body>
    </html>
  );
}


