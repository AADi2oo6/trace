import React, { useState } from 'react'
import { Globe, Copy, Check, AlertCircle } from 'lucide-react'
import type { DnsAnalysis } from '../../types/api'

interface DnsAnalysisPanelProps {
  dnsAnalysis: DnsAnalysis | null
}

function formatMs(ms: number | null): string {
  if (ms === null) return 'UNAVAILABLE'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export const DnsAnalysisPanel: React.FC<DnsAnalysisPanelProps> = ({ dnsAnalysis }) => {
  const [copiedIp, setCopiedIp] = useState<string | null>(null)

  const handleCopy = async (ip: string) => {
    try {
      await navigator.clipboard.writeText(ip)
      setCopiedIp(ip)
      setTimeout(() => setCopiedIp(null), 2000)
    } catch {
      // Ignore
    }
  }

  if (!dnsAnalysis) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg-panel)]">
          <Globe className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase">
            1. DNS Resolution
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
          DNS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  const isFailed = !dnsAnalysis.resolved

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-muted)] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold">
            1. DNS Resolution
          </h2>
        </div>

        <div>
          {dnsAnalysis.resolved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              RESOLVED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              FAILED
            </span>
          )}
        </div>
      </div>

      {/* Failure Banner if unresolved */}
      {isFailed && (
        <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-mono font-semibold text-rose-500 tracking-wider uppercase">
              DNS Resolution Failed
            </p>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              {dnsAnalysis.error || 'The system could not resolve this host to an IP address.'}
            </p>
          </div>
        </div>
      )}

      {/* Key Details Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hostname */}
        <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">Hostname</p>
          <p className="text-xs font-mono text-[var(--text-primary)] truncate font-semibold" title={dnsAnalysis.hostname}>
            {dnsAnalysis.hostname}
          </p>
        </div>

        {/* Resolution Time */}
        <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">Resolution Time</p>
          <p className="text-xs font-mono font-semibold text-emerald-500">
            {formatMs(dnsAnalysis.resolution_time_ms)}
          </p>
        </div>

        {/* Total Records */}
        <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-panel)] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">Addresses Discovered</p>
          <p className="text-xs font-mono text-[var(--text-primary)]">
            {dnsAnalysis.ipv4_addresses.length} IPv4, {dnsAnalysis.ipv6_addresses.length} IPv6
          </p>
        </div>
      </div>

      {/* Addresses Table / Lists */}
      <div className="p-4 space-y-4">
        {/* IPv4 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase font-semibold">
              IPv4 Addresses ({dnsAnalysis.ipv4_addresses.length})
            </span>
          </div>

          {dnsAnalysis.ipv4_addresses.length > 0 ? (
            <div className="rounded-md border border-[var(--border-muted)] divide-y divide-[var(--border-muted)] bg-[var(--bg-panel)] overflow-hidden">
              {dnsAnalysis.ipv4_addresses.map((ip) => (
                <div key={ip} className="flex items-center justify-between px-3 py-2 text-xs font-mono group hover:bg-[var(--bg-hover)] transition-colors">
                  <span className="text-[var(--text-primary)] font-medium">{ip}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ip)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all rounded-sm"
                    title="Copy IP"
                    aria-label={`Copy IP ${ip}`}
                  >
                    {copiedIp === ip ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md px-3 py-2 text-xs font-mono text-[var(--text-muted)] border border-[var(--border-muted)] bg-[var(--bg-panel)]">
              No IPv4 (A) records returned
            </div>
          )}
        </div>

        {/* IPv6 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase font-semibold">
              IPv6 Addresses ({dnsAnalysis.ipv6_addresses.length})
            </span>
          </div>

          {dnsAnalysis.ipv6_addresses.length > 0 ? (
            <div className="rounded-md border border-[var(--border-muted)] divide-y divide-[var(--border-muted)] bg-[var(--bg-panel)] overflow-hidden">
              {dnsAnalysis.ipv6_addresses.map((ip) => (
                <div key={ip} className="flex items-center justify-between px-3 py-2 text-xs font-mono group hover:bg-[var(--bg-hover)] transition-colors">
                  <span className="text-[var(--text-primary)] break-all font-medium">{ip}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ip)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all shrink-0 ml-2 rounded-sm"
                    title="Copy IPv6"
                    aria-label={`Copy IPv6 ${ip}`}
                  >
                    {copiedIp === ip ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md px-3 py-2 text-xs font-mono text-[var(--text-muted)] border border-[var(--border-muted)] bg-[var(--bg-panel)]">
              No IPv6 (AAAA) records returned
            </div>
          )}
        </div>
      </div>

      {/* Observations */}
      {dnsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[var(--bg-panel)]">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-2 font-semibold">
            DNS Observations
          </p>
          <ul className="space-y-1.5" aria-label="DNS observations">
            {dnsAnalysis.observations.map((obs, idx) => (
              <li key={idx} className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                <span className="text-blue-500 select-none">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
