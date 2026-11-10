import React from 'react'
import {
  Play,
  Pause,
  RotateCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
} from 'lucide-react'
import type { MonitorListItem, MonitorStatus } from '../../types/api'

interface MonitorTableProps {
  monitors: MonitorListItem[]
  selectedId: string | null
  onSelect: (monitor: MonitorListItem) => void
  onRunNow: (id: string, e: React.MouseEvent) => void
  onTogglePause: (monitor: MonitorListItem, e: React.MouseEvent) => void
  onDelete: (monitor: MonitorListItem, e: React.MouseEvent) => void
  runningId: string | null
}

const statusConfig: Record<
  MonitorStatus,
  { label: string; text: string; bg: string; border: string; icon: React.ReactNode }
> = {
  UP: {
    label: 'OPERATIONAL',
    text: 'text-[#22C55E]',
    bg: 'bg-[#22C55E10]',
    border: 'border-[#22C55E30]',
    icon: <CheckCircle2 className="w-3 h-3 text-[#22C55E]" />,
  },
  DOWN: {
    label: 'DEGRADED',
    text: 'text-[#EF4444]',
    bg: 'bg-[#EF444410]',
    border: 'border-[#EF444430]',
    icon: <AlertCircle className="w-3 h-3 text-[#EF4444]" />,
  },
  PAUSED: {
    label: 'PAUSED',
    text: 'text-[#6B6B6B]',
    bg: 'bg-[#6B6B6B10]',
    border: 'border-[#6B6B6B30]',
    icon: <Pause className="w-3 h-3 text-[#6B6B6B]" />,
  },
  UNKNOWN: {
    label: 'UNTESTED',
    text: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B10]',
    border: 'border-[#F59E0B30]',
    icon: <HelpCircle className="w-3 h-3 text-[#F59E0B]" />,
  },
}

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

function formatTime(isoString: string | null): string {
  if (!isoString) return 'Never'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return isoString
  }
}

export const MonitorTable: React.FC<MonitorTableProps> = ({
  monitors,
  selectedId,
  onSelect,
  onRunNow,
  onTogglePause,
  onDelete,
  runningId,
}) => {
  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E1E1E] bg-[#0D0D0D] text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase select-none">
              <th className="py-2.5 px-4 font-medium w-36">Status</th>
              <th className="py-2.5 px-4 font-medium">Monitor Target</th>
              <th className="py-2.5 px-3 font-medium w-20 text-center">Interval</th>
              <th className="py-2.5 px-3 font-medium w-24 text-right">Latency</th>
              <th className="py-2.5 px-4 font-medium w-28">Last Check</th>
              <th className="py-2.5 px-4 font-medium w-28">Next Check</th>
              <th className="py-2.5 px-4 font-medium w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161616] font-mono text-xs">
            {monitors.map((m) => {
              const isSelected = selectedId === m.id
              const isRunning = runningId === m.id
              const statusCfg = statusConfig[m.status]

              return (
                <tr
                  key={m.id}
                  onClick={() => onSelect(m)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-[#E8E8E8]'
                      : 'hover:bg-[#121212] text-[#B0B0B0]'
                  }`}
                >
                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border ${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}
                    >
                      {statusCfg.icon}
                      <span>{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Name & Target URL */}
                  <td className="py-3 px-4 min-w-[200px] max-w-xs md:max-w-md">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 border ${
                          m.method === 'GET'
                            ? 'text-[#22C55E] border-[#22C55E30] bg-[#22C55E10]'
                            : 'text-[#6B6B6B] border-[#6B6B6B30] bg-[#6B6B6B10]'
                        }`}
                      >
                        {m.method}
                      </span>
                      <span className="font-semibold text-[#E8E8E8] group-hover:text-white truncate">
                        {m.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#555555] truncate font-mono mt-0.5" title={m.url}>
                      {m.url}
                    </div>
                  </td>

                  {/* Interval */}
                  <td className="py-3 px-3 text-center text-[#888888] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#121212] border border-[#222222] text-[10px]">
                      <Clock className="w-2.5 h-2.5 text-[#6B6B6B]" />
                      {formatInterval(m.interval_seconds)}
                    </span>
                  </td>

                  {/* Latency */}
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {m.last_duration_ms !== null ? (
                      <span className="text-[#FF6A00] font-bold">
                        {Math.round(m.last_duration_ms)} ms
                      </span>
                    ) : (
                      <span className="text-[#444444]">—</span>
                    )}
                  </td>

                  {/* Last Check */}
                  <td className="py-3 px-4 text-[#888888] text-[11px] whitespace-nowrap">
                    {formatTime(m.last_checked_at)}
                  </td>

                  {/* Next Check */}
                  <td className="py-3 px-4 text-[#888888] text-[11px] whitespace-nowrap">
                    {m.enabled ? formatTime(m.next_run_at) : <span className="text-[#555555]">Paused</span>}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Run Now */}
                      <button
                        type="button"
                        onClick={(e) => onRunNow(m.id, e)}
                        disabled={isRunning}
                        className="p-1.5 text-[#A0A0A0] hover:text-[#FF6A00] hover:bg-[#FF6A0010] border border-transparent hover:border-[#FF6A0030] transition-colors disabled:opacity-50"
                        title="Run check immediately"
                        aria-label={`Run check now for ${m.name}`}
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin text-[#FF6A00]' : ''}`} />
                      </button>

                      {/* Pause / Resume */}
                      <button
                        type="button"
                        onClick={(e) => onTogglePause(m, e)}
                        className={`p-1.5 border border-transparent transition-colors ${
                          m.enabled
                            ? 'text-[#A0A0A0] hover:text-[#F59E0B] hover:bg-[#F59E0B10] hover:border-[#F59E0B30]'
                            : 'text-[#22C55E] hover:bg-[#22C55E10] hover:border-[#22C55E30]'
                        }`}
                        title={m.enabled ? 'Pause checks' : 'Resume checks'}
                        aria-label={`${m.enabled ? 'Pause' : 'Resume'} ${m.name}`}
                      >
                        {m.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      {/* Inspect Detail */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(m)
                        }}
                        className="p-1.5 text-[#A0A0A0] hover:text-white hover:bg-[#222222] transition-colors"
                        title="View analytics & history"
                        aria-label={`Inspect ${m.name}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => onDelete(m, e)}
                        className="p-1.5 text-[#A0A0A0] hover:text-[#EF4444] hover:bg-[#EF444410] hover:border-[#EF444430] border border-transparent transition-colors"
                        title="Delete monitor"
                        aria-label={`Delete ${m.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
