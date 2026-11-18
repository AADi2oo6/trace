import React, { useState } from 'react'
import type { RequestJourney, JourneyPhase } from '../../types/api'
import { Info } from 'lucide-react'

interface RequestWaterfallProps {
  journey: RequestJourney
  title?: string
}

export const RequestWaterfall: React.FC<RequestWaterfallProps> = ({
  journey,
  title = 'Request Timing Waterfall',
}) => {
  const [selectedPhase, setSelectedPhase] = useState<JourneyPhase | null>(null)

  // Compute maximum time for scale
  // Note: DNS is measured independently, HTTP is measured independently.
  // The scale max is max(total_duration_ms, dns duration, http duration, 1.0)
  const dnsPhase = journey.phases.find((p) => p.name === 'dns')
  const httpPhase = journey.phases.find((p) => p.name === 'http')
  const dnsDuration = dnsPhase?.duration_ms ?? 0
  const httpDuration = httpPhase?.duration_ms ?? (journey.total_duration_ms ?? 0)

  // Maximum timeline value for proportional scaling
  const maxTimeMs = Math.max(
    journey.total_duration_ms ?? 0,
    dnsDuration,
    httpDuration,
    10.0
  )

  // Ticks at 0%, 25%, 50%, 75%, 100%
  const ticks = [0, 0.25, 0.5, 0.75, 1.0].map((fraction) => ({
    fraction,
    ms: fraction * maxTimeMs,
  }))

  const getPhaseMeta = (phase: JourneyPhase) => {
    switch (phase.name) {
      case 'dns':
        return {
          title: 'DNS Resolution',
          color: 'bg-emerald-500 dark:bg-emerald-400',
          borderColor: 'border-emerald-600',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          isMeasured: phase.status === 'completed' && phase.duration_ms !== null,
        }
      case 'connection':
        return {
          title: 'TCP Connection',
          color: 'bg-slate-400 dark:bg-slate-600',
          borderColor: 'border-slate-500',
          textColor: 'text-slate-500 dark:text-slate-400',
          isMeasured: false,
        }
      case 'tls':
        return {
          title: 'TLS Handshake',
          color: 'bg-purple-400 dark:bg-purple-600',
          borderColor: 'border-purple-500',
          textColor: 'text-purple-600 dark:text-purple-400',
          isMeasured: false,
        }
      case 'http':
        return {
          title: 'HTTP Execution',
          color: 'bg-amber-500 dark:bg-amber-400',
          borderColor: 'border-amber-600',
          textColor: 'text-amber-600 dark:text-amber-400',
          isMeasured: phase.status === 'completed' && phase.duration_ms !== null,
        }
      case 'response':
        return {
          title: 'Response Ready',
          color: 'bg-blue-500 dark:bg-blue-400',
          borderColor: 'border-blue-600',
          textColor: 'text-blue-600 dark:text-blue-400',
          isMeasured: false,
        }
      default:
        return {
          title: phase.name.toUpperCase(),
          color: 'bg-slate-500',
          borderColor: 'border-slate-600',
          textColor: 'text-slate-400',
          isMeasured: phase.duration_ms !== null,
        }
    }
  }

  return (
    <div className="border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] rounded-lg shadow-xs p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#222736]">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white uppercase font-mono">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronized millisecond timeline of verified network telemetry
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Measured</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 border border-dashed border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800 inline-block" />
            <span className="text-slate-500 dark:text-slate-400">Unmeasured</span>
          </div>
        </div>
      </div>

      {/* Waterfall Timeline Scale Header */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider pb-1">
          <div className="col-span-4 sm:col-span-3">Phase</div>
          <div className="col-span-8 sm:col-span-9 relative">
            <div className="flex justify-between w-full">
              {ticks.map((tick, i) => (
                <span
                  key={i}
                  style={{ left: `${tick.fraction * 100}%` }}
                  className="translate-x-[-50%] first:translate-x-0 last:translate-x-[-100%]"
                >
                  {tick.ms.toFixed(0)} ms
                </span>
              ))}
            </div>
            {/* Grid line track */}
            <div className="w-full h-1 border-b border-slate-200 dark:border-[#222736] mt-1 relative" />
          </div>
        </div>

        {/* Phase Rows */}
        <div className="space-y-3 pt-1">
          {journey.phases.map((phase) => {
            const meta = getPhaseMeta(phase)
            const duration = phase.duration_ms
            const isSelected = selectedPhase?.name === phase.name

            // Proportional width calculation
            const widthPct =
              duration !== null && maxTimeMs > 0
                ? Math.max((duration / maxTimeMs) * 100, 1.5)
                : null

            const leftPct =
              phase.start_offset_ms !== null && phase.start_offset_ms !== undefined && maxTimeMs > 0
                ? Math.min((phase.start_offset_ms / maxTimeMs) * 100, 98)
                : 0

            return (
              <div
                key={phase.name}
                onClick={() => setSelectedPhase(isSelected ? null : phase)}
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded transition-colors cursor-pointer border ${
                  isSelected
                    ? 'border-orange-500/50 bg-orange-500/5 dark:bg-orange-500/10'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-[#1C202C]'
                }`}
              >
                {/* Phase Info (Left 3-4 cols) */}
                <div className="col-span-4 sm:col-span-3 flex items-center justify-between pr-2">
                  <div className="truncate">
                    <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {meta.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      {phase.status}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    {duration !== null ? (
                      <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {duration < 1000 ? `${duration.toFixed(1)}ms` : `${(duration / 1000).toFixed(2)}s`}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 italic">
                        {phase.status === 'not_applicable' ? 'n/a' : 'unmeasured'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Bar (Right 8-9 cols) */}
                <div className="col-span-8 sm:col-span-9 relative h-6 flex items-center bg-slate-50 dark:bg-[#10121A] rounded overflow-hidden border border-slate-100 dark:border-[#1E2230]">
                  {/* Background gridlines */}
                  {ticks.map((t, idx) => (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 w-px bg-slate-200/50 dark:bg-slate-700/30"
                      style={{ left: `${t.fraction * 100}%` }}
                    />
                  ))}

                  {/* Render Timing Bar if Measured */}
                  {meta.isMeasured && widthPct !== null ? (
                    <div
                      className={`absolute h-4 rounded-sm ${meta.color} transition-all duration-300 shadow-sm flex items-center justify-end px-1`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.min(widthPct, 100 - leftPct)}%`,
                        minWidth: '6px',
                      }}
                      title={`${meta.title}: ${duration?.toFixed(2)} ms`}
                    >
                      {widthPct > 12 && (
                        <span className="text-[9px] font-mono font-bold text-white drop-shadow-sm select-none">
                          {duration?.toFixed(0)}ms
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Render Hatched / Dash Indicator for Unmeasured */
                    <div
                      className="w-full h-3 mx-2 border border-dashed border-slate-300 dark:border-slate-700 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.1)_4px,rgba(148,163,184,0.1)_8px)] flex items-center justify-center"
                      title={
                        phase.status === 'not_applicable'
                          ? 'Not applicable for this protocol'
                          : 'Timing not isolated by transport engine'
                      }
                    >
                      <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 bg-slate-50 dark:bg-[#10121A]">
                        {phase.status === 'not_applicable' ? 'Not Applicable' : 'Unmeasured by Transport'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Phase Detail Drawer / Inspection */}
      {selectedPhase && (
        <div className="border border-orange-500/30 bg-orange-500/5 dark:bg-orange-500/10 p-4 space-y-3 rounded-none animate-fadeIn text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-orange-500/20">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 font-bold uppercase tracking-wider">
                Phase Details: {selectedPhase.name.toUpperCase()}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                ({selectedPhase.status})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPhase(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Duration</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                {selectedPhase.duration_ms !== null ? `${selectedPhase.duration_ms.toFixed(2)} ms` : 'Unmeasured'}
              </p>
            </div>
            <div className="p-2 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Telemetry Source</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                {selectedPhase.source || 'derived'}
              </p>
            </div>
            <div className="p-2 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922]">
              <span className="text-[9px] uppercase tracking-wider text-slate-400">Timing Boundary</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                {selectedPhase.start_offset_ms !== null && selectedPhase.start_offset_ms !== undefined
                  ? `${selectedPhase.start_offset_ms.toFixed(1)}ms → ${selectedPhase.end_offset_ms?.toFixed(1) ?? '?'}ms`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {selectedPhase.observations.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] uppercase text-slate-400">Observations:</span>
              <ul className="space-y-1 pl-3">
                {selectedPhase.observations.map((obs, i) => (
                  <li key={i} className="text-slate-600 dark:text-slate-300 list-disc">
                    {obs}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedPhase.details && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] uppercase text-slate-400">Diagnostic Details:</span>
              <pre className="p-2 bg-slate-900 text-slate-200 text-[11px] rounded overflow-x-auto">
                {JSON.stringify(selectedPhase.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Timing Model Callout (Technical Honesty) */}
      <div className="p-4 border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
            Truthful Telemetry Model
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            TRACE measures DNS resolution independently via its DNS inspector, and HTTP execution duration via the client roundtrip socket timer. TCP connection and TLS handshake timings are not isolated by the low-level HTTP transport and are intentionally reported as unmeasured rather than synthetically estimated.
          </p>
        </div>
      </div>
    </div>
  )
}
