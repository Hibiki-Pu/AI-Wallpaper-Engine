import type { CSSProperties } from 'react'
import type {
  WallpaperEffectSpec,
  WallpaperLayer,
  WallpaperSpec,
} from '../types/WallpaperSpec'
import { FirefliesEffect } from './effects/FirefliesEffect'
import { FogEffect } from './effects/FogEffect'
import { GlowParticlesEffect } from './effects/GlowParticlesEffect'
import { LightRaysEffect } from './effects/LightRaysEffect'
import { PetalsEffect } from './effects/PetalsEffect'
import { RainEffect } from './effects/RainEffect'
import { SnowEffect } from './effects/SnowEffect'
import { StarsEffect } from './effects/StarsEffect'
import { DepthParallaxRenderer } from './DepthParallaxRenderer'

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

const layerToEffect = (layer: WallpaperLayer): WallpaperEffectSpec | null => {
  if (layer.type === 'background' || !layer.visible) {
    return null
  }

  return {
    type: layer.type,
    enabled: layer.visible,
    count: layer.settings.count ?? 0,
    speed: layer.settings.speed ?? 1,
      opacity: layer.settings.opacity ?? 0,
      variant: layer.settings.variant,
      size: layer.settings.size,
      blur: layer.settings.blur,
      color: layer.settings.color,
      direction: layer.settings.direction,
  }
}

export function WallpaperRenderer({ spec }: WallpaperRendererProps) {
  const shouldAnimateCamera =
    (spec.camera.enabled ?? spec.camera.type !== 'static') &&
    spec.camera.type !== 'static'
  const layers = spec.layers?.length
    ? [...spec.layers].sort((a, b) => a.zIndex - b.zIndex)
    : []
  const backgroundLayer = layers.find((layer) => layer.type === 'background')
  const shouldShowBackground = !backgroundLayer || backgroundLayer.visible

  return (
    <div className="wallpaper-renderer">
      {shouldShowBackground && (
        spec.depth?.enabled && spec.depth.mapUrl ? (
          <DepthParallaxRenderer
            imageUrl={spec.imageUrl}
            depthMapUrl={spec.depth.mapUrl}
            strength={spec.depth.strength}
            className={shouldAnimateCamera ? `wallpaper-image wallpaper-camera-${spec.camera.type}` : 'wallpaper-image'}
            style={{
              '--camera-zoom': spec.camera.zoom,
              '--camera-intensity': spec.camera.intensity ?? 1,
              '--camera-duration': `${Math.max(6, 28 - spec.camera.speed * 4)}s`,
              zIndex: backgroundLayer?.zIndex ?? 0,
            } as CSSProperties}
          />
        ) : (
        <img
          className={
            shouldAnimateCamera
              ? `wallpaper-image wallpaper-camera-${spec.camera.type}`
              : 'wallpaper-image'
          }
          src={spec.imageUrl}
          alt="Uploaded wallpaper preview"
          style={
            {
              '--camera-zoom': spec.camera.zoom,
              '--camera-intensity': spec.camera.intensity ?? 1,
              '--camera-duration': `${Math.max(6, 28 - spec.camera.speed * 4)}s`,
              zIndex: backgroundLayer?.zIndex ?? 0,
            } as CSSProperties
          }
        />)
      )}
      {layers.length
        ? layers.map((layer) => {
            const effect = layerToEffect(layer)

            if (!effect) {
              return null
            }

            return (
              <div
                key={layer.id}
                className="wallpaper-layer-node"
                style={{ zIndex: layer.zIndex }}
              >
                {renderEffect(effect)}
              </div>
            )
          })
        : spec.effects.map(renderEffect)}
    </div>
  )
}
