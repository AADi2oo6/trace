import React from 'react'
import type { StatusCategory } from '../../types/api'

interface ResponseSummaryProps {
  statusCode: number
  statusText: string | null
  statusCategory: StatusCategory | null
  durationMs: number | null
  bodySizeBytes: number | null
  contentType?: string | null
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/** Strip parameters like `;charset=utf-8` from a MIME type string */
function stripMimeParams(contentType: string): string {
  return contentType.split(';')[0].trim()
}

const categoryColors: Record<StatusCategory, { bg: string; text: string; border: string }> = {
  informational: {
    bg: 'bg-[#3B82F610]',
    text: 'text-[#3B82F6]',
    border: 'border-[#3B82F630]',
  },
  success: {
    bg: 'bg-[#22C55E10]',
    text: 'text-[#22C55E]',
    border: 'border-[#22C55E30]',
  },
  redirection: {
    bg: 'bg-[#F59E0B10]',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B30]',
  },
  client_error: {
    bg: 'bg-[#FF6A0015]',
    text: 'text-[#FF6A00]',
    border: 'border-[#FF6A0030]',
  },
  server_error: {
    bg: 'bg-[#EF444415]',
    text: 'text-[#EF4444]',
    border: 'border-[#EF444430]',
  },
}

export const ResponseSummary: React.FC<ResponseSummaryProps> = ({
  statusCode,
  statusText,
  statusCategory,
  durationMs,
  bodySizeBytes,
  contentType,
}) => {
  const colors = statusCategory
    ? categoryColors[statusCategory]
    : { bg: 'bg-[#1A1A1A]', text: 'text-[#6B6B6B]', border: 'border-[#2A2A2A]' }

  const mimeType = contentType ? stripMimeParams(contentType) : null

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {/* Status */}
      <div
        className={[
          'flex items-center gap-2 px-3 py-1.5 border',
          colors.bg,
          colors.border,
        ].join(' ')}
      >
        <span className={['text-base font-mono font-bold leading-none', colors.text].join(' ')}>
          {statusCode}
        </span>
        {statusText && (
          <span className={['text-xs font-mono leading-none', colors.text].join(' ')}>
            {statusText}
          </span>
        )}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1E1E1E] bg-[#0D0D0D]">
        <span className="text-[10px] font-mono text-[#3A3A3A] uppercase tracking-wider">
          Time
        </span>
        <span className="text-sm font-mono font-semibold text-[#E8E8E8]">
          {formatMs(durationMs)}
        </span>
      </div>

      {/* Size */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1E1E1E] bg-[#0D0D0D]">
        <span className="text-[10px] font-mono text-[#3A3A3A] uppercase tracking-wider">
          Size
        </span>
        <span className="text-sm font-mono font-semibold text-[#E8E8E8]">
          {formatBytes(bodySizeBytes)}
        </span>
      </div>

      {/* Content-Type */}
      {mimeType && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1E1E1E] bg-[#0D0D0D]">
          <span className="text-[10px] font-mono text-[#3A3A3A] uppercase tracking-wider">
            Type
          </span>
          <span className="text-sm font-mono font-semibold text-[#E8E8E8]">
            {mimeType}
          </span>
        </div>
      )}
    </div>
  )
}
