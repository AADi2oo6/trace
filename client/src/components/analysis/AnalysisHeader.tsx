import React, { useState } from 'react'
import { Copy, Check, Globe, ListFilter, ShieldCheck, Settings } from 'lucide-react'
import type {
  DnsAnalysis,
  CorsAnalysis,
  OptionsAnalysis,
  HeaderAnalysisItem,
  StatusCategory,
} from '../../types/api'

interface AnalysisHeaderProps {
  url: string
  method: string
  statusCode: number | null
  statusText: string | null
  statusCategory: StatusCategory | null
  durationMs: number | null
  dnsAnalysis: DnsAnalysis | null
  headerAnalysis: HeaderAnalysisItem[] | null
  corsAnalysis: CorsAnalysis | null
  optionsAnalysis: OptionsAnalysis | null
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const categoryColors: Record<StatusCategory, { bg: string; text: string; border: string }> = {
  informational: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/30',
  },
  success: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
  },
  redirection: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
  client_error: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-500',
    border: 'border-orange-500/30',
  },
  server_error: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-500',
    border: 'border-rose-500/30',
  },
}

export const AnalysisHeader: React.FC<AnalysisHeaderProps> = ({
  url,
  method,
  statusCode,
  statusText,
  statusCategory,
  durationMs,
  dnsAnalysis,
  headerAnalysis,
  corsAnalysis,
  optionsAnalysis,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // Ignore clipboard failure
    }
  }

  const statusStyle = statusCategory
    ? categoryColors[statusCategory]
    : { bg: 'bg-[#1A1A1A]', text: 'text-[#6B6B6B]', border: 'border-[#2A2A2A]' }

  // DNS summary badge
  let dnsLabel = 'UNAVAILABLE'
  let dnsColor = 'text-[#555555]'
  let dnsDot = 'bg-[#3A3A3A]'
  if (dnsAnalysis) {
    if (dnsAnalysis.resolved) {
      dnsLabel = dnsAnalysis.resolution_time_ms !== null
        ? `RESOLVED (${Math.round(dnsAnalysis.resolution_time_ms)}ms)`
        : 'RESOLVED'
      dnsColor = 'text-[#22C55E]'
      dnsDot = 'bg-[#22C55E]'
    } else {
      dnsLabel = 'FAILED'
      dnsColor = 'text-[#EF4444]'
      dnsDot = 'bg-[#EF4444]'
    }
  }

  // Headers summary badge
  const headerCount = headerAnalysis ? headerAnalysis.length : 0
  const headersLabel = `${headerCount} ANALYZED`
  const headersColor = headerCount > 0 ? 'text-[#E8E8E8]' : 'text-[#555555]'
  const headersDot = headerCount > 0 ? 'bg-[#3B82F6]' : 'bg-[#3A3A3A]'

  // CORS summary badge
  let corsLabel = 'NOT INDICATED'
  let corsColor = 'text-[#555555]'
  let corsDot = 'bg-[#3A3A3A]'
  if (corsAnalysis) {
    if (corsAnalysis.is_cors_request) {
      if (corsAnalysis.origin_allowed === true) {
        corsLabel = 'ORIGIN ALLOWED'
        corsColor = 'text-[#22C55E]'
        corsDot = 'bg-[#22C55E]'
      } else if (corsAnalysis.origin_allowed === false) {
        corsLabel = 'ORIGIN BLOCKED'
        corsColor = 'text-[#EF4444]'
        corsDot = 'bg-[#EF4444]'
      } else if (corsAnalysis.wildcard_origin) {
        corsLabel = 'WILDCARD *'
        corsColor = 'text-[#F59E0B]'
        corsDot = 'bg-[#F59E0B]'
      } else {
        corsLabel = 'CORS REQUEST'
        corsColor = 'text-[#FF6A00]'
        corsDot = 'bg-[#FF6A00]'
      }
    } else {
      corsLabel = corsAnalysis.allowed_origin ? `ORIGIN: ${corsAnalysis.allowed_origin}` : 'NOT INDICATED'
      corsColor = corsAnalysis.allowed_origin ? 'text-[#B0B0B0]' : 'text-[#555555]'
      corsDot = corsAnalysis.allowed_origin ? 'bg-[#22C55E]' : 'bg-[#3A3A3A]'
    }
  }

  // OPTIONS summary badge
  let optionsLabel = 'NOT REQUESTED'
  let optionsColor = 'text-[#555555]'
  let optionsDot = 'bg-[#3A3A3A]'
  if (optionsAnalysis) {
    if (optionsAnalysis.is_options_request) {
      optionsLabel = `ANALYZED (${optionsAnalysis.allowed_methods.length} methods)`
      optionsColor = 'text-[#FF6A00]'
      optionsDot = 'bg-[#FF6A00]'
    } else if (optionsAnalysis.allowed_methods.length > 0) {
      optionsLabel = `${optionsAnalysis.allowed_methods.length} METHODS ADVERTISED`
      optionsColor = 'text-[#B0B0B0]'
      optionsDot = 'bg-[#3B82F6]'
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-muted)] overflow-hidden shadow-xs">
      {/* Primary Context Row */}
      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Method + Target URL */}
        <div className="flex items-start md:items-center gap-3 min-w-0 flex-1">
          <span className="shrink-0 px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded-md bg-[var(--bg-input)] border border-[var(--border-default)] text-blue-500">
            {method}
          </span>
          <span className="text-sm font-mono text-[var(--text-primary)] truncate max-w-2xl select-all" title={url}>
            {url}
          </span>
          <button
            type="button"
            onClick={handleCopyUrl}
            className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm"
            title="Copy URL"
            aria-label="Copy URL"
          >
            {copiedUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
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
                'flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono font-bold',
                statusStyle.bg,
                statusStyle.border,
                statusStyle.text,
              ].join(' ')}
            >
              <span>{statusCode}</span>
              {statusText && <span className="font-normal opacity-90">{statusText}</span>}
            </div>
          ) : (
            <div className="px-3 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-xs font-mono text-rose-500">
              NO HTTP RESPONSE
            </div>
          )}

          <div className="px-3 py-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-panel)] text-xs font-mono text-[var(--text-secondary)]">
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mr-1.5 font-normal">TIME</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatMs(durationMs)}</span>
          </div>
        </div>
      </div>

      {/* Analysis Quick Status Pills Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-muted)] bg-[var(--bg-panel)]">
        {/* DNS */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">DNS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={['w-1.5 h-1.5 rounded-full shrink-0', dnsDot].join(' ')} />
            <span className={['text-[11px] font-mono font-semibold tracking-wide', dnsColor].join(' ')}>
              {dnsLabel}
            </span>
          </div>
        </div>

        {/* HEADERS */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListFilter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">HEADERS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={['w-1.5 h-1.5 rounded-full shrink-0', headersDot].join(' ')} />
            <span className={['text-[11px] font-mono font-semibold tracking-wide', headersColor].join(' ')}>
              {headersLabel}
            </span>
          </div>
        </div>

        {/* CORS */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">CORS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={['w-1.5 h-1.5 rounded-full shrink-0', corsDot].join(' ')} />
            <span className={['text-[11px] font-mono font-semibold tracking-wide', corsColor].join(' ')}>
              {corsLabel}
            </span>
          </div>
        </div>

        {/* OPTIONS */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[10px] font-mono tracking-widest text-[var(--text-muted)] uppercase">OPTIONS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={['w-1.5 h-1.5 rounded-full shrink-0', optionsDot].join(' ')} />
            <span className={['text-[11px] font-mono font-semibold tracking-wide', optionsColor].join(' ')}>
              {optionsLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
