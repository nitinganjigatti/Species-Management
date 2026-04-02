export const SupportedLanguages = [
  { code: 'en-IN', label: 'English', nativeLabel: 'English', dir: 'ltr', dayjsLocale: 'en', currency: 'INR' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', dir: 'ltr', dayjsLocale: 'hi', currency: 'INR' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', dir: 'ltr', dayjsLocale: 'ta', currency: 'INR' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr', dayjsLocale: 'fr', currency: 'EUR' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย', dir: 'ltr', dayjsLocale: 'th', currency: 'THB' },
  { code: 'ka', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', dir: 'ltr', dayjsLocale: 'kn', currency: 'INR' },
  { code: 'ch', label: 'Chinese', nativeLabel: '中文', dir: 'ltr', dayjsLocale: 'zh-cn', currency: 'CNY' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', dir: 'ltr', dayjsLocale: 'ru', currency: 'RUB' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', dir: 'ltr', dayjsLocale: 'id', currency: 'IDR' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', dir: 'ltr', dayjsLocale: 'gu', currency: 'INR' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', dir: 'ltr', dayjsLocale: 'te', currency: 'INR' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', dir: 'ltr', dayjsLocale: 'bn', currency: 'INR' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', dayjsLocale: 'ar', currency: 'SAR' }
]

export const getLanguageConfig = code => SupportedLanguages.find(l => l.code === code) || SupportedLanguages[0]

export const isRtl = code => getLanguageConfig(code).dir === 'rtl'
