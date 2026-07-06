import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { WallpaperRenderer } from '../../renderer/WallpaperRenderer'
import type { WallpaperSpec } from '../../types/WallpaperSpec'
import type { CanvasSizePreset } from './CanvasSizeSelector'
import type { CanvasZoomMode } from './ZoomControls'
import { useI18n } from '../../i18n'

export interface CanvasPan {
  x: number
  y: number
}

interface CanvasViewportProps {
  spec: WallpaperSpec | null
  canvasSize: CanvasSizePreset
  zoom: number
  zoomMode: CanvasZoomMode
  pan: CanvasPan
  onPanChange: (pan: CanvasPan) => void
  onZoomChange: (zoom: number) => void
  onZoomModeChange: (mode: CanvasZoomMode) => void
  onImageSelected: (file: File) => void
  onImageReplace: (file: File) => void
}

const clampZoom = (value: number) => Math.min(200, Math.max(25, value))

export function CanvasViewport({
  spec,
  canvasSize,
  zoom,
  zoomMode,
  pan,
  onPanChange,
  onZoomChange,
  onZoomModeChange,
  onImageSelected,
  onImageReplace,
}: CanvasViewportProps) {
  const { t } = useI18n()
  const [spacePressed, setSpacePressed] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(true)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const scale =
    zoomMode === 'fit' ? 1 : zoomMode === 'fill' ? 1.18 : clampZoom(zoom) / 100
  const isPortrait = canvasSize.height > canvasSize.width
  const boardWidth = isPortrait ? 'min(58vw, 560px)' : 'min(82vw, 1240px)'

  const handleFile = (file: File) => {
    if (spec) {
      onImageReplace(file)
      return
    }

    onImageSelected(file)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      return
    }

    if (spec && !window.confirm(t('replaceCurrentWallpaper'))) {
      return
    }

    handleFile(file)
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const shouldPan = event.button === 1 || spacePressed

    if (!shouldPan) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) {
      return
    }

    onPanChange({
      x: dragStart.current.panX + event.clientX - dragStart.current.pointerX,
      y: dragStart.current.panY + event.clientY - dragStart.current.pointerY,
    })
  }

  const endDrag = () => setDragging(false)

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey) {
      return
    }

    event.preventDefault()
    const nextZoom = clampZoom(zoom + (event.deltaY > 0 ? -10 : 10))
    onZoomModeChange('custom')
    onZoomChange(nextZoom)
  }

  return (
    <div
      className={`canvas-viewport ${dragging ? 'is-panning' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={handleWheel}
    >
      <div
        className="canvas-board"
        style={{
          width: boardWidth,
          aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
        }}
      >
        <div className="canvas-board-frame">
          {spec ? (
            <WallpaperRenderer spec={spec} />
          ) : (
            <button
              type="button"
              className="workspace-empty-state"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="workspace-empty-illustration" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <strong>{t('uploadWallpaper')}</strong>
              <span>{t('dragImageHere')}</span>
              <small>{t('clickToBrowse')}</small>
            </button>
          )}
          <span className="canvas-corner-handle top-left" aria-hidden="true" />
          <span className="canvas-corner-handle top-right" aria-hidden="true" />
          <span className="canvas-corner-handle bottom-left" aria-hidden="true" />
          <span className="canvas-corner-handle bottom-right" aria-hidden="true" />
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="upload-input"
        onChange={(event) => {
          const file = event.target.files?.[0]

          if (file) {
            handleFile(file)
          }

          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
