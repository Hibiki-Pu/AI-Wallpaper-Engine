import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface FogEffectProps {
  effect: WallpaperEffectSpec
}

export function FogEffect({ effect }: FogEffectProps) {
  const fogBanks = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) => {
        const seed = index + 1
        return {
          id: index,
          y: 18 + ((seed * 23) % 70),
          delay: -((seed * 13) % 80) / 10,
          duration: Math.max(12, 34 - effect.speed * 5) + ((seed * 7) % 8),
          scale: 0.8 + ((seed * 5) % 8) / 10,
        }
      }),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div className="effect-layer fog-layer" style={{ opacity: effect.opacity }} aria-hidden="true">
      {fogBanks.map((fog) => (
        <span
          key={fog.id}
          className="fog-bank"
          style={
            {
              '--fog-y': `${fog.y}%`,
              '--fog-delay': `${fog.delay}s`,
              '--fog-duration': `${fog.duration}s`,
              '--fog-scale': fog.scale,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
