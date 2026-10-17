import { create } from 'zustand';
import { SeoStudioInput, SeoStudioOutput, SeoGeneratorConfig } from '@/types';
import { generateSeoStudioOutput } from '@/lib/seo/generator';
import { toast } from 'sonner';

interface SeoState {
  input: SeoStudioInput;
  output: SeoStudioOutput | null;
  config: SeoGeneratorConfig;
  setInput: (input: Partial<SeoStudioInput>) => void;
  setConfig: (config: Partial<SeoGeneratorConfig>) => void;
  generate: () => void;
  reset: () => void;
}

const defaultInput: SeoStudioInput = {
  contentText: 'Premium cotton t-shirt for men. Comfortable fabric, modern fit, available in multiple colors.',
  targetKeyword: 'cotton t-shirt',
  contentType: 'product',
  language: 'en',
  brandName: 'PixelSEO',
  targetAudience: 'Everyday shoppers',
};

const defaultConfig: SeoGeneratorConfig = {
  brandName: 'PixelSEO',
  category: 'Apparel',
  defaultAltTemplate: '{name} - High Quality {category}',
  defaultTitleTemplate: '{name} | Buy Online at {brand}',
  autoExtractKeywords: true,
  ecommercePreset: 'shopify',
};

export const useSeoStore = create<SeoState>((set, get) => ({
  input: defaultInput,
  output: generateSeoStudioOutput(defaultInput),
  config: defaultConfig,

  setInput: (partial) => {
    set((state) => ({ input: { ...state.input, ...partial } }));
  },

  setConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }));
  },

  generate: () => {
    const currentInput = get().input;
    if (!currentInput.contentText.trim()) {
      toast.error('Please enter content description first');
      return;
    }
    const res = generateSeoStudioOutput(currentInput);
    set({ output: res });
    toast.success('SEO content generated successfully');
  },

  reset: () => {
    set({ input: defaultInput, output: generateSeoStudioOutput(defaultInput) });
  },
}));
