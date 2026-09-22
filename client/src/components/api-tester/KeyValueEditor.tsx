import React from 'react'
import { X, Plus } from 'lucide-react'
import type { KVRow } from '../../store/requestStore'

interface KeyValueEditorProps {
  rows: KVRow[]
  onAdd: () => void
  onUpdate: (id: string, field: 'key' | 'value', value: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  /** Names of keys whose values should be masked (e.g. Authorization, Cookie) */
  sensitiveKeys?: string[]
  disabled?: boolean
}

const SENSITIVE_KEYS_DEFAULT = ['authorization', 'cookie', 'proxy-authorization']

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  rows,
  onAdd,
  onUpdate,
  onToggle,
  onRemove,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  sensitiveKeys,
  disabled = false,
}) => {
  const sensitiveSet = new Set(
    (sensitiveKeys ?? SENSITIVE_KEYS_DEFAULT).map((k) => k.toLowerCase()),
  )

  return (
    <div className="flex flex-col">
      {/* Rows */}
      {rows.length > 0 && (
        <div className="border border-[#1E1E1E] divide-y divide-[#1A1A1A] mb-2">
          {/* Column headers */}
          <div className="flex items-center px-3 py-1.5 bg-[#0D0D0D]">
            <span className="w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-[9px] font-mono tracking-widest text-[#2A2A2A] uppercase pl-2">
              Key
            </span>
            <span className="flex-1 text-[9px] font-mono tracking-widest text-[#2A2A2A] uppercase pl-2">
              Value
            </span>
            <span className="w-6 shrink-0" aria-hidden="true" />
          </div>

          {rows.map((row) => {
            const isSensitive = sensitiveSet.has(row.key.toLowerCase())

            return (
              <div
                key={row.id}
                className={[
                  'flex items-center gap-1 px-3 py-1.5 group',
                  row.enabled ? 'bg-[#0A0A0A]' : 'bg-[#070707] opacity-50',
                ].join(' ')}
              >
                {/* Enable/disable checkbox */}
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={() => onToggle(row.id)}
                  disabled={disabled}
                  aria-label={`Enable ${row.key || 'row'}`}
                  className="w-3 h-3 shrink-0 accent-[#FF6A00] cursor-pointer disabled:cursor-not-allowed"
                />

                {/* Key input */}
                <input
                  type="text"
                  value={row.key}
                  onChange={(e) => onUpdate(row.id, 'key', e.target.value)}
                  disabled={disabled}
                  placeholder={keyPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className={[
                    'flex-1 px-2 py-1 text-xs font-mono bg-transparent border-0 outline-none',
                    'text-[#B0B0B0] placeholder:text-[#2A2A2A]',
                    'focus:bg-[#111111] transition-colors duration-100',
                    'disabled:cursor-not-allowed',
                  ].join(' ')}
                />

                {/* Value input */}
                <div className="flex-1 relative">
                  <input
                    type={isSensitive ? 'password' : 'text'}
                    value={row.value}
                    onChange={(e) => onUpdate(row.id, 'value', e.target.value)}
                    disabled={disabled}
                    placeholder={isSensitive ? '••••••••' : valuePlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                    aria-label={isSensitive ? `${row.key} (sensitive)` : `Value for ${row.key}`}
                    className={[
                      'w-full px-2 py-1 text-xs font-mono bg-transparent border-0 outline-none',
                      'text-[#B0B0B0] placeholder:text-[#2A2A2A]',
                      'focus:bg-[#111111] transition-colors duration-100',
                      'disabled:cursor-not-allowed',
                    ].join(' ')}
                  />
                  {isSensitive && row.value && (
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-[#3A3A3A]"
                      aria-hidden="true"
                    >
                      sensitive
                    </span>
                  )}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemove(row.id)}
                  disabled={disabled}
                  aria-label={`Remove row ${row.key || ''}`}
                  className={[
                    'w-5 h-5 flex items-center justify-center shrink-0',
                    'text-[#2A2A2A] hover:text-[#EF4444] transition-colors duration-100',
                    'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    'focus-visible:outline-none',
                    'disabled:cursor-not-allowed',
                  ].join(' ')}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add row button */}
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className={[
          'flex items-center gap-2 px-3 py-2 text-xs font-mono text-[#3A3A3A]',
          'hover:text-[#6B6B6B] hover:bg-[#0D0D0D] transition-colors duration-100',
          'border border-dashed border-[#1E1E1E] hover:border-[#2A2A2A]',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <Plus className="w-3 h-3" />
        Add row
      </button>
    </div>
  )
}
