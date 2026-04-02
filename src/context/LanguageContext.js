/**
 * LanguageContext — mirrors mobile app's context/LanguageContext.js
 *
 * Flow (same as mobile app):
 * 1. On mount, detect current language from i18next (localStorage / browser)
 * 2. Call API: get-files-by-language?language_code={code}
 * 3. API returns CDN URLs → fetch translations.json and formats.json
 * 4. Merge remote translations on top of static bundled ones via addResourceBundle
 * 5. Cache in IndexedDB for offline/fast reload (handles 16K+ keys safely)
 * 6. On language switch, repeat steps 2-5 for new language
 * 7. On logout, clear cache and reset to default language
 */

import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import i18n from 'src/configs/i18n'
import { getLanguageFiles } from 'src/lib/api/language'
import {
  cacheTranslations,
  cacheFormats,
  getCachedTranslations,
  getCachedFormats,
  clearTranslationCache
} from 'src/lib/i18n/translationCache'

const LanguageContext = createContext({
  formats: null,
  locale: 'en-IN',
  loadLanguage: () => Promise.resolve(),
  resetLanguage: () => Promise.resolve()
})

export const LanguageProvider = ({ children }) => {
  const [formats, setFormats] = useState(null)
  const [locale, setLocale] = useState(i18n.language || 'en-IN')

  /**
   * Fetch translations from API and merge with static bundled files.
   * Mirrors mobile app's fetchAndSaveTranslation() + initializeI18n()
   */
  const fetchAndMergeTranslations = useCallback(async lang => {
    try {
      const fileUrls = await getLanguageFiles(lang)

      // Fetch translations from CDN URL (same as mobile: fetch(translationsUrl))
      if (fileUrls?.translations) {
        const response = await fetch(fileUrls.translations)
        if (response.ok) {
          const remoteTranslations = await response.json()

          // addResourceBundle(lang, namespace, resources, deep, overwrite)
          // deep=true, overwrite=true → same as mobile's { ...bundled, ...remote }
          i18n.addResourceBundle(lang, 'common', remoteTranslations, true, true)

          // Cache in IndexedDB (web equivalent of mobile's device file system cache)
          await cacheTranslations(lang, remoteTranslations)
        }
      }

      // Fetch formats from CDN URL
      if (fileUrls?.formats) {
        const response = await fetch(fileUrls.formats)
        if (response.ok) {
          const formatsData = await response.json()
          await cacheFormats(lang, formatsData)
          setFormats(formatsData)

          return
        }
      }
    } catch (error) {
      console.warn(`API translation fetch failed for ${lang}, trying cache...`, error)
    }

    // Fallback: load from IndexedDB cache (same as mobile's loadLocaleDataFromDir fallback)
    const cachedTranslations = await getCachedTranslations(lang)
    if (cachedTranslations) {
      i18n.addResourceBundle(lang, 'common', cachedTranslations, true, true)
    }

    const cachedFormats = await getCachedFormats(lang)
    if (cachedFormats) {
      setFormats(cachedFormats)
    }
  }, [])

  /**
   * Switch language — mirrors mobile app's loadI18n(newLocale)
   * 1. Change i18next language (loads static file via http-backend)
   * 2. Fetch + merge API translations on top
   */
  const loadLanguage = useCallback(
    async lang => {
      // 1. Change language immediately (loads static file via http-backend)
      await i18n.changeLanguage(lang)
      setLocale(lang)

      // 2. Fetch API translations in background — don't block language switch
      fetchAndMergeTranslations(lang).catch(err =>
        console.warn('Background translation fetch failed:', err)
      )
    },
    [fetchAndMergeTranslations]
  )

  /**
   * Reset language to default — mirrors mobile app's logout behavior
   * Mobile: loadI18n("en") + clearLocaleDirectoryContent() + clearAsyncData()
   */
  const resetLanguage = useCallback(async () => {
    await clearTranslationCache()
    localStorage.removeItem('i18nextLng')
    await i18n.changeLanguage('en-IN')
    setLocale('en-IN')
    setFormats(null)
  }, [])

  // On mount: fetch API translations for current language
  useEffect(() => {
    fetchAndMergeTranslations(i18n.language || 'en-IN')
  }, [fetchAndMergeTranslations])

  return (
    <LanguageContext.Provider value={{ formats, locale, loadLanguage, resetLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
