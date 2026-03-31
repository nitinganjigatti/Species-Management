export const SupportedLanguages = [
  { code: 'en-IN', label: 'English', dir: 'ltr', dayjsLocale: 'en', currency: 'INR' },
  { code: 'fr', label: 'French', dir: 'ltr', dayjsLocale: 'fr', currency: 'EUR' },
  { code: 'hi', label: 'Hindi', dir: 'ltr', dayjsLocale: 'hi', currency: 'INR' },
  { code: 'ar', label: 'Arabic', dir: 'rtl', dayjsLocale: 'ar', currency: 'SAR' }
]

export const getLanguageConfig = code => SupportedLanguages.find(l => l.code === code) || SupportedLanguages[0]

export const isRtl = code => getLanguageConfig(code).dir === 'rtl'
