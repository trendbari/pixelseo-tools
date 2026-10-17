import { generateSeoContentStudio, generateSeoForItem } from '../seoEngine';
import {
  SeoStudioInput,
  SeoStudioOutput,
  SeoInput,
  SeoResult,
  toSeoStudioInput,
  toSeoResult,
} from '@/types';

export const generateSeoFromContent = generateSeoContentStudio;
export const generateSeoStudioOutput = generateSeoContentStudio;

/**
 * High-level SEO generator accepting SeoInput and returning SeoResult
 */
export function generateSeo(input: SeoInput): SeoResult {
  const studioInput = toSeoStudioInput(input);
  const studioOutput = generateSeoContentStudio(studioInput);
  return toSeoResult(studioOutput);
}

export { generateSeoContentStudio, generateSeoForItem };

