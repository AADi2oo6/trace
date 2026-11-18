import React, { useState, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Search,
  Copy,
  Check,
  Code2,
  FileJson,
  Layers,
} from 'lucide-react'

interface AdvancedJsonViewerProps {
  data: unknown
  initialDepth?: number
  maxRootArrayPreview?: number
}

interface TreeNodeProps {
  name?: string
  value: unknown
  path: string
  depth: number
  expandedMap: Record<string, boolean>
  toggleExpand: (path: string) => void
  searchQuery: string
  onSelectPath?: (path: string, val: unknown) => void
  activePath?: string | null
}

function getType(val: unknown): 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'undefined' {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  if (typeof val === 'object') return 'object'
  if (typeof val === 'number') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'string') return 'string'
  return 'undefined'
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return text

  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-orange-500/30 text-orange-400 font-semibold px-0.5 rounded-none">
        {text.slice(idx, idx + query.length)}
      </mark>
      {highlightText(text.slice(idx + query.length), query)}
    </>
  )
}

const TreeNode: React.FC<TreeNodeProps> = ({
  name,
  value,
  path,
  depth,
  expandedMap,
  toggleExpand,
  searchQuery,
  onSelectPath,
  activePath,
}) => {
  const type = getType(value)
  const isExpanded = !!expandedMap[path]
  const isSelected = activePath === path

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === 'object' || type === 'array') {
      toggleExpand(path)
    }
    if (onSelectPath) {
      onSelectPath(path, value)
    }
  }

  // Value rendering by type
  const renderValuePreview = () => {
    switch (type) {
      case 'string':
        return (
          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
            "{highlightText(String(value), searchQuery)}"
          </span>
        )
      case 'number':
        return (
          <span className="text-sky-600 dark:text-sky-400 font-mono font-medium">
            {highlightText(String(value), searchQuery)}
          </span>
        )
      case 'boolean':
        return (
          <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
            {highlightText(String(value), searchQuery)}
          </span>
        )
      case 'null':
        return (
          <span className="text-rose-600 dark:text-rose-400 font-mono italic">
            null
          </span>
        )
      case 'array': {
        const arr = value as unknown[]
        return (
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            [{arr.length} {arr.length === 1 ? 'item' : 'items'}]
          </span>
        )
      }
      case 'object': {
        const keys = Object.keys(value as Record<string, unknown>)
        return (
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            {`{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`}
          </span>
        )
      }
      default:
        return <span className="text-slate-400 font-mono">{String(value)}</span>
    }
  }

  return (
    <div className="font-mono text-xs select-text">
      <div
        onClick={handleNodeClick}
        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer transition-colors group ${
          isSelected
            ? 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-500'
            : 'hover:bg-slate-100 dark:hover:bg-[#1A1E2B]'
        }`}
        style={{ paddingLeft: `${Math.max(depth * 14 + 6, 6)}px` }}
      >
        {/* Expand / Collapse Chevron for Objects & Arrays */}
        {type === 'object' || type === 'array' ? (
          <span className="text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Key / Property Name */}
        {name !== undefined && (
          <span className="text-slate-700 dark:text-slate-300 font-medium shrink-0">
            {highlightText(name, searchQuery)}
            <span className="text-slate-400 dark:text-slate-600 mr-1">:</span>
          </span>
        )}

        {/* Value preview */}
        <div className="truncate flex-1">
          {renderValuePreview()}
        </div>

        {/* Type Badge on Hover */}
        <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded shrink-0 transition-opacity">
          {type}
        </span>
      </div>

      {/* Children Nodes when Expanded */}
      {isExpanded && (type === 'object' || type === 'array') && (
        <div className="border-l border-slate-200 dark:border-[#222736] ml-3">
          {type === 'array'
            ? (value as unknown[]).map((item, idx) => (
                <TreeNode
                  key={idx}
                  name={`[${idx}]`}
                  value={item}
                  path={`${path}[${idx}]`}
                  depth={depth + 1}
                  expandedMap={expandedMap}
                  toggleExpand={toggleExpand}
                  searchQuery={searchQuery}
                  onSelectPath={onSelectPath}
                  activePath={activePath}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <TreeNode
                  key={k}
                  name={k}
                  value={v}
                  path={`${path}.${k}`}
                  depth={depth + 1}
                  expandedMap={expandedMap}
                  toggleExpand={toggleExpand}
                  searchQuery={searchQuery}
                  onSelectPath={onSelectPath}
                  activePath={activePath}
                />
              ))}
        </div>
      )}
    </div>
  )
}

function buildInitialExpanded(
  val: unknown,
  depth: number,
  currentDepth = 0,
  path = '$'
): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  if (currentDepth <= depth && typeof val === 'object' && val !== null) {
    result[path] = true
    if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        Object.assign(result, buildInitialExpanded(item, depth, currentDepth + 1, `${path}[${idx}]`))
      })
    } else {
      Object.entries(val as Record<string, unknown>).forEach(([k, v]) => {
        Object.assign(result, buildInitialExpanded(v, depth, currentDepth + 1, `${path}.${k}`))
      })
    }
  }
  return result
}

export const AdvancedJsonViewer: React.FC<AdvancedJsonViewerProps> = ({
  data,
  initialDepth = 2,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activePath, setActivePath] = useState<string | null>('$')
  const [selectedValue, setSelectedValue] = useState<unknown>(data)
  const [copiedType, setCopiedType] = useState<'path' | 'formatted' | 'minified' | 'node' | null>(null)

  // Parse object if string passed
  const parsedData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    }
    return data
  }, [data])

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(() =>
    buildInitialExpanded(parsedData, initialDepth)
  )

  const toggleExpand = (path: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  const expandToDepth = (targetDepth: number) => {
    setExpandedMap(buildInitialExpanded(parsedData, targetDepth))
  }

  const expandAll = () => {
    setExpandedMap(buildInitialExpanded(parsedData, 100))
  }

  const collapseAll = () => {
    setExpandedMap({ $: false })
  }

  const handleSelectPath = (path: string, val: unknown) => {
    setActivePath(path)
    setSelectedValue(val)
  }

  const copyToClipboard = async (text: string, type: 'path' | 'formatted' | 'minified' | 'node') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    } catch {
      // ignore
    }
  }

  // Count matches in search
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return 0
    const str = JSON.stringify(parsedData).toLowerCase()
    const q = searchQuery.toLowerCase()
    let count = 0
    let pos = 0
    while ((pos = str.indexOf(q, pos)) !== -1) {
      count++
      pos += q.length
    }
    return count
  }, [parsedData, searchQuery])

  // Auto-expand paths when user searches
  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    if (q.trim()) {
      // Expand more deeply so matches are visible
      expandToDepth(4)
    }
  }

  return (
    <div className="flex flex-col h-full border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922]">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#12141D] border-b border-slate-200 dark:border-[#222736]">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search keys and values..."
              className="pl-8 pr-3 py-1 text-xs bg-white dark:bg-[#1A1E2B] border border-slate-200 dark:border-[#282E40] rounded text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-orange-500 w-48 sm:w-60 font-mono"
            />
          </div>
          {searchQuery && (
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {searchMatches} {searchMatches === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Depth & Actions Buttons */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Depth selectors */}
          <div className="inline-flex items-center border border-slate-200 dark:border-[#282E40] bg-white dark:bg-[#1A1E2B] rounded p-0.5">
            <span className="px-2 text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Depth:
            </span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => expandToDepth(d)}
                className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                title={`Expand up to depth ${d}`}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={expandAll}
              className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 border-l border-slate-200 dark:border-[#282E40]"
              title="Expand All"
            >
              All
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="px-2 py-0.5 text-slate-600 dark:text-slate-300 hover:text-orange-500 dark:hover:text-orange-400 border-l border-slate-200 dark:border-[#282E40]"
              title="Collapse All"
            >
              None
            </button>
          </div>

          {/* Copy Full Document */}
          <button
            type="button"
            onClick={() => copyToClipboard(JSON.stringify(parsedData, null, 2), 'formatted')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1A1E2B] hover:bg-slate-100 dark:hover:bg-[#222736] border border-slate-200 dark:border-[#282E40] text-slate-700 dark:text-slate-200 rounded transition-colors"
            title="Copy formatted JSON"
          >
            {copiedType === 'formatted' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <FileJson className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Format</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(JSON.stringify(parsedData), 'minified')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1A1E2B] hover:bg-slate-100 dark:hover:bg-[#222736] border border-slate-200 dark:border-[#282E40] text-slate-700 dark:text-slate-200 rounded transition-colors"
            title="Copy minified JSON"
          >
            {copiedType === 'minified' ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Minify</span>
          </button>
        </div>
      </div>

      {/* JSON Path Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/70 dark:bg-[#0F1118] border-b border-slate-200 dark:border-[#222736] text-xs font-mono">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Path:</span>
          <span className="text-orange-500 dark:text-orange-400 font-semibold truncate">
            {activePath || '$'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => activePath && copyToClipboard(activePath, 'path')}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Copy selected JSON Path"
          >
            {copiedType === 'path' ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Copy Path</span>
          </button>

          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                typeof selectedValue === 'string'
                  ? selectedValue
                  : JSON.stringify(selectedValue, null, 2),
                'node'
              )
            }
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors border-l border-slate-300 dark:border-[#282E40] pl-2"
            title="Copy selected node value"
          >
            {copiedType === 'node' ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Copy Value</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Tree Area */}
      <div className="flex-1 overflow-auto p-3 max-h-[550px]">
        {parsedData !== undefined && parsedData !== null ? (
          <TreeNode
            name="$"
            value={parsedData}
            path="$"
            depth={0}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            searchQuery={searchQuery}
            onSelectPath={handleSelectPath}
            activePath={activePath}
          />
        ) : (
          <div className="text-slate-400 font-mono text-xs p-4 text-center">
            No JSON payload to display.
          </div>
        )}
      </div>
    </div>
  )
}
