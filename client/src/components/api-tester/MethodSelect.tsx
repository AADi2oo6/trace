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
      className="flex items-center border-r border-[#222222]"
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
            'bg-[#0D0D0D] border-0 outline-none cursor-pointer',
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
                'h-10 px-3 text-[11px] font-mono tracking-widest font-bold transition-colors duration-100',
                'border-r border-[#1A1A1A] last:border-r-0',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00] focus-visible:ring-inset',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? `bg-[#151515] ${methodAccent[m]}`
                  : 'bg-[#0D0D0D] text-[#3A3A3A] hover:text-[#6B6B6B] hover:bg-[#111111]',
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
