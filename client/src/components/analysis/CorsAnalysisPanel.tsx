import React from 'react'
import { ShieldCheck, ArrowRight, Info, AlertTriangle } from 'lucide-react'
import type { CorsAnalysis } from '../../types/api'

interface CorsAnalysisPanelProps {
  corsAnalysis: CorsAnalysis | null
}

function BoolCell({ value }: { value: boolean | null }) {
  if (value === null) {
    return <span className="text-[var(--text-muted)] font-mono text-xs">NOT INDICATED</span>
  }
  return (
    <span
      className={[
        'font-mono text-xs font-semibold',
        value ? 'text-emerald-500' : 'text-rose-500',
      ].join(' ')}
    >
      {value ? 'YES' : 'NO'}
    </span>
  )
}

function Dash() {
  return <span className="text-[var(--text-muted)] font-mono text-xs">—</span>
}

function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-[var(--border-muted)] last:border-b-0">
      <span className="w-48 shrink-0 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider leading-5 font-medium">
        {label}
      </span>
      <div className="flex-1 text-xs font-mono text-[var(--text-secondary)] leading-5 break-all">
        {children}
      </div>
    </div>
  )
}

export const CorsAnalysisPanel: React.FC<CorsAnalysisPanelProps> = ({ corsAnalysis }) => {
  if (!corsAnalysis) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg-panel)]">
          <ShieldCheck className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase">
            3. CORS Analysis
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
          CORS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-muted)] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold">
            3. CORS Analysis
          </h2>
        </div>

        <div>
          {corsAnalysis.is_cors_request ? (
            corsAnalysis.origin_allowed === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ORIGIN PERMITTED
              </span>
            ) : corsAnalysis.origin_allowed === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                ORIGIN RESTRICTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-md">
                CORS REQUEST
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md">
              NO ORIGIN HEADER SENT
            </span>
          )}
        </div>
      </div>

      {/* Technical Note / Context Banner */}
      <div className="p-3 bg-[var(--bg-panel)] flex items-start gap-2.5 text-xs font-mono text-[var(--text-secondary)]">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[var(--text-primary)]">Browser-Enforced Mechanism:</strong> Cross-Origin Resource Sharing (CORS) rules govern web browsers. TRACE executes outbound server-to-server requests and is not restricted by browser CORS. This section analyzes the headers returned by the server that would affect a browser.
        </p>
      </div>

      {/* Compact Flow Visualization */}
      <div className="p-4 bg-[var(--bg-panel)]">
        <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-3 font-semibold">
          Cross-Origin Evaluation Flow
        </p>
        <div className="flex flex-col md:flex-row items-center gap-2 text-xs font-mono">
          {/* Step 1: Request Origin */}
          <div className="w-full md:w-auto flex-1 rounded-md border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Request Origin</p>
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {corsAnalysis.request_origin || 'None (Direct / Same-origin)'}
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 rotate-90 md:rotate-0 my-1 md:my-0" />

          {/* Step 2: Server Allow-Origin */}
          <div className="w-full md:w-auto flex-1 rounded-md border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Server Response (Allow-Origin)</p>
            <p className="font-semibold text-[var(--text-primary)] truncate">
              {corsAnalysis.allowed_origin || 'Not returned'}
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-blue-500 shrink-0 rotate-90 md:rotate-0 my-1 md:my-0" />

          {/* Step 3: Browser Evaluation */}
          <div className="w-full md:w-auto flex-1 rounded-md border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Browser Verdict</p>
            {corsAnalysis.is_cors_request ? (
              corsAnalysis.origin_allowed ? (
                <p className="font-semibold text-emerald-500">ALLOWED</p>
              ) : (
                <p className="font-semibold text-rose-500">NOT ALLOWED</p>
              )
            ) : (
              <p className="text-[var(--text-muted)]">NOT INDICATED</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Technical KV Table */}
      <div className="p-4 space-y-1">
        <KVRow label="CORS Request">
          <BoolCell value={corsAnalysis.is_cors_request} />
        </KVRow>

        <KVRow label="Request Origin Sent">
          {corsAnalysis.request_origin ? (
            <span className="text-[var(--text-primary)]">{corsAnalysis.request_origin}</span>
          ) : (
            <span className="text-[var(--text-muted)]">No Origin header was sent with this request</span>
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Origin">
          {corsAnalysis.allowed_origin ? (
            <span className="text-[var(--text-primary)] font-semibold">{corsAnalysis.allowed_origin}</span>
          ) : (
            <span className="text-[var(--text-muted)]">Access-Control-Allow-Origin was not returned by the server</span>
          )}
        </KVRow>

        <KVRow label="Origin Permitted">
          <BoolCell value={corsAnalysis.origin_allowed} />
        </KVRow>

        <KVRow label="Wildcard (*) Origin">
          {corsAnalysis.wildcard_origin ? (
            <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
              <AlertTriangle className="w-3 h-3" /> YES (Wildcard Allows Any Origin)
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">NO</span>
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Methods">
          {corsAnalysis.allowed_methods && corsAnalysis.allowed_methods.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {corsAnalysis.allowed_methods.map((m) => (
                <span key={m} className="px-1.5 py-0.5 text-[9px] font-mono border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xs">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Headers">
          {corsAnalysis.allowed_headers && corsAnalysis.allowed_headers.length > 0 ? (
            <span className="text-[var(--text-secondary)]">{corsAnalysis.allowed_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Credentials">
          {corsAnalysis.allow_credentials !== null ? (
            <span className={corsAnalysis.allow_credentials ? 'text-emerald-500 font-semibold' : 'text-rose-500'}>
              {corsAnalysis.allow_credentials ? 'YES (Cookies/Credentials Allowed)' : 'NO'}
            </span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Max-Age">
          {corsAnalysis.max_age !== null ? (
            <span className="text-[var(--text-primary)]">{corsAnalysis.max_age} seconds</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Expose-Headers">
          {corsAnalysis.expose_headers && corsAnalysis.expose_headers.length > 0 ? (
            <span className="text-[var(--text-secondary)]">{corsAnalysis.expose_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>
      </div>

      {/* Observations */}
      {corsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[var(--bg-panel)]">
          <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-2 font-semibold">
            CORS Observations
          </p>
          <ul className="space-y-1.5" aria-label="CORS observations">
            {corsAnalysis.observations.map((obs, idx) => (
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
