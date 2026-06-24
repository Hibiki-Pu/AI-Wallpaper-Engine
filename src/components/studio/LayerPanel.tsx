import type { WallpaperLayer } from '../../types/WallpaperSpec'

interface LayerPanelProps {
  layers: WallpaperLayer[]
  selectedLayerId: string | null
  onLayerSelect: (id: string) => void
  onLayerChange: (id: string, patch: Partial<WallpaperLayer>) => void
  onLayerDelete: (id: string) => void
  onMoveLayer: (id: string, direction: 'up' | 'down') => void
}

export function LayerPanel({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerChange,
  onLayerDelete,
  onMoveLayer,
}: LayerPanelProps) {
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <section className="layer-panel" aria-label="Layer panel">
      <div>
        <p className="panel-kicker">Layers</p>
        <h2>Layer Stack</h2>
      </div>

      <div className="layer-list">
        {orderedLayers.map((layer, index) => {
          const isBackground = layer.type === 'background'

          return (
            <article
              key={layer.id}
              className={`layer-row ${selectedLayerId === layer.id ? 'selected' : ''}`}
              onClick={() => onLayerSelect(layer.id)}
            >
              <div>
                <h3>{layer.name}</h3>
                <p>z-index {layer.zIndex}</p>
              </div>

              <div className="layer-actions">
                <label title="Visible">
                  <input
                    type="checkbox"
                    checked={layer.visible}
                    disabled={layer.locked}
                    onChange={(event) =>
                      onLayerChange(layer.id, { visible: event.target.checked })
                    }
                  />
                  <span>visible</span>
                </label>
                <label title="Locked">
                  <input
                    type="checkbox"
                    checked={layer.locked}
                    onChange={(event) =>
                      onLayerChange(layer.id, { locked: event.target.checked })
                    }
                  />
                  <span>locked</span>
                </label>
                <button
                  type="button"
                  disabled={index === 0 || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveLayer(layer.id, 'up')
                  }}
                >
                  Move Up
                </button>
                <button
                  type="button"
                  disabled={index === orderedLayers.length - 1 || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveLayer(layer.id, 'down')
                  }}
                >
                  Move Down
                </button>
                <button
                  type="button"
                  disabled={isBackground || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onLayerDelete(layer.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
