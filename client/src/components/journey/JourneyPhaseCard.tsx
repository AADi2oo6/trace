import React from 'react'
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
} from 'lucide-react'
import type { JourneyPhase, JourneyPhaseStatus } from '../../types/api'

interface JourneyPhaseCardProps {
  phase: JourneyPhase
  stepNumber: number
  isExpanded: boolean
  onToggle: () => void
  isLast: boolean
  animDelayMs?: number
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

const phaseNamesFormatted: Record<string, { title: string; subtitle: string }> = {
  dns: {
    title: 'DNS Resolution',
    subtitle: 'Resolves destination hostname to IPv4/IPv6 network addresses',
  },
  connection: {
    title: 'TCP Connection',
    subtitle: 'Establishes Layer 4 transport connection with target socket',
  },
  tls: {
    title: 'TLS Handshake',
    subtitle: 'Cryptographic negotiation and certificate validation for HTTPS',
  },
  http: {
    title: 'HTTP Exchange',
    subtitle: 'Transmits HTTP request headers and payload over the open channel',
  },
  response: {
    title: 'Response Ingestion',
    subtitle: 'Receives and validates status code, headers, and response body',
  },
}

interface StatusVisual {
  dotColor: string
  borderColor: string
  bgColor: string
  textColor: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  label: string
  icon: React.ReactNode
  description: string
}

const statusVisuals: Record<JourneyPhaseStatus, StatusVisual> = {
  completed: {
    dotColor: 'bg-[#22C55E]',
    borderColor: 'border-[#22C55E40]',
    bgColor: 'bg-[#22C55E08]',
    textColor: 'text-[#22C55E]',
    badgeBg: 'bg-[#22C55E15]',
    badgeText: 'text-[#22C55E]',
    badgeBorder: 'border-[#22C55E30]',
    label: 'COMPLETED',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    description: 'Phase completed successfully and measurements recorded.',
  },
  failed: {
    dotColor: 'bg-[#EF4444]',
    borderColor: 'border-[#EF444440]',
    bgColor: 'bg-[#EF444408]',
    textColor: 'text-[#EF4444]',
    badgeBg: 'bg-[#EF444415]',
    badgeText: 'text-[#EF4444]',
    badgeBorder: 'border-[#EF444430]',
    label: 'FAILED',
    icon: <XCircle className="w-3.5 h-3.5" />,
    description: 'Phase encountered an error and halted execution.',
  },
  unavailable: {
    dotColor: 'bg-[#555555]',
    borderColor: 'border-[#262626]',
    bgColor: 'bg-[#0D0D0D]',
    textColor: 'text-[#888888]',
    badgeBg: 'bg-[#181818]',
    badgeText: 'text-[#888888]',
    badgeBorder: 'border-[#2E2E2E]',
    label: 'UNAVAILABLE',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    description: 'Timing or telemetry not exposed by the execution layer.',
  },
  not_applicable: {
    dotColor: 'bg-[#333333]',
    borderColor: 'border-[#1E1E1E]',
    bgColor: 'bg-[#080808]',
    textColor: 'text-[#555555]',
    badgeBg: 'bg-[#141414]',
    badgeText: 'text-[#555555]',
    badgeBorder: 'border-[#222222]',
    label: 'NOT APPLICABLE',
    icon: <MinusCircle className="w-3.5 h-3.5" />,
    description: 'Phase does not apply to this request protocol (e.g. TLS on unencrypted HTTP).',
  },
}

export const JourneyPhaseCard: React.FC<JourneyPhaseCardProps> = ({
  phase,
  stepNumber,
  isExpanded,
  onToggle,
  isLast,
  animDelayMs = 0,
}) => {
  const visual = statusVisuals[phase.status] || statusVisuals.unavailable
  const meta = phaseNamesFormatted[phase.name] || {
    title: phase.name.toUpperCase(),
    subtitle: 'Diagnostic request phase',
  }

  return (
    <div
      className="flex gap-4 sm:gap-6 group"
      style={{
        animation: 'fadeIn 250ms ease-out both',
        animationDelay: `${animDelayMs}ms`,
      }}
    >
      {/* Timeline track (vertical line + indicator node) */}
      <div className="flex flex-col items-center shrink-0">
        {/* Node circle */}
        <div
          className={[
            'w-7 h-7 rounded border flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs',
            visual.dotColor === 'bg-[#22C55E]'
              ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-500'
              : visual.dotColor === 'bg-[#EF4444]'
                ? 'border-rose-500/50 bg-rose-500/15 text-rose-500'
                : 'border-[var(--border-default)] bg-[var(--bg-panel)] text-[var(--text-dim)]',
          ].join(' ')}
          aria-hidden="true"
        >
          {stepNumber}
        </div>

        {/* Vertical connector line */}
        {!isLast && (
          <div
            className={[
              'w-0.5 flex-1 my-1.5 transition-colors duration-200',
              phase.status === 'completed' ? 'bg-emerald-500/40' : 'bg-[var(--border-default)]',
            ].join(' ')}
            style={{ minHeight: 48 }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Main Phase Card */}
      <div
        className={[
          'flex-1 border rounded-lg transition-all duration-150 mb-4 shadow-xs overflow-hidden',
          visual.borderColor,
          isExpanded ? 'bg-[var(--bg-panel-secondary)]' : 'bg-[var(--bg-panel)]',
        ].join(' ')}
      >
        {/* Header row (clickable to expand) */}
        <div
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggle()
            }
          }}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-[var(--bg-panel-hover)] transition-colors"
        >
          {/* Phase Title + Subtitle */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] tracking-wider uppercase">
                {meta.title}
              </span>
              <span className="text-[10px] font-mono text-[var(--text-dim)]">
                PHASE 0{stepNumber}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {meta.subtitle}
            </p>
          </div>

          {/* Status + Duration + Expand Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Measured Duration (or N/A) */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-default)] bg-[var(--bg-panel)] rounded text-xs font-mono">
              <Clock className="w-3 h-3 text-[var(--text-dim)]" />
              {phase.duration_ms !== null ? (
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatMs(phase.duration_ms)}
                </span>
              ) : (
                <span className="text-[var(--text-dim)]">
                  {phase.status === 'not_applicable' ? 'N/A' : 'UNMEASURED'}
                </span>
              )}
            </div>

            {/* Status Badge */}
            <span
              className={[
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider border rounded',
                visual.badgeBg,
                visual.badgeText,
                visual.badgeBorder,
              ].join(' ')}
            >
              {visual.icon}
              {visual.label}
            </span>

            {/* Expand / Collapse Icon */}
            <span className="text-[var(--text-dim)] group-hover:text-[var(--text-primary)] transition-colors p-1">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          </div>
        </div>

        {/* Collapsed view quick observation snippet if present */}
        {!isExpanded && phase.observations.length > 0 && (
          <div className="px-4 pb-3 pt-0 border-t border-[var(--border-subtle)] mt-0 text-xs font-mono text-[var(--text-muted)] truncate">
            <span className="text-blue-500 mr-2">›</span>
            {phase.observations[0]}
          </div>
        )}

        {/* Expanded Technical Details Panel */}
        {isExpanded && (
          <div className="border-t border-[var(--border-default)] bg-[var(--bg-panel-secondary)] p-4 space-y-4 animate-fade-in text-xs font-mono">
            {/* Metadata Table */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-2.5 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                  Phase Status
                </span>
                <p className={['font-semibold', visual.textColor].join(' ')}>
                  {visual.label}
                </p>
              </div>

              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-2.5 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                  Measured Duration
                </span>
                <p className="text-[var(--text-primary)] font-semibold">
                  {phase.duration_ms !== null ? `${phase.duration_ms.toFixed(2)} ms` : 'Not Measured'}
                </p>
              </div>

              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-2.5 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                  Offset (Start → End)
                </span>
                <p className="text-[var(--text-primary)] font-semibold">
                  {phase.start_offset_ms !== null && phase.start_offset_ms !== undefined
                    ? `${phase.start_offset_ms.toFixed(1)}ms → ${phase.end_offset_ms?.toFixed(1) ?? '?'}ms`
                    : 'N/A'}
                </p>
              </div>

              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-2.5 space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                  Telemetry Source
                </span>
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Database className="w-3 h-3 text-[var(--text-dim)]" />
                  <span>{phase.source || 'unspecified'}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Details Dictionary */}
            {phase.details && Object.keys(phase.details).length > 0 && (
              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-3 space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)] font-semibold">
                  Phase Telemetry & Parameters
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(phase.details).map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between gap-2 p-1.5 bg-[var(--bg-panel-secondary)] border border-[var(--border-subtle)] rounded">
                      <span className="text-[var(--text-muted)] font-mono">{key}:</span>
                      <span className="text-[var(--text-primary)] font-mono text-right truncate max-w-[200px]" title={String(val)}>
                        {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase Explanation / Context */}
            <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-3 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                Technical Evaluation
              </span>
              <p className="text-[var(--text-muted)] leading-relaxed">
                {visual.description}
              </p>
            </div>

            {/* Observations List */}
            {phase.observations.length > 0 ? (
              <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded p-3 space-y-2">
                <span className="text-[9px] uppercase tracking-widest text-[var(--text-dim)]">
                  Phase Observations ({phase.observations.length})
                </span>
                <ul className="space-y-1.5" aria-label={`${meta.title} observations`}>
                  {phase.observations.map((obs, i) => (
                    <li key={i} className="text-[var(--text-secondary)] flex items-start gap-2 leading-relaxed">
                      <span className="text-blue-500 select-none shrink-0 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-[var(--text-dim)] text-[11px] italic">
                No observations recorded for this phase.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
