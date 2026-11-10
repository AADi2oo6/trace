import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { AnalyticsDataPoint } from '../../types/api'

interface ResponseTimeChartProps {
  data: AnalyticsDataPoint[]
}

function formatTimeLabel(timestamp: string): string {
  try {
    const d = new Date(timestamp)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return timestamp
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: AnalyticsDataPoint }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const point = payload[0].payload
    const d = new Date(point.timestamp)
    return (
      <div className="border border-[#222222] bg-[#0E0E0E] p-2.5 shadow-xl font-mono text-xs space-y-1">
        <div className="text-[#6B6B6B] text-[10px]">
          {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour12: false })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#A0A0A0]">Duration:</span>
          <span className="text-[#FF6A00] font-bold">
            {point.duration_ms !== null ? `${Math.round(point.duration_ms)} ms` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#A0A0A0]">Status:</span>
          <span className={point.success ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
            {point.status_code ? `HTTP ${point.status_code}` : 'Failed'}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export const ResponseTimeChart: React.FC<ResponseTimeChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
        <p className="text-xs font-mono text-[#555555]">
          No check metrics recorded in this time range.
        </p>
      </div>
    )
  }

  // Map to chart-ready format
  const chartData = data.map((pt) => ({
    ...pt,
    timeLabel: formatTimeLabel(pt.timestamp),
    chartValue: pt.duration_ms ?? 0,
  }))

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-[#888888]">
        <span className="uppercase tracking-wider">Response Latency (ms)</span>
        <span className="text-[10px] text-[#555555]">{chartData.length} data points</span>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6A00" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#444444"
              tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#222222' }}
            />
            <YAxis
              stroke="#444444"
              tick={{ fill: '#666666', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#222222' }}
              unit="ms"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="chartValue"
              stroke="#FF6A00"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#latencyGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
