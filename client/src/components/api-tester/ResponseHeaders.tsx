import React, { useState } from 'react'
import { Search } from 'lucide-react'

interface ResponseHeadersProps {
  headers: Record<string, string>
}

export const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers }) => {
  const [query, setQuery] = useState('')

  const entries = Object.entries(headers)
  const filtered = query.trim()
    ? entries.filter(
        ([k, v]) =>
          k.toLowerCase().includes(query.toLowerCase()) ||
          v.toLowerCase().includes(query.toLowerCase()),
      )
    : entries

  return (
    <div className="flex flex-col">
      {/* Search bar */}
      {entries.length > 5 && (
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
        </div>
      )}

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
            </tr>
          </thead>
          <tbody className="divide-y divide-[#111111]">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
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
