import type { CSSProperties } from 'react'
import type { WallpaperEffectSpec, WallpaperSpec } from '../types/WallpaperSpec'
import { GlowParticlesEffect } from './effects/GlowParticlesEffect'
import { PetalsEffect } from './effects/PetalsEffect'

interface WallpaperRendererProps {
  spec: WallpaperSpec
}

const renderEffect = (effect: WallpaperEffectSpec) => {
  switch (effect.type) {
    case 'glow_particles':
      return <GlowParticlesEffect key={effect.type} effect={effect} />
    case 'petals':
      return <PetalsEffect key={effect.type} effect={effect} />
  }
}

export function WallpaperRenderer({ spec }: WallpaperRendererProps) {
  const shouldAnimateCamera = spec.camera.type === 'ken_burns'

  return (
    <div className="wallpaper-renderer">
      <img
        className={
          shouldAnimateCamera
            ? 'wallpaper-image wallpaper-image-ken-burns'
            : 'wallpaper-image'
        }
        src={spec.imageUrl}
        alt="Uploaded wallpaper preview"
        style={
          {
            '--camera-zoom': spec.camera.zoom,
            '--camera-duration': `${Math.max(6, 28 - spec.camera.speed * 4)}s`,
          } as CSSProperties
        }
      />
      {spec.effects.map(renderEffect)}
    </div>
  )
}
