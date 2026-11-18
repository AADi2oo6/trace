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
import { toast } from '../store/toastStore'
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
    toast.success('Endpoint URL copied to clipboard')
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Handler: copy JSON text
  const handleCopyText = (text: string, type: 'body' | 'response') => {
    void navigator.clipboard.writeText(text)
    if (type === 'body') {
      setCopiedBody(true)
      toast.success('Request payload copied to clipboard')
      setTimeout(() => setCopiedBody(false), 2000)
    } else {
      setCopiedResponse(true)
      toast.success('Sample response copied to clipboard')
      setTimeout(() => setCopiedResponse(false), 2000)
    }
  }

  // Handler: send to API Tester
  const handleOpenInTester = (ep: DemoEndpointCatalogueItem) => {
    loadDemoEndpoint(ep, DEMO_BASE_URL)
    toast.info(`Loaded ${ep.method} ${ep.path} into API Tester`)
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
        <div className="flex items-center gap-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg px-3 py-1.5 shrink-0">
          <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold">BASE:</span>
          <code className="text-xs font-mono text-[var(--text-primary)]">{DEMO_BASE_URL}/demo</code>
          <button
            onClick={() => handleCopyUrl('')}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-sm"
            title="Copy Base URL"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded-md transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'border-blue-500 text-blue-500 bg-blue-500/10 font-bold'
                : 'border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border rounded-md transition-colors shrink-0 ${
                  isSelected
                    ? 'border-blue-500 text-blue-500 bg-blue-500/10 font-bold'
                    : 'border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search demo endpoints by name, path, tag, or status code..."
            className="w-full bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] pl-9 pr-3 py-2 font-mono placeholder:[var(--text-muted)] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Content Layout ───────────────────────────────────────── */}
      <div className="mt-6">
        {isLoading && (
          <div className="p-8 border border-[var(--border-default)] bg-[var(--bg-surface)] rounded-xl text-center font-mono text-xs text-[var(--text-muted)]">
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
                    className={`flex flex-col text-left p-3 border rounded-xl transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-[var(--bg-active)] shadow-xs'
                        : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 border rounded-xs font-semibold ${getMethodBadgeClass(
                            ep.method,
                          )}`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-medium text-[var(--text-primary)] truncate">
                          {ep.path}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 border rounded-md shrink-0 font-semibold ${getStatusBadgeClass(
                          ep.expected_status,
                        )}`}
                      >
                        {ep.expected_status}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-[var(--text-secondary)] line-clamp-1 font-medium">
                      {ep.name}
                    </div>

                    <div className="mt-1 text-[10px] text-[var(--text-muted)] line-clamp-2">
                      {ep.description}
                    </div>

                    {ep.tags.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {ep.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-mono px-1.5 py-0.2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-xs text-[var(--text-muted)]"
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
              <div className="lg:col-span-7 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-6 shadow-xs">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-muted)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono px-2 py-0.5 border rounded-xs font-bold ${getMethodBadgeClass(
                          activeEndpoint.method,
                        )}`}
                      >
                        {activeEndpoint.method}
                      </span>
                      <span className="text-sm font-mono font-semibold text-[var(--text-primary)]">
                        {activeEndpoint.path}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 border rounded-md font-semibold ${getStatusBadgeClass(
                          activeEndpoint.expected_status,
                        )}`}
                      >
                        Expected: {activeEndpoint.expected_status}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-[var(--text-secondary)]">{activeEndpoint.name}</div>
                  </div>

                  {/* Open in API Tester Button */}
                  <button
                    onClick={() => handleOpenInTester(activeEndpoint)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-xs"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Test in API Tester</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target URL with Copy */}
                <div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">
                    Target Execution URL
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg">
                    <code className="text-xs font-mono text-blue-500 break-all font-semibold">
                      {DEMO_BASE_URL}
                      {activeEndpoint.path}
                    </code>
                    <button
                      onClick={() => handleCopyUrl(activeEndpoint.path)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 shrink-0 rounded-sm"
                      title="Copy URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description & Technical Guidance */}
                <div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1 font-semibold">
                    Behavior & Testing Guidance
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {activeEndpoint.description}
                  </p>
                </div>

                {/* Query Parameters Section */}
                {activeEndpoint.query_params && activeEndpoint.query_params.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                      <Code2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Supported Query Parameters</span>
                    </div>
                    <div className="border border-[var(--border-default)] rounded-lg overflow-x-auto bg-[var(--bg-input)]">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[var(--bg-panel)] text-[var(--text-muted)] border-b border-[var(--border-muted)]">
                          <tr>
                            <th className="p-2 font-semibold">Param</th>
                            <th className="p-2 font-semibold">Type</th>
                            <th className="p-2 font-semibold">Default</th>
                            <th className="p-2 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-muted)] text-[var(--text-secondary)]">
                          {activeEndpoint.query_params.map((qp) => (
                            <tr key={qp.name} className="hover:bg-[var(--bg-hover)]">
                              <td className="p-2 text-blue-500 font-semibold">{qp.name}</td>
                              <td className="p-2 text-[var(--text-muted)]">{qp.type}</td>
                              <td className="p-2 text-[var(--text-primary)]">{String(qp.default ?? '—')}</td>
                              <td className="p-2 text-[var(--text-secondary)] text-[11px] leading-snug">
                                {qp.description}
                                {qp.options && (
                                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
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
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>Recommended Request Headers</span>
                    </div>
                    <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg space-y-1 font-mono text-xs">
                      {Object.entries(activeEndpoint.headers).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-[var(--text-muted)]">{k}:</span>
                          <span className="text-emerald-500 font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Request Body */}
                {activeEndpoint.body !== null && activeEndpoint.body !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                        <FileJson className="w-3.5 h-3.5 text-blue-500" />
                        <span>Sample Request Body (JSON)</span>
                      </div>
                      <button
                        onClick={() =>
                          handleCopyText(JSON.stringify(activeEndpoint.body, null, 2), 'body')
                        }
                        className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 rounded-sm"
                      >
                        {copiedBody ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedBody ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg font-mono text-xs text-[var(--text-primary)] overflow-x-auto max-h-48 leading-relaxed">
                      {JSON.stringify(activeEndpoint.body, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Sample / Expected Response Preview */}
                {activeEndpoint.sample_response !== null &&
                  activeEndpoint.sample_response !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sample Expected Response</span>
                        </div>
                        <button
                          onClick={() =>
                            handleCopyText(
                              JSON.stringify(activeEndpoint.sample_response, null, 2),
                              'response',
                            )
                          }
                          className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 rounded-sm"
                        >
                          {copiedResponse ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg font-mono text-xs text-[var(--text-primary)] overflow-x-auto max-h-48 leading-relaxed">
                        {JSON.stringify(activeEndpoint.sample_response, null, 2)}
                      </pre>
                    </div>
                  )}

                {/* Action Note Callout */}
                <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
                  <Terminal className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <strong className="text-[var(--text-primary)]">Controlled Testing Pipeline:</strong> When
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
