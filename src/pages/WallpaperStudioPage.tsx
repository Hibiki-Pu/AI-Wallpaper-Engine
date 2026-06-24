import { useEffect, useState } from 'react'
import { ExportPanel } from '../components/ExportPanel'
import { ImageUploader } from '../components/ImageUploader'
import { WallpaperControls } from '../components/WallpaperControls'
import { WallpaperPreview } from '../components/WallpaperPreview'
import { saveWallpaperPreviewSpec } from '../services/wallpaperPreviewStorage'
import type { WallpaperEffectSpec, WallpaperSpec } from '../types/WallpaperSpec'

type ScenePreset = 'dreamy' | 'nature' | 'winter' | 'rainy' | 'fantasy' | 'night'

const EFFECT_PRESETS: Record<
  ScenePreset,
  Record<
    WallpaperEffectSpec['type'],
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

const createDefaultWallpaperSpec = (
  imageUrl: string,
  preset: ScenePreset,
): WallpaperSpec => ({
  imageUrl,
  camera: {
    type: 'ken_burns',
    zoom: 1.06,
    speed: 1,
  },
  effects: Object.entries(EFFECT_PRESETS[preset]).map(([type, config]) => ({
    type: type as WallpaperEffectSpec['type'],
    ...config,
  })),
})

const applyPresetToSpec = (
  spec: WallpaperSpec,
  preset: ScenePreset,
): WallpaperSpec => ({
  ...spec,
  camera: {
    ...spec.camera,
    zoom: preset === 'rainy' || preset === 'fantasy' ? 1.08 : 1.06,
    speed: preset === 'rainy' ? 2.5 : preset === 'fantasy' ? 2 : 1,
  },
  effects: Object.entries(EFFECT_PRESETS[preset]).map(([type, config]) => ({
    type: type as WallpaperEffectSpec['type'],
    ...config,
  })),
})

export function WallpaperStudioPage() {
  const [wallpaperSpec, setWallpaperSpec] = useState<WallpaperSpec | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [preset, setPreset] = useState<ScenePreset>('dreamy')

  const handleImageSelected = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setActiveImageUrl((currentImageUrl) => {
      if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl)
      }

      return imageUrl
    })
    setWallpaperSpec(createDefaultWallpaperSpec(imageUrl, preset))
  }

  const handleEffectToggle = (
    type: WallpaperEffectSpec['type'],
    enabled: boolean,
  ) => {
    setWallpaperSpec((currentSpec) => {
      if (!currentSpec) {
        return currentSpec
      }

      return {
        ...currentSpec,
        effects: currentSpec.effects.map((effect) =>
          effect.type === type ? { ...effect, enabled } : effect,
        ),
      }
    })
  }

  const handlePresetChange = (nextPreset: ScenePreset) => {
    setPreset(nextPreset)
    setWallpaperSpec((currentSpec) =>
      currentSpec ? applyPresetToSpec(currentSpec, nextPreset) : currentSpec,
    )
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

  return (
    <main className="wallpaper-studio">
      <aside className="studio-sidebar">
        <ImageUploader onImageSelected={handleImageSelected} />
        <WallpaperControls
          disabled={!wallpaperSpec}
          preset={preset}
          spec={wallpaperSpec}
          onEffectToggle={handleEffectToggle}
          onPresetChange={handlePresetChange}
        />
      </aside>
      <section className="studio-main">
        <WallpaperPreview
          spec={wallpaperSpec}
          onOpenPreview={handleOpenPreview}
        />
        <ExportPanel spec={wallpaperSpec} />
      </section>
    </main>
  )
}
