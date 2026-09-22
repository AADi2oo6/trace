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
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A] bg-[#0D0D0D]">
          <Globe className="w-4 h-4 text-[#3A3A3A]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            1. DNS Resolution
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[#555555]">
          DNS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  const isFailed = !dnsAnalysis.resolved

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D]">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            1. DNS Resolution
          </h2>
        </div>

        <div>
          {dnsAnalysis.resolved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#22C55E] bg-[#22C55E10] border border-[#22C55E30]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              RESOLVED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#EF4444] bg-[#EF444410] border border-[#EF444430]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              FAILED
            </span>
          )}
        </div>
      </div>

      {/* Failure Banner if unresolved */}
      {isFailed && (
        <div className="p-4 bg-[#EF444408] border-b border-[#EF444420] flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-mono font-semibold text-[#EF4444] tracking-wider uppercase">
              DNS Resolution Failed
            </p>
            <p className="text-xs font-mono text-[#B0B0B0]">
              {dnsAnalysis.error || 'The system could not resolve this host to an IP address.'}
            </p>
          </div>
        </div>
      )}

      {/* Key Details Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hostname */}
        <div className="border border-[#1A1A1A] bg-[#080808] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase">Hostname</p>
          <p className="text-xs font-mono text-[#E8E8E8] truncate" title={dnsAnalysis.hostname}>
            {dnsAnalysis.hostname}
          </p>
        </div>

        {/* Resolution Time */}
        <div className="border border-[#1A1A1A] bg-[#080808] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase">Resolution Time</p>
          <p className="text-xs font-mono font-semibold text-[#E8E8E8]">
            {formatMs(dnsAnalysis.resolution_time_ms)}
          </p>
        </div>

        {/* Total Records */}
        <div className="border border-[#1A1A1A] bg-[#080808] p-3 space-y-1">
          <p className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase">Addresses Discovered</p>
          <p className="text-xs font-mono text-[#E8E8E8]">
            {dnsAnalysis.ipv4_addresses.length} IPv4, {dnsAnalysis.ipv6_addresses.length} IPv6
          </p>
        </div>
      </div>

      {/* Addresses Table / Lists */}
      <div className="p-4 space-y-4">
        {/* IPv4 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase">
              IPv4 Addresses ({dnsAnalysis.ipv4_addresses.length})
            </span>
          </div>

          {dnsAnalysis.ipv4_addresses.length > 0 ? (
            <div className="border border-[#1A1A1A] divide-y divide-[#141414] bg-[#080808]">
              {dnsAnalysis.ipv4_addresses.map((ip) => (
                <div key={ip} className="flex items-center justify-between px-3 py-2 text-xs font-mono group hover:bg-[#0D0D0D] transition-colors">
                  <span className="text-[#E8E8E8]">{ip}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ip)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#444444] hover:text-[#E8E8E8] transition-all"
                    title="Copy IP"
                    aria-label={`Copy IP ${ip}`}
                  >
                    {copiedIp === ip ? (
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs font-mono text-[#3A3A3A] border border-[#141414] bg-[#080808]">
              No IPv4 (A) records returned
            </div>
          )}
        </div>

        {/* IPv6 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase">
              IPv6 Addresses ({dnsAnalysis.ipv6_addresses.length})
            </span>
          </div>

          {dnsAnalysis.ipv6_addresses.length > 0 ? (
            <div className="border border-[#1A1A1A] divide-y divide-[#141414] bg-[#080808]">
              {dnsAnalysis.ipv6_addresses.map((ip) => (
                <div key={ip} className="flex items-center justify-between px-3 py-2 text-xs font-mono group hover:bg-[#0D0D0D] transition-colors">
                  <span className="text-[#E8E8E8] break-all">{ip}</span>
                  <button
                    type="button"
                    onClick={() => void handleCopy(ip)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#444444] hover:text-[#E8E8E8] transition-all shrink-0 ml-2"
                    title="Copy IPv6"
                    aria-label={`Copy IPv6 ${ip}`}
                  >
                    {copiedIp === ip ? (
                      <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs font-mono text-[#3A3A3A] border border-[#141414] bg-[#080808]">
              No IPv6 (AAAA) records returned
            </div>
          )}
        </div>
      </div>

      {/* Observations */}
      {dnsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[#080808]">
          <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-2">
            DNS Observations
          </p>
          <ul className="space-y-1.5" aria-label="DNS observations">
            {dnsAnalysis.observations.map((obs, idx) => (
              <li key={idx} className="text-xs font-mono text-[#777777] leading-relaxed flex items-start gap-2">
                <span className="text-[#3A3A3A] select-none">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
