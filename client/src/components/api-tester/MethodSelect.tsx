import React from 'react'
import type { HTTPMethod } from '../../types/api'
import { HTTP_METHODS } from '../../types/api'

interface MethodSelectProps {
  value: HTTPMethod
  onChange: (method: HTTPMethod) => void
  disabled?: boolean
}

/** Color hint per method — subtle, never dominant */
const methodAccent: Record<HTTPMethod, string> = {
  GET: 'text-[#22C55E]',
  POST: 'text-[#3B82F6]',
  PUT: 'text-[#F59E0B]',
  PATCH: 'text-[#A78BFA]',
  DELETE: 'text-[#EF4444]',
  HEAD: 'text-[#6B6B6B]',
  OPTIONS: 'text-[#FF6A00]',
}

export const MethodSelect: React.FC<MethodSelectProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div
      className="flex items-center border-r border-[var(--border-default)]"
      role="radiogroup"
      aria-label="HTTP method"
    >
      {/* Compact dropdown on narrow screens, pill group on wide */}
      <div className="sm:hidden">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as HTTPMethod)}
          disabled={disabled}
          className={[
            'h-10 px-3 text-xs font-mono tracking-widest font-bold',
            'bg-[var(--bg-input)] text-[var(--text-primary)] border-0 outline-none cursor-pointer',
            methodAccent[value],
            'disabled:opacity-50 disabled:cursor-not-allowed',
          ].join(' ')}
          aria-label="Select HTTP method"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Pill group — hidden on mobile */}
      <div className="hidden sm:flex items-stretch" role="group">
        {HTTP_METHODS.map((m) => {
          const isActive = m === value
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={disabled}
              onClick={() => onChange(m)}
              className={[
                'h-10 px-3 text-[11px] font-mono tracking-widest font-bold transition-all duration-150',
                'border-r border-[var(--border-subtle)] last:border-r-0',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? `bg-[var(--bg-panel-secondary)] ${methodAccent[m]} shadow-xs`
                  : 'bg-[var(--bg-input)] text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)]',
              ].join(' ')}
            >
              {m}
            </button>
          )
        })}
      </div>
    </div>
  )
}
