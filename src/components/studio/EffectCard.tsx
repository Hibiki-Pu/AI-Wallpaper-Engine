import type { WallpaperEffectLayerType } from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'
import { useState } from 'react'
import {
  getEffectIntensityPreset,
  type EffectIntensity,
} from '../../config/effectPresets'

export interface EffectLibraryItem {
  type: WallpaperEffectLayerType
  name: string
  description: string
  icon: string
  variants?: string[]
}

interface EffectCardProps {
  effect: EffectLibraryItem
  enabled: boolean
  selected: boolean
  disabled: boolean
  intensity: EffectIntensity | 'custom'
  onSelect: () => void
  onToggle: (enabled: boolean, variant?: string) => void
  onIntensityChange: (intensity: EffectIntensity) => void
  onAdvanced: () => void
}

export function EffectCard({
  effect,
  enabled,
  selected,
  disabled,
  intensity,
  onSelect,
  onToggle,
  onIntensityChange,
  onAdvanced,
}: EffectCardProps) {
  const { t } = useI18n()
  const variants = effect.variants ?? ['default']
  const [variant, setVariant] = useState(variants[0] ?? 'default')
  const intensityOptions: EffectIntensity[] = ['weak', 'medium', 'strong']

  return (
    <article
      className={`effect-card ${selected ? 'selected' : ''}`}
      aria-disabled={disabled}
      onClick={enabled && !disabled ? onSelect : undefined}
    >
      <div>
        <div className="effect-card-header">
          <div className="effect-card-title">
            <span className="effect-card-icon" aria-hidden="true">
              {effect.icon}
            </span>
            <h3>{effect.name}</h3>
          </div>
          <span className={enabled ? 'status-enabled' : 'status-disabled'}>
            {enabled ? t('enabled') : t('off')}
          </span>
        </div>
        <p>{effect.description}</p>
      </div>

      <div className="effect-card-controls">
        <select
          value={variant}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            const nextVariant = event.target.value
            setVariant(nextVariant)
            if (enabled) {
              onToggle(true, nextVariant)
            }
          }}
        >
          {variants.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation()
            onToggle(!enabled, variant)
          }}
        >
          {enabled ? t('remove') : t('add')}
        </button>
      </div>

      <div
        className="quick-intensity"
        role="group"
        aria-label={`${effect.name} intensity`}
        onClick={(event) => event.stopPropagation()}
      >
        {intensityOptions.map((option) => (
          <button
            key={option}
            type="button"
            className={intensity === option ? 'active' : ''}
            disabled={disabled}
            onClick={() => {
              const presetVariant = getEffectIntensityPreset(
                effect.type,
                option,
              ).variant

              if (presetVariant) {
                setVariant(presetVariant)
              }

              onIntensityChange(option)
            }}
          >
            {t(option)}
          </button>
        ))}
        {intensity === 'custom' && (
          <span className="custom-intensity">{t('custom')}</span>
        )}
      </div>

      <button
        type="button"
        className="advanced-button"
        disabled={disabled || !enabled}
        onClick={(event) => {
          event.stopPropagation()
          onAdvanced()
        }}
      >
        {t('advanced')}
      </button>
    </article>
  )
}
