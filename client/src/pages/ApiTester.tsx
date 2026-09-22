import React, { useState, useCallback } from 'react'
import { Terminal } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { RequestBar } from '../components/api-tester/RequestBar'
import { RequestTabs } from '../components/api-tester/RequestTabs'
import { ResponsePanel } from '../components/api-tester/ResponsePanel'
import { useRequestStore } from '../store/requestStore'
import { useExecuteRequest } from '../hooks/useExecuteRequest'

// ── URL validation (client-side, before sending) ──────────────────────────────

function validateUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return 'URL is required'
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return "URL must start with 'http://' or 'https://'"
  }
  try {
    const parsed = new URL(trimmed)
    if (!parsed.hostname) return 'URL must include a valid host'
  } catch {
    return 'Invalid URL format'
  }
  return null
}

// ── JSON body validation ──────────────────────────────────────────────────────

function validateJsonBody(bodyText: string, bodyType: string): string | null {
  if (bodyType !== 'json' || !bodyText.trim()) return null
  try {
    JSON.parse(bodyText)
    return null
  } catch (err) {
    return err instanceof Error ? err.message : 'Invalid JSON'
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const ApiTester: React.FC = () => {
  const [urlError, setUrlError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)

  const {
    method, url, bodyContentType, bodyText,
    setMethod, setUrl, resetEditor, buildPayload,
  } = useRequestStore()

  const { send, isPending, data, error, reset, status } = useExecuteRequest()

  // Derive network error message for the response panel
  const networkError =
    error && status === 'error'
      ? { title: error.title, message: error.message }
      : null

  // ── Send handler ────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    // Clear previous errors
    setUrlError(null)
    setBodyError(null)

    // Validate URL
    const uErr = validateUrl(url)
    if (uErr) {
      setUrlError(uErr)
      return
    }

    // Validate JSON body
    const bErr = validateJsonBody(bodyText, bodyContentType)
    if (bErr) {
      setBodyError(bErr)
      return
    }

    // Build and send
    const payload = buildPayload()
    reset() // clear previous result before new request
    send(payload)
  }, [url, bodyText, bodyContentType, buildPayload, reset, send])

  // ── Reset handler ───────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    resetEditor()
    setUrlError(null)
    setBodyError(null)
    reset()
  }, [resetEditor, reset])

  // ── Retry ───────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    handleSend()
  }, [handleSend])

  return (
    <PageContainer
      title="API Tester"
      description="Send HTTP requests and inspect the full network response — headers, body, DNS, CORS, and journey."
      icon={<Terminal className="w-4 h-4" />}
    >
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-5 py-5 space-y-4">

            {/* ── Request Bar ──────────────────────────────────────── */}
            <RequestBar
              method={method}
              url={url}
              isPending={isPending}
              urlError={urlError}
              onMethodChange={(m) => {
                setMethod(m)
                setUrlError(null)
              }}
              onUrlChange={(u) => {
                setUrl(u)
                if (urlError) setUrlError(null)
              }}
              onSend={handleSend}
              onReset={handleReset}
            />

            {/* ── Request Configuration ─────────────────────────── */}
            <div className="border border-[#1E1E1E] bg-[#0A0A0A] px-5 py-4">
              <p className="text-[9px] font-mono tracking-widest text-[#2A2A2A] uppercase mb-3 select-none">
                Request Configuration
              </p>
              <RequestTabs
                bodyValidationError={bodyError}
                disabled={isPending}
              />
            </div>

            {/* ── Response Panel ────────────────────────────────── */}
            <ResponsePanel
              isPending={isPending}
              response={data}
              networkError={networkError}
              onSend={handleSend}
              onRetry={handleRetry}
            />

          </div>
        </div>
      </div>
    </PageContainer>
  )
}
