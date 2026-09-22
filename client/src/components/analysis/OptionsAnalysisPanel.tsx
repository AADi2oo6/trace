import React from 'react'
import { Settings, Info } from 'lucide-react'
import type { OptionsAnalysis } from '../../types/api'

interface OptionsAnalysisPanelProps {
  optionsAnalysis: OptionsAnalysis | null
  currentMethod: string
}

function Dash() {
  return <span className="text-[#3A3A3A] font-mono text-xs">—</span>
}

function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2 border-b border-[#141414] last:border-b-0">
      <span className="w-52 shrink-0 text-[10px] font-mono text-[#444444] uppercase tracking-wider leading-5">
        {label}
      </span>
      <div className="flex-1 text-xs font-mono text-[#B0B0B0] leading-5 break-all">
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
            'px-2 py-0.5 text-[10px] font-mono font-semibold border',
            color === 'cors'
              ? 'border-[#3B82F630] bg-[#3B82F610] text-[#3B82F6]'
              : 'border-[#2A2A2A] bg-[#111111] text-[#E8E8E8]',
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
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A] bg-[#0D0D0D]">
          <Settings className="w-4 h-4 text-[#3A3A3A]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            4. OPTIONS &amp; Server Capabilities
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[#555555]">
          OPTIONS analysis is UNAVAILABLE for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0D0D0D]">
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            4. OPTIONS &amp; Server Capabilities
          </h2>
        </div>

        <div>
          {isOptions ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-semibold text-[#FF6A00] bg-[#FF6A0010] border border-[#FF6A0030]">
              OPTIONS REQUEST EXECUTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono text-[#777777] bg-[#141414] border border-[#222222]">
              METHOD: {currentMethod.toUpperCase()} (NOT OPTIONS)
            </span>
          )}
        </div>
      </div>

      {/* Info notice when request method was not OPTIONS */}
      {!isOptions && (
        <div className="p-3 bg-[#0D0D0D] flex items-start gap-2.5 text-xs font-mono text-[#6B6B6B]">
          <Info className="w-4 h-4 text-[#555555] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#888888]">OPTIONS was not requested:</strong> The primary request used method <span className="text-[#E8E8E8] font-semibold">{currentMethod}</span>. Any capability headers shown below were extracted directly from the response to this request.
          </p>
        </div>
      )}

      {/* Primary capability comparison: Allow vs Access-Control-Allow-Methods */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#080808]">
        {/* Allow Header (HTTP standard) */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest text-[#444444] uppercase">
              HTTP Standard: Allow Header
            </span>
            {optionsAnalysis.has_allow_header ? (
              <span className="text-[10px] font-mono text-[#22C55E]">Present ✓</span>
            ) : (
              <span className="text-[10px] font-mono text-[#555555]">Not returned</span>
            )}
          </div>
          <div>
            {optionsAnalysis.allowed_methods.length > 0 ? (
              <MethodChips methods={optionsAnalysis.allowed_methods} color="normal" />
            ) : (
              <p className="text-xs font-mono text-[#444444]">No advertised HTTP methods via Allow</p>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#444444] leading-normal pt-1 border-t border-[#141414]">
            Advertises general HTTP methods supported by the resource.
          </p>
        </div>

        {/* Access-Control-Allow-Methods (CORS Preflight) */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest text-[#444444] uppercase">
              CORS: Access-Control-Allow-Methods
            </span>
            {optionsAnalysis.cors?.allow_methods && optionsAnalysis.cors.allow_methods.length > 0 ? (
              <span className="text-[10px] font-mono text-[#3B82F6]">Present ✓</span>
            ) : (
              <span className="text-[10px] font-mono text-[#555555]">Not returned</span>
            )}
          </div>
          <div>
            {optionsAnalysis.cors?.allow_methods && optionsAnalysis.cors.allow_methods.length > 0 ? (
              <MethodChips methods={optionsAnalysis.cors.allow_methods} color="cors" />
            ) : (
              <p className="text-xs font-mono text-[#444444]">No CORS preflight methods advertised</p>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#444444] leading-normal pt-1 border-t border-[#141414]">
            Specifically grants cross-origin methods to web browsers during preflight.
          </p>
        </div>
      </div>

      {/* Additional OPTIONS / CORS Details */}
      <div className="p-4 space-y-1">
        <KVRow label="Allow Header Present">
          <span className={optionsAnalysis.has_allow_header ? 'text-[#22C55E] font-semibold' : 'text-[#555555]'}>
            {optionsAnalysis.has_allow_header ? 'YES' : 'NO'}
          </span>
        </KVRow>

        <KVRow label="CORS Allow-Origin">
          {optionsAnalysis.cors?.allow_origin ? (
            <span className="text-[#E8E8E8]">{optionsAnalysis.cors.allow_origin}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Allow-Headers">
          {optionsAnalysis.cors?.allow_headers && optionsAnalysis.cors.allow_headers.length > 0 ? (
            <span className="text-[#B0B0B0]">{optionsAnalysis.cors.allow_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Allow-Credentials">
          {optionsAnalysis.cors?.allow_credentials !== null && optionsAnalysis.cors?.allow_credentials !== undefined ? (
            <span className={optionsAnalysis.cors.allow_credentials ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
              {optionsAnalysis.cors.allow_credentials ? 'YES (Allowed)' : 'NO'}
            </span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Max-Age (Preflight Cache)">
          {optionsAnalysis.cors?.max_age !== null && optionsAnalysis.cors?.max_age !== undefined ? (
            <span>{optionsAnalysis.cors.max_age} seconds</span>
          ) : (
            <Dash />
          )}
        </KVRow>

        <KVRow label="CORS Expose-Headers">
          {optionsAnalysis.cors?.expose_headers && optionsAnalysis.cors.expose_headers.length > 0 ? (
            <span className="text-[#B0B0B0]">{optionsAnalysis.cors.expose_headers.join(', ')}</span>
          ) : (
            <Dash />
          )}
        </KVRow>
      </div>

      {/* Observations */}
      {optionsAnalysis.observations.length > 0 && (
        <div className="p-4 bg-[#080808]">
          <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-2">
            OPTIONS Observations
          </p>
          <ul className="space-y-1.5" aria-label="OPTIONS observations">
            {optionsAnalysis.observations.map((obs, idx) => (
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
