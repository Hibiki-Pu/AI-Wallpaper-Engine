import type { WallpaperEffectLayerType } from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'
import { useState } from 'react'

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
  onSelect: () => void
  onToggle: (enabled: boolean, variant?: string) => void
}

export function EffectCard({
  effect,
  enabled,
  selected,
  disabled,
  onSelect,
  onToggle,
}: EffectCardProps) {
  const { t } = useI18n()
  const variants = effect.variants ?? ['default']
  const [variant, setVariant] = useState(variants[0] ?? 'default')

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
          disabled={disabled || enabled}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setVariant(event.target.value)}
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
    </article>
  )
}
