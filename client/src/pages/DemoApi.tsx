import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FlaskConical,
  Search,
  Copy,
  Check,
  ArrowRight,
  Terminal,
  Code2,
  FileJson,
  Layers,
  Sparkles,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { EmptyState } from '../components/feedback/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState'
import { fetchDemoCatalogue, DEMO_BASE_URL } from '../lib/api'
import { useRequestStore } from '../store/requestStore'
import type { DemoEndpointCatalogueItem } from '../types/api'

export const DemoApi: React.FC = () => {
  const navigate = useNavigate()
  const loadDemoEndpoint = useRequestStore((state) => state.loadDemoEndpoint)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedBody, setCopiedBody] = useState(false)
  const [copiedResponse, setCopiedResponse] = useState(false)

  // Query: fetch demo catalogue from backend
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['demo-catalogue'],
    queryFn: fetchDemoCatalogue,
  })

  // Filtered endpoints based on category and search query
  const filteredEndpoints = useMemo(() => {
    if (!data?.endpoints) return []

    return data.endpoints.filter((ep) => {
      const matchesCategory = selectedCategory === 'ALL' || ep.category === selectedCategory
      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true

      const q = searchQuery.toLowerCase().trim()
      return (
        ep.name.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [data, selectedCategory, searchQuery])

  // Active selected endpoint
  const activeEndpoint: DemoEndpointCatalogueItem | null = useMemo(() => {
    if (!data?.endpoints || data.endpoints.length === 0) return null
    if (selectedEndpointId) {
      const found = data.endpoints.find((ep) => ep.id === selectedEndpointId)
      if (found) return found
    }
    // Default to the first endpoint in the filtered list
    return filteredEndpoints[0] || data.endpoints[0] || null
  }, [data, selectedEndpointId, filteredEndpoints])

  // Handler: copy full endpoint URL
  const handleCopyUrl = (path: string) => {
    const fullUrl = `${DEMO_BASE_URL}${path}`
    void navigator.clipboard.writeText(fullUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Handler: copy JSON text
  const handleCopyText = (text: string, type: 'body' | 'response') => {
    void navigator.clipboard.writeText(text)
    if (type === 'body') {
      setCopiedBody(true)
      setTimeout(() => setCopiedBody(false), 2000)
    } else {
      setCopiedResponse(true)
      setTimeout(() => setCopiedResponse(false), 2000)
    }
  }

  // Handler: send to API Tester
  const handleOpenInTester = (ep: DemoEndpointCatalogueItem) => {
    loadDemoEndpoint(ep, DEMO_BASE_URL)
    navigate('/tester')
  }

  // Badge helpers
  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
      case 'POST':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/40'
      case 'OPTIONS':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/40'
      default:
        return 'text-[#FF6A00] bg-[#FF6A00]/10 border-[#FF6A00]/30'
    }
  }

  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40'
    }
    if (status >= 300 && status < 400) {
      return 'text-blue-400 bg-blue-950/30 border-blue-800/40'
    }
    if (status >= 400 && status < 500) {
      return 'text-amber-400 bg-amber-950/30 border-amber-800/40'
    }
    return 'text-rose-400 bg-rose-950/30 border-rose-800/40'
  }

  return (
    <PageContainer
      title="Controlled Demo API"
      description="Predictable endpoints for testing HTTP methods, status codes, CORS preflight, delays, headers, and SSRF boundaries."
      icon={<FlaskConical className="w-4 h-4" />}
      actions={
        <div className="flex items-center gap-2 bg-[#121212] border border-[#222222] px-3 py-1.5 shrink-0">
          <span className="text-[11px] font-mono text-[#666666]">BASE:</span>
          <code className="text-xs font-mono text-[#E8E8E8]">{DEMO_BASE_URL}/demo</code>
          <button
            onClick={() => handleCopyUrl('')}
            className="text-[#666666] hover:text-[#FF6A00] transition-colors p-1"
            title="Copy Base URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      }
    >
      {/* ── Category Filters & Search Bar ──────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]'
                : 'bg-[#121212] border-[#222222] text-[#888888] hover:border-[#333333] hover:text-[#CCCCCC]'
            }`}
          >
            All ({data?.total || 0})
          </button>
          {data?.categories.map((cat) => {
            const count = data.endpoints.filter((ep) => ep.category === cat).length
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#FF6A00]/10 border-[#FF6A00] text-[#FF6A00]'
                    : 'bg-[#121212] border-[#222222] text-[#888888] hover:border-[#333333] hover:text-[#CCCCCC]'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#555555] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search demo endpoints by name, path, tag, or status code..."
            className="w-full bg-[#0D0D0D] border border-[#1E1E1E] text-xs text-[#E8E8E8] pl-9 pr-3 py-2 font-mono placeholder:text-[#444444] focus:outline-none focus:border-[#FF6A00] transition-colors"
          />
        </div>
      </div>

      {/* ── Content Layout ───────────────────────────────────────── */}
      <div className="mt-6">
        {isLoading && (
          <div className="p-8 border border-[#1E1E1E] bg-[#0E0E0E] text-center font-mono text-xs text-[#666666]">
            Loading TRACE Demo API Catalogue...
          </div>
        )}

        {isError && (
          <ErrorState
            title="Failed to Load Demo Catalogue"
            message={error instanceof Error ? error.message : 'Could not fetch endpoints from backend.'}
            onRetry={() => void refetch()}
          />
        )}

        {!isLoading && !isError && filteredEndpoints.length === 0 && (
          <EmptyState
            title="No Matching Endpoints Found"
            description={`No demo endpoints match "${searchQuery}". Try selecting another category or clearing the search query.`}
          />
        )}

        {!isLoading && !isError && filteredEndpoints.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ── Left Column: Endpoints List (5 cols) ─────────────── */}
            <div className="lg:col-span-5 flex flex-col gap-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredEndpoints.map((ep) => {
                const isSelected = activeEndpoint?.id === ep.id
                return (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpointId(ep.id)}
                    className={`flex flex-col text-left p-3 border transition-all ${
                      isSelected
                        ? 'border-[#FF6A00] bg-[#161616] shadow-sm'
                        : 'border-[#1E1E1E] bg-[#0E0E0E] hover:border-[#2C2C2C] hover:bg-[#121212]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 border font-semibold ${getMethodBadgeClass(
                            ep.method,
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-medium text-[#E8E8E8] truncate">
                          {ep.path}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 border shrink-0 ${getStatusBadgeClass(
                          ep.expected_status,
                        )}`}
                      >
                        {ep.expected_status}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-[#A0A0A0] line-clamp-1">
                      {ep.name}
                    </div>

                    <div className="mt-1 text-[10px] text-[#666666] line-clamp-2">
                      {ep.description}
                    </div>

                    {ep.tags.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {ep.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.2 bg-[#121212] border border-[#222222] text-[#777777]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ── Right Column: Selected Endpoint Inspector (7 cols) ─ */}
            {activeEndpoint && (
              <div className="lg:col-span-7 border border-[#1E1E1E] bg-[#0E0E0E] p-5 space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E1E]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 border font-bold ${getMethodBadgeClass(
                          activeEndpoint.method,
                        )}`}
                      >
                        {activeEndpoint.method}
                      </span>
                      <span className="text-sm font-mono font-semibold text-[#FFFFFF]">
                        {activeEndpoint.path}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 border ${getStatusBadgeClass(
                          activeEndpoint.expected_status,
                        )}`}
                      >
                        Expected: {activeEndpoint.expected_status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[#E8E8E8]">{activeEndpoint.name}</div>
                  </div>

                  {/* Open in API Tester Button */}
                  <button
                    onClick={() => handleOpenInTester(activeEndpoint)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6A00] hover:bg-[#FF7A1A] text-black font-mono text-xs font-bold transition-colors shrink-0 shadow-sm"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Test in API Tester</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target URL with Copy */}
                <div>
                  <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-1">
                    Target Execution URL
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-[#121212] border border-[#222222]">
                    <code className="text-xs font-mono text-[#FF6A00] break-all">
                      {DEMO_BASE_URL}
                      {activeEndpoint.path}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(activeEndpoint.path)}
                      className="text-[#888888] hover:text-[#FFFFFF] transition-colors p-1 shrink-0"
                      title="Copy URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description & Technical Guidance */}
                <div>
                  <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-1">
                    Behavior & Testing Guidance
                  </div>
                  <p className="text-xs text-[#CCCCCC] leading-relaxed">
                    {activeEndpoint.description}
                  </p>
                </div>

                {/* Query Parameters Section */}
                {activeEndpoint.query_params && activeEndpoint.query_params.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Supported Query Parameters</span>
                    </div>
                    <div className="border border-[#1E1E1E] overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#121212] text-[#888888] border-b border-[#1E1E1E]">
                          <tr>
                            <th className="p-2 font-normal">Param</th>
                            <th className="p-2 font-normal">Type</th>
                            <th className="p-2 font-normal">Default</th>
                            <th className="p-2 font-normal">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A1A1A] text-[#CCCCCC]">
                          {activeEndpoint.query_params.map((qp) => (
                            <tr key={qp.name} className="hover:bg-[#121212]/50">
                              <td className="p-2 text-[#FF6A00] font-semibold">{qp.name}</td>
                              <td className="p-2 text-[#888888]">{qp.type}</td>
                              <td className="p-2 text-[#AAAAAA]">{String(qp.default ?? '—')}</td>
                              <td className="p-2 text-[#999999] text-[11px] leading-snug">
                                {qp.description}
                                {qp.options && (
                                  <div className="text-[10px] text-[#666666] mt-0.5">
                                    Options: {qp.options.join(', ')}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Request Headers Section */}
                {activeEndpoint.headers && Object.keys(activeEndpoint.headers).length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#888888]" />
                      <span>Recommended Request Headers</span>
                    </div>
                    <div className="p-3 bg-[#121212] border border-[#1E1E1E] space-y-1 font-mono text-xs">
                      {Object.entries(activeEndpoint.headers).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-[#888888]">{k}:</span>
                          <span className="text-emerald-400 font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Request Body */}
                {activeEndpoint.body !== null && activeEndpoint.body !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-[#888888]" />
                        <span>Sample Request Body (JSON)</span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyText(JSON.stringify(activeEndpoint.body, null, 2), 'body')
                        }
                        className="text-[11px] font-mono text-[#888888] hover:text-[#FFFFFF] flex items-center gap-1"
                      >
                        {copiedBody ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-[#080808] border border-[#1E1E1E] font-mono text-xs text-[#CCCCCC] overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(activeEndpoint.body, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Sample / Expected Response Preview */}
                {activeEndpoint.sample_response !== null &&
                  activeEndpoint.sample_response !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-mono text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#888888]" />
                          <span>Sample Expected Response</span>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyText(
                              JSON.stringify(activeEndpoint.sample_response, null, 2),
                              'response',
                            )
                          }
                          className="text-[11px] font-mono text-[#888888] hover:text-[#FFFFFF] flex items-center gap-1"
                        >
                          {copiedResponse ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-[#080808] border border-[#1E1E1E] font-mono text-xs text-emerald-400/90 overflow-x-auto max-h-56 leading-relaxed">
                        {JSON.stringify(activeEndpoint.sample_response, null, 2)}
                      </pre>
                    </div>
                  )}

                {/* Action Note Callout */}
                <div className="p-3 bg-[#111111] border border-[#222222] flex items-start gap-2.5 text-xs text-[#888888]">
                  <Terminal className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-[#CCCCCC]">Controlled Testing Pipeline:</strong> When
                    you click &quot;Test in API Tester&quot;, TRACE configures the request parameters
                    and headers in the editor without triggering execution. You can inspect the
                    setup, adjust parameters, and send the request via the standard pipeline.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
