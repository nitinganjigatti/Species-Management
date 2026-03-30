import { useTranslation } from 'react-i18next'

/**
 * Hook for module-scoped translations with automatic namespace loading.
 * Always loads 'common' namespace alongside the module namespace.
 *
 * Usage:
 *   const { t, tc, i18n, ready } = useModuleTranslation('pharmacy')
 *   t('drug_name')           -> pharmacy:drug_name
 *   tc('buttons.save')       -> common:buttons.save
 */
export const useModuleTranslation = moduleNamespace => {
  const { t, i18n, ready } = useTranslation([moduleNamespace, 'common'])

  const tc = (key, options) => t(`common:${key}`, options)

  return { t, tc, i18n, ready }
}

export default useModuleTranslation
