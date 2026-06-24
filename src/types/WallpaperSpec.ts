export interface WallpaperSpec {
  imageUrl: string
  camera: WallpaperCameraSpec
  effects: WallpaperEffectSpec[]
}

export interface WallpaperCameraSpec {
  type: 'static' | 'ken_burns'
  zoom: number
  speed: number
}

export interface WallpaperEffectSpec {
  type: 'glow_particles' | 'petals'
  enabled: boolean
  count: number
  speed: number
  opacity: number
}
