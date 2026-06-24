import type { WallpaperEffectLayerType, WallpaperSpec } from '../../types/WallpaperSpec'
import { EffectCard, type EffectLibraryItem } from './EffectCard'
import { useI18n } from '../../i18n'

interface EffectLibrarySidebarProps {
  effects: EffectLibraryItem[]
  spec: WallpaperSpec | null
  selectedLayerId: string | null
  onEffectSelect: (type: WallpaperEffectLayerType) => void
  onEffectToggle: (
    type: WallpaperEffectLayerType,
    enabled: boolean,
    variant?: string,
  ) => void
}

export function EffectLibrarySidebar({
  effects,
  spec,
  selectedLayerId,
  onEffectSelect,
  onEffectToggle,
}: EffectLibrarySidebarProps) {
  const { t } = useI18n()
  const findLayer = (type: WallpaperEffectLayerType) =>
    spec?.layers.find((layer) => layer.type === type)

  return (
    <aside className="effect-library-sidebar" aria-label="Effect library">
      <div>
        <p className="panel-kicker">{t('library')}</p>
        <h2>{t('effects')}</h2>
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
              onToggle={(nextEnabled, variant) =>
                onEffectToggle(effect.type, nextEnabled, variant)
              }
            />
          )
        })}
      </div>
    </aside>
  )
}
