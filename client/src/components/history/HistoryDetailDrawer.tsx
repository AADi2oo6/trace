import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  X,
  RotateCw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Radio,
  Compass,
  ArrowRight,
} from 'lucide-react'
import { fetchHistoryDetail } from '../../lib/api'
import { useRequestStore } from '../../store/requestStore'
import { Button } from '../ui/Button'
import { SkeletonPanel } from '../feedback/Skeleton'
import { ResponseSummary } from '../api-tester/ResponseSummary'
import { ResponseBody } from '../api-tester/ResponseBody'
import { ResponseHeaders } from '../api-tester/ResponseHeaders'
import { ResponseAnalysis } from '../api-tester/ResponseAnalysis'
import { JourneyTimeline } from '../journey/JourneyTimeline'
import type { HTTPMethod, BodyType } from '../../types/api'

interface HistoryDetailDrawerProps {
  id: string | null
  onClose: () => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

type TabType = 'request' | 'response' | 'analysis' | 'journey'

const methodColorMap: Record<HTTPMethod, { text: string; bg: string; border: string }> = {
  GET: { text: 'text-[#22C55E]', bg: 'bg-[#22C55E10]', border: 'border-[#22C55E30]' },
  POST: { text: 'text-[#3B82F6]', bg: 'bg-[#3B82F610]', border: 'border-[#3B82F630]' },
  PUT: { text: 'text-[#F59E0B]', bg: 'bg-[#F59E0B10]', border: 'border-[#F59E0B30]' },
  PATCH: { text: 'text-[#A78BFA]', bg: 'bg-[#A78BFA10]', border: 'border-[#A78BFA30]' },
  DELETE: { text: 'text-[#EF4444]', bg: 'bg-[#EF444410]', border: 'border-[#EF444430]' },
  HEAD: { text: 'text-[#6B6B6B]', bg: 'bg-[#6B6B6B10]', border: 'border-[#6B6B6B30]' },
  OPTIONS: { text: 'text-[#FF6A00]', bg: 'bg-[#FF6A0010]', border: 'border-[#FF6A0030]' },
}

export const HistoryDetailDrawer: React.FC<HistoryDetailDrawerProps> = ({
  id,
  onClose,
  onDelete,
  isDeleting = false,
}) => {
  const navigate = useNavigate()
  const loadHistoricalRequest = useRequestStore((state) => state.loadHistoricalRequest)
  const [activeTab, setActiveTab] = useState<TabType>('response')
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Fetch full details
  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ['history', id],
    queryFn: () => fetchHistoryDetail(id!),
    enabled: Boolean(id),
  })

  // Keyboard navigation: Escape closes drawer
  useEffect(() => {
    if (!id) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [id, onClose])

  if (!id) return null

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // clipboard not accessible
    }
  }

  const handleReopenInTester = () => {
    if (!detail) return
    loadHistoricalRequest(detail)
    navigate('/tester')
  }

  const methodStyle = detail?.method
    ? methodColorMap[detail.method] || {
        text: 'text-[#E8E8E8]',
        bg: 'bg-[#1E1E1E]',
        border: 'border-[#333333]',
      }
    : { text: 'text-[#E8E8E8]', bg: 'bg-[#1E1E1E]', border: 'border-[#333333]' }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/70 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
    >
      <div
        className="w-full max-w-3xl h-full bg-[#090909] border-l border-[#1E1E1E] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="border-b border-[#1E1E1E] bg-[#0C0C0C] px-6 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              {detail && (
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold tracking-wider border ${methodStyle.text} ${methodStyle.bg} ${methodStyle.border}`}
                >
                  {detail.method}
                </span>
              )}
              {detail?.status_code !== null && detail?.status_code !== undefined ? (
                <span className="px-2 py-0.5 text-xs font-mono border text-[#22C55E] bg-[#22C55E10] border-[#22C55E30]">
                  {detail.status_code} {detail.status_text}
                </span>
              ) : detail ? (
                <span className="px-2 py-0.5 text-xs font-mono border text-[#EF4444] bg-[#EF444410] border-[#EF444430]">
                  {detail.error?.code === 'SSRF_BLOCKED' ? 'SSRF BLOCKED' : 'FAILED'}
                </span>
              ) : null}
              <span className="text-xs font-mono text-[#6B6B6B]">
                {detail?.created_at ? new Date(detail.created_at).toLocaleString() : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Target URL bar & Actions */}
          {detail && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 min-w-0 flex-1 bg-[#121212] border border-[#222222] px-3 py-1.5">
                <span className="text-xs font-mono text-[#E8E8E8] truncate select-all">
                  {detail.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(detail.url)}
                  className="text-[#6B6B6B] hover:text-[#E8E8E8] p-1 shrink-0 ml-auto"
                  title="Copy URL"
                  aria-label="Copy URL"
                >
                  {copiedUrl ? (
                    <Check className="w-3.5 h-3.5 text-[#22C55E]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleReopenInTester}
                  leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Reopen in Tester
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(detail.id)}
                  loading={isDeleting}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />}
                  className="text-xs text-[#EF4444] hover:bg-[#EF444410]"
                  title="Delete from history"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tab Selection */}
        {detail && (
          <div className="flex items-center border-b border-[#1E1E1E] bg-[#0A0A0A] px-6">
            <button
              type="button"
              onClick={() => setActiveTab('response')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-mono tracking-wider transition-colors border-b-2 ${
                activeTab === 'response'
                  ? 'border-[#FF6A00] text-[#FF6A00] font-semibold'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#B0B0B0]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              RESPONSE
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-mono tracking-wider transition-colors border-b-2 ${
                activeTab === 'request'
                  ? 'border-[#FF6A00] text-[#FF6A00] font-semibold'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#B0B0B0]'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              REQUEST
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-mono tracking-wider transition-colors border-b-2 ${
                activeTab === 'analysis'
                  ? 'border-[#FF6A00] text-[#FF6A00] font-semibold'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#B0B0B0]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              ANALYSIS
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('journey')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-mono tracking-wider transition-colors border-b-2 ${
                activeTab === 'journey'
                  ? 'border-[#FF6A00] text-[#FF6A00] font-semibold'
                  : 'border-transparent text-[#6B6B6B] hover:text-[#B0B0B0]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              JOURNEY
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <SkeletonPanel rows={3} />
              <SkeletonPanel rows={6} />
            </div>
          )}

          {isError && (
            <div className="p-6 border border-[#EF444433] bg-[#EF444408] text-center space-y-3">
              <AlertTriangle className="w-6 h-6 text-[#EF4444] mx-auto" />
              <p className="text-xs font-mono text-[#EF4444] tracking-wider uppercase">
                Failed to load historical record
              </p>
              <p className="text-xs text-[#6B6B6B]">
                The record could not be retrieved from the database.
              </p>
            </div>
          )}

          {detail && (
            <>
              {/* Tab 1: RESPONSE */}
              {activeTab === 'response' && (
                <div className="space-y-6">
                  {detail.status_code !== null ? (
                    <>
                      <ResponseSummary
                        statusCode={detail.status_code}
                        statusText={detail.status_text}
                        statusCategory={detail.status_category}
                        durationMs={detail.duration_ms}
                        bodySizeBytes={detail.response_size}
                        contentType={detail.content_type}
                      />

                      {detail.response_body_truncated && (
                        <div className="p-3 border border-[#F59E0B33] bg-[#F59E0B0a] text-xs text-[#F59E0B] font-mono flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Response body was truncated for storage (exceeded 512 KB limit).</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="text-xs font-mono text-[#6B6B6B] uppercase tracking-wider">
                          Response Body
                        </div>
                        <ResponseBody
                          body={detail.response_body}
                          bodyType={(detail.request_body_type as BodyType) || null}
                          bodySize={detail.response_size}
                          contentType={detail.content_type}
                        />
                      </div>

                      {detail.response_headers && Object.keys(detail.response_headers).length > 0 && (
                        <div className="space-y-4">
                          <div className="text-xs font-mono text-[#6B6B6B] uppercase tracking-wider">
                            Response Headers ({Object.keys(detail.response_headers).length})
                          </div>
                          <ResponseHeaders headers={detail.response_headers} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-5 border border-[#EF444433] bg-[#EF444408] space-y-3">
                      <div className="flex items-center gap-2 text-[#EF4444]">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <span className="font-mono text-xs font-bold tracking-wider uppercase">
                          {detail.error?.code || 'EXECUTION_FAILED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#B0B0B0] font-mono leading-relaxed">
                        {detail.error?.message || 'No response was received from the target server.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: REQUEST */}
              {activeTab === 'request' && (
                <div className="space-y-6">
                  {/* Method & Target */}
                  <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
                      Request Endpoint
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#E8E8E8] break-all">
                      <span className={`font-bold ${methodStyle.text}`}>{detail.method}</span>
                      <span>{detail.url}</span>
                    </div>
                  </div>

                  {/* Query Parameters */}
                  {detail.query_params && Object.keys(detail.query_params).length > 0 && (
                    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
                        Query Parameters ({Object.keys(detail.query_params).length})
                      </div>
                      <div className="space-y-1">
                        {Object.entries(detail.query_params).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1 border-b border-[#161616] text-xs font-mono">
                            <span className="text-[#FF6A00]">{key}</span>
                            <span className="text-[#B0B0B0]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Headers */}
                  {detail.request_headers && Object.keys(detail.request_headers).length > 0 && (
                    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
                        Request Headers ({Object.keys(detail.request_headers).length})
                      </div>
                      <div className="space-y-1">
                        {Object.entries(detail.request_headers).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between py-1 border-b border-[#161616] text-xs font-mono">
                            <span className="text-[#888888]">{key}</span>
                            <span className="text-[#E8E8E8] select-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {detail.request_body && (
                    <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#6B6B6B]">
                        <span>Request Body</span>
                        <span>{detail.request_body_type || 'text'}</span>
                      </div>
                      <pre className="p-3 bg-[#111111] border border-[#1E1E1E] text-xs font-mono text-[#E8E8E8] overflow-x-auto whitespace-pre">
                        {detail.request_body}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: ANALYSIS */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <ResponseAnalysis
                    dnsAnalysis={detail.dns_analysis}
                    corsAnalysis={detail.cors_analysis}
                    optionsAnalysis={detail.options_analysis}
                    headerAnalysis={detail.header_analysis}
                    currentMethod={detail.method}
                  />
                </div>
              )}

              {/* Tab 4: JOURNEY */}
              {activeTab === 'journey' && (
                <div>
                  {detail.request_journey ? (
                    <JourneyTimeline journey={detail.request_journey} />
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-xs font-mono text-[#444444]">
                        No journey telemetry recorded for this request.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
