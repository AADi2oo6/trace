import React from 'react'
import type { RequestJourney } from '../../types/api'
import { CheckCircle2, XCircle, HelpCircle, MinusCircle, Clock } from 'lucide-react'

interface JourneySummaryProps {
  journey: RequestJourney
  totalDurationMs: number | null
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export const JourneySummary: React.FC<JourneySummaryProps> = ({
  journey,
  totalDurationMs,
}) => {
  const completedCount = journey.phases.filter((p) => p.status === 'completed').length
  const unavailableCount = journey.phases.filter((p) => p.status === 'unavailable').length
  const notApplicableCount = journey.phases.filter((p) => p.status === 'not_applicable').length
  const failedCount = journey.phases.filter((p) => p.status === 'failed').length

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Title */}
      <div className="px-5 py-3.5 bg-[#0D0D0D] flex items-center justify-between">
        <h3 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
          Request Journey Summary
        </h3>
        <span className="text-[10px] font-mono text-[#555555]">
          AUTHORITATIVE METRICS
        </span>
      </div>

      {/* Counts Grid */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#080808]">
        {/* Total Duration */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#555555]">
            <Clock className="w-3 h-3 text-[#FF6A00]" />
            <span>Total Duration</span>
          </div>
          <p className="text-sm font-mono font-bold text-[#E8E8E8]">
            {formatMs(totalDurationMs)}
          </p>
        </div>

        {/* Completed */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#555555]">
            <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />
            <span>Completed</span>
          </div>
          <p className="text-sm font-mono font-bold text-[#22C55E]">
            {completedCount}
          </p>
        </div>

        {/* Unavailable */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#555555]">
            <HelpCircle className="w-3 h-3 text-[#777777]" />
            <span>Unavailable</span>
          </div>
          <p className="text-sm font-mono font-bold text-[#888888]">
            {unavailableCount}
          </p>
        </div>

        {/* Not Applicable */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#555555]">
            <MinusCircle className="w-3 h-3 text-[#555555]" />
            <span>Not Applicable</span>
          </div>
          <p className="text-sm font-mono font-bold text-[#555555]">
            {notApplicableCount}
          </p>
        </div>

        {/* Failed */}
        <div className="border border-[#1A1A1A] bg-[#0A0A0A] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-[#555555]">
            <XCircle className="w-3 h-3 text-[#EF4444]" />
            <span>Failed</span>
          </div>
          <p className="text-sm font-mono font-bold text-[#EF4444]">
            {failedCount}
          </p>
        </div>
      </div>

      {/* Observations Box if journey has overall observations */}
      {journey.observations.length > 0 && (
        <div className="p-5 space-y-2 bg-[#0A0A0A]">
          <p className="text-[9px] font-mono tracking-widest text-[#555555] uppercase">
            Overall Lifecycle Observations
          </p>
          <ul className="space-y-1 text-xs font-mono text-[#888888]">
            {journey.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[#FF6A00] select-none font-bold">•</span>
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
