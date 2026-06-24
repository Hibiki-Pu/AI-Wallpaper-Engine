import { useEffect, useState } from 'react'
import { ImageUploader } from '../components/ImageUploader'
import { WallpaperControls } from '../components/WallpaperControls'
import { WallpaperPreview } from '../components/WallpaperPreview'
import type { WallpaperEffectSpec, WallpaperSpec } from '../types/WallpaperSpec'

type IntensityPreset = 'soft' | 'medium' | 'strong'

const EFFECT_PRESETS: Record<
  IntensityPreset,
  Record<WallpaperEffectSpec['type'], Pick<WallpaperEffectSpec, 'count' | 'speed' | 'opacity'>>
> = {
  soft: {
    glow_particles: { count: 18, speed: 1, opacity: 0.28 },
    petals: { count: 8, speed: 1, opacity: 0.2 },
  },
  medium: {
    glow_particles: { count: 32, speed: 2, opacity: 0.38 },
    petals: { count: 14, speed: 2, opacity: 0.28 },
  },
  strong: {
    glow_particles: { count: 48, speed: 3, opacity: 0.5 },
    petals: { count: 22, speed: 3, opacity: 0.36 },
  },
}

const createDefaultWallpaperSpec = (
  imageUrl: string,
  preset: IntensityPreset,
): WallpaperSpec => ({
  imageUrl,
  camera: {
    type: 'ken_burns',
    zoom: 1.06,
    speed: 1,
  },
  effects: [
    {
      type: 'glow_particles',
      enabled: true,
      ...EFFECT_PRESETS[preset].glow_particles,
    },
    {
      type: 'petals',
      enabled: false,
      ...EFFECT_PRESETS[preset].petals,
    },
  ],
})

const applyPresetToSpec = (
  spec: WallpaperSpec,
  preset: IntensityPreset,
): WallpaperSpec => ({
  ...spec,
  camera: {
    ...spec.camera,
    zoom: preset === 'strong' ? 1.08 : preset === 'medium' ? 1.06 : 1.04,
    speed: preset === 'strong' ? 3 : preset === 'medium' ? 2 : 1,
  },
  effects: spec.effects.map((effect) => ({
    ...effect,
    ...EFFECT_PRESETS[preset][effect.type],
  })),
})

export function WallpaperStudioPage() {
  const [wallpaperSpec, setWallpaperSpec] = useState<WallpaperSpec | null>(null)
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null)
  const [preset, setPreset] = useState<IntensityPreset>('soft')

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

  const handlePresetChange = (nextPreset: IntensityPreset) => {
    setPreset(nextPreset)
    setWallpaperSpec((currentSpec) =>
      currentSpec ? applyPresetToSpec(currentSpec, nextPreset) : currentSpec,
    )
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
      <WallpaperPreview spec={wallpaperSpec} />
    </main>
  )
}
