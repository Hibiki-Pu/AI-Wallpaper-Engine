import { useMemo } from 'react'
import { WallpaperRenderer } from '../renderer/WallpaperRenderer'
import { loadWallpaperPreviewSpec } from '../services/wallpaperPreviewStorage'

export function WallpaperPreviewPage() {
  const spec = useMemo(() => loadWallpaperPreviewSpec(), [])

  if (!spec) {
    return (
      <main className="wallpaper-preview-missing">
        No wallpaper spec found.
      </main>
    )
  }

  return (
    <main className="wallpaper-preview-page">
      <WallpaperRenderer spec={spec} />
    </main>
  )
}
