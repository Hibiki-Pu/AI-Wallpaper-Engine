import type { ReactNode } from 'react'

interface StudioDrawerProps {
  side: 'left' | 'right'
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function StudioDrawer({
  side,
  title,
  open,
  onClose,
  children,
}: StudioDrawerProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="studio-drawer-backdrop"
          aria-label="Close panel"
          onClick={onClose}
        />
      )}
      <aside
        className={`studio-drawer ${side} ${open ? 'open' : ''}`}
        aria-label={title}
        aria-hidden={!open}
      >
        <div className="studio-drawer-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="studio-drawer-body">{children}</div>
      </aside>
    </>
  )
}
