import { useRef, type CSSProperties, type PointerEvent } from 'react'

interface DepthParallaxRendererProps {
  imageUrl: string
  depthMapUrl: string
  strength: number
  className?: string
  style?: CSSProperties
}

export function DepthParallaxRenderer({
  imageUrl,
  depthMapUrl,
  strength,
  className = '',
  style,
}: DepthParallaxRendererProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const setPosition = (x: number, y: number) => {
    const travel = 16 + strength * 56
    rootRef.current?.style.setProperty('--depth-x', `${x * travel}px`)
    rootRef.current?.style.setProperty('--depth-y', `${y * travel * 0.68}px`)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    setPosition((event.clientX - bounds.left) / bounds.width - 0.5, (event.clientY - bounds.top) / bounds.height - 0.5)
  }

  return (
    <div
      ref={rootRef}
      className={`depth-parallax ${className}`}
      style={{ ...style, '--depth-map': `url("${depthMapUrl}")` } as CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPosition(0, 0)}
      data-depth-enabled="true"
    >
      <img className="depth-parallax-back" src={imageUrl} alt="Uploaded wallpaper preview" />
      <img className="depth-parallax-front" src={imageUrl} alt="" aria-hidden="true" />
    </div>
  )
}
