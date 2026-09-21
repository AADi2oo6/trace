import React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'orange' | 'info'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  dot?: boolean
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-[#6B6B6B] border-[#333333] bg-[#1A1A1A]',
  success: 'text-[#22C55E] border-[#22C55E33] bg-[#22C55E10]',
  warning: 'text-[#F59E0B] border-[#F59E0B33] bg-[#F59E0B10]',
  error: 'text-[#EF4444] border-[#EF444433] bg-[#EF444410]',
  orange: 'text-[#FF6A00] border-[#FF6A0033] bg-[#FF6A0010]',
  info: 'text-[#3B82F6] border-[#3B82F633] bg-[#3B82F610]',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#6B6B6B]',
  success: 'bg-[#22C55E]',
  warning: 'bg-[#F59E0B]',
  error: 'bg-[#EF4444]',
  orange: 'bg-[#FF6A00]',
  info: 'bg-[#3B82F6]',
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  dot = false,
  className = '',
}) => {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-xs font-mono tracking-wider border',
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={['w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant]].join(' ')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
