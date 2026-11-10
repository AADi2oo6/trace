import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, FilterX } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { SkeletonTable } from '../components/feedback/Skeleton'
import { Button } from '../components/ui/Button'
import { HistoryFilterBar, type StatusFilter, type SortOption } from '../components/history/HistoryFilterBar'
import { HistoryTable } from '../components/history/HistoryTable'
import { HistoryDetailDrawer } from '../components/history/HistoryDetailDrawer'
import { ClearHistoryModal } from '../components/history/ClearHistoryModal'
import { fetchHistory, deleteHistoryItem, clearAllHistory } from '../lib/api'
import type { HistoryListItem } from '../types/api'

export const History: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMethod, setSelectedMethod] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL')
  const [sortOption, setSortOption] = useState<SortOption>('newest')

  // Selection & Modal State
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Query: fetch history items
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['history'],
    queryFn: () => fetchHistory(200, 0),
  })

  // Mutation: delete single item
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHistoryItem(id),
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      if (selectedId === deletedId) {
        setSelectedId(null)
      }
    },
  })

  // Mutation: clear all history
  const clearAllMutation = useMutation({
    mutationFn: () => clearAllHistory(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] })
      setIsClearModalOpen(false)
      setSelectedId(null)
    },
  })

  const rawItems = useMemo(() => data?.items ?? [], [data?.items])
  const totalCount = data?.total ?? rawItems.length

  // Filter & Sort logic
  const filteredItems = useMemo(() => {
    let result = [...rawItems]

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((item) => {
        const urlMatch = item.url.toLowerCase().includes(q)
        const methodMatch = item.method.toLowerCase().includes(q)
        const statusMatch = item.status_code?.toString().includes(q) ?? false
        const statusTextMatch = item.status_text?.toLowerCase().includes(q) ?? false
        const errorMatch =
          item.error?.message.toLowerCase().includes(q) ||
          item.error?.code.toLowerCase().includes(q)
        return urlMatch || methodMatch || statusMatch || statusTextMatch || Boolean(errorMatch)
      })
    }

    // 2. Method Filter
    if (selectedMethod !== 'ALL') {
      result = result.filter((item) => item.method === selectedMethod)
    }

    // 3. Status Filter
    if (selectedStatus !== 'ALL') {
      result = result.filter((item) => {
        if (selectedStatus === '2xx') {
          return item.status_code !== null && item.status_code >= 200 && item.status_code < 300
        }
        if (selectedStatus === '3xx') {
          return item.status_code !== null && item.status_code >= 300 && item.status_code < 400
        }
        if (selectedStatus === '4xx') {
          return item.status_code !== null && item.status_code >= 400 && item.status_code < 500
        }
        if (selectedStatus === '5xx') {
          return item.status_code !== null && item.status_code >= 500 && item.status_code < 600
        }
        if (selectedStatus === 'ERROR') {
          return !item.success || item.status_code === null || item.status_code >= 400
        }
        return true
      })
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortOption === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortOption === 'duration') {
        const durA = a.duration_ms ?? -1
        const durB = b.duration_ms ?? -1
        return durB - durA
      }
      if (sortOption === 'status') {
        const statA = a.status_code ?? -1
        const statB = b.status_code ?? -1
        return statB - statA
      }
      return 0
    })

    return result
  }, [rawItems, searchQuery, selectedMethod, selectedStatus, sortOption])

  const handleSelectItem = (item: HistoryListItem) => {
    setSelectedId(item.id)
  }

  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    deleteMutation.mutate(id)
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedMethod('ALL')
    setSelectedStatus('ALL')
    setSortOption('newest')
  }

  return (
    <PageContainer
      title="Request History"
      description="Inspect, replay, and analyze past HTTP requests and network telemetry."
      icon={<Clock className="w-4.5 h-4.5" />}
    >
      <div className="space-y-4 mt-6">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 flex gap-4">
              <div className="skeleton-shimmer h-9 w-64" />
              <div className="skeleton-shimmer h-9 w-32 ml-auto" />
            </div>
            <SkeletonTable rows={8} cols={7} />
          </div>
        )}

        {/* Backend Error State */}
        {isError && (
          <ErrorState
            title="FAILED TO LOAD HISTORY"
            message={
              error instanceof Error
                ? error.message
                : 'Unable to connect to the TRACE persistence service.'
            }
            onRetry={() => {
              void refetch()
            }}
          />
        )}

        {/* Empty History State */}
        {!isLoading && !isError && rawItems.length === 0 && (
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title="No requests yet"
            description="Run your first API request in the API Tester to start building a history you can replay and inspect."
            action={{
              label: 'Open API Tester',
              onClick: () => navigate('/tester'),
            }}
            className="mt-8"
          />
        )}

        {/* Populated History View */}
        {!isLoading && !isError && rawItems.length > 0 && (
          <>
            <HistoryFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sortOption={sortOption}
              onSortChange={setSortOption}
              totalCount={totalCount}
              filteredCount={filteredItems.length}
              onClearAllClick={() => setIsClearModalOpen(true)}
              isClearing={clearAllMutation.isPending}
            />

            {filteredItems.length === 0 ? (
              <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-12 text-center space-y-4">
                <div className="flex items-center justify-center w-10 h-10 border border-[#222222] bg-[#111111] mx-auto">
                  <FilterX className="w-5 h-5 text-[#6B6B6B]" />
                </div>
                <div>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#E8E8E8]">
                    No matching requests found
                  </h3>
                  <p className="text-xs text-[#6B6B6B] mt-1 max-w-sm mx-auto">
                    No requests match your current search and filter criteria.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-xs"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <HistoryTable
                items={filteredItems}
                selectedId={selectedId}
                onSelect={handleSelectItem}
                onDelete={handleDeleteItem}
                isDeletingId={deleteMutation.variables}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Drawer */}
      <HistoryDetailDrawer
        id={selectedId}
        onClose={() => setSelectedId(null)}
        onDelete={(id) => deleteMutation.mutate(id)}
        isDeleting={deleteMutation.isPending}
      />

      {/* Clear All Confirmation Modal */}
      <ClearHistoryModal
        isOpen={isClearModalOpen}
        isLoading={clearAllMutation.isPending}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => clearAllMutation.mutate()}
        totalCount={totalCount}
      />
    </PageContainer>
  )
}
