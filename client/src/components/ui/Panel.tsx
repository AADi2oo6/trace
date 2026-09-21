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
        'border border-[#222222] bg-[#111111]',
        hover ? 'transition-colors duration-150 hover:border-[#333333] hover:bg-[#141414]' : '',
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
