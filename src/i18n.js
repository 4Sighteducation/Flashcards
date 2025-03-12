import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // load translations using http (default public/locales/{lng}/translation.json)
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    supportedLngs: ['en', 'cy', 'ar', 'es', 'it', 'fr', 'ja', 'vi', 'zh'],
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: false
    }
  });

// Language names in their native language
export const languageNames = {
  en: 'English',
  cy: 'Cymraeg',   // Welsh
  ar: 'العربية',   // Arabic
  es: 'Español',   // Spanish
  it: 'Italiano',  // Italian
  fr: 'Français',  // French
  ja: '日本語',     // Japanese
  vi: 'Tiếng Việt', // Vietnamese
  zh: '中文'        // Chinese
};

export default i18n; 