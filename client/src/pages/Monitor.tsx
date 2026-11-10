import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Activity, Plus } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { SkeletonPanel, SkeletonTable } from '../components/feedback/Skeleton'
import { Button } from '../components/ui/Button'
import { MonitorSummaryCards } from '../components/monitor/MonitorSummaryCards'
import { MonitorTable } from '../components/monitor/MonitorTable'
import { CreateMonitorModal } from '../components/monitor/CreateMonitorModal'
import { DeleteMonitorModal } from '../components/monitor/DeleteMonitorModal'
import { MonitorDetailDrawer } from '../components/monitor/MonitorDetailDrawer'
import {
  fetchMonitors,
  createMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  runMonitorNow,
} from '../lib/api'
import type { MonitorListItem, MonitorCreatePayload } from '../types/api'

export const Monitor: React.FC = () => {
  const queryClient = useQueryClient()

  // Selection & Modal States
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // 1. Fetch monitor fleet with 30s polling
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['monitors'],
    queryFn: fetchMonitors,
    refetchInterval: 30000,
  })

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: (payload: MonitorCreatePayload) => createMonitor(payload),
    onSuccess: (newMonitor) => {
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      setIsCreateModalOpen(false)
      setCreateError(null)
      // Open detail drawer for newly created monitor
      setSelectedId(newMonitor.id)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to register monitor.'
      setCreateError(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMonitor(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      setDeleteTarget(null)
      if (selectedId === deleteTarget?.id) {
        setSelectedId(null)
      }
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (id: string) => pauseMonitor(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      void queryClient.invalidateQueries({ queryKey: ['monitor', id] })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (id: string) => resumeMonitor(id),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      void queryClient.invalidateQueries({ queryKey: ['monitor', id] })
    },
  })

  const runNowMutation = useMutation({
    mutationFn: (id: string) => runMonitorNow(id),
    onMutate: (id) => {
      setRunningId(id)
    },
    onSettled: (_, __, id) => {
      setRunningId(null)
      void queryClient.invalidateQueries({ queryKey: ['monitors'] })
      void queryClient.invalidateQueries({ queryKey: ['monitor', id] })
      void queryClient.invalidateQueries({ queryKey: ['monitor_analytics', id] })
      void queryClient.invalidateQueries({ queryKey: ['monitor_results', id] })
    },
  })

  const monitors = data?.items ?? []
  const total = data?.total ?? 0
  const totalUp = data?.total_up ?? 0
  const totalDown = data?.total_down ?? 0
  const avgLatency = data?.avg_response_time_ms ?? null

  const handleTogglePause = (m: MonitorListItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (m.enabled) {
      pauseMutation.mutate(m.id)
    } else {
      resumeMutation.mutate(m.id)
    }
  }

  const handleRunNow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    runNowMutation.mutate(id)
  }

  const handleDeletePrompt = (m: MonitorListItem | { id: string; name: string }, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDeleteTarget({ id: m.id, name: m.name })
  }

  return (
    <PageContainer
      title="Endpoint Monitoring"
      description="Automated uptime tracking, continuous health checks, and latency telemetry."
      icon={<Activity className="w-4.5 h-4.5" />}
    >
      <div className="space-y-6 mt-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-[#6B6B6B]">
            Automated recurring health checks independently scheduled in the background.
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setCreateError(null)
              setIsCreateModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="text-xs shrink-0"
          >
            Create Monitor
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SkeletonPanel rows={2} />
              <SkeletonPanel rows={2} />
              <SkeletonPanel rows={2} />
              <SkeletonPanel rows={2} />
            </div>
            <SkeletonTable rows={6} cols={7} />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <ErrorState
            title="FAILED TO LOAD MONITORS"
            message={
              error instanceof Error
                ? error.message
                : 'Unable to reach the TRACE monitoring service.'
            }
            onRetry={() => {
              void refetch()
            }}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && monitors.length === 0 && (
          <EmptyState
            icon={<Activity className="w-8 h-8" />}
            title="No monitoring targets configured"
            description="Register your first API endpoint to begin automated uptime tracking and response-time analytics."
            action={{
              label: 'Create First Monitor',
              onClick: () => {
                setCreateError(null)
                setIsCreateModalOpen(true)
              },
            }}
            className="mt-8"
          />
        )}

        {/* Populated Fleet View */}
        {!isLoading && !isError && monitors.length > 0 && (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <MonitorSummaryCards
              total={total}
              totalUp={totalUp}
              totalDown={totalDown}
              avgResponseTimeMs={avgLatency}
            />

            {/* Monitors Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#666666] px-1">
                <span>Configured Targets ({monitors.length})</span>
                <span>Auto-refreshing every 30s</span>
              </div>
              <MonitorTable
                monitors={monitors}
                selectedId={selectedId}
                onSelect={(m) => setSelectedId(m.id)}
                onRunNow={handleRunNow}
                onTogglePause={handleTogglePause}
                onDelete={handleDeletePrompt}
                runningId={runningId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Create Monitor Modal */}
      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        isLoading={createMutation.isPending}
        error={createError}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteMonitorModal
        isOpen={Boolean(deleteTarget)}
        isLoading={deleteMutation.isPending}
        monitorName={deleteTarget?.name || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id)
          }
        }}
      />

      {/* Detail & Analytics Drawer */}
      <MonitorDetailDrawer
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onRunNow={(id) => handleRunNow(id)}
        onTogglePause={(id, currentEnabled) => {
          if (currentEnabled) {
            pauseMutation.mutate(id)
          } else {
            resumeMutation.mutate(id)
          }
        }}
        onDelete={(id, name) => handleDeletePrompt({ id, name })}
        isRunning={runningId === selectedId}
      />
    </PageContainer>
  )
}
