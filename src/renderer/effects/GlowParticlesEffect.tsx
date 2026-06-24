import { useMemo, type CSSProperties } from 'react'
import type { WallpaperEffectSpec } from '../../types/WallpaperSpec'

interface GlowParticlesEffectProps {
  effect: WallpaperEffectSpec
}

interface GlowParticle {
  id: number
  x: number
  y: number
  size: number
  delay: number
  duration: number
}

const createParticle = (id: number, speed: number): GlowParticle => {
  const seed = id + 1
  const durationBase = Math.max(7, 18 - speed * 3)

  return {
    id,
    x: (seed * 37) % 100,
    y: (seed * 53) % 100,
    size: 3 + ((seed * 17) % 10),
    delay: -((seed * 19) % 100) / 10,
    duration: durationBase + ((seed * 11) % 6),
  }
}

export function GlowParticlesEffect({ effect }: GlowParticlesEffectProps) {
  const particles = useMemo(
    () =>
      Array.from({ length: effect.count }, (_, index) =>
        createParticle(index, effect.speed),
      ),
    [effect.count, effect.speed],
  )

  if (!effect.enabled || effect.count <= 0) {
    return null
  }

  return (
    <div
      className={`effect-layer glow-particles-layer effect-variant-${effect.variant ?? 'soft_glow'}`}
      style={
        {
          opacity: effect.opacity,
          '--effect-size': effect.size ?? 1,
          '--effect-blur': `${effect.blur ?? 0}px`,
          '--effect-color': effect.color ?? 'rgba(216, 248, 255, 0.82)',
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="glow-particle"
          style={
            {
              '--particle-x': `${particle.x}%`,
              '--particle-y': `${particle.y}%`,
              '--particle-size': `${particle.size}px`,
              '--particle-delay': `${particle.delay}s`,
              '--particle-duration': `${particle.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
