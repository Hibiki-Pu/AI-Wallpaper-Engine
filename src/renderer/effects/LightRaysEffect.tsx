import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface LightRaysEffectProps {
  effect: WallpaperEffectSpec
}

export function LightRaysEffect({ effect }: LightRaysEffectProps) {
  const rays = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) => {
        const seed = index + 1
        return {
          id: index,
          x: (seed * 21) % 90,
          width: 12 + ((seed * 9) % 20),
          delay: -((seed * 17) % 90) / 10,
          duration: Math.max(8, 24 - effect.speed * 3) + ((seed * 5) % 7),
          rotation: -22 + ((seed * 11) % 28),
        }
      }),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className={`effect-layer light-rays-layer effect-variant-${effect.variant ?? 'morning_rays'}`}
      style={
        {
          opacity: effect.opacity,
          '--effect-size': effect.size ?? 1,
          '--effect-blur': `${effect.blur ?? 0}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {rays.map((ray) => (
        <span
          key={ray.id}
          className="light-ray"
          style={
            {
              '--ray-x': `${ray.x}%`,
              '--ray-width': `${ray.width}%`,
              '--ray-delay': `${ray.delay}s`,
              '--ray-duration': `${ray.duration}s`,
              '--ray-rotation': `${ray.rotation}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
