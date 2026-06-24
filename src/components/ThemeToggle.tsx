import { useI18n } from '../i18n'
import { useTheme } from '../theme'

export function ThemeToggle() {
  const { t } = useI18n()
  const { theme, toggleTheme } = useTheme()

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme}>
      <span>{t('theme')}</span>
      <strong>{theme === 'dark' ? t('dark') : t('light')}</strong>
    </button>
  )
}
