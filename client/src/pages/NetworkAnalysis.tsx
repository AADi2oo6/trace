import React from 'react'
import { Network, Terminal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { useRequestStore } from '../store/requestStore'
import { AnalysisHeader } from '../components/analysis/AnalysisHeader'
import { DnsAnalysisPanel } from '../components/analysis/DnsAnalysisPanel'
import { HeaderAnalysisPanel } from '../components/analysis/HeaderAnalysisPanel'
import { CorsAnalysisPanel } from '../components/analysis/CorsAnalysisPanel'
import { OptionsAnalysisPanel } from '../components/analysis/OptionsAnalysisPanel'
import { AnalysisEmptyState } from '../components/analysis/AnalysisEmptyState'
import { AnalysisErrorState } from '../components/analysis/AnalysisErrorState'
import { Button } from '../components/ui/Button'

export const NetworkAnalysis: React.FC = () => {
  const navigate = useNavigate()
  const lastResponse = useRequestStore((s) => s.lastResponse)
  const lastRequestPayload = useRequestStore((s) => s.lastRequestPayload)
  const lastNetworkError = useRequestStore((s) => s.lastNetworkError)

  // Case 1: Pure network-level exception (e.g. TRACE backend unreachable)
  if (lastNetworkError && !lastResponse) {
    return (
      <PageContainer
        title="Network Analysis"
        description="Technical inspection of DNS resolution, HTTP headers, CORS policies, and server capabilities."
        icon={<Network className="w-4 h-4" />}
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
        title="Network Analysis"
        description="Technical inspection of DNS resolution, HTTP headers, CORS policies, and server capabilities."
        icon={<Network className="w-4 h-4" />}
      >
        <AnalysisEmptyState />
      </PageContainer>
    )
  }

  // Case 3: Target network failure (e.g. SSRF blocked, host not resolved, timeout)
  // When status_code is null, no HTTP response was received.
  if (lastResponse.status_code === null) {
    return (
      <PageContainer
        title="Network Analysis"
        description="Technical inspection of DNS resolution, HTTP headers, CORS policies, and server capabilities."
        icon={<Network className="w-4 h-4" />}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          <AnalysisErrorState response={lastResponse} />
        </div>
      </PageContainer>
    )
  }

  // Case 4: Valid HTTP response received (2xx, 3xx, 4xx, 5xx)
  const url = lastResponse.url || lastRequestPayload?.url || '—'
  const method = lastResponse.method || lastRequestPayload?.method || 'GET'

  return (
    <PageContainer
      title="Network Analysis"
      description="Technical inspection of DNS resolution, HTTP headers, CORS policies, and server capabilities."
      icon={<Network className="w-4 h-4" />}
    >
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6 animate-fade-in">
        {/* Top Context & Summary */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono tracking-widest text-[#444444] uppercase">
            Active Request Analysis
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/tester')}
            leftIcon={<Terminal className="w-3.5 h-3.5" />}
          >
            Switch to API Tester
          </Button>
        </div>

        <AnalysisHeader
          url={url}
          method={method}
          statusCode={lastResponse.status_code}
          statusText={lastResponse.status_text}
          statusCategory={lastResponse.status_category}
          durationMs={lastResponse.duration_ms}
          dnsAnalysis={lastResponse.dns_analysis}
          headerAnalysis={lastResponse.header_analysis}
          corsAnalysis={lastResponse.cors_analysis}
          optionsAnalysis={lastResponse.options_analysis}
        />

        {/* 1. DNS Resolution */}
        <section aria-labelledby="dns-heading">
          <DnsAnalysisPanel dnsAnalysis={lastResponse.dns_analysis} />
        </section>

        {/* 2. HTTP Header Analysis */}
        <section aria-labelledby="headers-heading">
          <HeaderAnalysisPanel headerAnalysis={lastResponse.header_analysis} />
        </section>

        {/* 3. CORS Analysis */}
        <section aria-labelledby="cors-heading">
          <CorsAnalysisPanel corsAnalysis={lastResponse.cors_analysis} />
        </section>

        {/* 4. OPTIONS Analysis */}
        <section aria-labelledby="options-heading">
          <OptionsAnalysisPanel
            optionsAnalysis={lastResponse.options_analysis}
            currentMethod={method}
          />
        </section>
      </div>
    </PageContainer>
  )
}
