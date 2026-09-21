import React from 'react'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {icon && (
        <div className="text-[#3A3A3A] mb-5" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* Decorative line */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-px bg-[#2A2A2A]" />
        <div className="w-1.5 h-1.5 border border-[#3A3A3A] rotate-45" />
        <div className="w-8 h-px bg-[#2A2A2A]" />
      </div>

      <p className="text-xs font-mono tracking-widest text-[#3A3A3A] uppercase mb-2">
        {title}
      </p>

      {description && (
        <p className="text-sm text-[#6B6B6B] max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
