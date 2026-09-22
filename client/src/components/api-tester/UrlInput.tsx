import React, { useRef, useEffect } from 'react'

interface UrlInputProps {
  value: string
  onChange: (url: string) => void
  onSubmit: () => void
  disabled?: boolean
  error?: string | null
  autoFocus?: boolean
}

export const UrlInput: React.FC<UrlInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  error,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="https://api.example.com/endpoint"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Request URL"
        aria-invalid={!!error}
        aria-describedby={error ? 'url-error' : undefined}
        className={[
          'h-10 w-full px-4 text-sm font-mono tracking-wide',
          'bg-[#0A0A0A] border-0 outline-none',
          'text-[#F5F5F5] placeholder:text-[#3A3A3A]',
          'selection:bg-[#FF6A00] selection:text-black',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-100',
        ].join(' ')}
      />
      {error && (
        <span
          id="url-error"
          className="px-4 py-1 text-[10px] font-mono text-[#EF4444] bg-[#EF444408] border-t border-[#EF444420]"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
}
