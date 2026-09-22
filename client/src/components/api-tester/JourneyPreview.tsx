import React from 'react'
import type { RequestJourney, JourneyPhaseStatus } from '../../types/api'

interface JourneyPreviewProps {
  journey: RequestJourney
}

function formatMs(ms: number | null): string {
  if (ms === null) return ''
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const phaseLabels: Record<string, string> = {
  dns: 'DNS Resolution',
  connection: 'TCP Connection',
  tls: 'TLS Handshake',
  http: 'HTTP Exchange',
  response: 'Response',
}

const statusConfig: Record<
  JourneyPhaseStatus,
  { dot: string; text: string; label: string; icon: string }
> = {
  completed: {
    dot: 'bg-[#22C55E] shadow-[0_0_6px_#22C55E60]',
    text: 'text-[#22C55E]',
    label: 'COMPLETED',
    icon: '✓',
  },
  failed: {
    dot: 'bg-[#EF4444] shadow-[0_0_6px_#EF444460]',
    text: 'text-[#EF4444]',
    label: 'FAILED',
    icon: '✗',
  },
  unavailable: {
    dot: 'bg-[#3A3A3A]',
    text: 'text-[#3A3A3A]',
    label: 'UNAVAILABLE',
    icon: '—',
  },
  not_applicable: {
    dot: 'bg-[#2A2A2A]',
    text: 'text-[#2A2A2A]',
    label: 'NOT APPLICABLE',
    icon: '—',
  },
}

export const JourneyPreview: React.FC<JourneyPreviewProps> = ({ journey }) => {
  return (
    <div className="p-5">
      {/* Journey header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span
            className={[
              'w-2 h-2 rounded-full',
              journey.completed ? 'bg-[#22C55E]' : 'bg-[#EF4444]',
            ].join(' ')}
            aria-hidden="true"
          />
          <span className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase">
            {journey.completed ? 'Journey complete' : 'Journey incomplete'}
          </span>
        </div>
        {journey.total_duration_ms !== null && (
          <span className="text-[10px] font-mono text-[#555555]">
            {formatMs(journey.total_duration_ms)} total
          </span>
        )}
      </div>

      {/* Phase list */}
      <div className="space-y-0" role="list" aria-label="Request journey phases">
        {journey.phases.map((phase, index) => {
          const cfg = statusConfig[phase.status]
          const isLast = index === journey.phases.length - 1
          const label = phaseLabels[phase.name] ?? phase.name

          return (
            <div key={phase.name} className="flex gap-4" role="listitem">
              {/* Timeline track */}
              <div className="flex flex-col items-center">
                {/* Dot */}
                <div
                  className={[
                    'w-2.5 h-2.5 rounded-full shrink-0 mt-0.5',
                    cfg.dot,
                  ].join(' ')}
                  aria-hidden="true"
                />
                {/* Connector line */}
                {!isLast && (
                  <div
                    className="w-px flex-1 mt-1 mb-0"
                    style={{
                      background:
                        phase.status === 'completed'
                          ? '#22C55E30'
                          : '#1E1E1E',
                      minHeight: 28,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Phase content */}
              <div className={['flex-1 pb-5', isLast ? 'pb-0' : ''].join(' ')}>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xs font-mono text-[#B0B0B0]">{label}</span>

                  {/* Duration for completed */}
                  {phase.status === 'completed' && phase.duration_ms !== null && (
                    <span className="text-xs font-mono font-semibold text-[#E8E8E8]">
                      {formatMs(phase.duration_ms)}
                    </span>
                  )}

                  {/* Status label with icon — always shown */}
                  <span
                    className={[
                      'text-[10px] font-mono tracking-wider',
                      cfg.text,
                    ].join(' ')}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>

                {/* All observations */}
                {phase.observations.length > 0 && (
                  <ul
                    className="mt-1 space-y-0.5"
                    aria-label={`${label} observations`}
                  >
                    {phase.observations.map((obs, i) => (
                      <li
                        key={i}
                        className="text-[10px] font-mono text-[#3A3A3A] leading-relaxed"
                      >
                        {obs}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Journey observations */}
      {journey.observations.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#1A1A1A]">
          {journey.observations.map((obs, i) => (
            <p key={i} className="text-[11px] font-mono text-[#3A3A3A] leading-relaxed">
              {obs}
            </p>
          ))}
        </div>
      )}

      {/* Phase summary table */}
      <div className="mt-5 pt-4 border-t border-[#1A1A1A]">
        <p className="text-[9px] font-mono tracking-widest text-[#2A2A2A] uppercase mb-3">
          Phase summary
        </p>
        <table className="w-full text-[10px] font-mono" aria-label="Journey phase summary">
          <thead>
            <tr className="border-b border-[#1A1A1A]">
              <th
                scope="col"
                className="text-left py-1.5 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal"
              >
                Phase
              </th>
              <th
                scope="col"
                className="text-left py-1.5 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-right py-1.5 text-[9px] tracking-widest text-[#2A2A2A] uppercase font-normal"
              >
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111111]">
            {journey.phases.map((phase) => {
              const cfg = statusConfig[phase.status]
              const label = phaseLabels[phase.name] ?? phase.name
              return (
                <tr key={phase.name} className="hover:bg-[#0D0D0D] transition-colors duration-75">
                  <td className="py-1.5 text-[#6B6B6B]">{label}</td>
                  <td className={['py-1.5', cfg.text].join(' ')}>
                    {cfg.icon} {cfg.label}
                  </td>
                  <td className="py-1.5 text-right text-[#555555]">
                    {phase.status === 'completed' && phase.duration_ms !== null
                      ? formatMs(phase.duration_ms)
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
