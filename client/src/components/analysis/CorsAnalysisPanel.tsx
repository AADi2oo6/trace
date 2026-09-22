import React from 'react'
import { ShieldCheck, ArrowRight, Info, AlertTriangle } from 'lucide-react'
import type { CorsAnalysis } from '../../types/api'

interface CorsAnalysisPanelProps {
  corsAnalysis: CorsAnalysis | null
}

function BoolCell({ value }: { value: boolean | null }) {
  if (value === null) {
    return <span className="text-[#444444] font-mono text-xs">NOT INDICATED</span>
  }
  return (
    <span
      className={[
        'font-mono text-xs font-semibold',
        value ? 'text-[#22C55E]' : 'text-[#EF4444]',
      ].join(' ')}
    >
      {value ? 'YES' : 'NO'}
    </span>
  )
}

function Dash() {
  return <span className="text-[#3A3A3A] font-mono text-xs">—</span>
}

function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-[#141414] last:border-b-0">
      <span className="w-48 shrink-0 text-[10px] font-mono text-[#444444] uppercase tracking-wider leading-5">
        {label}
      </span>
      <div className="flex-1 text-xs font-mono text-[#B0B0B0] leading-5 break-all">
        {children}
      </div>
    </div>
  )
}

export const CorsAnalysisPanel: React.FC<CorsAnalysisPanelProps> = ({ corsAnalysis }) => {
  if (!corsAnalysis) {
    return (
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A] bg-[#0D0D0D]">
          <ShieldCheck className="w-4 h-4 text-[#3A3A3A]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            3. CORS Analysis
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[#555555]">
          CORS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            3. CORS Analysis
          </h2>
        </div>

        <div>
          {corsAnalysis.is_cors_request ? (
            corsAnalysis.origin_allowed === true ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#22C55E] bg-[#22C55E10] border border-[#22C55E30]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                ORIGIN PERMITTED
              </span>
            ) : corsAnalysis.origin_allowed === false ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#EF4444] bg-[#EF444410] border border-[#EF444430]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                ORIGIN RESTRICTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-[#FF6A00] bg-[#FF6A0010] border border-[#FF6A0030]">
                CORS REQUEST
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-[#777777] bg-[#141414] border border-[#222222]">
              NO ORIGIN HEADER SENT
            </span>
          )}
        </div>
      </div>

      {/* Technical Note / Context Banner */}
      <div className="p-3 bg-[#0D0D0D] flex items-start gap-2.5 text-xs font-mono text-[#6B6B6B]">
        <Info className="w-4 h-4 text-[#555555] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-[#888888]">Browser-Enforced Mechanism:</strong> Cross-Origin Resource Sharing (CORS) rules govern web browsers. TRACE executes outbound server-to-server requests and is not restricted by browser CORS. This section analyzes the headers returned by the server that would affect a browser.
        </p>
      </div>

      {/* Compact Flow Visualization */}
      <div className="p-4 bg-[#080808]">
        <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-3">
          Cross-Origin Evaluation Flow
        </p>
        <div className="flex flex-col md:flex-row items-center gap-2 text-xs font-mono">
          {/* Step 1: Request Origin */}
          <div className="w-full md:w-auto flex-1 border border-[#1A1A1A] bg-[#0A0A0A] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[#444444] mb-1">Request Origin</p>
            <p className="font-semibold text-[#E8E8E8] truncate">
              {corsAnalysis.request_origin || 'None (Direct / Same-origin)'}
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-[#3A3A3A] shrink-0 rotate-90 md:rotate-0 my-1 md:my-0" />

          {/* Step 2: Server Allow-Origin */}
          <div className="w-full md:w-auto flex-1 border border-[#1A1A1A] bg-[#0A0A0A] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[#444444] mb-1">Server Response (Allow-Origin)</p>
            <p className="font-semibold text-[#E8E8E8] truncate">
              {corsAnalysis.allowed_origin || 'Not returned'}
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-[#3A3A3A] shrink-0 rotate-90 md:rotate-0 my-1 md:my-0" />

          {/* Step 3: Browser Evaluation */}
          <div className="w-full md:w-auto flex-1 border border-[#1A1A1A] bg-[#0A0A0A] p-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[#444444] mb-1">Browser Verdict</p>
            {corsAnalysis.is_cors_request ? (
              corsAnalysis.origin_allowed ? (
                <p className="font-semibold text-[#22C55E]">ALLOWED</p>
              ) : (
                <p className="font-semibold text-[#EF4444]">NOT ALLOWED</p>
              )
            ) : (
              <p className="text-[#6B6B6B]">NOT INDICATED</p>
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
            <span className="text-[#E8E8E8]">{corsAnalysis.request_origin}</span>
          ) : (
            <span className="text-[#555555]">No Origin header was sent with this request</span>
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Origin">
          {corsAnalysis.allowed_origin ? (
            <span className="text-[#E8E8E8] font-semibold">{corsAnalysis.allowed_origin}</span>
          ) : (
            <span className="text-[#6B6B6B]">Access-Control-Allow-Origin was not returned by the server</span>
          )}
        </KVRow>

        <KVRow label="Origin Permitted">
          <BoolCell value={corsAnalysis.origin_allowed} />
        </KVRow>

        <KVRow label="Wildcard (*) Origin">
          {corsAnalysis.wildcard_origin ? (
            <span className="inline-flex items-center gap-1 text-[#F59E0B] font-semibold">
              <AlertTriangle className="w-3 h-3" /> YES (Wildcard Allows Any Origin)
            </span>
          ) : (
            <span className="text-[#555555]">NO</span>
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Methods">
          {corsAnalysis.allowed_methods && corsAnalysis.allowed_methods.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {corsAnalysis.allowed_methods.map((m) => (
                <span key={m} className="px-1.5 py-0.5 text-[9px] font-mono border border-[#2A2A2A] bg-[#111111] text-[#E8E8E8]">
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
            <span className="text-[#B0B0B0]">{corsAnalysis.allowed_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Allow-Credentials">
          {corsAnalysis.allow_credentials !== null ? (
            <span className={corsAnalysis.allow_credentials ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
              {corsAnalysis.allow_credentials ? 'YES (Cookies/Credentials Allowed)' : 'NO'}
            </span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Max-Age">
          {corsAnalysis.max_age !== null ? (
            <span>{corsAnalysis.max_age} seconds</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="Access-Control-Expose-Headers">
          {corsAnalysis.expose_headers && corsAnalysis.expose_headers.length > 0 ? (
            <span className="text-[#B0B0B0]">{corsAnalysis.expose_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>
      </div>

      {/* Observations */}
      {corsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[#080808]">
          <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-2">
            CORS Observations
          </p>
          <ul className="space-y-1.5" aria-label="CORS observations">
            {corsAnalysis.observations.map((obs, idx) => (
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
