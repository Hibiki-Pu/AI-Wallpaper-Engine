import type { WallpaperEffectLayerType, WallpaperSpec } from '../../types/WallpaperSpec'
import { EffectCard, type EffectLibraryItem } from './EffectCard'

interface EffectLibrarySidebarProps {
  effects: EffectLibraryItem[]
  spec: WallpaperSpec | null
  selectedLayerId: string | null
  onEffectSelect: (type: WallpaperEffectLayerType) => void
  onEffectToggle: (type: WallpaperEffectLayerType, enabled: boolean) => void
}

export function EffectLibrarySidebar({
  effects,
  spec,
  selectedLayerId,
  onEffectSelect,
  onEffectToggle,
}: EffectLibrarySidebarProps) {
  const findLayer = (type: WallpaperEffectLayerType) =>
    spec?.layers.find((layer) => layer.type === type)

  return (
    <aside className="effect-library-sidebar" aria-label="Effect library">
      <div>
        <p className="panel-kicker">Library</p>
        <h2>Effects</h2>
      </div>

      <div className="effect-card-list">
        {effects.map((effect) => {
          const effectLayer = findLayer(effect.type)
          const enabled = Boolean(effectLayer?.visible)

          return (
            <EffectCard
              key={effect.type}
              effect={effect}
              enabled={enabled}
              selected={selectedLayerId === effectLayer?.id}
              disabled={!spec}
              onSelect={() => onEffectSelect(effect.type)}
              onToggle={(nextEnabled) =>
                onEffectToggle(effect.type, nextEnabled)
              }
            />
          )
        })}
      </div>
    </aside>
  )
}
