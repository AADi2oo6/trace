import React, { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  GitCompare,
  ArrowLeftRight,
  Terminal,
  Info,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { useRequestStore } from '../store/requestStore'
import { fetchHistory, fetchHistoryDetail } from '../lib/api'
import type { HTTPMethod } from '../types/api'
import { compareResponses } from '../lib/comparison'
import { ComparisonSummary } from '../components/comparison/ComparisonSummary'
import { HeaderDiffViewer } from '../components/comparison/HeaderDiffViewer'
import { JsonDiffViewer } from '../components/comparison/JsonDiffViewer'
import { Button } from '../components/ui/Button'

interface SelectedResponseData {
  id: string
  label: string
  method: string
  url: string
  status_code: number | null
  duration_ms: number | null
  body_size: number | null
  content_type: string | null
  headers: Record<string, string>
  body: string | null
}

export const ResponseComparisonPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const lastResponse = useRequestStore((s) => s.lastResponse)
  const setMethod = useRequestStore((s) => s.setMethod)
  const setUrl = useRequestStore((s) => s.setUrl)

  const initialLeft = searchParams.get('leftId') || 'active'
  const initialRight = searchParams.get('rightId') || ''

  const [leftSelection, setLeftSelection] = useState<string>(initialLeft)
  const [rightSelection, setRightSelection] = useState<string>(initialRight)
  const [activeTab, setActiveTab] = useState<'summary' | 'headers' | 'body'>('summary')

  // Load history list with React Query
  const { data: historyData } = useQuery({
    queryKey: ['history', 'compare-list'],
    queryFn: () => fetchHistory(100, 0),
  })

  const historyItems = useMemo(() => historyData?.items ?? [], [historyData?.items])

  // If right selection is empty and history loaded, pick first history item
  const effectiveRightSelection = useMemo(() => {
    if (rightSelection) return rightSelection
    if (historyItems.length > 0) {
      const candidate = historyItems.find((h) => String(h.id) !== leftSelection)
      return candidate ? String(candidate.id) : ''
    }
    return ''
  }, [rightSelection, historyItems, leftSelection])

  // Fetch Left Record if historical
  const { data: leftRecord } = useQuery({
    queryKey: ['history-detail-compare', leftSelection],
    queryFn: () => fetchHistoryDetail(leftSelection),
    enabled: leftSelection !== 'active' && Boolean(leftSelection),
  })

  // Fetch Right Record if historical
  const { data: rightRecord } = useQuery({
    queryKey: ['history-detail-compare', effectiveRightSelection],
    queryFn: () => fetchHistoryDetail(effectiveRightSelection),
    enabled: effectiveRightSelection !== 'active' && Boolean(effectiveRightSelection),
  })

  // Derive Left Data
  const leftData = useMemo<SelectedResponseData | null>(() => {
    if (leftSelection === 'active') {
      if (!lastResponse) return null
      return {
        id: 'active',
        label: `Active Tester (${lastResponse.method || 'GET'} ${lastResponse.status_code ?? '—'})`,
        method: lastResponse.method || 'GET',
        url: lastResponse.url || '',
        status_code: lastResponse.status_code,
        duration_ms: lastResponse.duration_ms,
        body_size: lastResponse.body_size,
        content_type: lastResponse.content_type,
        headers: lastResponse.headers || {},
        body: lastResponse.body,
      }
    }
    if (leftRecord) {
      return {
        id: String(leftRecord.id),
        label: `#${leftRecord.id} (${leftRecord.method} ${leftRecord.status_code ?? '—'})`,
        method: leftRecord.method,
        url: leftRecord.url,
        status_code: leftRecord.status_code,
        duration_ms: leftRecord.duration_ms,
        body_size: leftRecord.response_size,
        content_type: leftRecord.content_type,
        headers: (leftRecord.response_headers as Record<string, string>) || {},
        body: leftRecord.response_body,
      }
    }
    return null
  }, [leftSelection, lastResponse, leftRecord])

  // Derive Right Data
  const rightData = useMemo<SelectedResponseData | null>(() => {
    if (effectiveRightSelection === 'active') {
      if (!lastResponse) return null
      return {
        id: 'active',
        label: `Active Tester (${lastResponse.method || 'GET'} ${lastResponse.status_code ?? '—'})`,
        method: lastResponse.method || 'GET',
        url: lastResponse.url || '',
        status_code: lastResponse.status_code,
        duration_ms: lastResponse.duration_ms,
        body_size: lastResponse.body_size,
        content_type: lastResponse.content_type,
        headers: lastResponse.headers || {},
        body: lastResponse.body,
      }
    }
    if (rightRecord) {
      return {
        id: String(rightRecord.id),
        label: `#${rightRecord.id} (${rightRecord.method} ${rightRecord.status_code ?? '—'})`,
        method: rightRecord.method,
        url: rightRecord.url,
        status_code: rightRecord.status_code,
        duration_ms: rightRecord.duration_ms,
        body_size: rightRecord.response_size,
        content_type: rightRecord.content_type,
        headers: (rightRecord.response_headers as Record<string, string>) || {},
        body: rightRecord.response_body,
      }
    }
    return null
  }, [effectiveRightSelection, lastResponse, rightRecord])

  // Swap Left and Right
  const handleSwap = () => {
    const tempLeft = leftSelection
    setLeftSelection(effectiveRightSelection)
    setRightSelection(tempLeft)
  }

  // Comparison computation
  const comparisonResult = useMemo(() => {
    if (!leftData || !rightData) return null
    return compareResponses(leftData, rightData)
  }, [leftData, rightData])

  // Re-run in API tester
  const handleReRun = (target: SelectedResponseData) => {
    setMethod(target.method as HTTPMethod)
    setUrl(target.url)
    navigate('/tester')
  }

  return (
    <PageContainer
      title="Response Comparison"
      description="Deep behavioral, performance, header, and JSON body difference analyzer."
      icon={<GitCompare className="w-4 h-4" />}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fade-in font-mono">
        {/* Source Selection Card */}
        <div className="p-4 sm:p-5 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#222736]">
            <div>
              <h2 className="text-xs uppercase font-bold tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-orange-500" />
                Select Responses to Compare
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Compare the active API Tester response against historical snapshots or compare two historical records
              </p>
            </div>

            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#1C202C] hover:bg-slate-200 dark:hover:bg-[#282E40] border border-slate-200 dark:border-[#282E40] text-slate-700 dark:text-slate-200 rounded text-xs transition-colors shrink-0"
              title="Swap Left and Right responses"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-orange-500" />
              <span>Swap Sides</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Source */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold">
                Left (Baseline Response)
              </label>
              <select
                value={leftSelection}
                onChange={(e) => setLeftSelection(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#12141D] border border-slate-200 dark:border-[#282E40] text-slate-800 dark:text-slate-100 rounded p-2 focus:outline-none focus:border-orange-500"
              >
                <option value="active">Active Tester Response {lastResponse ? `(${lastResponse.method} ${lastResponse.status_code || ''})` : '(No response yet)'}</option>
                <optgroup label="Historical Executions">
                  {historyItems.map((h) => (
                    <option key={h.id} value={String(h.id)}>
                      #{h.id} • {h.method} {h.status_code || 'ERR'} — {h.url.replace(/^https?:\/\//, '').slice(0, 45)} ({new Date(h.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </optgroup>
              </select>

              {leftData && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="truncate max-w-[280px]" title={leftData.url}>
                    {leftData.method} {leftData.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReRun(leftData)}
                    className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1 shrink-0 ml-2"
                  >
                    <Terminal className="w-3 h-3" /> Re-run
                  </button>
                </div>
              )}
            </div>

            {/* Right Source */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-bold">
                Right (Candidate Response)
              </label>
              <select
                value={effectiveRightSelection}
                onChange={(e) => setRightSelection(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-[#12141D] border border-slate-200 dark:border-[#282E40] text-slate-800 dark:text-slate-100 rounded p-2 focus:outline-none focus:border-orange-500"
              >
                <option value="">Select candidate response...</option>
                <option value="active">Active Tester Response {lastResponse ? `(${lastResponse.method} ${lastResponse.status_code || ''})` : '(No response yet)'}</option>
                <optgroup label="Historical Executions">
                  {historyItems.map((h) => (
                    <option key={h.id} value={String(h.id)}>
                      #{h.id} • {h.method} {h.status_code || 'ERR'} — {h.url.replace(/^https?:\/\//, '').slice(0, 45)} ({new Date(h.created_at).toLocaleTimeString()})
                    </option>
                  ))}
                </optgroup>
              </select>

              {rightData && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span className="truncate max-w-[280px]" title={rightData.url}>
                    {rightData.method} {rightData.url}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReRun(rightData)}
                    className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1 shrink-0 ml-2"
                  >
                    <Terminal className="w-3 h-3" /> Re-run
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comparison Display */}
        {comparisonResult ? (
          <div className="space-y-6">
            {/* High Level Metrics Cards */}
            <ComparisonSummary
              stats={comparisonResult.stats}
              leftLabel={leftData?.label || 'Baseline'}
              rightLabel={rightData?.label || 'Candidate'}
            />

            {/* Sub-Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222736] pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    activeTab === 'summary'
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Overview & Headers ({comparisonResult.headerDiffs.filter((h) => h.status !== 'identical').length} diffs)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('headers')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    activeTab === 'headers'
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Headers Table ({comparisonResult.headerDiffs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('body')}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    activeTab === 'body'
                      ? 'bg-orange-500 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  JSON Body Diff {comparisonResult.jsonDiffs ? `(${comparisonResult.jsonDiffs.filter((j) => j.status !== 'identical').length} diffs)` : ''}
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <HeaderDiffViewer
                  diffs={comparisonResult.headerDiffs}
                  leftLabel={leftData?.label}
                  rightLabel={rightData?.label}
                />
                {comparisonResult.isJson && comparisonResult.jsonDiffs && (
                  <JsonDiffViewer
                    diffs={comparisonResult.jsonDiffs}
                    leftLabel={leftData?.label}
                    rightLabel={rightData?.label}
                  />
                )}
              </div>
            )}

            {activeTab === 'headers' && (
              <HeaderDiffViewer
                diffs={comparisonResult.headerDiffs}
                leftLabel={leftData?.label}
                rightLabel={rightData?.label}
              />
            )}

            {activeTab === 'body' && (
              <div>
                {comparisonResult.isJson && comparisonResult.jsonDiffs ? (
                  <JsonDiffViewer
                    diffs={comparisonResult.jsonDiffs}
                    leftLabel={leftData?.label}
                    rightLabel={rightData?.label}
                  />
                ) : (
                  <div className="p-8 border border-slate-200 dark:border-[#222736] bg-white dark:bg-[#161922] text-center space-y-2">
                    <Info className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Non-JSON or Empty Response Bodies
                    </p>
                    <p className="text-xs text-slate-500">
                      Deep recursive structural diff is only available when both response bodies contain valid JSON payloads.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Incomplete Selection State */
          <div className="p-12 border border-dashed border-slate-200 dark:border-[#282E40] bg-white dark:bg-[#161922] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
              <GitCompare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Select Two Responses to Compare
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Choose a baseline response and a candidate response above to analyze status codes, latency deltas, header changes, and recursive JSON body differences.
              </p>
            </div>
            {!lastResponse && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/tester')}
                leftIcon={<Terminal className="w-3.5 h-3.5" />}
              >
                Execute a Request in API Tester
              </Button>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
