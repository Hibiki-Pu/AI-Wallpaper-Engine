import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useI18n } from '../../i18n'

export interface CanvasSizePreset {
  id: string
  label: string
  width: number
  height: number
}

export const CANVAS_SIZE_PRESETS: CanvasSizePreset[] = [
  { id: 'desktop-16-9', label: 'desktop169', width: 1920, height: 1080 },
  { id: 'desktop-4k', label: 'desktop4k', width: 3840, height: 2160 },
  { id: 'ultrawide-21-9', label: 'ultrawide219', width: 2560, height: 1080 },
  { id: 'phone-9-16', label: 'phone916', width: 1080, height: 1920 },
  { id: 'tablet', label: 'tablet', width: 2048, height: 1536 },
  { id: 'square-1-1', label: 'square11', width: 1200, height: 1200 },
  { id: 'portrait-3-4', label: 'portrait34', width: 1200, height: 1600 },
  { id: 'landscape-4-3', label: 'landscape43', width: 1600, height: 1200 },
]

interface CanvasSizeSelectorProps {
  value: CanvasSizePreset
  onChange: (size: CanvasSizePreset) => void
}

export function CanvasSizeSelector({
  value,
  onChange,
}: CanvasSizeSelectorProps) {
  const { t } = useI18n()
  const [customOpen, setCustomOpen] = useState(false)
  const [customWidth, setCustomWidth] = useState(value.width)
  const [customHeight, setCustomHeight] = useState(value.height)

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value

    if (nextId === 'custom') {
      setCustomWidth(value.width)
      setCustomHeight(value.height)
      setCustomOpen(true)
      return
    }

    const preset = CANVAS_SIZE_PRESETS.find((item) => item.id === nextId)

    if (preset) {
      onChange(preset)
    }
  }

  const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const width = Math.max(240, Math.round(customWidth))
    const height = Math.max(240, Math.round(customHeight))

    onChange({
      id: 'custom',
      label: `${t('custom')} ${width}x${height}`,
      width,
      height,
    })
    setCustomOpen(false)
  }

  return (
    <div className="canvas-size-selector">
      <label>
        <span>{t('canvasSize')}</span>
        <select value={value.id} onChange={handlePresetChange}>
          {CANVAS_SIZE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {t(preset.label as Parameters<typeof t>[0])}
            </option>
          ))}
          <option value="custom">{t('custom')}</option>
        </select>
      </label>

      {customOpen && (
        <div className="custom-size-dialog" role="dialog" aria-modal="false">
          <form onSubmit={handleCustomSubmit}>
            <strong>{t('customCanvas')}</strong>
            <label>
              <span>{t('width')}</span>
              <input
                type="number"
                min="240"
                value={customWidth}
                onChange={(event) => setCustomWidth(Number(event.target.value))}
              />
            </label>
            <label>
              <span>{t('height')}</span>
              <input
                type="number"
                min="240"
                value={customHeight}
                onChange={(event) => setCustomHeight(Number(event.target.value))}
              />
            </label>
            <div>
              <button type="button" onClick={() => setCustomOpen(false)}>
                {t('cancel')}
              </button>
              <button type="submit">{t('apply')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
