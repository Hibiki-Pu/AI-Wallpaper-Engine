import { ImageUploader } from '../ImageUploader'
import { WallpaperRenderer } from '../../renderer/WallpaperRenderer'
import type { WallpaperSpec } from '../../types/WallpaperSpec'

interface StudioCanvasProps {
  spec: WallpaperSpec | null
  onImageSelected: (file: File) => void
}

export function StudioCanvas({ spec, onImageSelected }: StudioCanvasProps) {
  return (
    <section className="studio-canvas-column" aria-label="Wallpaper canvas">
      <div className="canvas-workspace">
        <div className="canvas-stage-header">
          <div>
            <p className="panel-kicker">Canvas</p>
            <h1>Wallpaper Studio</h1>
          </div>
          <span>16:9 Workspace</span>
        </div>

        <div className="wallpaper-canvas-frame">
          {spec ? (
            <WallpaperRenderer spec={spec} />
          ) : (
            <div className="canvas-empty-state">
              <div className="empty-upload-art" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <ImageUploader onImageSelected={onImageSelected} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
