import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 hover:bg-blue-500 text-white font-semibold border border-blue-600 dark:border-blue-500 active:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-500 shadow-xs transition-colors',
  secondary:
    'bg-[var(--bg-panel)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-panel-hover)] active:opacity-80 transition-colors',
  ghost:
    'bg-transparent text-[var(--text-muted)] border border-transparent hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-secondary)] active:opacity-80 transition-colors',
  danger:
    'bg-transparent text-rose-500 border border-rose-500/50 hover:bg-rose-500 hover:text-white active:bg-rose-600 transition-colors',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

const Spinner: React.FC = () => (
  <svg
    className="animate-spin w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
)

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-mono tracking-wider transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-offset-0',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
}
