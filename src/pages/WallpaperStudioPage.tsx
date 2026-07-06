import { useEffect, useState } from 'react'
import { StudioCanvas } from '../components/studio/StudioCanvas'
import { StudioDrawer } from '../components/studio/StudioDrawer'
import { FloatingPanelButton } from '../components/studio/FloatingPanelButton'
import { StudioInspector, type StudioInspectorSection } from '../components/studio/StudioInspector'
import { StudioSidebar } from '../components/studio/StudioSidebar'
import { StudioToolbar } from '../components/studio/StudioToolbar'
import type { EffectLibraryItem } from '../components/studio/EffectCard'
import { EFFECT_LIBRARY as BASE_EFFECT_LIBRARY } from '../components/studio/effectLibrary'
import {
  detectEffectIntensity,
  getEffectIntensityPreset,
  type EffectIntensity,
} from '../config/effectPresets'
import { saveWallpaperPreviewSpec } from '../services/wallpaperPreviewStorage'
import { generateSmartMatch } from '../services/smartMatch/smartMatchEngine'
import { getAllStyleCasesFromPacks } from '../services/stylePacks/stylePackService'
import type {
  WallpaperEffectLayerType,
  WallpaperEffectSpec,
  WallpaperLayer,
  WallpaperSpec,
} from '../types/WallpaperSpec'
import type { StyleCase } from '../types/StyleCase'
import type { SmartMatch } from '../types/SmartMatch'
import { useI18n } from '../i18n'

type ScenePreset = 'dreamy' | 'nature' | 'winter' | 'rainy' | 'fantasy' | 'night'

const translateEffectLibrary = (
  t: ReturnType<typeof useI18n>['t'],
): EffectLibraryItem[] =>
  BASE_EFFECT_LIBRARY.map((effect) => ({
    ...effect,
    name:
      effect.type === 'glow_particles'
        ? t('glowParticles')
        : effect.type === 'petals'
          ? t('petals')
          : effect.type === 'snow'
            ? t('snow')
            : effect.type === 'rain'
              ? t('rain')
              : effect.type === 'fireflies'
                ? t('fireflies')
                : effect.type === 'fog'
                  ? t('fog')
                  : effect.type === 'light_rays'
                    ? t('lightRays')
                    : t('stars'),
    description:
      effect.type === 'glow_particles'
        ? t('glowParticlesDesc')
        : effect.type === 'petals'
          ? t('petalsDesc')
          : effect.type === 'snow'
            ? t('snowDesc')
            : effect.type === 'rain'
              ? t('rainDesc')
              : effect.type === 'fireflies'
                ? t('firefliesDesc')
                : effect.type === 'fog'
                  ? t('fogDesc')
                  : effect.type === 'light_rays'
                    ? t('lightRaysDesc')
                    : t('starsDesc'),
  }))

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

const createLayerId = (type: WallpaperLayer['type']) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const readImageDimensions = (
  imageUrl: string,
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    image.onerror = reject
    image.src = imageUrl
  })

const getEffectName = (type: WallpaperEffectLayerType) =>
  BASE_EFFECT_LIBRARY.find((effect) => effect.type === type)?.name ?? type

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
  variant?: string,
): WallpaperLayer => {
  const config = getPresetConfig(type, preset)
  const defaultVariant =
    variant ?? BASE_EFFECT_LIBRARY.find((effect) => effect.type === type)?.variants?.[0]

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
      variant: defaultVariant,
      size: 1,
      blur: 0,
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
      variant: layer.settings.variant,
      size: layer.settings.size,
      blur: layer.settings.blur,
      color: layer.settings.color,
      direction: layer.settings.direction,
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

const cloneStyleCaseLayers = (styleCase: StyleCase): WallpaperLayer[] =>
  styleCase.layers.map((layer, index) => ({
    ...layer,
    id: createLayerId(layer.type),
    zIndex: index + 1,
    settings: {
      ...layer.settings,
    },
  }))

const createDefaultWallpaperSpecFromStyleCase = (
  imageUrl: string,
  styleCase: StyleCase,
): WallpaperSpec =>
  withSyncedEffects({
    imageUrl,
    camera: {
      ...styleCase.camera,
    },
    effects: [],
    layers: [createBackgroundLayer(), ...cloneStyleCaseLayers(styleCase)],
  })

const applyStyleCaseToSpec = (
  spec: WallpaperSpec,
  styleCase: StyleCase,
): WallpaperSpec => {
  const backgroundLayer =
    spec.layers.find((layer) => layer.type === 'background') ??
    createBackgroundLayer()

  return withSyncedEffects({
    ...spec,
    camera: {
      ...styleCase.camera,
    },
    layers: [backgroundLayer, ...cloneStyleCaseLayers(styleCase)],
  })
}

export function WallpaperStudioPage() {
  const { t } = useI18n()
  const effectLibrary = translateEffectLibrary(t)
  const [wallpaperSpec, setWallpaperSpec] = useState<WallpaperSpec | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [activeImageFileName, setActiveImageFileName] = useState('')
  const [activeImageDimensions, setActiveImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [smartMatch, setSmartMatch] = useState<SmartMatch | null>(null)
  const [isSmartMatchAnalyzing, setIsSmartMatchAnalyzing] = useState(false)
  const preset: ScenePreset = 'dreamy'
  const [activeStyleCaseId, setActiveStyleCaseId] = useState(
    getAllStyleCasesFromPacks()[0]?.id ?? '',
  )
  const [stylePacksVersion, setStylePacksVersion] = useState(0)
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)
  const [canvasResetSignal, setCanvasResetSignal] = useState(0)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<
    Record<StudioInspectorSection, boolean>
  >({
    current: true,
    smartMatch: false,
    layers: false,
    export: false,
  })
  const [quickSelections, setQuickSelections] = useState<
    Partial<
      Record<
        WallpaperEffectLayerType,
        { intensity: EffectIntensity; variant?: string }
      >
    >
  >({})

  const findLatestEffectLayer = (type: WallpaperEffectLayerType) =>
    wallpaperSpec?.layers
      .filter((layer) => layer.type === type)
      .sort((a, b) => b.zIndex - a.zIndex)[0] ?? null

  const runSmartMatch = async (imageUrl: string, fileName: string) => {
    setIsSmartMatchAnalyzing(true)

    try {
      const nextMatch = await generateSmartMatch({ imageUrl, fileName })
      setSmartMatch(nextMatch)
    } finally {
      setIsSmartMatchAnalyzing(false)
    }
  }

  const handleImageSelected = (file: File) => {
    if (wallpaperSpec) {
      handleImageReplace(file)
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setActiveImageFileName(file.name)
    setActiveImageDimensions(null)
    setSmartMatch(null)
    setActiveImageUrl((currentImageUrl) => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return imageUrl
    })
    const installedStyleCases = getAllStyleCasesFromPacks()
    const activeStyleCase =
      installedStyleCases.find((styleCase) => styleCase.id === activeStyleCaseId) ??
      installedStyleCases[0]

    if (!activeStyleCase) {
      return
    }

    const nextSpec = createDefaultWallpaperSpecFromStyleCase(
      imageUrl,
      activeStyleCase,
    )
    setWallpaperSpec(nextSpec)
    setSelectedLayerId(nextSpec.layers[1]?.id ?? nextSpec.layers[0]?.id ?? null)
    void readImageDimensions(imageUrl)
      .then(setActiveImageDimensions)
      .catch(() => setActiveImageDimensions(null))
    void runSmartMatch(imageUrl, file.name)
  }

  const handleImageReplace = (file: File) => {
    if (!wallpaperSpec) {
      handleImageSelected(file)
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setActiveImageFileName(file.name)
    setActiveImageDimensions(null)
    setSmartMatch(null)
    setActiveImageUrl((currentImageUrl) => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return imageUrl
    })
    setWallpaperSpec((currentSpec) =>
      currentSpec
        ? withSyncedEffects({
            ...currentSpec,
            imageUrl,
          })
        : currentSpec,
    )
    setCanvasResetSignal((currentSignal) => currentSignal + 1)
    void readImageDimensions(imageUrl)
      .then(setActiveImageDimensions)
      .catch(() => setActiveImageDimensions(null))
    void runSmartMatch(imageUrl, file.name)
  }

  const handleImageDelete = () => {
    setActiveImageUrl((currentImageUrl) => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return null
    })
    setActiveImageFileName('')
    setActiveImageDimensions(null)
    setSmartMatch(null)
    setWallpaperSpec(null)
    setSelectedLayerId(null)
    setCanvasResetSignal((currentSignal) => currentSignal + 1)
  }

  const handleResetCanvasPosition = () => {
    setCanvasResetSignal((currentSignal) => currentSignal + 1)
  }

  const handleEffectSelect = (type: WallpaperEffectLayerType) => {
    const layer = findLatestEffectLayer(type)
    setSelectedLayerId(layer?.id ?? null)
  }

  const handleEffectToggle = (
    type: WallpaperEffectLayerType,
    enabled: boolean,
    variant?: string,
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

      const existingLayer = [...currentSpec.layers]
        .reverse()
        .find((layer) => layer.type === type)

      if (existingLayer) {
        return withSyncedEffects({
          ...currentSpec,
          layers: currentSpec.layers.map((layer) =>
            layer.id === existingLayer.id
              ? {
                  ...layer,
                  visible: true,
                  settings: {
                    ...layer.settings,
                    ...(variant ? { variant } : {}),
                  },
                }
              : layer,
          ),
        })
      }

      const selectedQuick = quickSelections[type]
      const selectedIntensity = selectedQuick?.intensity ?? 'medium'
      const intensityPreset = getEffectIntensityPreset(type, selectedIntensity)
      const nextZIndex =
        Math.max(...currentSpec.layers.map((layer) => layer.zIndex), 0) + 1
      const nextLayer = createEffectLayer(
        type,
        preset,
        nextZIndex,
        true,
        variant ?? selectedQuick?.variant ?? intensityPreset.variant,
      )
      nextLayer.settings = {
        ...nextLayer.settings,
        ...intensityPreset,
        variant: variant ?? selectedQuick?.variant ?? intensityPreset.variant,
      }
      setSelectedLayerId(nextLayer.id)

      return withSyncedEffects({
        ...currentSpec,
        layers: [...currentSpec.layers, nextLayer],
      })
    })
  }

  const getEffectIntensity = (
    type: WallpaperEffectLayerType,
  ): EffectIntensity | 'custom' => {
    const layer = findLatestEffectLayer(type)

    if (!layer) {
      return quickSelections[type]?.intensity ?? 'medium'
    }

    return detectEffectIntensity(type, layer.settings)
  }

  const handleEffectIntensityChange = (
    type: WallpaperEffectLayerType,
    intensity: EffectIntensity,
  ) => {
    const intensityPreset = getEffectIntensityPreset(type, intensity)
    setQuickSelections((currentSelections) => ({
      ...currentSelections,
      [type]: {
        intensity,
        variant: intensityPreset.variant,
      },
    }))

    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      const targetLayer = [...currentSpec.layers]
        .reverse()
        .find((layer) => layer.type === type)

      if (!targetLayer) {
        return currentSpec
      }

      return withSyncedEffects({
        ...currentSpec,
        layers: currentSpec.layers.map((layer) =>
          layer.id === targetLayer.id
            ? {
                ...layer,
                settings: {
                  ...layer.settings,
                  ...intensityPreset,
                },
              }
            : layer,
        ),
      })
    })
  }

  const handleEffectAdvanced = (type: WallpaperEffectLayerType) => {
    const layer = findLatestEffectLayer(type)

    if (!layer) {
      return
    }

    setSelectedLayerId(layer.id)
    setRightDrawerOpen(true)
    setOpenSections((currentSections) => ({
      ...currentSections,
      current: true,
    }))
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

  const handleStyleCaseApply = (styleCase: StyleCase) => {
    setActiveStyleCaseId(styleCase.id)
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      const nextSpec = applyStyleCaseToSpec(currentSpec, styleCase)
      setSelectedLayerId(nextSpec.layers[1]?.id ?? nextSpec.layers[0]?.id ?? null)
      return nextSpec
    })
  }

  const handleCameraChange = (patch: Partial<WallpaperSpec['camera']>) => {
    setWallpaperSpec((currentSpec) =>
      currentSpec
        ? {
            ...currentSpec,
            camera: {
              ...currentSpec.camera,
              ...patch,
            },
          }
        : currentSpec,
    )
  }

  const toggleSection = (section: StudioInspectorSection) => {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [section]: !currentSections[section],
    }))
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
      : effectLibrary.find((effect) => effect.type === selectedLayer?.type) ??
        null
  const smartMatchScores =
    smartMatch?.matchedCases.reduce<Record<string, number>>(
      (scores, styleCase, index) => ({
        ...scores,
        [styleCase.id]: Math.max(0.52, smartMatch.confidence - index * 0.08),
      }),
      {},
    ) ?? {}

  return (
    <main className="wallpaper-studio">
      <StudioToolbar
        canPreview={Boolean(wallpaperSpec)}
        onOpenPreview={handleOpenPreview}
      />

      <section className="studio-canvas-shell">
        <FloatingPanelButton
          side="left"
          icon="🖼️"
          label={t('assetLibrary')}
          onClick={() => setLeftDrawerOpen(true)}
        />
        <FloatingPanelButton
          side="right"
          icon="⚙"
          label={t('properties')}
          onClick={() => setRightDrawerOpen(true)}
        />

        <StudioCanvas
          spec={wallpaperSpec}
          onImageSelected={handleImageSelected}
          onImageReplace={handleImageReplace}
          resetSignal={canvasResetSignal}
        />
      </section>

      <StudioDrawer
        side="left"
        title={t('assetLibrary')}
        open={leftDrawerOpen}
        onClose={() => setLeftDrawerOpen(false)}
      >
        <StudioSidebar
          effects={effectLibrary}
          spec={wallpaperSpec}
          selectedLayerId={selectedLayerId}
          activeImageFileName={activeImageFileName}
          activeImageDimensions={activeImageDimensions}
          activeStyleCaseId={activeStyleCaseId}
          smartMatchScores={smartMatchScores}
          stylePacksVersion={stylePacksVersion}
          onStylePacksChange={() =>
            setStylePacksVersion((currentVersion) => currentVersion + 1)
          }
          onStyleCaseApply={handleStyleCaseApply}
          onImageReplace={handleImageReplace}
          onImageDelete={handleImageDelete}
          onResetCanvasPosition={handleResetCanvasPosition}
          onCameraChange={handleCameraChange}
          onEffectSelect={handleEffectSelect}
          onEffectToggle={handleEffectToggle}
          getEffectIntensity={getEffectIntensity}
          onEffectIntensityChange={handleEffectIntensityChange}
          onEffectAdvanced={handleEffectAdvanced}
        />
      </StudioDrawer>

      <StudioDrawer
        side="right"
        title={t('properties')}
        open={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
      >
        <StudioInspector
          openSections={openSections}
          spec={wallpaperSpec}
          selectedLayer={selectedLayer}
          selectedEffectMetadata={selectedEffectMetadata}
          selectedLayerId={selectedLayerId}
          smartMatch={smartMatch}
          isSmartMatchAnalyzing={isSmartMatchAnalyzing}
          activeImageFileName={activeImageFileName}
          onToggleSection={toggleSection}
          onSmartMatch={setSmartMatch}
          onSmartMatchAnalyzingChange={setIsSmartMatchAnalyzing}
          onStyleCaseApply={handleStyleCaseApply}
          onLayerSelect={handleLayerSelect}
          onLayerChange={handleLayerChange}
          onLayerDelete={handleLayerDelete}
          onMoveLayer={handleMoveLayer}
          onInspectorLayerChange={handleInspectorLayerChange}
        />
      </StudioDrawer>
    </main>
  )
}

