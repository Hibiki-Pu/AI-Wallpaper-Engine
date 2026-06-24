import type {
  WallpaperEffectLayerType,
  WallpaperLayer,
} from '../types/WallpaperSpec'

export type EffectIntensity = 'weak' | 'medium' | 'strong'

export interface EffectPresetSettings {
  count: number
  speed: number
  opacity: number
  variant?: string
  size?: number
  blur?: number
  direction?: string
}

const BASE_PRESETS: Record<EffectIntensity, EffectPresetSettings> = {
  weak: {
    count: 20,
    speed: 0.5,
    opacity: 0.3,
  },
  medium: {
    count: 50,
    speed: 1,
    opacity: 0.5,
  },
  strong: {
    count: 120,
    speed: 1.5,
    opacity: 0.8,
  },
}

export const EFFECT_INTENSITY_PRESETS: Record<
  WallpaperEffectLayerType,
  Record<EffectIntensity, EffectPresetSettings>
> = {
  glow_particles: {
    weak: { ...BASE_PRESETS.weak, variant: 'soft_glow', size: 0.85 },
    medium: { ...BASE_PRESETS.medium, variant: 'magic_dust', size: 1 },
    strong: { ...BASE_PRESETS.strong, variant: 'bokeh', size: 1.2 },
  },
  petals: {
    weak: { ...BASE_PRESETS.weak, variant: 'sakura', count: 12 },
    medium: { ...BASE_PRESETS.medium, variant: 'rose_petals', count: 28 },
    strong: { ...BASE_PRESETS.strong, variant: 'tiny_flowers', count: 60 },
  },
  snow: {
    weak: { ...BASE_PRESETS.weak, variant: 'light_snow', count: 28 },
    medium: { ...BASE_PRESETS.medium, variant: 'crystal_snow', count: 70 },
    strong: { ...BASE_PRESETS.strong, variant: 'heavy_snow', count: 140 },
  },
  rain: {
    weak: { ...BASE_PRESETS.weak, variant: 'drizzle', count: 35, speed: 1 },
    medium: { ...BASE_PRESETS.medium, variant: 'neon_rain', count: 80, speed: 1.8 },
    strong: { ...BASE_PRESETS.strong, variant: 'heavy_rain', count: 150, speed: 2.8 },
  },
  fireflies: {
    weak: { ...BASE_PRESETS.weak, variant: 'warm_fireflies', count: 14 },
    medium: { ...BASE_PRESETS.medium, variant: 'fairy_lights', count: 30 },
    strong: { ...BASE_PRESETS.strong, variant: 'blue_spirits', count: 70 },
  },
  fog: {
    weak: { ...BASE_PRESETS.weak, variant: 'soft_mist', count: 2, blur: 1 },
    medium: { ...BASE_PRESETS.medium, variant: 'low_fog', count: 4, blur: 2 },
    strong: { ...BASE_PRESETS.strong, variant: 'dream_haze', count: 7, blur: 3 },
  },
  light_rays: {
    weak: { ...BASE_PRESETS.weak, variant: 'morning_rays', count: 2 },
    medium: { ...BASE_PRESETS.medium, variant: 'moonlight_rays', count: 4 },
    strong: { ...BASE_PRESETS.strong, variant: 'fantasy_beams', count: 7 },
  },
  stars: {
    weak: { ...BASE_PRESETS.weak, variant: 'twinkle', count: 35 },
    medium: { ...BASE_PRESETS.medium, variant: 'shooting_stars', count: 75 },
    strong: { ...BASE_PRESETS.strong, variant: 'galaxy_dust', count: 140 },
  },
}

export const getEffectIntensityPreset = (
  type: WallpaperEffectLayerType,
  intensity: EffectIntensity,
): EffectPresetSettings => ({
  ...EFFECT_INTENSITY_PRESETS[type][intensity],
})

export const detectEffectIntensity = (
  type: WallpaperEffectLayerType,
  settings: WallpaperLayer['settings'],
): EffectIntensity | 'custom' => {
  const entries = Object.entries(EFFECT_INTENSITY_PRESETS[type]) as Array<
    [EffectIntensity, EffectPresetSettings]
  >

  const matched = entries.find(([, preset]) => {
    return (
      settings.count === preset.count &&
      settings.speed === preset.speed &&
      settings.opacity === preset.opacity &&
      (!preset.variant || settings.variant === preset.variant)
    )
  })

  return matched?.[0] ?? 'custom'
}
