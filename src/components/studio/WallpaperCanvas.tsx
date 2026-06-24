import { ImageUploader } from '../ImageUploader'
import { WallpaperRenderer } from '../../renderer/WallpaperRenderer'
import type { WallpaperSpec } from '../../types/WallpaperSpec'

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
  return (
    <section className="wallpaper-canvas-panel" aria-labelledby="canvas-title">
      <div className="canvas-toolbar">
        <div>
          <p className="panel-kicker">Canvas</p>
          <h1 id="canvas-title">Wallpaper Canvas</h1>
        </div>
        <button
          type="button"
          className="open-preview-button"
          disabled={!spec}
          onClick={onOpenPreview}
        >
          Open fullscreen preview
        </button>
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
