import type { CSSProperties } from 'react'
import type { WallpaperEffectSpec, WallpaperSpec } from '../types/WallpaperSpec'
import { FirefliesEffect } from './effects/FirefliesEffect'
import { FogEffect } from './effects/FogEffect'
import { GlowParticlesEffect } from './effects/GlowParticlesEffect'
import { LightRaysEffect } from './effects/LightRaysEffect'
import { PetalsEffect } from './effects/PetalsEffect'
import { RainEffect } from './effects/RainEffect'
import { SnowEffect } from './effects/SnowEffect'
import { StarsEffect } from './effects/StarsEffect'

interface WallpaperRendererProps {
  spec: WallpaperSpec
}

const renderEffect = (effect: WallpaperEffectSpec) => {
  switch (effect.type) {
    case 'glow_particles':
      return <GlowParticlesEffect key={effect.type} effect={effect} />
    case 'petals':
      return <PetalsEffect key={effect.type} effect={effect} />
    case 'snow':
      return <SnowEffect key={effect.type} effect={effect} />
    case 'rain':
      return <RainEffect key={effect.type} effect={effect} />
    case 'fireflies':
      return <FirefliesEffect key={effect.type} effect={effect} />
    case 'fog':
      return <FogEffect key={effect.type} effect={effect} />
    case 'light_rays':
      return <LightRaysEffect key={effect.type} effect={effect} />
    case 'stars':
      return <StarsEffect key={effect.type} effect={effect} />
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
