import React from 'react'
import { Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import type { HistoryListItem, HTTPMethod } from '../../types/api'

interface HistoryTableProps {
  items: HistoryListItem[]
  selectedId: string | null
  onSelect: (item: HistoryListItem) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  isDeletingId?: string | null
}

const methodColorMap: Record<HTTPMethod, { text: string; bg: string; border: string }> = {
  GET: { text: 'text-[#22C55E]', bg: 'bg-[#22C55E10]', border: 'border-[#22C55E30]' },
  POST: { text: 'text-[#3B82F6]', bg: 'bg-[#3B82F610]', border: 'border-[#3B82F630]' },
  PUT: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B10]', border: 'border-[#F59E0B30]' },
  PATCH: { text: 'text-[#A78BFA]', bg: 'bg-[#A78BFA10]', border: 'border-[#A78BFA30]' },
  DELETE: { text: 'text-[#EF4444]', bg: 'bg-[#EF444410]', border: 'border-[#EF444430]' },
  HEAD: { text: 'text-[#6B6B6B]', bg: 'bg-[#6B6B6B10]', border: 'border-[#6B6B6B30]' },
  OPTIONS: { text: 'text-[#FF6A00]', bg: 'bg-[#FF6A0010]', border: 'border-[#FF6A0030]' },
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  } catch {
    return isoString
  }
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  items,
  selectedId,
  onSelect,
  onDelete,
  isDeletingId,
}) => {
  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E1E1E] bg-[#0D0D0D] text-[10px] font-mono tracking-wider text-[#6B6B6B] uppercase select-none">
              <th className="py-2.5 px-4 font-medium w-24">Time</th>
              <th className="py-2.5 px-3 font-medium w-24">Method</th>
              <th className="py-2.5 px-4 font-medium">Target URL</th>
              <th className="py-2.5 px-4 font-medium w-32">Status</th>
              <th className="py-2.5 px-4 font-medium w-24 text-right">Duration</th>
              <th className="py-2.5 px-4 font-medium w-24 text-right">Size</th>
              <th className="py-2.5 px-4 font-medium w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#161616] font-mono text-xs">
            {items.map((item) => {
              const isSelected = selectedId === item.id
              const isDeleting = isDeletingId === item.id
              const methodStyle = methodColorMap[item.method] || {
                text: 'text-[#E8E8E8]',
                bg: 'bg-[#1E1E1E]',
                border: 'border-[#333333]',
              }

              // Status badge styling
              let statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono border text-[#EF4444] bg-[#EF444410] border-[#EF444430]">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {item.error?.code === 'SSRF_BLOCKED' ? 'BLOCKED' : 'ERR'}
                </span>
              )

              if (item.status_code !== null) {
                let badgeClass = 'text-[#22C55E] bg-[#22C55E10] border-[#22C55E30]'
                if (item.status_code >= 300 && item.status_code < 400) {
                  badgeClass = 'text-[#F59E0B] bg-[#F59E0B10] border-[#F59E0B30]'
                } else if (item.status_code >= 400 && item.status_code < 500) {
                  badgeClass = 'text-[#FF6A00] bg-[#FF6A0010] border-[#FF6A0030]'
                } else if (item.status_code >= 500) {
                  badgeClass = 'text-[#EF4444] bg-[#EF444410] border-[#EF444430]'
                }

                statusBadge = (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono border ${badgeClass}`}
                  >
                    <span>{item.status_code}</span>
                    {item.status_text && (
                      <span className="opacity-80 text-[10px] hidden sm:inline truncate max-w-[70px]">
                        {item.status_text}
                      </span>
                    )}
                  </span>
                )
              }

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-[#E8E8E8]'
                      : 'hover:bg-[#121212] text-[#B0B0B0]'
                  } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  {/* Time */}
                  <td className="py-2.5 px-4 text-[#6B6B6B] whitespace-nowrap text-[11px]">
                    {formatTimestamp(item.created_at)}
                  </td>

                  {/* Method */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold tracking-wider border ${methodStyle.text} ${methodStyle.bg} ${methodStyle.border}`}
                    >
                      {item.method}
                    </span>
                  </td>

                  {/* URL */}
                  <td className="py-2.5 px-4 max-w-xs md:max-w-md lg:max-w-lg truncate text-[#E8E8E8] group-hover:text-white" title={item.url}>
                    {item.url}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {statusBadge}
                  </td>

                  {/* Duration */}
                  <td className="py-2.5 px-4 text-right text-[#888888] whitespace-nowrap text-[11px]">
                    {formatMs(item.duration_ms)}
                  </td>

                  {/* Size */}
                  <td className="py-2.5 px-4 text-right text-[#888888] whitespace-nowrap text-[11px]">
                    {formatBytes(item.response_size)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(item)
                        }}
                        className="p-1 text-[#6B6B6B] hover:text-[#FF6A00] transition-colors"
                        title="Inspect details"
                        aria-label={`Inspect ${item.method} ${item.url}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => onDelete(item.id, e)}
                        className="p-1 text-[#6B6B6B] hover:text-[#EF4444] transition-colors"
                        title="Delete from history"
                        aria-label={`Delete ${item.method} ${item.url}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
