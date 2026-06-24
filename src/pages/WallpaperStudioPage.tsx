import { useEffect, useState } from 'react'
import { ExportPanel } from '../components/ExportPanel'
import { EffectLibrarySidebar } from '../components/studio/EffectLibrarySidebar'
import { InspectorPanel } from '../components/studio/InspectorPanel'
import { LayerPanel } from '../components/studio/LayerPanel'
import { WallpaperCanvas } from '../components/studio/WallpaperCanvas'
import type { EffectLibraryItem } from '../components/studio/EffectCard'
import { saveWallpaperPreviewSpec } from '../services/wallpaperPreviewStorage'
import type {
  WallpaperEffectLayerType,
  WallpaperEffectSpec,
  WallpaperLayer,
  WallpaperSpec,
} from '../types/WallpaperSpec'

type ScenePreset = 'dreamy' | 'nature' | 'winter' | 'rainy' | 'fantasy' | 'night'

const EFFECT_PRESETS: Record<
  ScenePreset,
  Record<
    WallpaperEffectLayerType,
    Pick<WallpaperEffectSpec, 'enabled' | 'count' | 'speed' | 'opacity'>
  >
> = {
  dreamy: {
    glow_particles: { enabled: true, count: 30, speed: 1.4, opacity: 0.34 },
    petals: { enabled: true, count: 12, speed: 1.2, opacity: 0.24 },
    snow: { enabled: false, count: 26, speed: 1, opacity: 0.24 },
    rain: { enabled: false, count: 48, speed: 2, opacity: 0.2 },
    fireflies: { enabled: false, count: 18, speed: 1.2, opacity: 0.32 },
    fog: { enabled: false, count: 3, speed: 1, opacity: 0.18 },
    light_rays: { enabled: true, count: 3, speed: 1, opacity: 0.22 },
    stars: { enabled: false, count: 50, speed: 1, opacity: 0.28 },
  },
  nature: {
    glow_particles: { enabled: false, count: 24, speed: 1, opacity: 0.28 },
    petals: { enabled: true, count: 18, speed: 1.6, opacity: 0.3 },
    snow: { enabled: false, count: 24, speed: 1, opacity: 0.2 },
    rain: { enabled: false, count: 60, speed: 2, opacity: 0.22 },
    fireflies: { enabled: true, count: 20, speed: 1, opacity: 0.36 },
    fog: { enabled: true, count: 3, speed: 1, opacity: 0.16 },
    light_rays: { enabled: true, count: 2, speed: 1, opacity: 0.16 },
    stars: { enabled: false, count: 46, speed: 1, opacity: 0.22 },
  },
  winter: {
    glow_particles: { enabled: false, count: 18, speed: 1, opacity: 0.2 },
    petals: { enabled: false, count: 8, speed: 1, opacity: 0.18 },
    snow: { enabled: true, count: 70, speed: 1.8, opacity: 0.44 },
    rain: { enabled: false, count: 36, speed: 2, opacity: 0.18 },
    fireflies: { enabled: false, count: 12, speed: 1, opacity: 0.22 },
    fog: { enabled: true, count: 4, speed: 1, opacity: 0.25 },
    light_rays: { enabled: false, count: 2, speed: 1, opacity: 0.12 },
    stars: { enabled: false, count: 40, speed: 1, opacity: 0.18 },
  },
  rainy: {
    glow_particles: { enabled: false, count: 16, speed: 1, opacity: 0.18 },
    petals: { enabled: false, count: 8, speed: 1, opacity: 0.16 },
    snow: { enabled: false, count: 28, speed: 1, opacity: 0.18 },
    rain: { enabled: true, count: 120, speed: 3.4, opacity: 0.42 },
    fireflies: { enabled: false, count: 10, speed: 1, opacity: 0.18 },
    fog: { enabled: true, count: 4, speed: 1.4, opacity: 0.22 },
    light_rays: { enabled: false, count: 2, speed: 1, opacity: 0.12 },
    stars: { enabled: false, count: 38, speed: 1, opacity: 0.18 },
  },
  fantasy: {
    glow_particles: { enabled: true, count: 42, speed: 2, opacity: 0.42 },
    petals: { enabled: true, count: 16, speed: 1.5, opacity: 0.28 },
    snow: { enabled: false, count: 24, speed: 1, opacity: 0.18 },
    rain: { enabled: false, count: 40, speed: 2, opacity: 0.18 },
    fireflies: { enabled: true, count: 26, speed: 1.8, opacity: 0.44 },
    fog: { enabled: true, count: 3, speed: 1, opacity: 0.18 },
    light_rays: { enabled: true, count: 4, speed: 1.2, opacity: 0.26 },
    stars: { enabled: false, count: 60, speed: 1, opacity: 0.24 },
  },
  night: {
    glow_particles: { enabled: true, count: 24, speed: 1, opacity: 0.3 },
    petals: { enabled: false, count: 8, speed: 1, opacity: 0.16 },
    snow: { enabled: false, count: 22, speed: 1, opacity: 0.16 },
    rain: { enabled: false, count: 44, speed: 2, opacity: 0.18 },
    fireflies: { enabled: false, count: 14, speed: 1, opacity: 0.24 },
    fog: { enabled: false, count: 3, speed: 1, opacity: 0.16 },
    light_rays: { enabled: false, count: 2, speed: 1, opacity: 0.12 },
    stars: { enabled: true, count: 90, speed: 1.2, opacity: 0.46 },
  },
}

const EFFECT_LIBRARY: EffectLibraryItem[] = [
  {
    type: 'glow_particles',
    name: 'Glow Particles',
    description: 'Soft drifting light points for a gentle magical layer.',
  },
  {
    type: 'petals',
    name: 'Petals',
    description: 'Slow falling petal shapes for calm nature motion.',
  },
  {
    type: 'snow',
    name: 'Snow',
    description: 'Light flakes falling across the wallpaper.',
  },
  {
    type: 'rain',
    name: 'Rain',
    description: 'Fast diagonal drops for a rainy ambience.',
  },
  {
    type: 'fireflies',
    name: 'Fireflies',
    description: 'Warm wandering sparks near the lower scene.',
  },
  {
    type: 'fog',
    name: 'Fog',
    description: 'Wide drifting mist layers for atmospheric depth.',
  },
  {
    type: 'light_rays',
    name: 'Light Rays',
    description: 'Soft beams sweeping through the canvas.',
  },
  {
    type: 'stars',
    name: 'Stars',
    description: 'Subtle twinkling points for night scenes.',
  },
]

const createLayerId = (type: WallpaperLayer['type']) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getEffectName = (type: WallpaperEffectLayerType) =>
  EFFECT_LIBRARY.find((effect) => effect.type === type)?.name ?? type

const getPresetConfig = (
  type: WallpaperEffectLayerType,
  preset: ScenePreset,
) => EFFECT_PRESETS[preset][type]

const createBackgroundLayer = (): WallpaperLayer => ({
  id: 'background',
  name: 'Background',
  type: 'background',
  visible: true,
  locked: false,
  zIndex: 0,
  settings: {},
})

const createEffectLayer = (
  type: WallpaperEffectLayerType,
  preset: ScenePreset,
  zIndex: number,
  visible = true,
): WallpaperLayer => {
  const config = getPresetConfig(type, preset)

  return {
    id: createLayerId(type),
    name: getEffectName(type),
    type,
    visible,
    locked: false,
    zIndex,
    settings: {
      count: config.count,
      speed: config.speed,
      opacity: config.opacity,
    },
  }
}

const layersToEffects = (layers: WallpaperLayer[]): WallpaperEffectSpec[] =>
  layers
    .filter(
      (layer): layer is WallpaperLayer & { type: WallpaperEffectLayerType } =>
        layer.type !== 'background',
    )
    .map((layer) => ({
      type: layer.type,
      enabled: layer.visible,
      count: layer.settings.count ?? 0,
      speed: layer.settings.speed ?? 1,
      opacity: layer.settings.opacity ?? 0,
    }))

const normalizeLayerOrder = (layers: WallpaperLayer[]): WallpaperLayer[] =>
  [...layers]
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer, index) => ({
      ...layer,
      zIndex: index,
    }))

const withSyncedEffects = (spec: WallpaperSpec): WallpaperSpec => ({
  ...spec,
  layers: normalizeLayerOrder(spec.layers),
  effects: layersToEffects(normalizeLayerOrder(spec.layers)),
})

const createDefaultWallpaperSpec = (
  imageUrl: string,
  preset: ScenePreset,
): WallpaperSpec => {
  const layers = [
    createBackgroundLayer(),
    ...Object.entries(EFFECT_PRESETS[preset])
      .filter(([, config]) => config.enabled)
      .map(([type], index) =>
        createEffectLayer(type as WallpaperEffectLayerType, preset, index + 1),
      ),
  ]

  return withSyncedEffects({
    imageUrl,
    camera: {
      type: 'ken_burns',
      zoom: 1.06,
      speed: 1,
    },
    effects: [],
    layers,
  })
}

const applyPresetToSpec = (
  spec: WallpaperSpec,
  preset: ScenePreset,
): WallpaperSpec => {
  const layers = [
    spec.layers.find((layer) => layer.type === 'background') ??
      createBackgroundLayer(),
    ...Object.entries(EFFECT_PRESETS[preset])
      .filter(([, config]) => config.enabled)
      .map(([type], index) =>
        createEffectLayer(type as WallpaperEffectLayerType, preset, index + 1),
      ),
  ]

  return withSyncedEffects({
    ...spec,
    camera: {
      ...spec.camera,
      zoom: preset === 'rainy' || preset === 'fantasy' ? 1.08 : 1.06,
      speed: preset === 'rainy' ? 2.5 : preset === 'fantasy' ? 2 : 1,
    },
    layers,
  })
}

export function WallpaperStudioPage() {
  const [wallpaperSpec, setWallpaperSpec] = useState<WallpaperSpec | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [preset, setPreset] = useState<ScenePreset>('dreamy')
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const handleImageSelected = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setActiveImageUrl((currentImageUrl) => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return imageUrl
    })
    const nextSpec = createDefaultWallpaperSpec(imageUrl, preset)
    setWallpaperSpec(nextSpec)
    setSelectedLayerId(nextSpec.layers[1]?.id ?? nextSpec.layers[0]?.id ?? null)
  }

  const handleEffectSelect = (type: WallpaperEffectLayerType) => {
    const layer = wallpaperSpec?.layers.find((item) => item.type === type)
    setSelectedLayerId(layer?.id ?? null)
  }

  const handleEffectToggle = (
    type: WallpaperEffectLayerType,
    enabled: boolean,
  ) => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      if (!enabled) {
        const layerToRemove = [...currentSpec.layers]
          .reverse()
          .find((layer) => layer.type === type)
        const nextLayers = layerToRemove
          ? currentSpec.layers.filter((layer) => layer.id !== layerToRemove.id)
          : currentSpec.layers

        if (layerToRemove?.id === selectedLayerId) {
          setSelectedLayerId(nextLayers[0]?.id ?? null)
        }

        return withSyncedEffects({ ...currentSpec, layers: nextLayers })
      }

      const nextZIndex =
        Math.max(...currentSpec.layers.map((layer) => layer.zIndex), 0) + 1
      const nextLayer = createEffectLayer(type, preset, nextZIndex)
      setSelectedLayerId(nextLayer.id)

      return withSyncedEffects({
        ...currentSpec,
        layers: [...currentSpec.layers, nextLayer],
      })
    })
  }

  const handleLayerChange = (
    id: string,
    patch: Partial<WallpaperLayer>,
  ) => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      return {
        ...withSyncedEffects({
          ...currentSpec,
          layers: currentSpec.layers.map((layer) =>
            layer.id === id ? { ...layer, ...patch } : layer,
          ),
        }),
      }
    })
  }

  const handleLayerDelete = (id: string) => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      const target = currentSpec.layers.find((layer) => layer.id === id)

      if (!target || target.type === 'background' || target.locked) {
        return currentSpec
      }

      const nextLayers = currentSpec.layers.filter((layer) => layer.id !== id)
      setSelectedLayerId(nextLayers[0]?.id ?? null)

      return withSyncedEffects({ ...currentSpec, layers: nextLayers })
    })
  }

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      const orderedLayers = normalizeLayerOrder(currentSpec.layers)
      const currentIndex = orderedLayers.findIndex((layer) => layer.id === id)
      const targetIndex = direction === 'up' ? currentIndex + 1 : currentIndex - 1

      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= orderedLayers.length ||
        orderedLayers[currentIndex].locked
      ) {
        return currentSpec
      }

      const nextLayers = [...orderedLayers]
      const currentLayer = nextLayers[currentIndex]
      nextLayers[currentIndex] = nextLayers[targetIndex]
      nextLayers[targetIndex] = currentLayer

      return withSyncedEffects({ ...currentSpec, layers: nextLayers })
    })
  }

  const handleLayerSelect = (id: string) => {
    setSelectedLayerId(id)
  }

  const handleInspectorLayerChange = (
    id: string,
    patch: Partial<WallpaperLayer>,
  ) => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      return withSyncedEffects({
        ...currentSpec,
        effects: currentSpec.effects.map((effect) =>
          effect,
        ),
        layers: currentSpec.layers.map((layer) =>
          layer.id === id ? { ...layer, ...patch } : layer,
        ),
      })
    })
  }

  const handlePresetChange = (nextPreset: ScenePreset) => {
    setPreset(nextPreset)
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      const nextSpec = applyPresetToSpec(currentSpec, nextPreset)
      setSelectedLayerId(nextSpec.layers[1]?.id ?? nextSpec.layers[0]?.id ?? null)
      return nextSpec
    })
  }

  const handleOpenPreview = () => {
    if (!wallpaperSpec) {
      return
    }

    saveWallpaperPreviewSpec(wallpaperSpec)
    window.open('/preview', '_blank')
  }

  useEffect(() => {
    return () => {
      if (activeImageUrl) {
        URL.revokeObjectURL(activeImageUrl)
      }
    }
  }, [activeImageUrl])

  const selectedLayer =
    wallpaperSpec?.layers.find((layer) => layer.id === selectedLayerId) ??
    null
  const selectedEffectMetadata =
    selectedLayer?.type === 'background'
      ? null
      : EFFECT_LIBRARY.find((effect) => effect.type === selectedLayer?.type) ??
        null

  return (
    <main className="wallpaper-studio">
      <EffectLibrarySidebar
        effects={EFFECT_LIBRARY}
        spec={wallpaperSpec}
        selectedLayerId={selectedLayerId}
        onEffectSelect={handleEffectSelect}
        onEffectToggle={handleEffectToggle}
      />

      <section className="studio-canvas-column">
        <WallpaperCanvas
          spec={wallpaperSpec}
          onImageSelected={handleImageSelected}
          onOpenPreview={handleOpenPreview}
        />
      </section>

      <aside className="studio-inspector-column">
        {wallpaperSpec && (
          <LayerPanel
            layers={wallpaperSpec.layers}
            selectedLayerId={selectedLayerId}
            onLayerSelect={handleLayerSelect}
            onLayerChange={handleLayerChange}
            onLayerDelete={handleLayerDelete}
            onMoveLayer={handleMoveLayer}
          />
        )}

        <section className="preset-panel" aria-label="Scene presets">
          <p className="panel-kicker">Presets</p>
          <div className="preset-control">
            {Object.keys(EFFECT_PRESETS).map((presetName) => (
              <button
                key={presetName}
                type="button"
                disabled={!wallpaperSpec}
                className={preset === presetName ? 'active' : ''}
                onClick={() => handlePresetChange(presetName as ScenePreset)}
              >
                {presetName}
              </button>
            ))}
          </div>
        </section>

        <InspectorPanel
          layer={selectedLayer}
          metadata={selectedEffectMetadata}
          onEffectChange={handleInspectorLayerChange}
        />
        <ExportPanel spec={wallpaperSpec} />
      </aside>
    </main>
  )
}
