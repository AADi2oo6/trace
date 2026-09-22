import React, { useRef } from 'react'
import type { BodyContentType } from '../../store/requestStore'

interface BodyEditorProps {
  bodyContentType: BodyContentType
  bodyText: string
  onTypeChange: (type: BodyContentType) => void
  onTextChange: (text: string) => void
  validationError?: string | null
  disabled?: boolean
}

const TYPE_OPTIONS: { value: BodyContentType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'text', label: 'Text' },
]

export const BodyEditor: React.FC<BodyEditorProps> = ({
  bodyContentType,
  bodyText,
  onTypeChange,
  onTextChange,
  validationError,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTypeChange = (type: BodyContentType) => {
    onTypeChange(type)
    if (type !== 'none') {
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Type selector row */}
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Body content type">
        {TYPE_OPTIONS.map((opt) => {
          const isActive = opt.value === bodyContentType
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleTypeChange(opt.value)}
              disabled={disabled}
              className={[
                'px-3 py-1 text-xs font-mono tracking-wider transition-colors duration-100',
                'border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                isActive
                  ? 'border-[#FF6A00] text-[#FF6A00] bg-[#FF6A000D]'
                  : 'border-[#1E1E1E] text-[#3A3A3A] hover:text-[#6B6B6B] hover:border-[#2A2A2A]',
              ].join(' ')}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Editor area — only shown when type is not 'none' */}
      {bodyContentType !== 'none' && (
        <div className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={bodyText}
            onChange={(e) => onTextChange(e.target.value)}
            disabled={disabled}
            placeholder={
              bodyContentType === 'json'
                ? '{\n  "key": "value"\n}'
                : 'Request body text…'
            }
            rows={10}
            spellCheck={false}
            autoComplete="off"
            aria-label="Request body"
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'body-error' : undefined}
            className={[
              'w-full px-4 py-3 text-xs font-mono leading-relaxed resize-y',
              'bg-[#0A0A0A] text-[#E8E8E8] placeholder:text-[#2A2A2A]',
              'border outline-none transition-colors duration-100',
              'selection:bg-[#FF6A00] selection:text-black',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              validationError
                ? 'border-[#EF444430]'
                : 'border-[#1E1E1E] focus:border-[#2A2A2A]',
            ].join(' ')}
          />

          {/* Validation error */}
          {validationError && (
            <div
              id="body-error"
              className="flex items-start gap-2 px-3 py-2 bg-[#EF444408] border border-t-0 border-[#EF444420]"
              role="alert"
            >
              <span className="text-[#EF4444] text-[10px] font-mono leading-relaxed">
                Invalid JSON — {validationError}
              </span>
            </div>
          )}
        </div>
      )}

      {bodyContentType === 'none' && (
        <p className="text-[11px] text-[#3A3A3A] font-mono">
          No request body. Select JSON or Text to add a body.
        </p>
      )}
    </div>
  )
}
