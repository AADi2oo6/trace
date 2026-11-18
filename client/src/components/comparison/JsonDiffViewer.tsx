import React, { useState, useMemo } from 'react'
import type { JsonDiffItem, DiffType } from '../../types/api'
import { Search, Plus, Minus, RefreshCw, Check, Copy } from 'lucide-react'

interface JsonDiffViewerProps {
  diffs: JsonDiffItem[]
  leftLabel?: string
  rightLabel?: string
}

function formatJsonVal(val: unknown): string {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

export const JsonDiffViewer: React.FC<JsonDiffViewerProps> = ({
  diffs,
  leftLabel = 'Baseline',
  rightLabel = 'Candidate',
}) => {
  const [filterMode, setFilterMode] = useState<'changed' | 'all'>('changed')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedPath, setCopiedPath] = useState<string | null>(null)

  const filteredDiffs = useMemo(() => {
    return diffs.filter((item) => {
      if (filterMode === 'changed' && item.status === 'identical') return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const leftStr = formatJsonVal(item.leftValue).toLowerCase()
      const rightStr = formatJsonVal(item.rightValue).toLowerCase()
      return item.path.toLowerCase().includes(q) || leftStr.includes(q) || rightStr.includes(q)
    })
  }, [diffs, filterMode, searchQuery])

  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      setCopiedPath(path)
      setTimeout(() => setCopiedPath(null), 1500)
    } catch {
      // ignore
    }
  }

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
              placeholder="Search JSON path or value..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-[#1A1E2B] border border-slate-200 dark:border-[#282E40] rounded text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-48 sm:w-64 font-mono"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredDiffs.length} {filteredDiffs.length === 1 ? 'node' : 'nodes'}
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
            All Nodes
          </button>
        </div>
      </div>

      {/* JSON Diff Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#12141D] z-10">
            <tr className="border-b border-slate-200 dark:border-[#222736] text-[10px] uppercase text-slate-400 tracking-wider">
              <th className="py-2 px-3 w-56">JSONPath</th>
              <th className="py-2 px-3 w-28">Status</th>
              <th className="py-2 px-3 w-1/3">{leftLabel}</th>
              <th className="py-2 px-3 w-1/3">{rightLabel}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1C202C]">
            {filteredDiffs.length > 0 ? (
              filteredDiffs.map((item) => (
                <tr
                  key={item.path}
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
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 group">
                      <span className="font-semibold text-orange-500 dark:text-orange-400 break-all">
                        {item.path}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyPath(item.path)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 transition-opacity p-0.5"
                        title="Copy JSONPath"
                      >
                        {copiedPath === item.path ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-2.5 px-3 break-all text-slate-600 dark:text-slate-300">
                    {item.leftValue !== undefined ? (
                      <span
                        className={
                          item.status === 'removed' ? 'line-through text-rose-500/80' : ''
                        }
                      >
                        {formatJsonVal(item.leftValue)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">undefined</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 break-all text-slate-600 dark:text-slate-300">
                    {item.rightValue !== undefined ? (
                      <span
                        className={
                          item.status === 'added'
                            ? 'text-emerald-500 font-semibold'
                            : item.status === 'modified'
                            ? 'text-amber-500 font-semibold'
                            : ''
                        }
                      >
                        {formatJsonVal(item.rightValue)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">undefined</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400 font-mono text-xs">
                  {searchQuery ? 'No nodes match your search query.' : 'No JSON differences detected.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
