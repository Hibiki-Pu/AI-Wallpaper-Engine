export interface WallpaperSpec {
  imageUrl: string
  camera: WallpaperCameraSpec
  effects: WallpaperEffectSpec[]
  layers: WallpaperLayer[]
}

export interface WallpaperCameraSpec {
  enabled?: boolean
  type:
    | 'static'
    | 'slow_zoom_in'
    | 'slow_zoom_out'
    | 'pan_left'
    | 'pan_right'
    | 'breathing'
  zoom: number
  speed: number
  direction?: 'left' | 'right' | 'in' | 'out'
  intensity?: number
}

export interface WallpaperEffectSpec {
  type: WallpaperEffectLayerType
  enabled: boolean
  count: number
  speed: number
  opacity: number
  variant?: string
  size?: number
  blur?: number
  color?: string
  direction?: string
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
    variant?: string
    size?: number
    blur?: number
    color?: string
    direction?: string
  }
}
