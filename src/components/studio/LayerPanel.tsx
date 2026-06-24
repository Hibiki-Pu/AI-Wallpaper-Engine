import type { WallpaperLayer } from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'

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
  const { t } = useI18n()
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex)
  const getLayerName = (layer: WallpaperLayer) => {
    if (layer.type === 'background') {
      return t('background')
    }

    const labels = {
      glow_particles: t('glowParticles'),
      petals: t('petals'),
      snow: t('snow'),
      rain: t('rain'),
      fireflies: t('fireflies'),
      fog: t('fog'),
      light_rays: t('lightRays'),
      stars: t('stars'),
    }

    return labels[layer.type]
  }

  return (
    <section className="layer-panel" aria-label="Layer panel">
      <div>
        <p className="panel-kicker">{t('layers')}</p>
        <h2>{t('layerStack')}</h2>
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
                <h3>{getLayerName(layer)}</h3>
                <p>
                  {t('zIndex')} {layer.zIndex}
                </p>
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
                  <span>{t('visible')}</span>
                </label>
                <label title="Locked">
                  <input
                    type="checkbox"
                    checked={layer.locked}
                    onChange={(event) =>
                      onLayerChange(layer.id, { locked: event.target.checked })
                    }
                  />
                  <span>{t('locked')}</span>
                </label>
                <button
                  type="button"
                  disabled={index === 0 || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveLayer(layer.id, 'up')
                  }}
                >
                  {t('moveUp')}
                </button>
                <button
                  type="button"
                  disabled={index === orderedLayers.length - 1 || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onMoveLayer(layer.id, 'down')
                  }}
                >
                  {t('moveDown')}
                </button>
                <button
                  type="button"
                  disabled={isBackground || layer.locked}
                  onClick={(event) => {
                    event.stopPropagation()
                    onLayerDelete(layer.id)
                  }}
                >
                  {t('delete')}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
