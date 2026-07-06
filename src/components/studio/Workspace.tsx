import { CanvasToolbar } from './CanvasToolbar'
import {
  CANVAS_SIZE_PRESETS,
  type CanvasSizePreset,
} from './CanvasSizeSelector'
import { CanvasViewport, type CanvasPan } from './CanvasViewport'
import { ZoomControls, type CanvasZoomMode } from './ZoomControls'
import type { WallpaperSpec } from '../../types/WallpaperSpec'

interface WorkspaceProps {
  spec: WallpaperSpec | null
  canvasSize: CanvasSizePreset
  zoom: number
  zoomMode: CanvasZoomMode
  pan: CanvasPan
  onCanvasSizeChange: (size: CanvasSizePreset) => void
  onZoomChange: (zoom: number) => void
  onZoomModeChange: (mode: CanvasZoomMode) => void
  onPanChange: (pan: CanvasPan) => void
  onImageSelected: (file: File) => void
  onImageReplace: (file: File) => void
}

export const DEFAULT_CANVAS_SIZE = CANVAS_SIZE_PRESETS[0]

export function Workspace({
  spec,
  canvasSize,
  zoom,
  zoomMode,
  pan,
  onCanvasSizeChange,
  onZoomChange,
  onZoomModeChange,
  onPanChange,
  onImageSelected,
  onImageReplace,
}: WorkspaceProps) {
  return (
    <section className="workspace">
      <CanvasToolbar
        canvasSize={canvasSize}
        zoom={zoom}
        zoomMode={zoomMode}
        onCanvasSizeChange={onCanvasSizeChange}
      />
      <CanvasViewport
        spec={spec}
        canvasSize={canvasSize}
        zoom={zoom}
        zoomMode={zoomMode}
        pan={pan}
        onPanChange={onPanChange}
        onZoomChange={onZoomChange}
        onZoomModeChange={onZoomModeChange}
        onImageSelected={onImageSelected}
        onImageReplace={onImageReplace}
      />
      <ZoomControls
        zoom={zoom}
        mode={zoomMode}
        onZoomChange={onZoomChange}
        onModeChange={onZoomModeChange}
      />
    </section>
  )
}
