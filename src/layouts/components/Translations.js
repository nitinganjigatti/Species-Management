import { useTranslation } from 'react-i18next'

const Translations = ({ text }) => {
  const { t } = useTranslation('navigation')

  return <>{t(text, { defaultValue: text })}</>
}

export default Translations
