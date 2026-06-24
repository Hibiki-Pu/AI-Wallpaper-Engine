import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface RainEffectProps {
  effect: WallpaperEffectSpec
}

const createDrop = (id: number, speed: number) => {
  const seed = id + 1
  return {
    id,
    x: (seed * 31) % 100,
    length: 34 + ((seed * 13) % 34),
    delay: -((seed * 7) % 80) / 10,
    duration: Math.max(0.45, 1.8 - speed * 0.28) + ((seed * 3) % 5) / 10,
  }
}

export function RainEffect({ effect }: RainEffectProps) {
  const drops = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createDrop(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className={`effect-layer rain-layer effect-variant-${effect.variant ?? 'drizzle'}`}
      style={
        {
          opacity: effect.opacity,
          '--effect-size': effect.size ?? 1,
          '--effect-blur': `${effect.blur ?? 0}px`,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {drops.map((drop) => (
        <span
          key={drop.id}
          className="raindrop"
          style={
            {
              '--rain-x': `${drop.x}%`,
              '--rain-length': `${drop.length}px`,
              '--rain-delay': `${drop.delay}s`,
              '--rain-duration': `${drop.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
