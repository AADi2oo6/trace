import React, { useState, useMemo } from 'react'
import type { HeaderDiffItem, DiffType } from '../../types/api'
import { Search, ShieldAlert, Check, Plus, Minus, RefreshCw } from 'lucide-react'

interface HeaderDiffViewerProps {
  diffs: HeaderDiffItem[]
  leftLabel?: string
  rightLabel?: string
}

export const HeaderDiffViewer: React.FC<HeaderDiffViewerProps> = ({
  diffs,
  leftLabel = 'Baseline',
  rightLabel = 'Candidate',
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'changed'>('changed')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDiffs = useMemo(() => {
    return diffs.filter((item) => {
      if (filterMode === 'changed' && item.status === 'identical') return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        (item.leftValue && item.leftValue.toLowerCase().includes(q)) ||
        (item.rightValue && item.rightValue.toLowerCase().includes(q))
      )
    })
  }, [diffs, filterMode, searchQuery])

  const getStatusBadge = (status: DiffType) => {
    switch (status) {
      case 'added':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded">
            <Plus className="w-2.5 h-2.5" /> Added
          </span>
        )
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded">
            <Minus className="w-2.5 h-2.5" /> Removed
          </span>
        )
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded">
            <RefreshCw className="w-2.5 h-2.5" /> Modified
          </span>
        )
      case 'identical':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            <Check className="w-2.5 h-2.5" /> Identical
          </span>
        )
    }
  }

  return (
    <div className="border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-3 p-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#222736]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headers..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-[#1A1E2B] border border-slate-200 dark:border-[#282E40] rounded text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-44 sm:w-56 font-mono"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredDiffs.length} {filteredDiffs.length === 1 ? 'header' : 'headers'}
          </span>
        </div>

        <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-[#10121A] border border-slate-200 dark:border-[#282E40] rounded text-xs font-mono">
          <button
            type="button"
            onClick={() => setFilterMode('changed')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterMode === 'changed'
                ? 'bg-white dark:bg-[#1E2230] text-orange-500 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Changed Only
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterMode === 'all'
                ? 'bg-white dark:bg-[#1E2230] text-orange-500 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            All Headers
          </button>
        </div>
      </div>

      {/* Header Diff Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#222736] text-[10px] uppercase text-slate-400 tracking-wider">
              <th className="py-2 px-3 w-44">Header Name</th>
              <th className="py-2 px-3 w-28">Status</th>
              <th className="py-2 px-3 w-1/3">{leftLabel}</th>
              <th className="py-2 px-3 w-1/3">{rightLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1C202C]">
            {filteredDiffs.length > 0 ? (
              filteredDiffs.map((item) => (
                <tr
                  key={item.name}
                  className={`hover:bg-slate-50 dark:hover:bg-[#1A1E2B] transition-colors ${
                    item.status === 'added'
                      ? 'bg-emerald-500/[0.03]'
                      : item.status === 'removed'
                      ? 'bg-rose-500/[0.03]'
                      : item.status === 'modified'
                      ? 'bg-amber-500/[0.03]'
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    {item.isMasked && (
                      <span title="Sensitive header masked for security">
                        <ShieldAlert className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                    <span className="truncate max-w-[160px]" title={item.name}>
                      {item.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-2.5 px-3 break-all text-slate-600 dark:text-slate-300">
                    {item.leftValue !== null ? (
                      <span className={item.status === 'removed' ? 'line-through text-rose-500/80' : ''}>
                        {item.leftValue}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 break-all text-slate-600 dark:text-slate-300">
                    {item.rightValue !== null ? (
                      <span
                        className={
                          item.status === 'added'
                            ? 'text-emerald-500 font-semibold'
                            : item.status === 'modified'
                            ? 'text-amber-500 font-semibold'
                            : ''
                        }
                      >
                        {item.rightValue}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 font-mono text-xs">
                  {searchQuery ? 'No headers match your search query.' : 'No header differences detected.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
