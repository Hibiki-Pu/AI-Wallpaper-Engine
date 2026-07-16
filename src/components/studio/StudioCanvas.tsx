import { useEffect, useState } from 'react'
import { Workspace } from './Workspace'
import type { CanvasSizePreset } from './CanvasSizeSelector'
import type { CanvasPan } from './CanvasViewport'
import type { CanvasZoomMode } from './ZoomControls'
import type { WallpaperSpec } from '../../types/WallpaperSpec'

interface StudioCanvasProps {
  spec: WallpaperSpec | null
  canvasSize: CanvasSizePreset
  onCanvasSizeChange: (size: CanvasSizePreset) => void
  onImageSelected: (file: File) => void
  onImageReplace: (file: File) => void
  resetSignal: number
}

export function StudioCanvas({
  spec,
  canvasSize,
  onCanvasSizeChange,
  onImageSelected,
  onImageReplace,
  resetSignal,
}: StudioCanvasProps) {
  const [zoom, setZoom] = useState(100)
  const [zoomMode, setZoomMode] = useState<CanvasZoomMode>('fit')
  const [pan, setPan] = useState<CanvasPan>({ x: 0, y: 0 })

  useEffect(() => {
    setPan({ x: 0, y: 0 })
    setZoom(100)
    setZoomMode('fit')
  }, [resetSignal])

  return (
    <section className="studio-canvas-column" aria-label="Wallpaper canvas">
      <Workspace
        spec={spec}
        canvasSize={canvasSize}
        zoom={zoom}
        zoomMode={zoomMode}
        pan={pan}
        onCanvasSizeChange={onCanvasSizeChange}
        onZoomChange={setZoom}
        onZoomModeChange={setZoomMode}
        onPanChange={setPan}
        onImageSelected={onImageSelected}
        onImageReplace={onImageReplace}
      />
    </section>
  )
}
