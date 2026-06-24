import type { WallpaperSpec } from '../types/WallpaperSpec'
import { WallpaperRenderer } from '../renderer/WallpaperRenderer'

interface WallpaperPreviewProps {
  spec: WallpaperSpec | null
  onOpenPreview: () => void
}

export function WallpaperPreview({ spec, onOpenPreview }: WallpaperPreviewProps) {
  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div className="preview-header">
        <div>
          <p className="panel-kicker">Preview</p>
          <h2 id="preview-title">Wallpaper</h2>
        </div>
        <div className="preview-actions">
          <button
            type="button"
            className="open-preview-button"
            disabled={!spec}
            onClick={onOpenPreview}
          >
            Open wallpaper preview
          </button>
          <span className="preview-ratio">16:9</span>
        </div>
      </div>

      <div className="wallpaper-frame">
        {spec ? (
          <WallpaperRenderer spec={spec} />
        ) : (
          <div className="wallpaper-empty">Upload an image to preview it.</div>
        )}
      </div>
    </section>
  )
}
