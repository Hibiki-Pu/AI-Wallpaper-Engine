import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface FirefliesEffectProps {
  effect: WallpaperEffectSpec
}

const createFirefly = (id: number, speed: number) => {
  const seed = id + 1
  return {
    id,
    x: (seed * 43) % 100,
    y: 35 + ((seed * 19) % 55),
    delay: -((seed * 29) % 100) / 10,
    duration: Math.max(5, 15 - speed * 2) + ((seed * 7) % 6),
    driftX: -36 + ((seed * 17) % 72),
    driftY: -24 + ((seed * 11) % 48),
  }
}

export function FirefliesEffect({ effect }: FirefliesEffectProps) {
  const fireflies = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createFirefly(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div className="effect-layer fireflies-layer" style={{ opacity: effect.opacity }} aria-hidden="true">
      {fireflies.map((firefly) => (
        <span
          key={firefly.id}
          className="firefly"
          style={
            {
              '--firefly-x': `${firefly.x}%`,
              '--firefly-y': `${firefly.y}%`,
              '--firefly-delay': `${firefly.delay}s`,
              '--firefly-duration': `${firefly.duration}s`,
              '--firefly-drift-x': `${firefly.driftX}px`,
              '--firefly-drift-y': `${firefly.driftY}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
