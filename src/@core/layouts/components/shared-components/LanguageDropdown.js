// ** React Import
import { useEffect } from 'react'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Import
import { useTranslation } from 'react-i18next'

// ** Custom Components Imports
import OptionsMenu from 'src/@core/components/option-menu'

// ** Locale Config
import { SupportedLanguages } from 'src/utility/localeConfig'
import { isRtlLanguage } from 'src/configs/i18n'

// ** Language Context
import { useLanguage } from 'src/context/LanguageContext'

const LanguageDropdown = ({ settings, saveSettings }) => {
  const { i18n, t } = useTranslation()
  const { loadLanguage } = useLanguage()

  const { layout } = settings

  const handleLangItemClick = async lang => {
    // Use loadLanguage from context — fetches API translations + merges
    // Mirrors mobile app's selectLanguage() in Profile.js
    await loadLanguage(lang)

    // Only update settings if direction actually changes (avoids unnecessary theme re-creation)
    const newDirection = isRtlLanguage(lang) ? 'rtl' : 'ltr'
    if (settings.direction !== newDirection) {
      saveSettings({
        ...settings,
        direction: newDirection
      })
    }
  }

  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language])

  return (
    <OptionsMenu
      icon={<Icon icon='mdi:translate' />}
      menuProps={{ sx: { '& .MuiMenu-paper': { mt: 4, minWidth: 130 } } }}
      iconButtonProps={{ color: 'inherit', sx: { ...(layout === 'vertical' ? { mr: 0.75 } : { mx: 0.75 }) } }}
      options={SupportedLanguages.map(lang => ({
        text: t(`languages.${lang.code}`, { defaultValue: lang.nativeLabel || lang.label }),
        menuItemProps: {
          sx: { py: 2 },
          selected: i18n.language === lang.code,
          onClick: () => handleLangItemClick(lang.code)
        }
      }))}
    />
  )
}

export default LanguageDropdown
