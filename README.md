# PixelSEO Tools 3.1 ⚡

> **Free In-Browser Bulk WebP Converter, Watermark Studio & SEO Toolkit**  
> *Convert, Optimize & Rank Better — 100% Client-Side Privacy.*

![PixelSEO Tools](https://pixelseo.tools/icons/icon-192.svg)

---

## 🌟 Overview

**PixelSEO Tools** is a modern, high-velocity, privacy-first web platform engineered to eliminate image optimization and e-commerce SEO bottlenecks. Built with **Next.js 15 (App Router)**, **TypeScript strict mode**, **Tailwind CSS v4**, and **HTML5 Canvas / Web Workers**, it allows users to process **up to 100 images simultaneously** directly inside the browser with **zero server uploads**.

---

## 🚀 Features

- **Bulk WebP Converter (IMG-01 to IMG-14):**
  - Converts JPG, PNG, WEBP, AVIF into high-fidelity WebP format.
  - Quality tuning (1% to 100%, default 85%).
  - Optional width/height resizing with aspect ratio preservation.
  - Dynamic naming conventions (`original`, `kebab`, `seo-slug`, `custom`).
- **Watermark Studio:**
  - Imprint company logos (PNG, SVG, WEBP) or typography text across batches.
  - 9-point grid positioning (`Top Left` to `Bottom Right`) plus repeating tile patterns.
  - Opacity control (0–100%, default 55%), rotation, and text drop shadow.
- **Bilingual SEO Content Studio:**
  - Deterministic rule-based NLP engine for English & বাংলা (Bengali).
  - Generates Meta Titles, Descriptions, Focus Keywords, Image Alt Texts, and Schema.org JSON-LD snippets.
  - 50–60 & 140–160 character guidance meters.
- **Universal Exporting:**
  - **CSV Export:** RFC 4180 compliant 16-column export with UTF-8 BOM (`\uFEFF`) and CWE-1236 Formula Injection sanitization.
  - **ZIP Packaging:** Hierarchical bundling (`images/*.webp`, `metadata/manifest.csv`, `metadata/schema.json`, `README.txt`).
- **100% In-Browser Privacy:**
  - Raw images, logos, and product descriptions never leave the local browser memory.
  - Zero cloud processing overhead and zero timeout limits.

---

## 📁 Project Architecture & Directory Structure

```
pixelseo-tools/
├── public/
│   ├── icons/
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   ├── manifest.webmanifest
│   └── robots.txt
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── not-found.tsx
│   │   ├── tools/
│   │   │   ├── layout.tsx
│   │   │   ├── image-converter/page.tsx
│   │   │   ├── watermark/page.tsx
│   │   │   ├── image-compressor/page.tsx
│   │   │   ├── csv-export/page.tsx
│   │   │   └── seo-generator/page.tsx
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── contact/page.tsx
│   │   └── faq/page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── badge.tsx
│   │   │   └── slider.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── tool-sidebar.tsx
│   │   ├── uploader/
│   │   │   ├── dropzone.tsx
│   │   │   ├── image-grid.tsx
│   │   │   └── image-card.tsx
│   │   ├── converter/
│   │   │   ├── converter-workspace.tsx
│   │   │   ├── conversion-settings.tsx
│   │   │   ├── progress-panel.tsx
│   │   │   └── download-panel.tsx
│   │   ├── watermark/
│   │   │   ├── watermark-editor.tsx
│   │   │   ├── watermark-preview.tsx
│   │   │   └── watermark-controls.tsx
│   │   ├── seo/
│   │   │   ├── seo-form.tsx
│   │   │   └── seo-results.tsx
│   │   └── export/
│   │       ├── csv-exporter.tsx
│   │       └── zip-exporter.tsx
│   │
│   ├── hooks/
│   │   ├── use-image-upload.ts
│   │   ├── use-converter.ts
│   │   ├── use-watermark.ts
│   │   └── use-processing-queue.ts
│   │
│   ├── stores/
│   │   ├── image-store.ts
│   │   ├── settings-store.ts
│   │   └── seo-store.ts
│   │
│   ├── lib/
│   │   ├── image/
│   │   │   ├── validation.ts
│   │   │   ├── convert.ts
│   │   │   ├── resize.ts
│   │   │   ├── watermark.ts
│   │   │   └── queue.ts
│   │   ├── export/
│   │   │   ├── csv.ts
│   │   │   └── zip.ts
│   │   ├── seo/
│   │   │   ├── generator.ts
│   │   │   └── validators.ts
│   │   └── utils.ts
│   │
│   ├── workers/
│   │   └── image.worker.ts
│   │
│   ├── types/
│   │   ├── image.ts
│   │   ├── watermark.ts
│   │   └── seo.ts
│   │
│   └── config/
│       ├── site.ts
│       ├── limits.ts
│       └── navigation.ts
│
├── tests/
│   ├── unit/
│   │   ├── validation.test.ts
│   │   ├── seo-engine.test.ts
│   │   └── csv-export.test.ts
│   ├── integration/
│   │   └── queue-processing.test.ts
│   └── e2e/
│       └── converter-flow.test.ts
│
├── package.json
├── next.config.mjs
├── tsconfig.json
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 App Router |
| **Language** | TypeScript strict mode |
| **Styling** | Tailwind CSS v4 + Vanilla CSS tokens |
| **State Management** | Zustand (`usePixelSeoStore`, `useImageStore`, `useSettingsStore`) |
| **Schema Validation** | Zod v3 |
| **Image Processing** | HTML5 Canvas 2D + Web Workers (`OffscreenCanvas`) |
| **Packaging & Export** | JSZip + Custom RFC 4180 BOM CSV Serializer |
| **Testing** | Vitest |
| **Notifications** | Sonner |
| **Deployment** | Vercel Ready |

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+ / 20+ / 22+
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/pixelseo/pixelseo-tools.git

# Enter project directory
cd pixelseo-tools

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Tests
```bash
# Run Vitest test suite
npx vitest run
```

### Production Build
```bash
npm run build
npm run start
```

---

## 📄 License
This project is licensed under the MIT License — free for personal and commercial use.
