export interface WallpaperSpec {
  imageUrl: string
  camera: WallpaperCameraSpec
  effects: WallpaperEffectSpec[]
  layers: WallpaperLayer[]
}

export interface WallpaperCameraSpec {
  type: 'static' | 'ken_burns'
  zoom: number
  speed: number
}

export interface WallpaperEffectSpec {
  type: WallpaperEffectLayerType
  enabled: boolean
  count: number
  speed: number
  opacity: number
}

export type WallpaperEffectLayerType =
  | 'glow_particles'
  | 'petals'
  | 'snow'
  | 'rain'
  | 'fireflies'
  | 'fog'
  | 'light_rays'
  | 'stars'

export interface WallpaperLayer {
  id: string
  name: string
  type: 'background' | WallpaperEffectLayerType
  visible: boolean
  locked: boolean
  zIndex: number
  settings: {
    count?: number
    speed?: number
    opacity?: number
  }
}
