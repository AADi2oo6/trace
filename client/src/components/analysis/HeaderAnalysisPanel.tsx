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
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1A1A1A] bg-[#0D0D0D]">
          <ListFilter className="w-4 h-4 text-[#3A3A3A]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            2. HTTP Header Analysis
          </h2>
        </div>
        <div className="p-8 text-center text-xs font-mono text-[#555555]">
          No header analysis available for this request.
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] divide-y divide-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-[#0D0D0D]">
        <div className="flex items-center gap-2.5">
          <ListFilter className="w-4 h-4 text-[#FF6A00]" />
          <h2 className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase">
            2. HTTP Header Analysis
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 border border-[#2A2A2A] text-[#777777]">
            {items.length} total
          </span>
        </div>

        {/* Copy all button */}
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={filteredItems.length === 0}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#888888] hover:text-[#E8E8E8] border border-[#2A2A2A] hover:border-[#444444] transition-colors disabled:opacity-40"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-[#22C55E]">Copied all ✓</span>
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
      <div className="p-4 space-y-3 bg-[#080808]">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#444444]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search header name, value, or description..."
              className="w-full bg-[#0D0D0D] border border-[#1A1A1A] pl-9 pr-3 py-1.5 text-xs font-mono text-[#E8E8E8] placeholder:text-[#3A3A3A] focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          {/* Source Filter Tabs */}
          <div className="flex items-center border border-[#1A1A1A] bg-[#0D0D0D] shrink-0 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedSource('ALL')}
              className={[
                'px-3 py-1.5 transition-colors',
                selectedSource === 'ALL'
                  ? 'bg-[#1E1E1E] text-[#FF6A00] font-semibold'
                  : 'text-[#555555] hover:text-[#E8E8E8]',
              ].join(' ')}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('response')}
              className={[
                'px-3 py-1.5 border-l border-[#1A1A1A] transition-colors',
                selectedSource === 'response'
                  ? 'bg-[#1E1E1E] text-[#FF6A00] font-semibold'
                  : 'text-[#555555] hover:text-[#E8E8E8]',
              ].join(' ')}
            >
              Response ({responseCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('request')}
              className={[
                'px-3 py-1.5 border-l border-[#1A1A1A] transition-colors',
                selectedSource === 'request'
                  ? 'bg-[#1E1E1E] text-[#FF6A00] font-semibold'
                  : 'text-[#555555] hover:text-[#E8E8E8]',
              ].join(' ')}
            >
              Request ({requestCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-mono text-[#444444] uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={[
              'px-2 py-0.5 text-[10px] font-mono border transition-colors',
              selectedCategory === 'ALL'
                ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A0010]'
                : 'border-[#1A1A1A] text-[#555555] hover:text-[#B0B0B0]',
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
                'px-2 py-0.5 text-[10px] font-mono border transition-colors',
                selectedCategory === cat
                  ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A0010]'
                  : 'border-[#1A1A1A] text-[#555555] hover:text-[#B0B0B0]',
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
            <tr className="border-b border-[#1A1A1A] bg-[#0D0D0D] text-[9px] tracking-widest text-[#444444] uppercase">
              <th scope="col" className="py-2.5 px-4 w-8" />
              <th scope="col" className="py-2.5 px-4 w-48">Header</th>
              <th scope="col" className="py-2.5 px-4 w-32">Category / Source</th>
              <th scope="col" className="py-2.5 px-4">Value</th>
              <th scope="col" className="py-2.5 px-4 text-right w-16">Copy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141414]">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#444444]">
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
                      className="group hover:bg-[#0D0D0D] transition-colors cursor-pointer"
                      onClick={() => toggleExpand(rowKey)}
                    >
                      {/* Expand Chevron */}
                      <td className="py-2.5 px-4 text-[#444444] group-hover:text-[#E8E8E8]">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </td>

                      {/* Header Name */}
                      <td className="py-2.5 px-4 text-[#E8E8E8] font-semibold whitespace-nowrap">
                        {item.name}
                      </td>

                      {/* Category & Source Badges */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 text-[9px] font-mono border border-[#222222] bg-[#111111] text-[#999999]">
                            {item.category}
                          </span>
                          <span
                            className={[
                              'px-1 py-0.5 text-[8px] font-mono uppercase tracking-wider',
                              item.source === 'response'
                                ? 'text-[#3B82F6] bg-[#3B82F610]'
                                : 'text-[#888888] bg-[#222222]',
                            ].join(' ')}
                          >
                            {item.source}
                          </span>
                        </div>
                      </td>

                      {/* Value */}
                      <td className="py-2.5 px-4 text-[#B0B0B0] break-all">
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
                          className="p-1 text-[#444444] hover:text-[#E8E8E8] opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy value"
                          aria-label={`Copy value of ${item.name}`}
                        >
                          {copiedValue === rowKey ? (
                            <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Technical Detail */}
                    {isExpanded && (
                      <tr className="bg-[#080808] border-b border-[#141414]">
                        <td colSpan={5} className="p-4 pl-12 space-y-2">
                          <div>
                            <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-0.5">
                              Description
                            </p>
                            <p className="text-xs font-mono text-[#888888] leading-relaxed">
                              {item.description || 'No detailed documentation available.'}
                            </p>
                          </div>

                          {item.observations && item.observations.length > 0 && (
                            <div className="pt-2 border-t border-[#111111]">
                              <p className="text-[9px] font-mono tracking-widest text-[#444444] uppercase mb-1">
                                Technical Observations
                              </p>
                              <ul className="space-y-1">
                                {item.observations.map((obs, i) => (
                                  <li key={i} className="text-xs font-mono text-[#777777] flex items-start gap-1.5">
                                    <span className="text-[#3A3A3A] select-none">•</span>
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
