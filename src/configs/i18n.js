import i18n from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const RTL_LANGUAGES = ['ar']

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // No 'lng' — let LanguageDetector auto-detect from localStorage / browser
    fallbackLng: 'en-IN',
    supportedLngs: ['en', 'en-IN', 'en-US', 'fr', 'hi', 'ar', 'ta', 'th', 'ka', 'ch', 'ru', 'id', 'gu', 'te', 'bn'],
    debug: process.env.NODE_ENV === 'development',

    // Module-based namespaces — each page loads its own namespace on demand
    ns: ['common'],
    defaultNS: 'common',

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    },

    keySeparator: '.',
    nsSeparator: ':',

    react: {
      useSuspense: false
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false,
      format: (value, format, lng, options = {}) => {
        if (format === 'intlDate' && value instanceof Date) {
          const dateOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...(options.dateType === 'long' && {
              month: 'short',
              day: 'numeric'
            }),
            ...(options.dateType === 'datetime' && {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          }

          return new Intl.DateTimeFormat(lng, dateOptions).format(value)
        }
        if (format === 'currency') {
          const currency = options.currency || 'INR'

          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: currency
          }).format(value)
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value)
        }

        return value?.toString() ?? ''
      }
    }
  })

export const isRtlLanguage = lang => RTL_LANGUAGES.includes(lang)

export default i18n
