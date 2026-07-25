'use client'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Switch({ checked, onChange, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="switch"
      data-checked={checked}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <span className="switch-thumb" />
    </button>
  )
}
