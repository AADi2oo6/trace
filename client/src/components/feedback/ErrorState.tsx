import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'

interface ErrorStateProps {
  title?: string
  message?: string
  code?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'REQUEST FAILED',
  message = 'Unable to reach the analysis service.',
  code,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-12 px-8',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
    >
      <div className="flex items-center justify-center w-10 h-10 border border-[#EF444433] bg-[#EF444408] mb-5">
        <AlertTriangle className="w-4.5 h-4.5 text-[#EF4444]" aria-hidden="true" />
      </div>

      <p className="text-xs font-mono tracking-widest text-[#EF4444] uppercase mb-2">
        {title}
      </p>

      {code && (
        <p className="text-xs font-mono text-[#3A3A3A] mb-3">
          ERROR: {code}
        </p>
      )}

      <p className="text-sm text-[#6B6B6B] max-w-xs leading-relaxed mb-6">
        {message}
      </p>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
