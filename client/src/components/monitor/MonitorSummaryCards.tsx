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
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider">Total Monitors</span>
          <Activity className="w-4 h-4 text-[#888888]" />
        </div>
        <div className="text-2xl font-mono font-bold text-[#E8E8E8]">{total}</div>
        <div className="text-[11px] text-[#555555] font-mono mt-1">Configured targets</div>
      </div>

      {/* Up / Healthy */}
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider">Operational</span>
          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
        </div>
        <div className="text-2xl font-mono font-bold text-[#22C55E]">{totalUp}</div>
        <div className="text-[11px] text-[#555555] font-mono mt-1">Passing health checks</div>
      </div>

      {/* Down / Degraded */}
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider">Degraded / Down</span>
          <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
        </div>
        <div className="text-2xl font-mono font-bold text-[#EF4444]">{totalDown}</div>
        <div className="text-[11px] text-[#555555] font-mono mt-1">Failing health checks</div>
      </div>

      {/* Average Response Time */}
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[#6B6B6B] mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider">Avg Latency</span>
          <Clock className="w-4 h-4 text-[#FF6A00]" />
        </div>
        <div className="text-2xl font-mono font-bold text-[#FF6A00]">
          {avgResponseTimeMs !== null ? `${Math.round(avgResponseTimeMs)} ms` : '—'}
        </div>
        <div className="text-[11px] text-[#555555] font-mono mt-1">Across operational targets</div>
      </div>
    </div>
  )
}
