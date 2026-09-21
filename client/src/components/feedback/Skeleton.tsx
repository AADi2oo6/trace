import React from 'react'

// ── Base Skeleton ───────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  return (
    <div
      className={['skeleton-shimmer', className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
      role="presentation"
    />
  )
}

// ── Skeleton Text ───────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?: number
  className?: string
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
  const widths = ['100%', '85%', '70%', '90%', '60%']
  return (
    <div className={['space-y-2', className].filter(Boolean).join(' ')} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer h-3"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  )
}

// ── Skeleton Card ───────────────────────────────────────────────────────────

interface SkeletonCardProps {
  className?: string
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => {
  return (
    <div
      className={[
        'border border-[#1E1E1E] bg-[#111111] p-4 space-y-3',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="skeleton-shimmer h-3 w-1/3" />
      <div className="skeleton-shimmer h-2.5 w-full" />
      <div className="skeleton-shimmer h-2.5 w-4/5" />
    </div>
  )
}

// ── Skeleton Panel ──────────────────────────────────────────────────────────

interface SkeletonPanelProps {
  className?: string
  rows?: number
}

export const SkeletonPanel: React.FC<SkeletonPanelProps> = ({ className = '', rows = 4 }) => {
  return (
    <div
      className={[
        'border border-[#1E1E1E] bg-[#111111] p-5 space-y-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <div className="skeleton-shimmer h-4 w-1/4 mb-6" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton-shimmer w-3 h-3 shrink-0" />
          <div className="skeleton-shimmer h-2.5 flex-1" />
          <div className="skeleton-shimmer h-2.5 w-16" />
        </div>
      ))}
    </div>
  )
}

// ── Skeleton Table ──────────────────────────────────────────────────────────

interface SkeletonTableProps {
  rows?: number
  cols?: number
  className?: string
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  return (
    <div className={['border border-[#1E1E1E] overflow-hidden', className].filter(Boolean).join(' ')} aria-hidden="true">
      {/* Header */}
      <div className="border-b border-[#1E1E1E] bg-[#0D0D0D] px-4 py-2.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-2.5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="border-b border-[#1A1A1A] bg-[#111111] px-4 py-3 flex gap-4"
        >
          {Array.from({ length: cols }).map((_, col) => (
            <div
              key={col}
              className="skeleton-shimmer h-2.5 flex-1"
              style={{ opacity: 1 - row * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
