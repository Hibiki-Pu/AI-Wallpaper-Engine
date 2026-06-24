import type { WallpaperEffectSpec, WallpaperSpec } from '../types/WallpaperSpec'

type IntensityPreset = 'soft' | 'medium' | 'strong'

interface WallpaperControlsProps {
  disabled: boolean
  preset: IntensityPreset
  spec: WallpaperSpec | null
  onEffectToggle: (type: WallpaperEffectSpec['type'], enabled: boolean) => void
  onPresetChange: (preset: IntensityPreset) => void
}

const EFFECT_LABELS: Record<WallpaperEffectSpec['type'], string> = {
  glow_particles: 'Glow particles',
  petals: 'Petals',
}

const PRESETS: IntensityPreset[] = ['soft', 'medium', 'strong']

export function WallpaperControls({
  disabled,
  preset,
  spec,
  onEffectToggle,
  onPresetChange,
}: WallpaperControlsProps) {
  const findEffect = (type: WallpaperEffectSpec['type']) =>
    spec?.effects.find((effect) => effect.type === type)

  return (
    <section className="controls-panel" aria-label="Wallpaper controls">
      <div>
        <p className="control-label">Effects</p>
        <div className="effect-toggles">
          {Object.entries(EFFECT_LABELS).map(([type, label]) => {
            const effectType = type as WallpaperEffectSpec['type']
            const effect = findEffect(effectType)

            return (
              <label className="toggle-row" key={type}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={Boolean(effect?.enabled)}
                  onChange={(event) =>
                    onEffectToggle(effectType, event.target.checked)
                  }
                />
                <span>{label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div>
        <p className="control-label">Intensity</p>
        <div className="preset-control">
          {PRESETS.map((presetName) => (
            <button
              key={presetName}
              type="button"
              disabled={disabled}
              className={preset === presetName ? 'active' : ''}
              onClick={() => onPresetChange(presetName)}
            >
              {presetName}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
