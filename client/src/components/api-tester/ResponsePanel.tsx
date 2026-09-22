import React, { useState } from 'react'
import { Send } from 'lucide-react'
import type { RequestResponse } from '../../types/api'
import { ResponseSummary } from './ResponseSummary'
import { ResponseBody } from './ResponseBody'
import { ResponseHeaders } from './ResponseHeaders'
import { ResponseAnalysis } from './ResponseAnalysis'
import { JourneyPreview } from './JourneyPreview'
import { SkeletonPanel, SkeletonText } from '../feedback/Skeleton'
import { Button } from '../ui/Button'

// ── Tabs ─────────────────────────────────────────────────────────────────────

type ResponseTab = 'body' | 'headers' | 'analysis' | 'journey'

interface TabDef {
  id: ResponseTab
  label: string
  available: (r: RequestResponse) => boolean
}

const TABS: TabDef[] = [
  {
    id: 'body',
    label: 'Body',
    // Body tab: always available when we got an HTTP response
    available: (r) => r.status_code !== null,
  },
  {
    id: 'headers',
    label: 'Headers',
    available: (r) => !!(r.headers && Object.keys(r.headers).length > 0),
  },
  {
    id: 'analysis',
    label: 'Analysis',
    available: (r) =>
      !!(r.dns_analysis || r.cors_analysis || r.options_analysis || r.header_analysis),
  },
  {
    id: 'journey',
    label: 'Journey',
    available: (r) => !!r.request_journey,
  },
]

// ── Loading skeleton ──────────────────────────────────────────────────────────

const ResponseSkeleton: React.FC = () => (
  <div className="animate-pulse" aria-busy="true" aria-label="Loading response…">
    {/* Summary row skeleton */}
    <div className="px-5 py-3 border-b border-[#1E1E1E] flex gap-3">
      <div className="skeleton-shimmer h-8 w-24" />
      <div className="skeleton-shimmer h-8 w-20" />
      <div className="skeleton-shimmer h-8 w-20" />
      <div className="skeleton-shimmer h-8 w-28" />
    </div>
    {/* Tab bar skeleton */}
    <div className="flex gap-0 border-b border-[#1E1E1E] px-5">
      {['Body', 'Headers', 'Analysis', 'Journey'].map((tab) => (
        <div key={tab} className="skeleton-shimmer h-8 w-16 mr-2 mt-1" />
      ))}
    </div>
    {/* Body skeleton */}
    <div className="p-5 space-y-4">
      <SkeletonPanel rows={6} />
      <SkeletonText lines={4} />
    </div>
  </div>
)

// ── Empty state ───────────────────────────────────────────────────────────────

interface IdleStateProps {
  onSend: () => void
}

const IdleState: React.FC<IdleStateProps> = ({ onSend }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    {/* Minimal network graphic */}
    <div className="flex items-center gap-2 mb-6 opacity-40" aria-hidden="true">
      <div className="w-8 h-px bg-[#2A2A2A]" />
      <div className="w-2 h-2 border border-[#3A3A3A] rotate-45" />
      <div className="w-8 h-px bg-[#2A2A2A]" />
      <div className="w-2 h-2 rounded-full bg-[#2A2A2A]" />
      <div className="w-8 h-px bg-[#2A2A2A]" />
    </div>
    <p className="text-[10px] font-mono tracking-widest text-[#2A2A2A] uppercase mb-2">
      No response yet
    </p>
    <p className="text-sm text-[#555555] max-w-xs leading-relaxed mb-6">
      Send a request to see the response, headers, DNS details, and network journey.
    </p>
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<Send className="w-3 h-3" />}
      onClick={onSend}
    >
      Send Request
    </Button>
  </div>
)

// ── Network-failure error display ─────────────────────────────────────────────

interface ErrorDisplayProps {
  title: string
  message: string
  onRetry: () => void
  responseError?: RequestResponse['error']
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  onRetry,
  responseError,
}) => (
  <div className="p-5 space-y-4">
    <div className="border border-[#EF444420] bg-[#EF444408] p-4">
      <p className="text-xs font-mono text-[#EF4444] tracking-wider uppercase mb-1">
        {title}
      </p>
      <p className="text-sm text-[#B0B0B0] leading-relaxed">{message}</p>
      {responseError && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-mono text-[#3A3A3A] tracking-widest uppercase">
            Error code
          </p>
          <p className="text-xs font-mono text-[#6B6B6B]">{responseError.code}</p>
          <p className="text-xs text-[#555555] leading-relaxed">{responseError.message}</p>
        </div>
      )}
    </div>
    <Button variant="secondary" size="sm" onClick={onRetry}>
      Retry
    </Button>
  </div>
)

// ── Compact inline HTTP-error notice ─────────────────────────────────────────

interface HttpErrorNoticeProps {
  statusCode: number
  message: string | null
  responseError?: RequestResponse['error']
}

const HttpErrorNotice: React.FC<HttpErrorNoticeProps> = ({
  statusCode,
  message,
  responseError,
}) => {
  const is4xx = statusCode >= 400 && statusCode < 500
  const label = is4xx ? 'HTTP Client Error' : 'HTTP Server Error'

  return (
    <div className="mx-5 my-3 flex items-start gap-3 border border-[#F59E0B30] bg-[#F59E0B08] px-4 py-3">
      <span className="text-[10px] font-mono text-[#F59E0B] tracking-wider uppercase shrink-0 mt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">
        {message && (
          <p className="text-xs text-[#B0B0B0] leading-relaxed">{message}</p>
        )}
        {responseError && (
          <p className="text-[10px] font-mono text-[#6B6B6B] mt-1">
            {responseError.code} — {responseError.message}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main ResponsePanel ────────────────────────────────────────────────────────

interface ResponsePanelProps {
  isPending: boolean
  response: RequestResponse | null
  networkError: { title: string; message: string } | null
  onSend: () => void
  onRetry: () => void
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  isPending,
  response,
  networkError,
  onSend,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body')

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isPending) {
    return (
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <ResponseSkeleton />
      </div>
    )
  }

  // ── Network-level error (backend unreachable, not HTTP error) ────────────
  if (networkError) {
    return (
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="px-5 py-3 border-b border-[#1E1E1E]">
          <p className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase">
            Response
          </p>
        </div>
        <ErrorDisplay
          title={networkError.title}
          message={networkError.message}
          onRetry={onRetry}
        />
      </div>
    )
  }

  // ── Idle (no response yet) ───────────────────────────────────────────────
  if (!response) {
    return (
      <div className="border border-[#1E1E1E] bg-[#0A0A0A]">
        <div className="px-5 py-3 border-b border-[#1E1E1E]">
          <p className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase">
            Response
          </p>
        </div>
        <IdleState onSend={onSend} />
      </div>
    )
  }

  // ── Response received ────────────────────────────────────────────────────
  //
  // CRITICAL DISTINCTION:
  // - "Network failure" = no HTTP response at all = status_code is null
  //   Examples: SSRF block, DNS failure, timeout, connection refused
  //   → show error panel ONLY (no tabs, because there's no body/headers to show)
  //
  // - "HTTP error response" = got a valid HTTP response with 4xx/5xx status
  //   Examples: 404 Not Found, 500 Internal Server Error
  //   → show summary + optional notice + ALL tabs (body/headers/analysis/journey)
  //
  const isNetworkFailure = response.status_code === null
  const isHttpErrorResponse = !response.success && response.status_code !== null

  // Build available tabs — only meaningful when we have a real HTTP response
  const availableTabs = isNetworkFailure ? [] : TABS.filter((t) => t.available(response))
  const currentTab = availableTabs.find((t) => t.id === activeTab)
    ? activeTab
    : (availableTabs[0]?.id ?? 'body')

  return (
    <div className="border border-[#1E1E1E] bg-[#0A0A0A] animate-fade-in">
      {/* Summary header */}
      <div className="px-5 border-b border-[#1E1E1E]">
        {response.status_code !== null ? (
          <ResponseSummary
            statusCode={response.status_code}
            statusText={response.status_text}
            statusCategory={response.status_category}
            durationMs={response.duration_ms}
            bodySizeBytes={response.body_size}
            contentType={response.content_type}
          />
        ) : (
          <div className="py-3">
            <p className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase">
              Response
            </p>
          </div>
        )}
      </div>

      {/* Network failure: show full error panel, no tabs */}
      {isNetworkFailure && (
        <ErrorDisplay
          title="Request failed"
          message={response.message ?? 'The request could not be completed.'}
          onRetry={onRetry}
          responseError={response.error ?? undefined}
        />
      )}

      {/* HTTP 4xx/5xx: show compact inline notice above tabs */}
      {isHttpErrorResponse && (
        <HttpErrorNotice
          statusCode={response.status_code!}
          message={response.message}
          responseError={response.error ?? undefined}
        />
      )}

      {/* Tab bar + panels — only for actual HTTP responses */}
      {!isNetworkFailure && (
        <>
          {/* Tab bar */}
          {availableTabs.length > 0 && (
            <div
              className="flex items-end border-b border-[#1E1E1E]"
              role="tablist"
              aria-label="Response data"
            >
              {availableTabs.map((tab) => {
                const isActive = tab.id === currentTab
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`res-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`res-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'px-4 py-2.5 text-xs font-mono tracking-wider',
                      'transition-colors duration-100 border-b-2 -mb-px',
                      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00] focus-visible:ring-inset',
                      isActive
                        ? 'text-[#E8E8E8] border-[#FF6A00]'
                        : 'text-[#3A3A3A] border-transparent hover:text-[#6B6B6B]',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Panels */}
          <div>
            {/* Body */}
            {currentTab === 'body' && (
              <div
                id="res-panel-body"
                role="tabpanel"
                aria-labelledby="res-tab-body"
              >
                <ResponseBody
                  body={response.body}
                  bodyType={response.body_type}
                  bodySize={response.body_size}
                  contentType={response.content_type}
                />
              </div>
            )}

            {/* Headers */}
            {currentTab === 'headers' && response.headers && (
              <div
                id="res-panel-headers"
                role="tabpanel"
                aria-labelledby="res-tab-headers"
              >
                <ResponseHeaders headers={response.headers} />
              </div>
            )}

            {/* Analysis */}
            {currentTab === 'analysis' && (
              <div
                id="res-panel-analysis"
                role="tabpanel"
                aria-labelledby="res-tab-analysis"
              >
                <ResponseAnalysis
                  dnsAnalysis={response.dns_analysis}
                  corsAnalysis={response.cors_analysis}
                  optionsAnalysis={response.options_analysis}
                  headerAnalysis={response.header_analysis}
                  currentMethod={response.method || 'GET'}
                />
              </div>
            )}

            {/* Journey */}
            {currentTab === 'journey' && response.request_journey && (
              <div
                id="res-panel-journey"
                role="tabpanel"
                aria-labelledby="res-tab-journey"
              >
                <JourneyPreview journey={response.request_journey} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
