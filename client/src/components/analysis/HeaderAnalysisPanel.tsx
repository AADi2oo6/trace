import React, { useState, useMemo } from 'react'
import { ListFilter, Search, Copy, Check, ChevronDown, ChevronRight, Filter } from 'lucide-react'
import type { HeaderAnalysisItem, HeaderCategory, HeaderSource } from '../../types/api'

interface HeaderAnalysisPanelProps {
  headerAnalysis: HeaderAnalysisItem[] | null
}

const ALL_CATEGORIES: HeaderCategory[] = [
  'General',
  'Content',
  'Caching',
  'Security',
  'Authentication',
  'CORS',
  'Cookies',
  'Connection',
  'Redirection',
  'Server',
  'Other',
]

export const HeaderAnalysisPanel: React.FC<HeaderAnalysisPanelProps> = ({ headerAnalysis }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HeaderCategory | 'ALL'>('ALL')
  const [selectedSource, setSelectedSource] = useState<HeaderSource | 'ALL'>('ALL')
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const items = useMemo(() => headerAnalysis ?? [], [headerAnalysis])

  // Available categories in data
  const availableCategories = useMemo(() => {
    const set = new Set<HeaderCategory>()
    for (const item of items) {
      set.add(item.category)
    }
    return ALL_CATEGORIES.filter((cat) => set.has(cat))
  }, [items])

  // Count by source
  const responseCount = useMemo(() => items.filter((i) => i.source === 'response').length, [items])
  const requestCount = useMemo(() => items.filter((i) => i.source === 'request').length, [items])

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Source filter
      if (selectedSource !== 'ALL' && item.source !== selectedSource) {
        return false
      }
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesVal = item.value.toLowerCase().includes(q)
        const matchesDesc = item.description.toLowerCase().includes(q)
        return matchesName || matchesVal || matchesDesc
      }
      return true
    })
  }, [items, selectedSource, selectedCategory, searchQuery])

  const toggleExpand = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCopyAll = async () => {
    const text = filteredItems.map((h) => `${h.name}: ${h.value}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // Ignore
    }
  }

  const handleCopyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(key)
      setTimeout(() => setCopiedValue(null), 2000)
    } catch {
      // Ignore
    }
  }

  if (!headerAnalysis || headerAnalysis.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border-muted)] bg-[var(--bg-panel)]">
          <ListFilter className="w-4 h-4 text-[var(--text-muted)]" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase">
            2. HTTP Header Analysis
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
          No header analysis available for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-muted)] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2.5">
          <ListFilter className="w-4 h-4 text-blue-500" />
          <h2 className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold">
            2. HTTP Header Analysis
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)]">
            {items.length} total
          </span>
        </div>

        {/* Copy all button */}
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={filteredItems.length === 0}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-hover)] bg-[var(--bg-input)] transition-colors disabled:opacity-40"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied all ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy all ({filteredItems.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-4 space-y-3 bg-[var(--bg-panel)]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search header name, value, or description..."
              className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] pl-9 pr-3 py-1.5 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500 rounded-md"
            />
          </div>

          {/* Source Filter Tabs */}
          <div className="flex items-center border border-[var(--border-default)] bg-[var(--bg-input)] rounded-md overflow-hidden shrink-0 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedSource('ALL')}
              className={[
                'px-3 py-1.5 transition-colors',
                selectedSource === 'ALL'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('response')}
              className={[
                'px-3 py-1.5 border-l border-[var(--border-default)] transition-colors',
                selectedSource === 'response'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Response ({responseCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('request')}
              className={[
                'px-3 py-1.5 border-l border-[var(--border-default)] transition-colors',
                selectedSource === 'request'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Request ({requestCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={[
              'px-2 py-0.5 text-[10px] font-mono border rounded-md transition-colors',
              selectedCategory === 'ALL'
                ? 'border-blue-500 text-blue-500 bg-blue-500/10 font-bold'
                : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            ].join(' ')}
          >
            ALL
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={[
                'px-2 py-0.5 text-[10px] font-mono border rounded-md transition-colors',
                selectedCategory === cat
                  ? 'border-blue-500 text-blue-500 bg-blue-500/10 font-bold'
                  : 'border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Headers Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono" aria-label="HTTP header analysis">
          <thead>
            <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)] text-[9px] tracking-widest text-[var(--text-muted)] uppercase font-semibold">
              <th scope="col" className="py-2.5 px-4 w-8" />
              <th scope="col" className="py-2.5 px-4 w-48">Header</th>
              <th scope="col" className="py-2.5 px-4 w-32">Category / Source</th>
              <th scope="col" className="py-2.5 px-4">Value</th>
              <th scope="col" className="py-2.5 px-4 text-right w-16">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-muted)]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                  No headers match the selected filters.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => {
                const rowKey = `${item.name}-${item.source}-${index}`
                const isExpanded = !!expandedRows[rowKey]
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className="group hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                      onClick={() => toggleExpand(rowKey)}
                    >
                      {/* Expand Chevron */}
                      <td className="py-2.5 px-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>

                      {/* Header Name */}
                      <td className="py-2.5 px-4 text-[var(--text-primary)] font-semibold whitespace-nowrap">
                        {item.name}
                      </td>

                      {/* Category & Source Badges */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[9px] font-mono border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-secondary)] rounded-xs">
                            {item.category}
                          </span>
                          <span
                            className={[
                              'px-1 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded-xs',
                              item.source === 'response'
                                ? 'text-blue-500 bg-blue-500/10 font-bold'
                                : 'text-[var(--text-muted)] bg-[var(--bg-input)]',
                            ].join(' ')}
                          >
                            {item.source}
                          </span>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-2.5 px-4 text-[var(--text-secondary)] break-all font-mono">
                        {item.value}
                      </td>

                      {/* Action Copy */}
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleCopyValue(rowKey, item.value)
                          }}
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-all rounded-sm"
                          title="Copy value"
                          aria-label={`Copy value of ${item.name}`}
                        >
                          {copiedValue === rowKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Technical Detail */}
                    {isExpanded && (
                      <tr className="bg-[var(--bg-panel)] border-b border-[var(--border-muted)]">
                        <td colSpan={5} className="p-4 pl-12 space-y-2">
                          <div>
                            <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-0.5 font-semibold">
                              Description
                            </p>
                            <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                              {item.description || 'No detailed documentation available.'}
                            </p>
                          </div>

                          {item.observations && item.observations.length > 0 && (
                            <div className="pt-2 border-t border-[var(--border-muted)]">
                              <p className="text-[9px] font-mono tracking-widest text-[var(--text-muted)] uppercase mb-1 font-semibold">
                                Technical Observations
                              </p>
                              <ul className="space-y-1">
                                {item.observations.map((obs, i) => (
                                  <li key={i} className="text-xs font-mono text-[var(--text-secondary)] flex items-start gap-1.5">
                                    <span className="text-blue-500 select-none">•</span>
                                    <span>{obs}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
