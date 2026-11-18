import React, { useState, useMemo } from 'react'
import { Copy, Check, Search, FileJson, Code } from 'lucide-react'

interface JsonExplorerViewProps {
  jsonString: string
}

export const JsonExplorerView: React.FC<JsonExplorerViewProps> = ({ jsonString }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted')
  const [copied, setCopied] = useState(false)

  const prettyJson = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonString
    }
  }, [jsonString])

  const filteredLines = useMemo(() => {
    const lines = prettyJson.split('\n')
    if (!searchTerm.trim()) return lines
    const term = searchTerm.toLowerCase()
    return lines.filter((line) => line.toLowerCase().includes(term))
  }, [prettyJson, searchTerm])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prettyJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keys & values..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-64"
            />
          </div>
          {searchTerm && (
            <span className="text-xs text-slate-400">
              {filteredLines.length} line{filteredLines.length === 1 ? '' : 's'} matching
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('formatted')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'formatted'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Formatted</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'raw'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="p-4 overflow-auto max-h-[580px] text-xs font-mono bg-slate-950">
        {viewMode === 'formatted' ? (
          <pre className="text-slate-300 whitespace-pre">
            {filteredLines.join('\n')}
          </pre>
        ) : (
          <pre className="text-slate-300 whitespace-pre-wrap break-all">
            {jsonString}
          </pre>
        )}
      </div>
    </div>
  )
}
