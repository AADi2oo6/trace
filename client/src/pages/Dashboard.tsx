import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Compass,
  Terminal,
  Network,
  Route,
  GitCompare,
  Clock,
  Activity,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Zap,
  Radio,
  FileCode,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { fetchHistory, fetchMonitors } from '../lib/api'
import type { MonitorListItem } from '../types/api'
import { Button } from '../components/ui/Button'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  // Fetch real history items
  const { data: historyData } = useQuery({
    queryKey: ['dashboard-history'],
    queryFn: () => fetchHistory(20, 0),
  })

  // Fetch real monitors
  const { data: monitorData } = useQuery({
    queryKey: ['dashboard-monitors'],
    queryFn: () => fetchMonitors(),
  })

  const historyItems = useMemo(() => historyData?.items ?? [], [historyData?.items])
  const monitors = useMemo(() => monitorData?.items ?? [], [monitorData?.items])

  // Real aggregate statistics calculation
  const stats = useMemo(() => {
    const totalRequests = historyData?.total ?? historyItems.length
    const successfulRequests = historyItems.filter(
      (h) => h.status_code !== null && h.status_code >= 200 && h.status_code < 400
    ).length
    const failedRequests = historyItems.filter(
      (h) => h.status_code === null || h.status_code >= 400
    ).length

    const measuredItems = historyItems.filter((h) => h.duration_ms !== null && h.duration_ms !== undefined)
    const avgDurationMs =
      measuredItems.length > 0
        ? measuredItems.reduce((acc, h) => acc + (h.duration_ms || 0), 0) / measuredItems.length
        : null

    const activeMonitors = monitors.filter((m: MonitorListItem) => m.enabled).length

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgDurationMs,
      activeMonitors,
      hasData: historyItems.length > 0,
    }
  }, [historyData, historyItems, monitors])

  // Latency chart data from recent requests (oldest to newest for chronological flow)
  const chartData = useMemo(() => {
    return [...historyItems]
      .reverse()
      .filter((h) => h.duration_ms !== null && h.duration_ms !== undefined)
      .slice(-15)
      .map((h, idx) => ({
        index: idx + 1,
        time: new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        latency: Math.round(h.duration_ms || 0),
        method: h.method,
        status: h.status_code || 0,
      }))
  }, [historyItems])

  const quickActions = [
    {
      title: 'API Tester',
      desc: 'Craft and send requests with full diagnostic inspection',
      icon: <Terminal className="w-4 h-4 text-blue-500" />,
      to: '/tester',
      accent: 'border-blue-500/30 hover:border-blue-500/60',
    },
    {
      title: 'Content Explorer',
      desc: 'Inspect URLs, preview rich media, and export files',
      icon: <Compass className="w-4 h-4 text-purple-500" />,
      to: '/explorer',
      accent: 'border-purple-500/30 hover:border-purple-500/60',
    },
    {
      title: 'Network Analysis',
      desc: 'Inspect DNS resolution, CORS rules & OPTIONS headers',
      icon: <Network className="w-4 h-4 text-cyan-500" />,
      to: '/analysis',
      accent: 'border-cyan-500/30 hover:border-cyan-500/60',
    },
    {
      title: 'Request Journey',
      desc: 'Observe the synchronized timing waterfall and stages',
      icon: <Route className="w-4 h-4 text-emerald-500" />,
      to: '/journey',
      accent: 'border-emerald-500/30 hover:border-emerald-500/60',
    },
    {
      title: 'Response Diff',
      desc: 'Side-by-side behavioral, header & JSON diff analyzer',
      icon: <GitCompare className="w-4 h-4 text-orange-500" />,
      to: '/compare',
      accent: 'border-orange-500/30 hover:border-orange-500/60',
    },
    {
      title: 'Endpoint Monitors',
      desc: 'Automated recurring health checks and uptime tracking',
      icon: <Activity className="w-4 h-4 text-rose-500" />,
      to: '/monitor',
      accent: 'border-rose-500/30 hover:border-rose-500/60',
    },
  ]

  return (
    <div className="h-full overflow-y-auto font-mono select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="relative p-6 sm:p-8 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
                <span className="text-[10px] tracking-widest text-blue-500 font-bold uppercase">
                  Network Intelligence Engine Active
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                Observe the Full Network Journey of Every API Request
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans leading-relaxed max-w-xl">
                TRACE connects API testing with low-level network telemetry. Inspect DNS resolution, HTTP exchange timing, CORS headers, and side-by-side diffs in a unified platform.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/tester')}
                leftIcon={<Terminal className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
              >
                Launch API Tester
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/explorer')}
                leftIcon={<Compass className="w-4 h-4" />}
                className="text-xs"
              >
                Open Explorer
              </Button>
            </div>
          </div>
        </div>

        {/* Real Overview Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Requests */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span className="uppercase tracking-wider font-semibold">Total Requests</span>
              <FileCode className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.totalRequests}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">persisted</span>
            </div>
          </div>

          {/* Success Rate */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span className="uppercase tracking-wider font-semibold">Success / Failed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-500">
                {stats.successfulRequests}
              </span>
              <span className="text-xs text-[var(--text-dim)]">/</span>
              <span className="text-lg font-bold text-rose-500">
                {stats.failedRequests}
              </span>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span className="uppercase tracking-wider font-semibold">Avg Latency</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.avgDurationMs !== null ? `${Math.round(stats.avgDurationMs)}` : '—'}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">ms</span>
            </div>
          </div>

          {/* Active Monitors */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-dim)]">
              <span className="uppercase tracking-wider font-semibold">Monitors</span>
              <Radio className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.activeMonitors}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">active health checks</span>
            </div>
          </div>
        </div>

        {/* Real Latency Chart & Recent Executions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart Panel (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <h2 className="text-xs uppercase font-bold tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Recent Execution Latency (ms)
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-sans">
                  Real measured round-trip times from recent requests
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-dim)] px-2 py-0.5 bg-[var(--bg-panel-secondary)] border border-[var(--border-default)] rounded">
                Live Telemetry
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: 'var(--chart-text)', fontSize: 10 }}
                      axisLine={{ stroke: 'var(--border-default)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--chart-text)', fontSize: 10 }}
                      axisLine={{ stroke: 'var(--border-default)' }}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="p-2 bg-[var(--tooltip-bg)] border border-[var(--tooltip-border)] rounded text-xs shadow-md">
                              <p className="font-bold text-blue-500">{data.method} • {data.status}</p>
                              <p className="text-[var(--text-primary)]">{data.latency} ms</p>
                              <p className="text-[10px] text-[var(--text-dim)]">{data.time}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="latency"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#latencyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <Zap className="w-8 h-8 text-[var(--text-dim)]" />
                <p className="text-xs text-[var(--text-muted)] max-w-sm font-sans">
                  No request executions measured yet. Send a request from the API Tester to visualize real network latency.
                </p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/tester')}>
                  Execute First Request
                </Button>
              </div>
            )}
          </div>

          {/* Recent Activity Panel (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)]">
              <div>
                <h2 className="text-xs uppercase font-bold tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  Recent Executions
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-sans">
                  Latest recorded requests from history
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="text-[11px] text-blue-500 hover:text-blue-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-60">
              {historyItems.length > 0 ? (
                historyItems.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/history')}
                    className="p-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-panel-secondary)] hover:bg-[var(--bg-panel-hover)] transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        {item.method}
                      </span>
                      <span className="text-[var(--text-primary)] truncate max-w-[140px]" title={item.url}>
                        {item.url.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      <span
                        className={`font-semibold ${
                          item.status_code && item.status_code < 400
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}
                      >
                        {item.status_code || 'ERR'}
                      </span>
                      <span className="text-[var(--text-dim)]">
                        {item.duration_ms ? `${Math.round(item.duration_ms)}ms` : '—'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <p className="text-xs text-[var(--text-muted)] font-sans">
                    History log is empty.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Launchpad Grid */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase font-bold tracking-wider text-[var(--text-dim)]">
            Explore Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <div
                key={action.title}
                onClick={() => navigate(action.to)}
                className={`p-4 rounded-lg border bg-[var(--bg-panel)] ${action.accent} hover:bg-[var(--bg-panel-hover)] transition-all cursor-pointer group flex items-start justify-between shadow-xs`}
              >
                <div className="space-y-1.5 pr-2">
                  <div className="flex items-center gap-2">
                    {action.icon}
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] font-sans leading-relaxed">
                    {action.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-x-0.5 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
