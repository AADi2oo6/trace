import React from 'react'
import { Route, Terminal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { useRequestStore } from '../store/requestStore'
import { JourneyHeader } from '../components/journey/JourneyHeader'
import { JourneyTimeline } from '../components/journey/JourneyTimeline'
import { JourneySummary } from '../components/journey/JourneySummary'
import { JourneyEmptyState } from '../components/journey/JourneyEmptyState'
import { JourneyErrorState } from '../components/journey/JourneyErrorState'
import { Button } from '../components/ui/Button'

export const RequestJourneyPage: React.FC = () => {
  const navigate = useNavigate()
  const lastResponse = useRequestStore((s) => s.lastResponse)
  const lastRequestPayload = useRequestStore((s) => s.lastRequestPayload)
  const lastNetworkError = useRequestStore((s) => s.lastNetworkError)

  // Case 1: Pure network-level exception (e.g. TRACE backend unreachable)
  if (lastNetworkError && !lastResponse) {
    return (
      <PageContainer
        title="Request Journey"
        description="Truthful end-to-end visualization of the HTTP request lifecycle phases."
        icon={<Route className="w-4 h-4" />}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          <div className="border border-[#EF444430] bg-[#EF444408] p-6 space-y-3">
            <p className="text-[10px] font-mono tracking-widest text-[#EF4444] uppercase font-bold">
              {lastNetworkError.title}
            </p>
            <p className="text-sm font-mono text-[#E8E8E8]">
              {lastNetworkError.message}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/tester')}
            >
              Open API Tester
            </Button>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Case 2: No request executed yet
  if (!lastResponse) {
    return (
      <PageContainer
        title="Request Journey"
        description="Truthful end-to-end visualization of the HTTP request lifecycle phases."
        icon={<Route className="w-4 h-4" />}
      >
        <JourneyEmptyState />
      </PageContainer>
    )
  }

  // Case 3: Target network failure (e.g. SSRF blocked, host not resolved, timeout)
  // When status_code is null, no HTTP response was received.
  if (lastResponse.status_code === null) {
    return (
      <PageContainer
        title="Request Journey"
        description="Truthful end-to-end visualization of the HTTP request lifecycle phases."
        icon={<Route className="w-4 h-4" />}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          <JourneyErrorState response={lastResponse} />
        </div>
      </PageContainer>
    )
  }

  // Case 4: Valid HTTP response received (2xx, 3xx, 4xx, 5xx)
  const url = lastResponse.url || lastRequestPayload?.url || '—'
  const method = lastResponse.method || lastRequestPayload?.method || 'GET'
  const journey = lastResponse.request_journey

  if (!journey) {
    return (
      <PageContainer
        title="Request Journey"
        description="Truthful end-to-end visualization of the HTTP request lifecycle phases."
        icon={<Route className="w-4 h-4" />}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-6 text-center text-xs font-mono text-[#555555]">
            No request journey data was synthesized for this response.
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="Request Journey"
      description="Truthful end-to-end visualization of the HTTP request lifecycle phases."
      icon={<Route className="w-4 h-4" />}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-fade-in">
        {/* Top Navigation & Status */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">
            Active Request Lifecycle
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analysis')}
            >
              View Network Analysis
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/tester')}
              leftIcon={<Terminal className="w-3.5 h-3.5" />}
            >
              Switch to API Tester
            </Button>
          </div>
        </div>

        {/* Journey Header */}
        <JourneyHeader
          method={method}
          url={url}
          statusCode={lastResponse.status_code}
          statusText={lastResponse.status_text}
          statusCategory={lastResponse.status_category}
          totalDurationMs={lastResponse.duration_ms}
          journey={journey}
        />

        {/* Vertical Journey Timeline */}
        <section aria-label="Request lifecycle timeline">
          <JourneyTimeline journey={journey} />
        </section>

        {/* Journey Summary */}
        <section aria-label="Request journey summary">
          <JourneySummary
            journey={journey}
            totalDurationMs={lastResponse.duration_ms}
          />
        </section>
      </div>
    </PageContainer>
  )
}
