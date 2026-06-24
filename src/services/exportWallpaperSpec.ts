import type { WallpaperSpec } from '../types/WallpaperSpec'

const WALLPAPER_SPEC_FILENAME = 'wallpaperSpec.json'

export const serializeWallpaperSpec = (spec: WallpaperSpec): string =>
  JSON.stringify(spec, null, 2)

export const downloadWallpaperSpec = (spec: WallpaperSpec) => {
  const json = serializeWallpaperSpec(spec)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = WALLPAPER_SPEC_FILENAME
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
