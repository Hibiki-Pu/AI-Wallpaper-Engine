import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface StarsEffectProps {
  effect: WallpaperEffectSpec
}

const createStar = (id: number, speed: number) => {
  const seed = id + 1
  return {
    id,
    x: (seed * 47) % 100,
    y: (seed * 31) % 82,
    size: 1 + ((seed * 7) % 3),
    delay: -((seed * 19) % 80) / 10,
    duration: Math.max(2.5, 8 - speed) + ((seed * 5) % 4),
  }
}

export function StarsEffect({ effect }: StarsEffectProps) {
  const stars = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createStar(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className={`effect-layer stars-layer effect-variant-${effect.variant ?? 'twinkle'}`}
      style={
        {
          opacity: effect.opacity,
          '--effect-size': effect.size ?? 1,
          '--effect-blur': `${effect.blur ?? 0}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {stars.map((star) => (
        <span
          key={star.id}
          className="star"
          style={
            {
              '--star-x': `${star.x}%`,
              '--star-y': `${star.y}%`,
              '--star-size': `${star.size}px`,
              '--star-delay': `${star.delay}s`,
              '--star-duration': `${star.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
