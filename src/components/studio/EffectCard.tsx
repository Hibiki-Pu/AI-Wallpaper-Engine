import type { WallpaperEffectLayerType } from '../../types/WallpaperSpec'

export interface EffectLibraryItem {
  type: WallpaperEffectLayerType
  name: string
  description: string
}

interface EffectCardProps {
  effect: EffectLibraryItem
  enabled: boolean
  selected: boolean
  disabled: boolean
  onSelect: () => void
  onToggle: (enabled: boolean) => void
}

export function EffectCard({
  effect,
  enabled,
  selected,
  disabled,
  onSelect,
  onToggle,
}: EffectCardProps) {
  return (
    <article
      className={`effect-card ${selected ? 'selected' : ''}`}
      aria-disabled={disabled}
      onClick={enabled && !disabled ? onSelect : undefined}
    >
      <div>
        <div className="effect-card-header">
          <h3>{effect.name}</h3>
          <span className={enabled ? 'status-enabled' : 'status-disabled'}>
            {enabled ? 'Enabled' : 'Off'}
          </span>
        </div>
        <p>{effect.description}</p>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          onToggle(!enabled)
        }}
      >
        {enabled ? 'Remove' : 'Add'}
      </button>
    </article>
  )
}
