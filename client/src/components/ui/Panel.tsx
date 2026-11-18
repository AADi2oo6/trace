import React from 'react'

interface PanelProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
}) => {
  return (
    <div
      className={[
        'border border-[var(--border-default)] bg-[var(--bg-panel)] transition-colors duration-150',
        hover ? 'hover:border-[var(--border-strong)] hover:bg-[var(--bg-panel-hover)]' : '',
        paddingStyles[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
