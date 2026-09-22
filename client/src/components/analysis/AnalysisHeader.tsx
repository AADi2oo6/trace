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
            <span className="text-[10px] text-[#444444] uppercase tracking-wider mr-1.5 font-normal">TIME</span>
            <span className="font-semibold text-[#E8E8E8]">{formatMs(durationMs)}</span>
          </div>
        </div>
      </div>

      {/* Analysis Quick Status Pills Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1A1A1A] bg-[#080808]">
        {/* DNS */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">DNS</span>
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
            <ListFilter className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">HEADERS</span>
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
            <ShieldCheck className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">CORS</span>
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
            <Settings className="w-3.5 h-3.5 text-[#444444]" />
            <span className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">OPTIONS</span>
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
