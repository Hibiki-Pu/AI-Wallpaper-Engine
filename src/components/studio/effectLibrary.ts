import type { EffectLibraryItem } from './EffectCard'

export const EFFECT_LIBRARY: EffectLibraryItem[] = [
  {
    type: 'glow_particles',
    name: 'Glow Particles',
    description: 'Soft drifting light points for a gentle magical layer.',
    icon: '\u2728',
    variants: ['soft_glow', 'magic_dust', 'bokeh'],
  },
  {
    type: 'petals',
    name: 'Petals',
    description: 'Slow falling petal shapes for calm nature motion.',
    icon: '\uD83C\uDF38',
    variants: ['sakura', 'rose_petals', 'tiny_flowers'],
  },
  {
    type: 'snow',
    name: 'Snow',
    description: 'Light flakes falling across the wallpaper.',
    icon: '\u2744\uFE0F',
    variants: ['light_snow', 'heavy_snow', 'crystal_snow'],
  },
  {
    type: 'rain',
    name: 'Rain',
    description: 'Fast diagonal drops for a rainy ambience.',
    icon: '\uD83C\uDF27\uFE0F',
    variants: ['drizzle', 'heavy_rain', 'neon_rain'],
  },
  {
    type: 'fireflies',
    name: 'Fireflies',
    description: 'Warm wandering sparks near the lower scene.',
    icon: '\uD83D\uDFE1',
    variants: ['warm_fireflies', 'blue_spirits', 'fairy_lights'],
  },
  {
    type: 'fog',
    name: 'Fog',
    description: 'Wide drifting mist layers for atmospheric depth.',
    icon: '\uD83C\uDF2B\uFE0F',
    variants: ['soft_mist', 'low_fog', 'dream_haze'],
  },
  {
    type: 'light_rays',
    name: 'Light Rays',
    description: 'Soft beams sweeping through the canvas.',
    icon: '\u2600\uFE0F',
    variants: ['morning_rays', 'moonlight_rays', 'fantasy_beams'],
  },
  {
    type: 'stars',
    name: 'Stars',
    description: 'Subtle twinkling points for night scenes.',
    icon: '\u2B50',
    variants: ['twinkle', 'shooting_stars', 'galaxy_dust'],
  },
]
