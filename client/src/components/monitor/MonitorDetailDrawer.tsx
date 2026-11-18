import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  RotateCw,
  Trash2,
  Pause,
  Play,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { fetchMonitor, fetchMonitorAnalytics, fetchMonitorResults } from '../../lib/api'
import { Button } from '../ui/Button'
import { SkeletonPanel, SkeletonTable } from '../feedback/Skeleton'
import { ResponseTimeChart } from './ResponseTimeChart'
import { AvailabilityTimeline } from './AvailabilityTimeline'
import type { MonitorStatus } from '../../types/api'

interface MonitorDetailDrawerProps {
  id: string | null
  onClose: () => void
  onRunNow: (id: string) => void
  onTogglePause: (id: string, currentEnabled: boolean) => void
  onDelete: (id: string, name: string) => void
  isRunning?: boolean
}

type PeriodType = '1h' | '24h' | '7d' | '30d'

const PERIOD_LABELS: Record<PeriodType, string> = {
  '1h': 'Last 1 Hour',
  '24h': 'Last 24 Hours',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
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
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />,
  },
  DOWN: {
    label: 'DEGRADED',
    text: 'text-[#EF4444]',
    bg: 'bg-[#EF444410]',
    border: 'border-[#EF444430]',
    icon: <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />,
  },
  PAUSED: {
    label: 'PAUSED',
    text: 'text-[#6B6B6B]',
    bg: 'bg-[#6B6B6B10]',
    border: 'border-[#6B6B6B30]',
    icon: <Pause className="w-3.5 h-3.5 text-[#6B6B6B]" />,
  },
  UNKNOWN: {
    label: 'UNTESTED',
    text: 'text-[#F59E0B]',
    bg: 'bg-[#F59E0B10]',
    border: 'border-[#F59E0B30]',
    icon: <HelpCircle className="w-3.5 h-3.5 text-[#F59E0B]" />,
  },
}

export const MonitorDetailDrawer: React.FC<MonitorDetailDrawerProps> = ({
  id,
  onClose,
  onRunNow,
  onTogglePause,
  onDelete,
  isRunning = false,
}) => {
  const [period, setPeriod] = useState<PeriodType>('24h')
  const [copiedUrl, setCopiedUrl] = useState(false)

  // 1. Fetch monitor details
  const { data: monitor, isLoading: isMonitorLoading } = useQuery({
    queryKey: ['monitor', id],
    queryFn: () => fetchMonitor(id!),
    enabled: Boolean(id),
    refetchInterval: 30000,
  })

  // 2. Fetch analytics for chosen period
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['monitor_analytics', id, period],
    queryFn: () => fetchMonitorAnalytics(id!, period),
    enabled: Boolean(id),
    refetchInterval: 30000,
  })

  // 3. Fetch recent historical check results
  const { data: resultsData, isLoading: isResultsLoading } = useQuery({
    queryKey: ['monitor_results', id],
    queryFn: () => fetchMonitorResults(id!, 25, 0),
    enabled: Boolean(id),
    refetchInterval: 30000,
  })

  // Keyboard navigation: Escape key closes drawer
  useEffect(() => {
    if (!id) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [id, onClose])

  if (!id) return null

  const handleCopyUrl = async (targetUrl: string) => {
    try {
      await navigator.clipboard.writeText(targetUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // clipboard inaccessible
    }
  }

  const statusCfg = monitor ? statusConfig[monitor.status] : null

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="monitor-drawer-title"
    >
      <div
        className="w-full max-w-4xl h-full bg-[var(--bg-surface)] border-l border-[var(--border-default)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {monitor && (
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold tracking-wider border rounded-xs ${
                    monitor.method === 'GET'
                      ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                      : 'text-[var(--text-muted)] border-[var(--border-default)] bg-[var(--bg-input)]'
                  }`}
                >
                  {monitor.method}
                </span>
              )}

              {statusCfg && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono border rounded-md font-semibold ${statusCfg.text} ${statusCfg.bg} ${statusCfg.border}`}
                >
                  {statusCfg.icon}
                  <span>{statusCfg.label}</span>
                </span>
              )}

              <h2 id="monitor-drawer-title" className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {monitor?.name || 'Monitor Details'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-sm"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* URL bar & Action Buttons */}
          {monitor && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 min-w-0 flex-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md px-3 py-1.5">
                <span className="text-xs font-mono text-[var(--text-primary)] truncate select-all">
                  {monitor.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(monitor.url)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 shrink-0 ml-auto rounded-sm"
                  title="Copy URL"
                  aria-label="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Run Now */}
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onRunNow(monitor.id)}
                  loading={isRunning}
                  leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Run Now
                </Button>

                {/* Pause / Resume */}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onTogglePause(monitor.id, monitor.enabled)}
                  leftIcon={
                    monitor.enabled ? (
                      <Pause className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-500" />
                    )
                  }
                  className="text-xs"
                >
                  {monitor.enabled ? 'Pause' : 'Resume'}
                </Button>

                {/* Delete */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(monitor.id, monitor.name)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  className="text-xs text-rose-500 hover:bg-rose-500/10"
                  title="Delete monitor"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-panel)] px-6 py-2.5">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-2 font-semibold">
              Time Range:
            </span>
            {(['1h', '24h', '7d', '30d'] as PeriodType[]).map((p) => {
              const isActive = period === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-mono tracking-wider transition-colors border rounded-md ${
                    isActive
                      ? 'border-blue-500 text-blue-500 bg-blue-500/10 font-bold'
                      : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-input)]'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            {PERIOD_LABELS[period]}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading Skeleton */}
          {isMonitorLoading && (
            <div className="space-y-4">
              <SkeletonPanel rows={3} />
              <SkeletonTable rows={4} cols={4} />
            </div>
          )}

          {monitor && (
            <>
              {/* Analytics Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Uptime */}
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] p-3.5 shadow-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 font-semibold">
                    Uptime
                  </div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                    {analytics?.uptime_percentage !== null && analytics?.uptime_percentage !== undefined ? (
                      <span className={analytics.uptime_percentage >= 99 ? 'text-emerald-500' : analytics.uptime_percentage >= 95 ? 'text-amber-500' : 'text-rose-500'}>
                        {analytics.uptime_percentage.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)]">No checks</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                    {analytics?.successful_checks ?? 0} of {analytics?.total_checks ?? 0} successful
                  </div>
                </div>

                {/* Avg Latency */}
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] p-3.5 shadow-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 font-semibold">
                    Avg Latency
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-500">
                    {analytics?.average_duration_ms !== null && analytics?.average_duration_ms !== undefined ? (
                      `${Math.round(analytics.average_duration_ms)} ms`
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Mean duration</div>
                </div>

                {/* Latency Min / Max */}
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] p-3.5 shadow-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 font-semibold">
                    Latency Range
                  </div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                    {analytics?.minimum_duration_ms !== null && analytics?.minimum_duration_ms !== undefined ? (
                      `${Math.round(analytics.minimum_duration_ms)} - ${Math.round(analytics.maximum_duration_ms ?? 0)} ms`
                    ) : (
                      '—'
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Min to Max</div>
                </div>

                {/* Outages / Consecutive Failures */}
                <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-panel)] p-3.5 shadow-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1 font-semibold">
                    Outages / Failures
                  </div>
                  <div className="text-xl font-mono font-bold text-rose-500">
                    {analytics?.failed_checks ?? 0}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] font-mono mt-1">
                    {monitor.consecutive_failures > 0 ? `${monitor.consecutive_failures} consecutive` : '0 consecutive'}
                  </div>
                </div>
              </div>

              {/* Availability Timeline */}
              {analytics && (
                <AvailabilityTimeline
                  data={analytics.history_points}
                  uptimePercentage={analytics.uptime_percentage}
                />
              )}

              {/* Performance Response Time Chart */}
              {isAnalyticsLoading ? (
                <SkeletonPanel rows={4} />
              ) : (
                analytics && <ResponseTimeChart data={analytics.history_points} />
              )}

              {/* Historical Check Results Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
                  <span className="uppercase tracking-wider font-semibold">Recent Health Checks</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-medium">
                    {resultsData?.total ?? 0} total checks
                  </span>
                </div>

                {isResultsLoading ? (
                  <SkeletonTable rows={5} cols={5} />
                ) : resultsData && resultsData.items.length > 0 ? (
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)] text-[10px] tracking-wider text-[var(--text-muted)] uppercase font-semibold">
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Verdict</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Duration</th>
                          <th className="py-2.5 px-3">Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-muted)]">
                        {resultsData.items.map((res) => {
                          const d = new Date(res.checked_at)
                          const timeStr = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour12: false })}`

                          return (
                            <tr key={res.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                              <td className="py-2 px-3 text-[var(--text-muted)] whitespace-nowrap text-[11px]">
                                {timeStr}
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 border rounded-xs ${
                                    res.success
                                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
                                      : 'text-rose-500 bg-rose-500/10 border-rose-500/30'
                                  }`}
                                >
                                  {res.success ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td className="py-2 px-3 whitespace-nowrap">
                                {res.status_code ? (
                                  <span className={res.status_code < 400 ? 'text-emerald-500 font-semibold' : 'text-rose-500 font-semibold'}>
                                    HTTP {res.status_code}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 font-semibold">NO_RESPONSE</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right text-blue-500 font-bold whitespace-nowrap">
                                {res.duration_ms !== null ? `${Math.round(res.duration_ms)} ms` : '—'}
                              </td>
                              <td className="py-2 px-3 text-[var(--text-secondary)] truncate max-w-xs text-[11px]">
                                {res.error_message || (res.success ? 'Healthy' : res.error_code || '—')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center text-xs font-mono text-[var(--text-muted)]">
                    No historical checks recorded yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
