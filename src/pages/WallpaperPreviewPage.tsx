import { useMemo } from 'react'
import { WallpaperRenderer } from '../renderer/WallpaperRenderer'
import { loadWallpaperPreviewSpec } from '../services/wallpaperPreviewStorage'
import { useI18n } from '../i18n'

export function WallpaperPreviewPage() {
  const { t } = useI18n()
  const spec = useMemo(() => loadWallpaperPreviewSpec(), [])

  if (!spec) {
    return (
      <main className="wallpaper-preview-missing">
        {t('noSpecFound')}
      </main>
    )
  }

  return (
    <main className="wallpaper-preview-page">
      <WallpaperRenderer spec={spec} />
    </main>
  )
}
