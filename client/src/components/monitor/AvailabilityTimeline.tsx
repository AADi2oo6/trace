import React from 'react'
import type { AnalyticsDataPoint } from '../../types/api'

interface AvailabilityTimelineProps {
  data: AnalyticsDataPoint[]
  uptimePercentage: number | null
}

export const AvailabilityTimeline: React.FC<AvailabilityTimelineProps> = ({
  data,
  uptimePercentage,
}) => {
  if (data.length === 0) {
    return null
  }

  // Take up to 60 most recent checks for the timeline visualization
  const recentPoints = data.slice(-60)

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="uppercase tracking-wider text-[#888888]">Availability Timeline</span>
        <span className="text-[#E8E8E8] font-bold">
          {uptimePercentage !== null ? `${uptimePercentage.toFixed(1)}% Uptime` : 'No checks'}
        </span>
      </div>

      {/* Blocks strip */}
      <div className="flex items-center gap-1 overflow-hidden py-1">
        {recentPoints.map((pt, i) => {
          const d = new Date(pt.timestamp)
          const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`
          const statusText = pt.success
            ? `HTTP ${pt.status_code ?? 200} (${Math.round(pt.duration_ms ?? 0)}ms)`
            : `Failed: ${pt.status_code ? `HTTP ${pt.status_code}` : 'Network error'}`

          return (
            <div
              key={i}
              className={`flex-1 min-w-[3px] h-7 rounded-[1px] transition-transform hover:scale-y-125 cursor-pointer ${
                pt.success
                  ? 'bg-[#22C55E] hover:bg-[#4ade80]'
                  : 'bg-[#EF4444] hover:bg-[#f87171]'
              }`}
              title={`${timeStr} — ${statusText}`}
            />
          )
        })}
      </div>

      {/* Legend and time boundaries */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#555555]">
        <span>Older</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>Success</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span>Outage</span>
          </div>
        </div>
        <span>Latest</span>
      </div>
    </div>
  )
}
