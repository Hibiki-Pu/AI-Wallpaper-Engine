import { LanguageToggle } from '../LanguageToggle'
import { ThemeToggle } from '../ThemeToggle'
import { useI18n } from '../../i18n'

interface StudioToolbarProps {
  canPreview: boolean
  onOpenPreview: () => void
}

export function StudioToolbar({
  canPreview,
  onOpenPreview,
}: StudioToolbarProps) {
  const { t } = useI18n()

  return (
    <header className="studio-toolbar">
      <div className="studio-toolbar-brand">
        <span aria-hidden="true">AI</span>
        <div>
          <strong>{t('appName')}</strong>
          <small>Live wallpaper studio</small>
        </div>
      </div>

      <div className="studio-toolbar-actions">
        <button type="button" className="studio-tool-button" disabled>
          Save
        </button>
        <button type="button" className="studio-tool-button" disabled>
          Undo
        </button>
        <button type="button" className="studio-tool-button" disabled>
          Redo
        </button>
        <LanguageToggle />
        <ThemeToggle />
        <button
          type="button"
          className="open-preview-button"
          disabled={!canPreview}
          onClick={onOpenPreview}
        >
          {t('openFullscreenPreview')}
        </button>
      </div>
    </header>
  )
}
