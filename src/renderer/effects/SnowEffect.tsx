import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface SnowEffectProps {
  effect: WallpaperEffectSpec
}

const createSnowflake = (id: number, speed: number) => {
  const seed = id + 1
  return {
    id,
    x: (seed * 41) % 100,
    size: 2 + ((seed * 11) % 6),
    delay: -((seed * 17) % 120) / 10,
    duration: Math.max(7, 22 - speed * 4) + ((seed * 5) % 8),
    drift: -28 + ((seed * 23) % 56),
  }
}

export function SnowEffect({ effect }: SnowEffectProps) {
  const flakes = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createSnowflake(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className={`effect-layer snow-layer effect-variant-${effect.variant ?? 'light_snow'}`}
      style={
        {
          opacity: effect.opacity,
          '--effect-size': effect.size ?? 1,
          '--effect-blur': `${effect.blur ?? 0}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {flakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake"
          style={
            {
              '--snow-x': `${flake.x}%`,
              '--snow-size': `${flake.size}px`,
              '--snow-delay': `${flake.delay}s`,
              '--snow-duration': `${flake.duration}s`,
              '--snow-drift': `${flake.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
