import React, { useState } from 'react'
import { Copy, Check, Route } from 'lucide-react'
import type { RequestJourney, StatusCategory } from '../../types/api'

interface JourneyHeaderProps {
  method: string
  url: string
  statusCode: number | null
  statusText: string | null
  statusCategory: StatusCategory | null
  totalDurationMs: number | null
  journey: RequestJourney
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
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

export const JourneyHeader: React.FC<JourneyHeaderProps> = ({
  method,
  url,
  statusCode,
  statusText,
  statusCategory,
  totalDurationMs,
  journey,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // Ignore
    }
  }

  const statusStyle = statusCategory
    ? categoryColors[statusCategory]
    : { bg: 'bg-[#1A1A1A]', text: 'text-[#6B6B6B]', border: 'border-[#2A2A2A]' }

  const completedPhasesCount = journey.phases.filter((p) => p.status === 'completed').length

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Primary Context Row */}
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Method + Target URL */}
        <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
          <span className="shrink-0 px-2.5 py-1 text-xs font-mono font-bold tracking-wider bg-[#141414] border border-[#2A2A2A] text-[#FF6A00]">
            {method}
          </span>
          <span className="text-sm font-mono text-[#E8E8E8] truncate max-w-2xl select-all" title={url}>
            {url}
          </span>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="shrink-0 p-1 text-[#444444] hover:text-[#E8E8E8] transition-colors"
            title="Copy URL"
            aria-label="Copy URL"
          >
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right: Status Code + Duration */}
        <div className="flex items-center gap-2.5 shrink-0">
          {statusCode !== null ? (
            <div
              className={[
                'flex items-center gap-2 px-3 py-1 border text-xs font-mono font-bold',
                statusStyle.bg,
                statusStyle.border,
                statusStyle.text,
              ].join(' ')}
            >
              <span>{statusCode}</span>
              {statusText && <span className="font-normal opacity-90">{statusText}</span>}
            </div>
          ) : (
            <div className="px-3 py-1 border border-[#EF444430] bg-[#EF444410] text-xs font-mono text-[#EF4444]">
              NO HTTP RESPONSE
            </div>
          )}

          <div className="px-3 py-1 border border-[#1E1E1E] bg-[#0D0D0D] text-xs font-mono text-[#B0B0B0]">
            <span className="text-[10px] text-[#444444] uppercase tracking-wider mr-1.5 font-normal">TOTAL</span>
            <span className="font-semibold text-[#E8E8E8]">{formatMs(totalDurationMs)}</span>
          </div>
        </div>
      </div>

      {/* Quick Journey Status Bar */}
      <div className="px-4 py-2.5 bg-[#080808] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-[#FF6A00]" />
          <span className="text-[10px] uppercase tracking-widest text-[#555555]">
            Journey Status:
          </span>
          {journey.completed ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold text-[#22C55E] bg-[#22C55E10] border border-[#22C55E30]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              JOURNEY COMPLETED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold text-[#EF4444] bg-[#EF444410] border border-[#EF444430]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              JOURNEY INCOMPLETE
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#6B6B6B]">
          <span>
            <strong className="text-[#E8E8E8]">{completedPhasesCount}</strong> of{' '}
            <strong className="text-[#E8E8E8]">{journey.phases.length}</strong> phases completed
          </span>
          <span>•</span>
          <span>
            Total duration:{' '}
            <strong className="text-[#E8E8E8]">{formatMs(totalDurationMs)}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
