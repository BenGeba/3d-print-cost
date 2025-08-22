import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enValidation from './locales/en/validation.json';
import deCommon from './locales/de/common.json';
import deValidation from './locales/de/validation.json';

export const resources = {
  en: {
    common: enCommon,
    validation: enValidation,
  },
  de: {
    common: deCommon,
    validation: deValidation,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false,
    },

    defaultNS: 'common',
    ns: ['common', 'validation'],
  });

export default i18n;