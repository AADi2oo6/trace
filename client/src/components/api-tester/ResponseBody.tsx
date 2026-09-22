import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { BodyType } from '../../types/api'

interface ResponseBodyProps {
  body: string | null
  bodyType: BodyType | null
  bodySize: number | null
  contentType: string | null
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export const ResponseBody: React.FC<ResponseBodyProps> = ({
  body,
  bodyType,
  bodySize,
  contentType,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!body) return
    try {
      await navigator.clipboard.writeText(
        bodyType === 'json' ? prettyJson(body) : body,
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available in some contexts
    }
  }

  // ── Empty ──────────────────────────────────────────────────────────────
  if (bodyType === 'empty' || (!body && bodyType !== 'binary')) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs font-mono text-[#3A3A3A]">(empty body)</p>
      </div>
    )
  }

  // ── Binary ─────────────────────────────────────────────────────────────
  if (bodyType === 'binary') {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <div className="w-8 h-8 border border-[#2A2A2A] flex items-center justify-center">
          <span className="text-[10px] font-mono text-[#3A3A3A]">BIN</span>
        </div>
        <p className="text-xs font-mono text-[#6B6B6B]">Binary response</p>
        {bodySize !== null && (
          <p className="text-[11px] font-mono text-[#3A3A3A]">{formatBytes(bodySize)}</p>
        )}
        {contentType && (
          <p className="text-[11px] font-mono text-[#3A3A3A]">{contentType}</p>
        )}
      </div>
    )
  }

  // ── Text content (JSON, text, HTML) ────────────────────────────────────
  const displayText =
    bodyType === 'json' && body ? prettyJson(body) :
    bodyType === 'html' && body ? escapeHtml(body) :
    body ?? ''

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A] bg-[#0D0D0D]">
        <div className="flex items-center gap-3">
          {contentType && (
            <span className="text-[10px] font-mono text-[#3A3A3A]">{contentType}</span>
          )}
          {bodySize !== null && (
            <span className="text-[10px] font-mono text-[#2A2A2A]">
              {formatBytes(bodySize)}
            </span>
          )}
        </div>

        {/* Copy button */}
        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={!body}
          aria-label="Copy response body"
          className={[
            'flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono',
            'text-[#3A3A3A] hover:text-[#E8E8E8] transition-colors duration-100',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-[#22C55E]" />
              <span className="text-[#22C55E]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Body text */}
      <pre
        className={[
          'overflow-auto px-4 py-4 text-xs font-mono leading-relaxed',
          'text-[#E8E8E8] bg-[#080808]',
          'whitespace-pre-wrap break-all',
          'max-h-[480px]',
        ].join(' ')}
        aria-label="Response body"
      >
        {displayText}
      </pre>
    </div>
  )
}
