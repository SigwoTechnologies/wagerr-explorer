import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { reactI18nextModule } from 'react-i18next';
import Backend from 'i18next-xhr-backend';

import en from './locales/en.json'
import zh from './locales/zh.json'
import kr from './locales/kr.json'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(reactI18nextModule)
  .init({
  // we init with resources
  resources: { en, kr, zh },

  fallbackLng: "en",
  // debug: process.env.NODE_ENV !== 'production',

  // have a common namespace used around the full app
  ns: ["common"],
  defaultNS: "common",

  keySeparator: false, // we use content as keys

  interpolation: {
    escapeValue: false, // not needed for react!!
    formatSeparator: ","
  },

  react: {
    wait: true,
    omitBoundRerender: false
  }
});

export default i18n;
