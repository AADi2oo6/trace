import React from 'react'

interface PageContainerProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  icon,
  actions,
  children,
  className = '',
}) => {
  return (
    <div
      className={['flex flex-col h-full min-h-0', className].filter(Boolean).join(' ')}
    >
      {/* Page Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold font-mono tracking-wider text-[var(--text-primary)] leading-none uppercase">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4 shrink-0">{actions}</div>
        )}
      </div>

      {/* Page Body */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
