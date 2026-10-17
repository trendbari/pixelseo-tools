import { AppLanguage } from '@/types';

export type ScenarioType =
  | 'no_images'
  | 'over_100_files'
  | 'unsupported_format'
  | 'corrupt_image'
  | 'memory_pressure'
  | 'webp_unsupported'
  | 'duplicate_filename'
  | 'zip_failure'
  | 'no_seo_input'
  | 'offline_mode'
  | 'session_refresh';

export interface ErrorGuidance {
  scenario: ScenarioType;
  title: string;
  whatHappened: string;
  nextStep: string;
  actionText?: string;
}

/**
 * Returns user-friendly, actionable error and status guidance
 * explaining exactly what happened and the next step in English or Bengali.
 */
export function getScenarioGuidance(
  scenario: ScenarioType,
  lang: AppLanguage = 'en',
  params: Record<string, string | number> = {}
): ErrorGuidance {
  const isBn = lang === 'bn';

  switch (scenario) {
    case 'no_images':
      return {
        scenario,
        title: isBn ? 'কোনো ছবি আপলোড করা হয়নি' : 'No Images Uploaded',
        whatHappened: isBn
          ? 'ওয়ার্কস্পেস কিউ বর্তমানে খালি রয়েছে।'
          : 'The workspace queue is currently empty.',
        nextStep: isBn
          ? 'নিচের বাক্সে ছবি ড্র্যাগ ও ড্রপ করুন, ব্রাউজ করুন অথবা শুরু করতে "নমুনা ছবি লোড করুন" বাটনে ক্লিক করুন।'
          : 'Drag and drop your images below, browse your device, or click "Load Demo Images" to try immediately.',
        actionText: isBn ? 'ছবি যুক্ত করুন' : 'Upload Images',
      };

    case 'over_100_files':
      return {
        scenario,
        title: isBn ? 'সর্বোচ্চ ফাইলের সীমা অতিক্রম করেছে' : 'Batch Limit Exceeded',
        whatHappened: isBn
          ? `আপনি ${params.attempted ?? 'অতিরিক্ত'}টি ছবি যোগ করার চেষ্টা করেছেন, কিন্তু ব্রাউজারের মেমরি সুরক্ষায় একসাথে সর্বোচ্চ ১০০টি ছবি অনুমোদিত।`
          : `You selected ${params.attempted ?? 'multiple'} files, but PixelSEO limits batches to 100 images to prevent browser memory exhaustion.`,
        nextStep: isBn
          ? `প্রথম ${params.added ?? 100}টি ছবি যুক্ত করা হয়েছে। অনুগ্রহ করে বর্তমান ব্যাচটি সম্পন্ন করে ডাউনলোড করুন অথবা অতিরিক্ত ছবি যোগ করতে কিছু ছবি মুছে ফেলুন।`
          : `Only the first ${params.added ?? 100} available slots were added. Please process and download this batch, or remove items to upload more.`,
        actionText: isBn ? 'বর্তমান ব্যাচ প্রসেস করুন' : 'Process Current Batch',
      };

    case 'unsupported_format':
      return {
        scenario,
        title: isBn ? 'অসমর্থিত ফাইল ফরম্যাট' : 'Unsupported File Format',
        whatHappened: isBn
          ? `"${params.filename ?? 'ফাইলটি'}" (${params.format ?? 'অজানা'}) ফাইলটি একটি স্বীকৃত ইমেজ ফরম্যাট নয়।`
          : `"${params.filename ?? 'The file'}" (${params.format ?? 'unsupported format'}) cannot be processed.`,
        nextStep: isBn
          ? 'অনুগ্রহ করে স্ট্যান্ডার্ড JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp), বা AVIF (.avif) ফরম্যাটের ছবি আপলোড করুন।'
          : 'Please upload standard images in JPEG (.jpg, .jpeg), PNG (.png), WebP (.webp), or AVIF (.avif) format.',
        actionText: isBn ? 'সঠিক ফরম্যাট নির্বাচন করুন' : 'Choose Valid Image',
      };

    case 'corrupt_image':
      return {
        scenario,
        title: isBn ? 'ক্ষতিগ্রস্ত ছবি (Corrupt File)' : 'Corrupted Image File',
        whatHappened: isBn
          ? `"${params.filename ?? 'ছবিটি'}" ডিকোড করা যায়নি। ফাইলের বাইনারি ডেটা অসম্পূর্ণ বা ক্ষতিগ্রস্ত হতে পারে।`
          : `"${params.filename ?? 'The image'}" could not be decoded. The file data may be incomplete or corrupted.`,
        nextStep: isBn
          ? 'পুনরায় চেষ্টা করতে "Retry Failed" বাটনে ক্লিক করুন অথবা ফটো এডিটর থেকে ছবিটি পুনরায় সেভ করে আপলোড করুন।'
          : 'Click "Retry Failed" to attempt conversion again, or verify and re-export the image from your photo editor.',
        actionText: isBn ? 'ব্যর্থগুলো পুনরায় চেষ্টা' : 'Retry Failed',
      };

    case 'memory_pressure':
      return {
        scenario,
        title: isBn ? 'উচ্চ মেমরি চাপ সনাক্ত হয়েছে' : 'Memory Pressure Detected',
        whatHappened: isBn
          ? 'বড় সাইজের ছবি বা উচ্চ রেজোলিউশনের কারণে ব্রাউজারের র‍্যামে চাপ বৃদ্ধি পেয়েছে।'
          : 'Large image resolutions in this batch are consuming significant browser heap memory.',
        nextStep: isBn
          ? 'ট্যাব ক্র্যাশ এড়াতে স্বয়ংক্রিয়ভাবে কনকারেন্সি ২ থেকে ১-এ নামিয়ে ধারাবাহিক প্রসেসিং চলছে।'
          : 'Concurrency was automatically reduced from 2 to 1 worker to ensure stable, crash-free conversion.',
        actionText: isBn ? 'প্রসেসিং জারি রয়েছে' : 'Continuing Safely',
      };

    case 'webp_unsupported':
      return {
        scenario,
        title: isBn ? 'WEBP এনকোডার অনুপস্থিত' : 'WebP Encoder Unsupported',
        whatHappened: isBn
          ? 'আপনার বর্তমান ব্রাউজারে নেটিভ WEBP ইমেজ এনকোডিং সমর্থন করে না।'
          : 'Your current browser does not natively support WebP image encoding.',
        nextStep: isBn
          ? 'ছবিগুলো বিকল্প PNG ফরম্যাটে সংরক্ষিত হবে। দ্রুতগতির WEBP এর জন্য আধুনিক Chrome, Edge, Safari 14+, বা Firefox ব্যবহার করুন।'
          : 'Images will fall back to PNG format. For optimal WebP compression, please upgrade to modern Chrome, Edge, Safari 14+, or Firefox.',
        actionText: isBn ? 'পিএনজি মোডে জারি রাখুন' : 'Continue with PNG Fallback',
      };

    case 'duplicate_filename':
      return {
        scenario,
        title: isBn ? 'একই নামের ফাইল সনাক্ত হয়েছে' : 'Duplicate Filename Detected',
        whatHappened: isBn
          ? `একাধিক ফাইলের নাম "${params.filename ?? 'ছবি'}" পাওয়া গেছে।`
          : `Multiple uploaded files share the same filename "${params.filename ?? 'image'}".`,
        nextStep: isBn
          ? `জিপ এক্সপোর্টে ফাইল ওভাররাইট হওয়া রোধ করতে স্বয়ংক্রিয়ভাবে অনন্য নাম "${params.uniqueName ?? 'image-1.webp'}" নির্ধারণ করা হয়েছে।`
          : `Automatically assigned unique output name "${params.uniqueName ?? 'image-1.webp'}" to prevent file collisions in your export archive.`,
        actionText: isBn ? 'অনন্য নাম নির্ধারিত' : 'Unique Name Assigned',
      };

    case 'zip_failure':
      return {
        scenario,
        title: isBn ? 'জিপ তৈরি ব্যর্থ হয়েছে' : 'ZIP Generation Failed',
        whatHappened: isBn
          ? `জিপ আর্কাইভ প্যাকেজ তৈরি করা সম্ভব হয়নি (${params.reason ?? 'অজানা ত্রুটি'})।`
          : `Could not bundle the ZIP archive (${params.reason ?? 'unknown error'}).`,
        nextStep: isBn
          ? 'পুনরায় জিপ তৈরি করতে "Retry Export" বাটনে ক্লিক করুন অথবা প্রতিটি ছবি আলাদাভাবে ডাউনলোড করুন।'
          : 'Click "Retry Export" to rebuild the archive, or download converted WebP images individually using the WEBP buttons.',
        actionText: isBn ? 'পুনরায় এক্সপোর্ট করুন' : 'Retry Export',
      };

    case 'no_seo_input':
      return {
        scenario,
        title: isBn ? 'প্রয়োজনীয় তথ্যের ঘাটতি' : 'Missing SEO Input Context',
        whatHappened: isBn
          ? 'কনটেন্ট বিবরণ, ব্র্যান্ডের নাম বা ফোকাস কিওয়ার্ড খালি রয়েছে।'
          : 'Content text, brand name, and target keyword are currently empty.',
        nextStep: isBn
          ? 'এসইও মেটাডেটা তৈরি করতে উপরের ফর্মে ব্র্যান্ডের নাম, পণ্যের বিবরণ বা ফোকাস কিওয়ার্ড লিখুন।'
          : 'Please enter your product description, brand, or focus keyword above to enable AI SEO generation.',
        actionText: isBn ? 'ইনপুট পূরণ করুন' : 'Fill Inputs',
      };

    case 'offline_mode':
      return {
        scenario,
        title: isBn ? 'অফলাইন মোড সক্রিয়' : 'Offline Mode Active',
        whatHappened: isBn
          ? 'আপনি বর্তমানে অফলাইনে আছেন।'
          : 'You are currently working offline.',
        nextStep: isBn
          ? 'PixelSEO সম্পূর্ণভাবে আপনার ডিভাইসে চলে! সমস্ত ইমেজ কনভার্সন, কম্প্রেসর, ওয়াটারমার্ক ও সিএসভি টুলস ইন্টারনেট ছাড়াই সচল রয়েছে।'
          : 'PixelSEO operates 100% locally in your browser. All compression, WebP conversion, watermark, and metadata tools remain fully usable without internet!',
        actionText: isBn ? '১০০% লোকাল প্রসেসিং' : '100% Local Engine',
      };

    case 'session_refresh':
      return {
        scenario,
        title: isBn ? 'সেশন পুনরুদ্ধার নোটিশ' : 'Session Recovery Notice',
        whatHappened: isBn
          ? 'নিরাপত্তা ও প্রাইভেসি বজায় রাখতে আসল ছবি ব্রাউজার র‍্যামে রাখা হয় এবং রিফ্রেশ করলে রিসেট হয়।'
          : 'Image files are stored strictly in private browser RAM for security and are cleared upon page refresh.',
        nextStep: isBn
          ? `আপনার সংরক্ষিত সেটিংস (কোয়ালিটি ${params.quality ?? 85}%, থিম, ভাষা) বহাল রয়েছে। কাজ পুনরায় শুরু করতে ছবি আপলোড করুন অথবা "নমুনা ছবি" লোড করুন।`
          : `Your preferences (Quality ${params.quality ?? 85}%, Theme, Language, Watermark settings) were restored. Re-upload your images or click "Load Demo Images" to resume.`,
        actionText: isBn ? 'কাজ পুনরায় শুরু করুন' : 'Resume Workspace',
      };
  }
}
