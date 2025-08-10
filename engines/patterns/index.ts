import { configLoader } from '../utils/configLoader';
import { LanguagePatterns, Language } from '../../backend/src/types';

// Legacy imports - kept for backward compatibility
import { koreanPatterns } from './korean';
import { englishPatterns } from './english';
import { chinesePatterns } from './chinese';
import { japanesePatterns } from './japanese';
import { spanishPatterns } from './spanish';
import { frenchPatterns } from './french';

// New config-based pattern loading
export const allPatterns: Record<Language, LanguagePatterns> = configLoader.getAllPatterns();

export const getPatternsByLanguage = (language: Language): LanguagePatterns => {
  return configLoader.getLanguagePatterns(language);
};

export const getPatternsByLanguages = (languages: Language[]): LanguagePatterns[] => {
  return languages.map(language => configLoader.getLanguagePatterns(language));
};

export const getEnabledLanguages = (): Language[] => {
  return configLoader.getEnabledLanguages();
};

export const getGlobalSettings = () => {
  return configLoader.getGlobalSettings();
};

export const reloadPatterns = (): void => {
  configLoader.reloadConfig();
};

// Legacy exports - kept for backward compatibility
export {
  koreanPatterns,
  englishPatterns,
  chinesePatterns,
  japanesePatterns,
  spanishPatterns,
  frenchPatterns
};