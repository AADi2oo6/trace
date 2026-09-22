import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Copy, Check, Search, X, ChevronUp, ChevronDown } from 'lucide-react'
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

/**
 * Splits `text` into segments alternating between non-matching and matching parts.
 * Safe: never injects HTML — each segment rendered as a React text node or <mark>.
 */
function getHighlightSegments(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  if (!query) return [{ text, match: false }]

  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const segments: Array<{ text: string; match: boolean }> = []
  let cursor = 0

  while (cursor < text.length) {
    const idx = lower.indexOf(lowerQuery, cursor)
    if (idx === -1) {
      segments.push({ text: text.slice(cursor), match: false })
      break
    }
    if (idx > cursor) {
      segments.push({ text: text.slice(cursor, idx), match: false })
    }
    segments.push({ text: text.slice(idx, idx + query.length), match: true })
    cursor = idx + query.length
  }

  return segments
}

/** Count the number of case-insensitive occurrences of `query` in `text`. */
function countMatches(text: string, query: string): number {
  if (!query) return 0
  let count = 0
  let idx = 0
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  while ((idx = lower.indexOf(lowerQuery, idx)) !== -1) {
    count++
    idx += query.length
  }
  return count
}

// ── Sub-component: highlighted body ──────────────────────────────────────────

interface HighlightedBodyProps {
  text: string
  query: string
  activeMatchIndex: number
  /** Callback that receives a ref-setter for the active match element (for scroll) */
  onActiveRef: (el: HTMLElement | null) => void
}

const HighlightedBody: React.FC<HighlightedBodyProps> = ({
  text,
  query,
  activeMatchIndex,
  onActiveRef,
}) => {
  if (!query) {
    return <>{text}</>
  }

  const segments = getHighlightSegments(text, query)
  let matchCounter = 0

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.match) {
          return <React.Fragment key={i}>{seg.text}</React.Fragment>
        }
        const matchIdx = matchCounter++
        const isActive = matchIdx === activeMatchIndex
        return (
          <mark
            key={i}
            ref={isActive ? onActiveRef : null}
            style={{
              backgroundColor: isActive ? '#FF6A00' : '#F59E0B50',
              color: isActive ? '#080808' : '#E8E8E8',
              borderRadius: 0,
            }}
          >
            {seg.text}
          </mark>
        )
      })}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export const ResponseBody: React.FC<ResponseBodyProps> = ({
  body,
  bodyType,
  bodySize,
  contentType,
}) => {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMatch, setActiveMatch] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleCopy = useCallback(async () => {
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
  }, [body, bodyType])

  // Compute display text
  const displayText = useMemo<string>(() => {
    if (bodyType === 'json' && body) return prettyJson(body)
    if (bodyType === 'html' && body) return escapeHtml(body)
    return body ?? ''
  }, [body, bodyType])

  const matchCount = useMemo(
    () => countMatches(displayText, searchQuery),
    [displayText, searchQuery],
  )

  // Clamp active match during render — derived value, no effect needed
  const clampedActiveMatch = matchCount > 0 ? Math.min(activeMatch, matchCount - 1) : 0

  // Scroll active match element into view via ref callback
  const handleActiveRef = useCallback((el: HTMLElement | null) => {
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setActiveMatch(0)
  }

  const handlePrev = () => {
    const count = matchCount
    if (count === 0) return
    setActiveMatch((prev) => {
      const clamped = Math.min(prev, count - 1)
      return clamped > 0 ? clamped - 1 : count - 1
    })
  }

  const handleNext = () => {
    const count = matchCount
    if (count === 0) return
    setActiveMatch((prev) => {
      const clamped = Math.min(prev, count - 1)
      return clamped < count - 1 ? clamped + 1 : 0
    })
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setActiveMatch(0)
    searchInputRef.current?.focus()
  }

  const showSearch = bodyType !== 'empty' && bodyType !== 'binary' && !!body

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

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1A1A1A] bg-[#0D0D0D]">
          <Search className="w-3.5 h-3.5 text-[#3A3A3A] shrink-0" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search in body…"
            aria-label="Search within response body"
            className={[
              'flex-1 text-xs font-mono bg-transparent border-0 outline-none',
              'text-[#E8E8E8] placeholder:text-[#2A2A2A]',
            ].join(' ')}
          />
          {searchQuery && (
            <>
              <span
                className="text-[10px] font-mono text-[#6B6B6B] whitespace-nowrap"
                aria-live="polite"
                aria-label={`${matchCount > 0 ? clampedActiveMatch + 1 : 0} of ${matchCount} matches`}
              >
                {matchCount > 0 ? `${clampedActiveMatch + 1} / ${matchCount}` : '0 / 0'} matches
              </span>
              <button
                type="button"
                onClick={handlePrev}
                disabled={matchCount === 0}
                aria-label="Previous match"
                className="text-[#3A3A3A] hover:text-[#E8E8E8] disabled:opacity-30 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={matchCount === 0}
                aria-label="Next match"
                className="text-[#3A3A3A] hover:text-[#E8E8E8] disabled:opacity-30 transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="text-[#3A3A3A] hover:text-[#E8E8E8] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Body text */}
      <pre
        className={[
          'overflow-auto px-4 py-4 text-xs font-mono leading-relaxed',
          'text-[#E8E8E8] bg-[#080808]',
          'whitespace-pre overflow-x-auto',
          'max-h-[480px]',
        ].join(' ')}
        aria-label="Response body"
      >
        <HighlightedBody
          text={displayText}
          query={searchQuery}
          activeMatchIndex={clampedActiveMatch}
          onActiveRef={handleActiveRef}
        />
      </pre>
    </div>
  )
}
