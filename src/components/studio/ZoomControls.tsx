import { useI18n } from '../../i18n'

export type CanvasZoomMode = 'fit' | 'fill' | 'custom'

interface ZoomControlsProps {
  zoom: number
  mode: CanvasZoomMode
  onZoomChange: (zoom: number) => void
  onModeChange: (mode: CanvasZoomMode) => void
}

const ZOOM_OPTIONS = [25, 50, 75, 100, 150, 200]

export function ZoomControls({
  zoom,
  mode,
  onZoomChange,
  onModeChange,
}: ZoomControlsProps) {
  const { t } = useI18n()
  const setZoom = (nextZoom: number) => {
    onModeChange('custom')
    onZoomChange(nextZoom)
  }

  return (
    <div className="zoom-controls" aria-label="Canvas zoom controls">
      <button
        type="button"
        className={mode === 'fit' ? 'active' : ''}
        onClick={() => onModeChange('fit')}
      >
        {t('fit')}
      </button>
      <button
        type="button"
        className={mode === 'fill' ? 'active' : ''}
        onClick={() => onModeChange('fill')}
      >
        {t('fill')}
      </button>
      <select
        value={mode === 'custom' ? zoom : mode}
        onChange={(event) => {
          const value = event.target.value

          if (value === 'fit' || value === 'fill') {
            onModeChange(value)
            return
          }

          setZoom(Number(value))
        }}
      >
        <option value="fit">{t('fit')}</option>
        <option value="fill">{t('fill')}</option>
        {ZOOM_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
      </select>
      <output>{mode === 'custom' ? `${zoom}%` : t(mode)}</output>
    </div>
  )
}
