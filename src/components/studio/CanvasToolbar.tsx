import {
  CanvasSizeSelector,
  type CanvasSizePreset,
} from './CanvasSizeSelector'
import type { CanvasZoomMode } from './ZoomControls'
import { useI18n } from '../../i18n'

interface CanvasToolbarProps {
  canvasSize: CanvasSizePreset
  zoom: number
  zoomMode: CanvasZoomMode
  onCanvasSizeChange: (size: CanvasSizePreset) => void
}

export function CanvasToolbar({
  canvasSize,
  zoom,
  zoomMode,
  onCanvasSizeChange,
}: CanvasToolbarProps) {
  const { t } = useI18n()
  const canvasLabel = canvasSize.id === 'custom'
    ? canvasSize.label
    : t(canvasSize.label as Parameters<typeof t>[0])

  return (
    <div className="workspace-header">
      <div>
        <p className="panel-kicker">{t('canvas')}</p>
        <h1>{t('wallpaperWorkspace')}</h1>
      </div>
      <div className="workspace-header-meta">
        <span>{canvasLabel}</span>
        <span>
          {t('canvasZoom')} {zoomMode === 'custom' ? `${zoom}%` : t(zoomMode)}
        </span>
        <CanvasSizeSelector value={canvasSize} onChange={onCanvasSizeChange} />
      </div>
    </div>
  )
}
