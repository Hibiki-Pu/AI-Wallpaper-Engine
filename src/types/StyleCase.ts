import type { WallpaperCameraSpec, WallpaperLayer } from './WallpaperSpec'

export type CameraConfig = WallpaperCameraSpec

export interface StyleCase {
  id: string
  name: string
  description: string
  previewEmoji: string
  tags: string[]
  recommendedScene: string[]
  camera: CameraConfig
  layers: WallpaperLayer[]
}
