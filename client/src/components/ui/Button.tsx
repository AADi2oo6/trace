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
    'bg-[#FF6A00] text-black font-semibold border border-[#FF6A00] hover:bg-[#D94F00] hover:border-[#D94F00] active:bg-[#C04400] focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
  secondary:
    'bg-transparent text-[#E8E8E8] border border-[#333333] hover:border-[#555555] hover:bg-[#1A1A1A] active:bg-[#222222]',
  ghost:
    'bg-transparent text-[#6B6B6B] border border-transparent hover:text-[#E8E8E8] hover:bg-[#1A1A1A]',
  danger:
    'bg-transparent text-[#EF4444] border border-[#EF4444] hover:bg-[#EF4444] hover:text-white active:bg-[#DC2626]',
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
