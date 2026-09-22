import React, { useState } from 'react'
import { Search, Copy, Check } from 'lucide-react'

interface ResponseHeadersProps {
  headers: Record<string, string>
}

export const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers }) => {
  const [query, setQuery] = useState('')
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedRow, setCopiedRow] = useState<string | null>(null)

  const entries = Object.entries(headers)
  const filtered = query.trim()
    ? entries.filter(
        ([k, v]) =>
          k.toLowerCase().includes(query.toLowerCase()) ||
          v.toLowerCase().includes(query.toLowerCase()),
      )
    : entries

  const handleCopyAll = async () => {
    const text = entries.map(([k, v]) => `${k}: ${v}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  const handleCopyRow = async (name: string, value: string) => {
    try {
      await navigator.clipboard.writeText(`${name}: ${value}`)
      setCopiedRow(name)
      setTimeout(() => setCopiedRow(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar: search + copy-all */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1A1A1A] bg-[#0D0D0D]">
        <Search className="w-3.5 h-3.5 text-[#3A3A3A] shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter headers…"
          className={[
            'flex-1 text-xs font-mono bg-transparent border-0 outline-none',
            'text-[#E8E8E8] placeholder:text-[#2A2A2A]',
          ].join(' ')}
          aria-label="Filter response headers"
        />
        {query && (
          <span className="text-[10px] font-mono text-[#3A3A3A]">
            {filtered.length} / {entries.length}
          </span>
        )}

        {/* Copy-all button */}
        <button
          type="button"
          onClick={() => void handleCopyAll()}
          disabled={entries.length === 0}
          aria-label="Copy all headers"
          className={[
            'flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono',
            'text-[#3A3A3A] hover:text-[#E8E8E8] transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {copiedAll ? (
            <>
              <Check className="w-3 h-3 text-[#22C55E]" />
              <span className="text-[#22C55E]">Copied ✓</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy all
            </>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[480px]">
        <table className="w-full text-xs font-mono" aria-label="Response headers">
          <thead className="sticky top-0">
            <tr className="border-b border-[#1A1A1A] bg-[#0D0D0D]">
              <th
                scope="col"
                className="px-4 py-2 text-left text-[9px] tracking-widest text-[#3A3A3A] uppercase w-2/5 font-normal"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-left text-[9px] tracking-widest text-[#3A3A3A] uppercase font-normal"
              >
                Value
              </th>
              <th
                scope="col"
                className="px-4 py-2 text-right text-[9px] tracking-widest text-[#3A3A3A] uppercase font-normal w-16"
                aria-label="Actions"
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111111]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-[#3A3A3A]"
                >
                  No headers match &ldquo;{query}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map(([name, value]) => (
                <tr
                  key={name}
                  className="group hover:bg-[#0D0D0D] transition-colors duration-75"
                >
                  <td className="px-4 py-2.5 text-[#6B6B6B] whitespace-nowrap align-top">
                    {name}
                  </td>
                  <td className="px-4 py-2.5 text-[#B0B0B0] break-all align-top">
                    {value}
                  </td>
                  <td className="px-4 py-2.5 text-right align-top">
                    <button
                      type="button"
                      onClick={() => void handleCopyRow(name, value)}
                      aria-label={`Copy header ${name}`}
                      className={[
                        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-mono',
                        'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
                        'text-[#3A3A3A] hover:text-[#E8E8E8]',
                        'focus-visible:outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
                      ].join(' ')}
                    >
                      {copiedRow === name ? (
                        <>
                          <Check className="w-3 h-3 text-[#22C55E]" />
                          <span className="text-[#22C55E]">Copied ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count footer */}
      <div className="px-4 py-2 border-t border-[#1A1A1A] bg-[#080808]">
        <span className="text-[10px] font-mono text-[#2A2A2A]">
          {entries.length} {entries.length === 1 ? 'header' : 'headers'}
        </span>
      </div>
    </div>
  )
}
