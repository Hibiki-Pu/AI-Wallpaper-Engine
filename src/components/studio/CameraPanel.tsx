import type { WallpaperCameraSpec } from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'

interface CameraPanelProps {
  camera: WallpaperCameraSpec | null
  onCameraChange: (patch: Partial<WallpaperCameraSpec>) => void
}

const CAMERA_MODES: Array<{
  type: WallpaperCameraSpec['type']
  label: string
  patch: Partial<WallpaperCameraSpec>
}> = [
  { type: 'static', label: 'Static', patch: { enabled: false, zoom: 1, speed: 1 } },
  {
    type: 'slow_zoom_in',
    label: 'Slow Zoom In',
    patch: { enabled: true, zoom: 1.08, speed: 1, direction: 'in', intensity: 1 },
  },
  {
    type: 'slow_zoom_out',
    label: 'Slow Zoom Out',
    patch: { enabled: true, zoom: 1.08, speed: 1, direction: 'out', intensity: 1 },
  },
  {
    type: 'pan_left',
    label: 'Gentle Pan Left',
    patch: { enabled: true, zoom: 1.04, speed: 1, direction: 'left', intensity: 1 },
  },
  {
    type: 'pan_right',
    label: 'Gentle Pan Right',
    patch: { enabled: true, zoom: 1.04, speed: 1, direction: 'right', intensity: 1 },
  },
  {
    type: 'breathing',
    label: 'Floating / Breathing',
    patch: { enabled: true, zoom: 1.035, speed: 1, intensity: 0.7 },
  },
]

export function CameraPanel({ camera, onCameraChange }: CameraPanelProps) {
  const { t } = useI18n()

  if (!camera) {
    return null
  }

  const handleModeChange = (type: WallpaperCameraSpec['type']) => {
    const mode = CAMERA_MODES.find((item) => item.type === type)

    if (!mode) {
      return
    }

    onCameraChange({ type, ...mode.patch })
  }

  return (
    <section className="camera-panel" aria-label="Camera panel">
      <div>
        <p className="panel-kicker">{t('camera')}</p>
        <h2>{t('cameraMotion')}</h2>
      </div>

      <label className="inspector-field">
        <span>{t('cameraMode')}</span>
        <select
          value={camera.type}
          onChange={(event) =>
            handleModeChange(event.target.value as WallpaperCameraSpec['type'])
          }
        >
          {CAMERA_MODES.map((mode) => (
            <option key={mode.type} value={mode.type}>
              {mode.label}
            </option>
          ))}
        </select>
      </label>

      <label className="inspector-toggle">
        <input
          type="checkbox"
          checked={camera.enabled ?? camera.type !== 'static'}
          onChange={(event) => onCameraChange({ enabled: event.target.checked })}
        />
        <span>{t('enabled')}</span>
      </label>

      <label className="inspector-field">
        <span>{t('zoom')}</span>
        <input
          type="range"
          min="1"
          max="1.2"
          step="0.005"
          value={camera.zoom}
          onChange={(event) => onCameraChange({ zoom: Number(event.target.value) })}
        />
        <output>{camera.zoom.toFixed(3)}</output>
      </label>

      <label className="inspector-field">
        <span>{t('speed')}</span>
        <input
          type="range"
          min="0.5"
          max="4"
          step="0.1"
          value={camera.speed}
          onChange={(event) => onCameraChange({ speed: Number(event.target.value) })}
        />
        <output>{camera.speed.toFixed(1)}</output>
      </label>

      <label className="inspector-field">
        <span>{t('intensity')}</span>
        <input
          type="range"
          min="0.1"
          max="2"
          step="0.1"
          value={camera.intensity ?? 1}
          onChange={(event) =>
            onCameraChange({ intensity: Number(event.target.value) })
          }
        />
        <output>{(camera.intensity ?? 1).toFixed(1)}</output>
      </label>
    </section>
  )
}
