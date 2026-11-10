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
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-4">
      {/* Top row: Search, Sort, and Clear All */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search URL, hostname, method, status code, error..."
            className="w-full bg-[#111111] border border-[#222222] pl-9 pr-9 py-2 text-xs font-mono text-[#E8E8E8] placeholder-[#555555] focus:outline-none focus:border-[#FF6A00] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#E8E8E8] p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 border border-[#222222] bg-[#111111] px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
              Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs font-mono text-[#E8E8E8] outline-none cursor-pointer border-0"
              aria-label="Sort history items"
            >
              <option value="newest" className="bg-[#111111] text-[#E8E8E8]">
                Newest first
              </option>
              <option value="oldest" className="bg-[#111111] text-[#E8E8E8]">
                Oldest first
              </option>
              <option value="duration" className="bg-[#111111] text-[#E8E8E8]">
                Duration (slowest)
              </option>
              <option value="status" className="bg-[#111111] text-[#E8E8E8]">
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
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />}
            className="text-xs text-[#EF4444] hover:bg-[#EF444410] border border-transparent hover:border-[#EF444430]"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Bottom row: Filter Pills and Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#161616]">
        {/* Method & Status Filters */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Method group */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#555555] mr-1.5">
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
                    className={`px-2 py-0.5 text-[11px] font-mono tracking-wider transition-colors border ${
                      isActive
                        ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A0010]'
                        : 'border-[#1E1E1E] text-[#6B6B6B] hover:text-[#B0B0B0] bg-[#111111]'
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#555555] mr-1.5">
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
                    className={`px-2 py-0.5 text-[11px] font-mono tracking-wider transition-colors border ${
                      isActive
                        ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A0010]'
                        : 'border-[#1E1E1E] text-[#6B6B6B] hover:text-[#B0B0B0] bg-[#111111]'
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
        <div className="text-[11px] font-mono text-[#6B6B6B]">
          Showing <span className="text-[#E8E8E8]">{filteredCount}</span> of{' '}
          <span className="text-[#E8E8E8]">{totalCount}</span> requests
        </div>
      </div>
    </div>
  )
}
