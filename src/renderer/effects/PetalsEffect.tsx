import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface PetalsEffectProps {
  effect: WallpaperEffectSpec
}

interface Petal {
  id: number
  x: number
  size: number
  delay: number
  duration: number
  drift: number
  rotation: number
}

const createPetal = (id: number, speed: number): Petal => {
  const seed = id + 1
  const durationBase = Math.max(8, 24 - speed * 4)

  return {
    id,
    x: (seed * 29) % 100,
    size: 8 + ((seed * 13) % 12),
    delay: -((seed * 23) % 140) / 10,
    duration: durationBase + ((seed * 7) % 8),
    drift: -24 + ((seed * 31) % 48),
    rotation: (seed * 47) % 360,
  }
}

export function PetalsEffect({ effect }: PetalsEffectProps) {
  const petals = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createPetal(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className="effect-layer petals-layer"
      style={{ opacity: effect.opacity }}
      aria-hidden="true"
    >
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="petal"
          style={
            {
              '--petal-x': `${petal.x}%`,
              '--petal-size': `${petal.size}px`,
              '--petal-delay': `${petal.delay}s`,
              '--petal-duration': `${petal.duration}s`,
              '--petal-drift': `${petal.drift}px`,
              '--petal-rotation': `${petal.rotation}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
