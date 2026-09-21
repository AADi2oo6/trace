import React from 'react'

type StatusType = 'connected' | 'connecting' | 'disconnected' | 'error' | 'ready' | 'idle'

interface StatusIndicatorProps {
  status: StatusType
  label?: string
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const statusConfig: Record<
  StatusType,
  { color: string; pulse: boolean; text: string }
> = {
  connected: { color: '#22C55E', pulse: false, text: 'Connected' },
  connecting: { color: '#F59E0B', pulse: true, text: 'Connecting' },
  disconnected: { color: '#3A3A3A', pulse: false, text: 'Disconnected' },
  error: { color: '#EF4444', pulse: true, text: 'Error' },
  ready: { color: '#FF6A00', pulse: false, text: 'Ready' },
  idle: { color: '#6B6B6B', pulse: false, text: 'Idle' },
}

const dotSize = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showLabel = true,
  className = '',
  size = 'sm',
}) => {
  const config = statusConfig[status]
  const displayLabel = label ?? config.text

  return (
    <span
      className={['inline-flex items-center gap-1.5', className].filter(Boolean).join(' ')}
      role="status"
      aria-label={`Status: ${displayLabel}`}
    >
      <span
        className={[
          'rounded-full shrink-0',
          dotSize[size],
          config.pulse ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ backgroundColor: config.color }}
        aria-hidden="true"
      />
      {showLabel && (
        <span className="text-xs font-mono tracking-wider" style={{ color: config.color }}>
          {displayLabel}
        </span>
      )}
    </span>
  )
}
