import {getRequestConfig} from 'next-intl/server';

export const locales = [
  'en',    // English
  'zh',    // Chinese (Simplified)
  'es',    // Spanish
  'fr',    // French
  'de',    // German
  'ja',    // Japanese
  'ko',    // Korean
  'pt',    // Portuguese
  'ru',    // Russian
  'ar',    // Arabic
  'hi',    // Hindi
  'it'     // Italian
];

export const localeNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
  hi: 'हिन्दी',
  it: 'Italiano'
};

export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
