import React from 'react'
import { Globe, ShieldCheck, Settings, ListFilter } from 'lucide-react'
import type { DnsAnalysis, CorsAnalysis, OptionsAnalysis, HeaderAnalysisItem } from '../../types/api'
import { Panel } from '../ui/Panel'
import { Badge } from '../ui/Badge'

interface AnalysisPreviewProps {
  dnsAnalysis: DnsAnalysis | null
  corsAnalysis: CorsAnalysis | null
  optionsAnalysis: OptionsAnalysis | null
  headerAnalysis: HeaderAnalysisItem[] | null
}

function MiniCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <Panel padding="sm" className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[#3A3A3A]" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase">
          {label}
        </span>
      </div>
      {children}
    </Panel>
  )
}

export const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({
  dnsAnalysis,
  corsAnalysis,
  optionsAnalysis,
  headerAnalysis,
}) => {
  const hasAny = dnsAnalysis || corsAnalysis || optionsAnalysis || headerAnalysis

  if (!hasAny) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs font-mono text-[#3A3A3A]">No analysis data available.</p>
      </div>
    )
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* DNS */}
      {dnsAnalysis && (
        <MiniCard icon={<Globe className="w-3.5 h-3.5" />} label="DNS">
          <div>
            <p className="text-xs font-mono text-[#B0B0B0] mb-1">{dnsAnalysis.hostname}</p>
            {dnsAnalysis.resolved ? (
              <div className="space-y-1">
                <Badge variant="success" dot>Resolved</Badge>
                {dnsAnalysis.resolution_time_ms !== null && (
                  <p className="text-[11px] font-mono text-[#6B6B6B]">
                    {dnsAnalysis.resolution_time_ms.toFixed(1)} ms
                  </p>
                )}
                {dnsAnalysis.ipv4_addresses.length > 0 && (
                  <div className="space-y-0.5 mt-1.5">
                    {dnsAnalysis.ipv4_addresses.slice(0, 3).map((ip) => (
                      <p key={ip} className="text-[10px] font-mono text-[#555555]">
                        {ip}
                      </p>
                    ))}
                    {dnsAnalysis.ipv4_addresses.length > 3 && (
                      <p className="text-[10px] font-mono text-[#3A3A3A]">
                        +{dnsAnalysis.ipv4_addresses.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Badge variant="error" dot>
                {dnsAnalysis.error ?? 'Failed'}
              </Badge>
            )}
          </div>
        </MiniCard>
      )}

      {/* CORS */}
      {corsAnalysis && (
        <MiniCard icon={<ShieldCheck className="w-3.5 h-3.5" />} label="CORS">
          <div className="space-y-1.5">
            {corsAnalysis.is_cors_request ? (
              <>
                <Badge variant="orange" dot>CORS Request</Badge>
                {corsAnalysis.allowed_origin && (
                  <p className="text-[10px] font-mono text-[#555555]">
                    Origin: {corsAnalysis.allowed_origin}
                  </p>
                )}
                {corsAnalysis.origin_allowed !== null && (
                  <Badge variant={corsAnalysis.origin_allowed ? 'success' : 'error'}>
                    {corsAnalysis.origin_allowed ? 'Origin allowed' : 'Origin blocked'}
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-[11px] font-mono text-[#3A3A3A]">
                No Origin header sent
              </p>
            )}
            {corsAnalysis.wildcard_origin && (
              <Badge variant="warning">Wildcard *</Badge>
            )}
          </div>
        </MiniCard>
      )}

      {/* OPTIONS analysis */}
      {optionsAnalysis && (
        <MiniCard icon={<Settings className="w-3.5 h-3.5" />} label="OPTIONS">
          <div className="space-y-1.5">
            {optionsAnalysis.allowed_methods.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {optionsAnalysis.allowed_methods.map((m) => (
                  <span
                    key={m}
                    className="text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#2A2A2A] text-[#6B6B6B]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-mono text-[#3A3A3A]">No Allow header</p>
            )}
          </div>
        </MiniCard>
      )}

      {/* Headers count */}
      {headerAnalysis && headerAnalysis.length > 0 && (
        <MiniCard icon={<ListFilter className="w-3.5 h-3.5" />} label="Headers">
          <div className="space-y-1.5">
            <p className="text-sm font-mono font-semibold text-[#E8E8E8]">
              {headerAnalysis.length}
            </p>
            <p className="text-[11px] font-mono text-[#555555]">
              headers analyzed
            </p>
            {/* Category breakdown — top 3 */}
            {(() => {
              const cats = new Map<string, number>()
              for (const h of headerAnalysis) {
                cats.set(h.category, (cats.get(h.category) ?? 0) + 1)
              }
              return Array.from(cats.entries())
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#3A3A3A]">{cat}</span>
                    <span className="text-[10px] font-mono text-[#555555]">{count}</span>
                  </div>
                ))
            })()}
          </div>
        </MiniCard>
      )}
    </div>
  )
}
