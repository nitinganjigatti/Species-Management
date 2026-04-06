import { axiosGet } from '../utility'

/**
 * Fetches translation file URLs from the API for a given language code.
 * Mirrors mobile app's LanguageService.getLanguageJsonById()
 *
 * @param {string} languageCode - e.g. 'en', 'hi', 'ta'
 * @returns {Promise<{ translations: string, formats: string }>} CDN URLs for translation files
 */
export const getLanguageFiles = async languageCode => {
  const response = await axiosGet({
    url: 'get-files-by-language',
    params: { language_code: languageCode }
  })

  return response?.data?.data
}
