import { useI18n } from '../i18n'

export function LanguageToggle() {
  const { t, toggleLanguage } = useI18n()

  return (
    <button type="button" className="language-toggle" onClick={toggleLanguage}>
      {t('language')}
    </button>
  )
}
