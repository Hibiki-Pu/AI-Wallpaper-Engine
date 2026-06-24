import type { ReactNode } from 'react'

interface AccordionSectionProps {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}

export function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section className="accordion-section">
      <button type="button" className="accordion-trigger" onClick={onToggle}>
        <span>{title}</span>
        <span aria-hidden="true">{open ? '-' : '+'}</span>
      </button>
      {open && <div className="accordion-content">{children}</div>}
    </section>
  )
}
