import { ImageUploader } from '../ImageUploader'
import { WallpaperRenderer } from '../../renderer/WallpaperRenderer'
import type { WallpaperSpec } from '../../types/WallpaperSpec'
import { LanguageToggle } from '../LanguageToggle'
import { ThemeToggle } from '../ThemeToggle'
import { useI18n } from '../../i18n'

interface WallpaperCanvasProps {
  spec: WallpaperSpec | null
  onImageSelected: (file: File) => void
  onOpenPreview: () => void
}

export function WallpaperCanvas({
  spec,
  onImageSelected,
  onOpenPreview,
}: WallpaperCanvasProps) {
  const { t } = useI18n()

  return (
    <section className="wallpaper-canvas-panel" aria-labelledby="canvas-title">
      <div className="canvas-toolbar">
        <div>
          <p className="panel-kicker">{t('canvas')}</p>
          <h1 id="canvas-title">{t('wallpaperCanvas')}</h1>
        </div>
        <div className="canvas-actions">
          <LanguageToggle />
          <ThemeToggle />
          <button
            type="button"
            className="open-preview-button"
            disabled={!spec}
            onClick={onOpenPreview}
          >
            {t('openFullscreenPreview')}
          </button>
        </div>
      </div>

      <div className="wallpaper-canvas-frame">
        {spec ? (
          <WallpaperRenderer spec={spec} />
        ) : (
          <div className="canvas-empty-state">
            <ImageUploader onImageSelected={onImageSelected} />
          </div>
        )}
      </div>
    </section>
  )
}
