export interface NavItem {
  name: string;
  bnName: string;
  href: string;
  description?: string;
  badge?: string;
}

export const headerNavItems: NavItem[] = [
  { name: 'Tools', bnName: 'টুলস', href: '/tools/image-converter' },
  { name: 'Watermark', bnName: 'ওয়াটারমার্ক', href: '/tools/watermark' },
  { name: 'Compressor', bnName: 'কম্প্রেসার', href: '/tools/image-compressor' },
  { name: 'CSV Export', bnName: 'সিএসভি এক্সপোর্ট', href: '/tools/csv-export' },
  { name: 'SEO Generator', bnName: 'এসইও স্টুডিও', href: '/tools/seo-generator', badge: 'AI-Ready' },
  { name: 'FAQ', bnName: 'প্রশ্নাবলী', href: '/faq' }
];

export const toolsCatalog: NavItem[] = [
  {
    name: 'Bulk WebP Converter',
    bnName: 'বাল্ক ওয়েবপি কনভার্টার',
    href: '/tools/image-converter',
    description: 'Convert up to 100 JPG/PNG images to modern WebP format.'
  },
  {
    name: 'Watermark Studio',
    bnName: 'ওয়াটারমার্ক স্টুডিও',
    href: '/tools/watermark',
    description: 'Protect catalog images with 9-point grid logo or text watermarks.'
  },
  {
    name: 'Image Compressor',
    bnName: 'ইমেজ কম্প্রেসার',
    href: '/tools/image-compressor',
    description: 'Shrink payload sizes with fine-grained lossy and lossless quality controls.'
  },
  {
    name: 'CSV Metadata Tool',
    bnName: 'সিএসভি মেটাডেটা টুল',
    href: '/tools/csv-export',
    description: 'Export 16-column RFC 4180 image metadata with UTF-8 BOM.'
  },
  {
    name: 'SEO Content Studio',
    bnName: 'এসইও কনটেন্ট স্টুডিও',
    href: '/tools/seo-generator',
    description: 'Bilingual rule-based title, alt text, and Schema.org generator.'
  }
];

export const footerCompanyLinks: NavItem[] = [
  { name: 'About PixelSEO', bnName: 'আমাদের সম্পর্কে', href: '/about' },
  { name: 'Privacy Policy', bnName: 'গোপনীয়তা নীতি', href: '/privacy' },
  { name: 'Terms of Service', bnName: 'ব্যবহারের শর্তাবলী', href: '/terms' },
  { name: 'Contact & Support', bnName: 'যোগাযোগ ও সহায়তা', href: '/contact' }
];
