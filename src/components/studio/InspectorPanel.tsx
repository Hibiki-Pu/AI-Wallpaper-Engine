import type { WallpaperLayer } from '../../types/WallpaperSpec'
import type { EffectLibraryItem } from './EffectCard'

interface InspectorPanelProps {
  layer: WallpaperLayer | null
  metadata: EffectLibraryItem | null
  onEffectChange: (
    id: string,
    patch: Partial<WallpaperLayer>,
  ) => void
}

export function InspectorPanel({
  layer,
  metadata,
  onEffectChange,
}: InspectorPanelProps) {
  if (!layer) {
    return (
      <section className="inspector-panel" aria-label="Inspector panel">
        <p className="panel-kicker">Inspector</p>
        <h2>No layer selected</h2>
      </section>
    )
  }

  const isBackground = layer.type === 'background'

  return (
    <section className="inspector-panel" aria-label="Inspector panel">
      <div>
        <p className="panel-kicker">Inspector</p>
        <h2>{layer.name}</h2>
        <p className="inspector-description">
          {metadata?.description ?? 'Base wallpaper image layer.'}
        </p>
      </div>

      <label className="inspector-toggle">
        <input
          type="checkbox"
          checked={layer.visible}
          disabled={layer.locked}
          onChange={(event) =>
            onEffectChange(layer.id, { visible: event.target.checked })
          }
        />
        <span>visible</span>
      </label>

      <label className="inspector-toggle">
        <input
          type="checkbox"
          checked={layer.locked}
          onChange={(event) =>
            onEffectChange(layer.id, { locked: event.target.checked })
          }
        />
        <span>locked</span>
      </label>

      {!isBackground && (
        <>
          <label className="inspector-field">
            <span>count</span>
            <input
              type="number"
              min="0"
              max="180"
              disabled={layer.locked}
              value={layer.settings.count ?? 0}
              onChange={(event) =>
                onEffectChange(layer.id, {
                  settings: {
                    ...layer.settings,
                    count: Number(event.target.value),
                  },
                })
              }
            />
          </label>

          <label className="inspector-field">
            <span>speed</span>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.1"
              disabled={layer.locked}
              value={layer.settings.speed ?? 1}
              onChange={(event) =>
                onEffectChange(layer.id, {
                  settings: {
                    ...layer.settings,
                    speed: Number(event.target.value),
                  },
                })
              }
            />
            <output>{(layer.settings.speed ?? 1).toFixed(1)}</output>
          </label>

          <label className="inspector-field">
            <span>opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              disabled={layer.locked}
              value={layer.settings.opacity ?? 0}
              onChange={(event) =>
                onEffectChange(layer.id, {
                  settings: {
                    ...layer.settings,
                    opacity: Number(event.target.value),
                  },
                })
              }
            />
            <output>{(layer.settings.opacity ?? 0).toFixed(2)}</output>
          </label>
        </>
      )}
    </section>
  )
}
