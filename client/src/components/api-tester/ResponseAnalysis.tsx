import React from 'react'
import { Globe, ShieldCheck, Settings, ListFilter } from 'lucide-react'
import type {
  DnsAnalysis,
  CorsAnalysis,
  OptionsAnalysis,
  HeaderAnalysisItem,
  HeaderCategory,
} from '../../types/api'

// ── Props ─────────────────────────────────────────────────────────────────────

interface ResponseAnalysisProps {
  dnsAnalysis: DnsAnalysis | null
  corsAnalysis: CorsAnalysis | null
  optionsAnalysis: OptionsAnalysis | null
  headerAnalysis: HeaderAnalysisItem[] | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMs(ms: number | null): string {
  if (ms === null) return 'UNAVAILABLE'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/** Render a "Yes" / "No" cell with color */
function BoolCell({ value }: { value: boolean | null }) {
  if (value === null) {
    return <span className="text-[#3A3A3A] font-mono text-xs">N/A</span>
  }
  return (
    <span
      className={[
        'font-mono text-xs font-semibold',
        value ? 'text-[#22C55E]' : 'text-[#EF4444]',
      ].join(' ')}
    >
      {value ? 'Yes' : 'No'}
    </span>
  )
}

/** Dash placeholder for unavailable/null data */
function Dash() {
  return <span className="text-[#3A3A3A] font-mono text-xs">—</span>
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1A1A1A] bg-[#0D0D0D]">
        <span className="text-[#3A3A3A]" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase">
          {label}
        </span>
      </div>
      {/* Section body */}
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ── Key-value row ─────────────────────────────────────────────────────────────

function KVRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4 py-1.5 border-b border-[#111111] last:border-b-0">
      <span className="w-40 shrink-0 text-[10px] font-mono text-[#3A3A3A] uppercase tracking-wider leading-5">
        {label}
      </span>
      <div className="flex-1 text-xs font-mono text-[#B0B0B0] leading-5 break-all">
        {children}
      </div>
    </div>
  )
}

// ── Observations list ─────────────────────────────────────────────────────────

function ObservationsList({ observations }: { observations: string[] }) {
  if (observations.length === 0) return null
  return (
    <KVRow label="Observations">
      <ul className="space-y-0.5">
        {observations.map((obs, i) => (
          <li key={i} className="text-[#6B6B6B] leading-relaxed">
            {obs}
          </li>
        ))}
      </ul>
    </KVRow>
  )
}

// ── Method chip ───────────────────────────────────────────────────────────────

function MethodChip({ method }: { method: string }) {
  return (
    <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 border border-[#2A2A2A] text-[#6B6B6B] mr-1">
      {method}
    </span>
  )
}

// ── DNS Section ───────────────────────────────────────────────────────────────

function DnsSection({ dns }: { dns: DnsAnalysis }) {
  return (
    <Section icon={<Globe className="w-3.5 h-3.5" />} label="DNS Resolution">
      <KVRow label="Hostname">
        <span className="text-[#E8E8E8]">{dns.hostname}</span>
      </KVRow>
      <KVRow label="Status">
        {dns.resolved ? (
          <span className="text-[#22C55E] font-semibold">Resolved ✓</span>
        ) : (
          <span className="text-[#EF4444] font-semibold">Failed ✗</span>
        )}
      </KVRow>
      {!dns.resolved && dns.error && (
        <KVRow label="Error">
          <span className="text-[#EF4444]">{dns.error}</span>
        </KVRow>
      )}
      <KVRow label="Resolution time">
        {dns.resolution_time_ms !== null ? (
          <span>{formatMs(dns.resolution_time_ms)}</span>
        ) : (
          <span className="text-[#3A3A3A]">UNAVAILABLE</span>
        )}
      </KVRow>
      {dns.ipv4_addresses.length > 0 && (
        <KVRow label="IPv4 addresses">
          <div className="space-y-0.5">
            {dns.ipv4_addresses.map((ip) => (
              <div key={ip}>{ip}</div>
            ))}
          </div>
        </KVRow>
      )}
      {dns.ipv6_addresses.length > 0 && (
        <KVRow label="IPv6 addresses">
          <div className="space-y-0.5">
            {dns.ipv6_addresses.map((ip) => (
              <div key={ip}>{ip}</div>
            ))}
          </div>
        </KVRow>
      )}
      <ObservationsList observations={dns.observations} />
    </Section>
  )
}

// ── CORS Section ──────────────────────────────────────────────────────────────

function CorsSection({ cors }: { cors: CorsAnalysis }) {
  return (
    <Section icon={<ShieldCheck className="w-3.5 h-3.5" />} label="CORS Analysis">
      <KVRow label="CORS request">
        <BoolCell value={cors.is_cors_request} />
      </KVRow>
      <KVRow label="Origin sent">
        {cors.request_origin ? (
          <span className="text-[#E8E8E8]">{cors.request_origin}</span>
        ) : (
          <Dash />
        )}
      </KVRow>
      <KVRow label="Allowed origin">
        {cors.allowed_origin ? (
          <span className="text-[#E8E8E8]">{cors.allowed_origin}</span>
        ) : (
          <Dash />
        )}
      </KVRow>
      <KVRow label="Origin permitted">
        <BoolCell value={cors.origin_allowed} />
      </KVRow>
      <KVRow label="Wildcard *">
        <BoolCell value={cors.wildcard_origin} />
      </KVRow>
      <KVRow label="Method allowed">
        <BoolCell value={cors.method_allowed} />
      </KVRow>
      <KVRow label="Credentials">
        {cors.allow_credentials !== null ? (
          <span className={cors.allow_credentials ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
            {cors.allow_credentials ? 'Allowed' : 'Not allowed'}
          </span>
        ) : (
          <Dash />
        )}
      </KVRow>
      <KVRow label="Max-Age">
        {cors.max_age !== null ? (
          <span>{cors.max_age}s</span>
        ) : (
          <Dash />
        )}
      </KVRow>
      {cors.allowed_methods && cors.allowed_methods.length > 0 && (
        <KVRow label="Allowed methods">
          <div className="flex flex-wrap gap-1">
            {cors.allowed_methods.map((m) => (
              <MethodChip key={m} method={m} />
            ))}
          </div>
        </KVRow>
      )}
      {cors.expose_headers && cors.expose_headers.length > 0 && (
        <KVRow label="Expose headers">
          <span className="text-[#6B6B6B]">{cors.expose_headers.join(', ')}</span>
        </KVRow>
      )}
      <ObservationsList observations={cors.observations} />
    </Section>
  )
}

// ── OPTIONS Section ───────────────────────────────────────────────────────────

function OptionsSection({ options }: { options: OptionsAnalysis }) {
  return (
    <Section icon={<Settings className="w-3.5 h-3.5" />} label="OPTIONS Inspector">
      <KVRow label="Allow header">
        {options.has_allow_header ? (
          <span className="text-[#22C55E]">Present</span>
        ) : (
          <span className="text-[#EF4444]">Not present</span>
        )}
      </KVRow>
      <KVRow label="Allowed methods">
        {options.allowed_methods.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {options.allowed_methods.map((m) => (
              <MethodChip key={m} method={m} />
            ))}
          </div>
        ) : (
          <Dash />
        )}
      </KVRow>
      {options.cors && (
        <>
          {options.cors.allow_origin && (
            <KVRow label="CORS Allow-Origin">
              <span className="text-[#E8E8E8]">{options.cors.allow_origin}</span>
            </KVRow>
          )}
          {options.cors.allow_methods && options.cors.allow_methods.length > 0 && (
            <KVRow label="CORS Allow-Methods">
              <div className="flex flex-wrap gap-1">
                {options.cors.allow_methods.map((m) => (
                  <MethodChip key={m} method={m} />
                ))}
              </div>
            </KVRow>
          )}
          {options.cors.allow_headers && options.cors.allow_headers.length > 0 && (
            <KVRow label="CORS Allow-Headers">
              <span className="text-[#6B6B6B]">
                {options.cors.allow_headers.join(', ')}
              </span>
            </KVRow>
          )}
          {options.cors.allow_credentials !== null && (
            <KVRow label="CORS Credentials">
              <span
                className={options.cors.allow_credentials ? 'text-[#22C55E]' : 'text-[#EF4444]'}
              >
                {options.cors.allow_credentials ? 'Allowed' : 'Not allowed'}
              </span>
            </KVRow>
          )}
          {options.cors.max_age !== null && (
            <KVRow label="CORS Max-Age">
              <span>{options.cors.max_age}s</span>
            </KVRow>
          )}
        </>
      )}
      <ObservationsList observations={options.observations} />
    </Section>
  )
}

// ── Header Analysis Section ───────────────────────────────────────────────────

/** Group headers by category, preserving order of first appearance */
function groupByCategory(items: HeaderAnalysisItem[]): Map<HeaderCategory, HeaderAnalysisItem[]> {
  const map = new Map<HeaderCategory, HeaderAnalysisItem[]>()
  for (const item of items) {
    const existing = map.get(item.category)
    if (existing) {
      existing.push(item)
    } else {
      map.set(item.category, [item])
    }
  }
  return map
}

function HeaderAnalysisSection({ items }: { items: HeaderAnalysisItem[] }) {
  const grouped = groupByCategory(items)

  return (
    <Section icon={<ListFilter className="w-3.5 h-3.5" />} label="Header Analysis">
      <div className="mb-3 pb-2 border-b border-[#111111]">
        <span className="text-xs font-mono text-[#6B6B6B]">
          <span className="text-[#E8E8E8] font-semibold">{items.length}</span> headers analyzed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono" aria-label="Header analysis table">
          <thead>
            <tr className="border-b border-[#1A1A1A]">
              <th
                scope="col"
                className="text-left py-1.5 pr-4 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal w-1/4"
              >
                Header
              </th>
              <th
                scope="col"
                className="text-left py-1.5 pr-4 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal w-1/3"
              >
                Value
              </th>
              <th
                scope="col"
                className="text-left py-1.5 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([category, catItems]) => (
              <React.Fragment key={category}>
                {/* Category separator row */}
                <tr className="bg-[#0D0D0D]">
                  <td
                    colSpan={3}
                    className="py-1.5 px-0 text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase border-t border-b border-[#1A1A1A]"
                  >
                    {category}
                  </td>
                </tr>
                {catItems.map((item) => (
                  <tr
                    key={`${item.name}-${item.source}`}
                    className="border-b border-[#111111] hover:bg-[#0D0D0D] transition-colors duration-75 align-top"
                  >
                    <td className="py-2 pr-4 text-[#6B6B6B] whitespace-nowrap">{item.name}</td>
                    <td className="py-2 pr-4 text-[#B0B0B0] break-all">{item.value}</td>
                    <td className="py-2 text-[#555555] leading-relaxed">{item.description}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export const ResponseAnalysis: React.FC<ResponseAnalysisProps> = ({
  dnsAnalysis,
  corsAnalysis,
  optionsAnalysis,
  headerAnalysis,
}) => {
  const hasAny = dnsAnalysis || corsAnalysis || optionsAnalysis || (headerAnalysis && headerAnalysis.length > 0)

  if (!hasAny) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs font-mono text-[#3A3A3A]">No analysis data available.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3" aria-label="Response analysis">
      {dnsAnalysis && <DnsSection dns={dnsAnalysis} />}
      {corsAnalysis && <CorsSection cors={corsAnalysis} />}
      {optionsAnalysis && <OptionsSection options={optionsAnalysis} />}
      {headerAnalysis && headerAnalysis.length > 0 && (
        <HeaderAnalysisSection items={headerAnalysis} />
      )}
    </div>
  )
}
