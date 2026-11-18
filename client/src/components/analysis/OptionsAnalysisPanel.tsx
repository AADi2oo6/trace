import React from 'react'
import { Settings, Info } from 'lucide-react'
import type { OptionsAnalysis } from '../../types/api'

interface OptionsAnalysisPanelProps {
  optionsAnalysis: OptionsAnalysis | null
  currentMethod: string
}

function Dash() {
  return <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
}

function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-[var(--border-muted)] last:border-b-0">
      <span className="w-52 shrink-0 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider leading-5 font-medium">
        {label}
      </span>
      <div className="flex-1 text-xs font-mono text-[var(--text-secondary)] leading-5 break-all">
        {children}
      </div>
    </div>
  )
}

function MethodChips({ methods, color = 'normal' }: { methods: string[]; color?: 'normal' | 'cors' }) {
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((m) => (
        <span
          key={m}
          className={[
            'px-2 py-0.5 text-[10px] font-mono font-semibold border rounded-xs',
            color === 'cors'
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-500'
              : 'border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)]',
          ].join(' ')}
        >
          {m}
        </span>
      ))}
    </div>
  )
}

export const OptionsAnalysisPanel: React.FC<OptionsAnalysisPanelProps> = ({
  optionsAnalysis,
  currentMethod,
}) => {
  const isOptions = currentMethod.toUpperCase() === 'OPTIONS'

  if (!optionsAnalysis) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg-panel)]">
          <Settings className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase">
            4. OPTIONS &amp; Server Capabilities
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
          OPTIONS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-muted)] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold">
            4. OPTIONS &amp; Server Capabilities
          </h2>
        </div>

        <div>
          {isOptions ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-blue-500 bg-blue-500/10 border border-blue-500/30 rounded-md">
              OPTIONS REQUEST EXECUTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md">
              METHOD: {currentMethod.toUpperCase()} (NOT OPTIONS)
            </span>
          )}
        </div>
      </div>

      {/* Info notice when request method was not OPTIONS */}
      {!isOptions && (
        <div className="p-3 bg-[var(--bg-panel)] flex items-start gap-2.5 text-xs font-mono text-[var(--text-secondary)]">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[var(--text-primary)]">OPTIONS was not requested:</strong> The primary request used method <span className="text-[var(--text-primary)] font-semibold">{currentMethod}</span>. Any capability headers shown below were extracted directly from the response to this request.
          </p>
        </div>
      )}

      {/* Primary capability comparison: Allow vs Access-Control-Allow-Methods */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-panel)]">
        {/* Allow Header (HTTP standard) */}
        <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">
              HTTP Standard: Allow Header
            </span>
            {optionsAnalysis.has_allow_header ? (
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">Present ✓</span>
            ) : (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Not returned</span>
            )}
          </div>
          <div>
            {optionsAnalysis.allowed_methods.length > 0 ? (
              <MethodChips methods={optionsAnalysis.allowed_methods} color="normal" />
            ) : (
              <p className="text-xs font-mono text-[var(--text-muted)]">No advertised HTTP methods via Allow</p>
            )}
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] leading-normal pt-1 border-t border-[var(--border-muted)]">
            Advertises general HTTP methods supported by the resource.
          </p>
        </div>

        {/* Access-Control-Allow-Methods (CORS Preflight) */}
        <div className="rounded-md border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase font-medium">
              CORS: Access-Control-Allow-Methods
            </span>
            {optionsAnalysis.cors?.allow_methods && optionsAnalysis.cors.allow_methods.length > 0 ? (
              <span className="text-[10px] font-mono text-blue-500 font-semibold">Present ✓</span>
            ) : (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Not returned</span>
            )}
          </div>
          <div>
            {optionsAnalysis.cors?.allow_methods && optionsAnalysis.cors.allow_methods.length > 0 ? (
              <MethodChips methods={optionsAnalysis.cors.allow_methods} color="cors" />
            ) : (
              <p className="text-xs font-mono text-[var(--text-muted)]">No CORS preflight methods advertised</p>
            )}
          </div>
          <p className="text-[10px] font-mono text-[var(--text-muted)] leading-normal pt-1 border-t border-[var(--border-muted)]">
            Specifically grants cross-origin methods to web browsers during preflight.
          </p>
        </div>
      </div>

      {/* Additional OPTIONS / CORS Details */}
      <div className="p-4 space-y-1">
        <KVRow label="Allow Header Present">
          <span className={optionsAnalysis.has_allow_header ? 'text-emerald-500 font-semibold' : 'text-[var(--text-muted)]'}>
            {optionsAnalysis.has_allow_header ? 'YES' : 'NO'}
          </span>
        </KVRow>

        <KVRow label="CORS Allow-Origin">
          {optionsAnalysis.cors?.allow_origin ? (
            <span className="text-[var(--text-primary)] font-semibold">{optionsAnalysis.cors.allow_origin}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Allow-Headers">
          {optionsAnalysis.cors?.allow_headers && optionsAnalysis.cors.allow_headers.length > 0 ? (
            <span className="text-[var(--text-secondary)]">{optionsAnalysis.cors.allow_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Allow-Credentials">
          {optionsAnalysis.cors?.allow_credentials !== null && optionsAnalysis.cors?.allow_credentials !== undefined ? (
            <span className={optionsAnalysis.cors.allow_credentials ? 'text-emerald-500 font-semibold' : 'text-rose-500'}>
              {optionsAnalysis.cors.allow_credentials ? 'YES (Allowed)' : 'NO'}
            </span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Max-Age (Preflight Cache)">
          {optionsAnalysis.cors?.max_age !== null && optionsAnalysis.cors?.max_age !== undefined ? (
            <span className="text-[var(--text-primary)]">{optionsAnalysis.cors.max_age} seconds</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Expose-Headers">
          {optionsAnalysis.cors?.expose_headers && optionsAnalysis.cors.expose_headers.length > 0 ? (
            <span className="text-[var(--text-secondary)]">{optionsAnalysis.cors.expose_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>
      </div>

      {/* Observations */}
      {optionsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[var(--bg-panel)]">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-2 font-semibold">
            OPTIONS Observations
          </p>
          <ul className="space-y-1.5" aria-label="OPTIONS observations">
            {optionsAnalysis.observations.map((obs, idx) => (
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
