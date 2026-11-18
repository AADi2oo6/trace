import React from 'react'
import { Send, RotateCcw } from 'lucide-react'
import { MethodSelect } from './MethodSelect'
import { UrlInput } from './UrlInput'
import { Button } from '../ui/Button'
import type { HTTPMethod } from '../../types/api'

interface RequestBarProps {
  method: HTTPMethod
  url: string
  isPending: boolean
  urlError?: string | null
  onMethodChange: (method: HTTPMethod) => void
  onUrlChange: (url: string) => void
  onSend: () => void
  onReset: () => void
}

export const RequestBar: React.FC<RequestBarProps> = ({
  method,
  url,
  isPending,
  urlError,
  onMethodChange,
  onUrlChange,
  onSend,
  onReset,
}) => {
  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-lg overflow-hidden shadow-xs">
      {/* Main row */}
      <div className="flex items-stretch">
        {/* Method selector */}
        <MethodSelect
          value={method}
          onChange={onMethodChange}
          disabled={isPending}
        />

        {/* URL input — flex-1 */}
        <UrlInput
          value={url}
          onChange={onUrlChange}
          onSubmit={onSend}
          disabled={isPending}
          error={urlError}
          autoFocus
        />

        {/* Actions */}
        <div className="flex items-center gap-1.5 px-3 border-l border-[var(--border-default)] bg-[var(--bg-surface-secondary)] shrink-0">
          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            disabled={isPending}
            title="Reset editor (clear all fields)"
            aria-label="Reset editor"
            className={[
              'p-2 text-[var(--text-dim)] hover:text-[var(--text-primary)] rounded transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Send */}
          <Button
            variant="primary"
            size="sm"
            onClick={onSend}
            loading={isPending}
            disabled={isPending || !url.trim()}
            leftIcon={!isPending ? <Send className="w-3 h-3" /> : undefined}
            aria-label={isPending ? 'Sending request…' : 'Send request (Ctrl+Enter)'}
            title="Send request (Ctrl+Enter)"
          >
            {isPending ? 'Sending' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
