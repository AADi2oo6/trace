import React from 'react'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
  label?: string
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className = '',
  label,
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={['w-px bg-[#222222] self-stretch shrink-0', className].filter(Boolean).join(' ')}
        role="separator"
        aria-orientation="vertical"
      />
    )
  }

  if (label) {
    return (
      <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
        <div className="flex-1 h-px bg-[#222222]" />
        <span className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase select-none">
          {label}
        </span>
        <div className="flex-1 h-px bg-[#222222]" />
      </div>
    )
  }

  return (
    <hr
      className={['border-0 h-px bg-[#222222]', className].filter(Boolean).join(' ')}
      role="separator"
    />
  )
}
