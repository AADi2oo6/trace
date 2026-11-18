import React from 'react'
import { Search, X, Trash2, ArrowUpDown } from 'lucide-react'
import type { HTTPMethod } from '../../types/api'
import { Button } from '../ui/Button'

export type StatusFilter = 'ALL' | '2xx' | '3xx' | '4xx' | '5xx' | 'ERROR'
export type SortOption = 'newest' | 'oldest' | 'duration' | 'status'

interface HistoryFilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedMethod: string
  onMethodChange: (method: string) => void
  selectedStatus: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  sortOption: SortOption
  onSortChange: (sort: SortOption) => void
  totalCount: number
  filteredCount: number
  onClearAllClick: () => void
  isClearing?: boolean
}

const METHODS: Array<'ALL' | HTTPMethod> = [
  'ALL',
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
]

const STATUSES: StatusFilter[] = ['ALL', '2xx', '3xx', '4xx', '5xx', 'ERROR']

export const HistoryFilterBar: React.FC<HistoryFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedMethod,
  onMethodChange,
  selectedStatus,
  onStatusChange,
  sortOption,
  onSortChange,
  totalCount,
  filteredCount,
  onClearAllClick,
  isClearing = false,
}) => {
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded-lg p-4 space-y-4 shadow-xs">
      {/* Top row: Search, Sort, and Clear All */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search URL, hostname, method, status code, error..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md pl-9 pr-9 py-2 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-primary)] p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 border border-[var(--border-default)] bg-[var(--bg-input)] rounded-md px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-dim)]" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)]">
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-mono text-[var(--text-primary)] outline-none cursor-pointer border-0"
              aria-label="Sort history items"
            >
              <option value="newest" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                Newest first
              </option>
              <option value="oldest" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                Oldest first
              </option>
              <option value="duration" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                Duration (slowest)
              </option>
              <option value="status" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                Status code
              </option>
            </select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAllClick}
            disabled={totalCount === 0 || isClearing}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-xs text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Bottom row: Filter Pills and Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
        {/* Method & Status Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Method group */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] mr-1.5">
              Method:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {METHODS.map((method) => {
                const isActive = selectedMethod === method
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => onMethodChange(method)}
                    className={`px-2 py-0.5 text-[11px] font-mono tracking-wider rounded transition-colors border ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-600/10 font-bold'
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-input)]'
                    }`}
                  >
                    {method}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Status group */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] mr-1.5">
              Status:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {STATUSES.map((status) => {
                const isActive = selectedStatus === status
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status)}
                    className={`px-2 py-0.5 text-[11px] font-mono tracking-wider rounded transition-colors border ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-600/10 font-bold'
                        : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-input)]'
                    }`}
                  >
                    {status}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="text-[11px] font-mono text-[var(--text-muted)]">
          Showing <span className="text-[var(--text-primary)] font-bold">{filteredCount}</span> of{' '}
          <span className="text-[var(--text-primary)] font-bold">{totalCount}</span> requests
        </div>
      </div>
    </div>
  )
}
