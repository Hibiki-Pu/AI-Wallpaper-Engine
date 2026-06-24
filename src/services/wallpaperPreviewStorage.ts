import type { WallpaperSpec } from '../types/WallpaperSpec'
import { serializeWallpaperSpec } from './exportWallpaperSpec'

const WALLPAPER_PREVIEW_SPEC_KEY = 'ai-wallpaper-engine.previewSpec'

export const saveWallpaperPreviewSpec = (spec: WallpaperSpec) => {
  localStorage.setItem(WALLPAPER_PREVIEW_SPEC_KEY, serializeWallpaperSpec(spec))
}

export const loadWallpaperPreviewSpec = (): WallpaperSpec | null => {
  const storedSpec = localStorage.getItem(WALLPAPER_PREVIEW_SPEC_KEY)

  if (!storedSpec) {
    return null
  }

  try {
    return JSON.parse(storedSpec) as WallpaperSpec
  } catch {
    return null
  }
}
