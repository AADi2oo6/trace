import React from 'react'
import { Activity, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'

interface MonitorSummaryCardsProps {
  total: number
  totalUp: number
  totalDown: number
  avgResponseTimeMs: number | null
}

export const MonitorSummaryCards: React.FC<MonitorSummaryCardsProps> = ({
  total,
  totalUp,
  totalDown,
  avgResponseTimeMs,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total Monitors */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Total Monitors</span>
          <Activity className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-[var(--text-primary)]">{total}</div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">Configured targets</div>
      </div>

      {/* Up / Healthy */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Operational</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-emerald-500">{totalUp}</div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">Passing health checks</div>
      </div>

      {/* Down / Degraded */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Degraded / Down</span>
          <AlertTriangle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-rose-500">{totalDown}</div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">Failing health checks</div>
      </div>

      {/* Average Response Time */}
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Avg Latency</span>
          <Clock className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-2xl font-mono font-bold text-blue-500">
          {avgResponseTimeMs !== null ? `${Math.round(avgResponseTimeMs)} ms` : '—'}
        </div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1">Across operational targets</div>
      </div>
    </div>
  )
}
