import { useEffect, useState } from 'react'
import { ImageUploader } from '../components/ImageUploader'
import { WallpaperPreview } from '../components/WallpaperPreview'
import type { WallpaperSpec } from '../types/WallpaperSpec'

export function WallpaperStudioPage() {
  const [wallpaperSpec, setWallpaperSpec] = useState<WallpaperSpec | null>(null)

  const handleImageSelected = (file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setWallpaperSpec((currentSpec) => {
      if (currentSpec) {
        URL.revokeObjectURL(currentSpec.imageUrl)
      }

      return { imageUrl }
    })
  }

  useEffect(() => {
    return () => {
      if (wallpaperSpec) {
        URL.revokeObjectURL(wallpaperSpec.imageUrl)
      }
    }
  }, [wallpaperSpec])

  return (
    <main className="wallpaper-studio">
      <ImageUploader onImageSelected={handleImageSelected} />
      <WallpaperPreview spec={wallpaperSpec} />
    </main>
  )
}
