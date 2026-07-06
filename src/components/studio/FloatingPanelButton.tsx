interface FloatingPanelButtonProps {
  side: 'left' | 'right'
  icon: string
  label: string
  onClick: () => void
}

export function FloatingPanelButton({
  side,
  icon,
  label,
  onClick,
}: FloatingPanelButtonProps) {
  return (
    <button
      type="button"
      className={`floating-panel-button ${side}`}
      onClick={onClick}
    >
      <span aria-hidden="true">{icon}</span>
      <strong>{label}</strong>
    </button>
  )
}
