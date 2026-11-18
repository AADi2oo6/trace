import React, { useState } from 'react'
import {
  Compass,
  ArrowRight,
  Loader2,
  Globe,
  FileCode,
  FileJson,
  Image as ImageIcon,
  Music,
  FileText,
  Binary,
  Video,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { executeRequest } from '../lib/api'
import type { RequestResponse, HTTPMethod, ContentCategory } from '../types/api'
import { HtmlSandboxPreview } from '../components/explorer/HtmlSandboxPreview'
import { JsonExplorerView } from '../components/explorer/JsonExplorerView'
import { XmlExplorerView } from '../components/explorer/XmlExplorerView'
import { ImageExplorerView } from '../components/explorer/ImageExplorerView'
import { MediaPlayerView } from '../components/explorer/MediaPlayerView'
import { PdfExplorerView } from '../components/explorer/PdfExplorerView'
import { YouTubeExplorerView } from '../components/explorer/YouTubeExplorerView'
import { RawHexExplorerView } from '../components/explorer/RawHexExplorerView'
import { DownloadManagerBar } from '../components/explorer/DownloadManagerBar'

const PRESET_EXAMPLES = [
  { label: 'HTML Page', url: 'http://localhost:8000/demo/html', icon: Globe },
  { label: 'JSON API', url: 'http://localhost:8000/demo/users', icon: FileJson },
  { label: 'PNG Image', url: 'http://localhost:8000/demo/image', icon: ImageIcon },
  { label: 'Vector SVG', url: 'http://localhost:8000/demo/svg', icon: FileCode },
  { label: 'WAV Audio', url: 'http://localhost:8000/demo/audio', icon: Music },
  { label: 'PDF Document', url: 'http://localhost:8000/demo/pdf', icon: FileText },
  { label: 'XML Feed', url: 'http://localhost:8000/demo/xml', icon: FileCode },
  { label: 'Binary File', url: 'http://localhost:8000/demo/binary', icon: Binary },
  { label: 'YouTube Demo', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', icon: Video },
]

export const UniversalExplorer: React.FC = () => {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<HTTPMethod>('GET')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<RequestResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'headers' | 'journey'>('preview')
  const [headerFilter, setHeaderFilter] = useState('')

  const handleInspect = async (targetUrl?: string) => {
    const finalUrl = (targetUrl || url).trim()
    if (!finalUrl) return

    setIsLoading(true)
    setErrorMsg(null)
    setActiveTab('preview')

    try {
      const result = await executeRequest({
        method,
        url: finalUrl,
        params: {},
        headers: {},
      })
      setResponse(result)
      if (!result.success && result.error) {
        setErrorMsg(result.error.message)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to inspect target URL'
      setErrorMsg(msg)
      setResponse(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl)
    handleInspect(presetUrl)
  }

  const getCategoryBadgeClass = (category?: ContentCategory) => {
    switch (category) {
      case 'html':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'json':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'xml':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      case 'image':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'video':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'audio':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'pdf':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      case 'youtube':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  const contentMeta = response?.content_metadata
  const category = contentMeta?.category || 'text'

  return (
    <PageContainer
      title="Universal Content Explorer"
      description="Explore, inspect, and download web pages, APIs, media assets, documents, and network streams."
      icon={<Compass className="w-4 h-4" />}
    >
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
        {/* URL Input Bar */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 shadow-xs space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleInspect()
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2"
          >
            {/* Method selector */}
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HTTPMethod)}
              className="px-3 py-2 text-xs font-semibold bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-blue-500 focus:outline-none focus:border-blue-500"
            >
              <option value="GET">GET</option>
              <option value="HEAD">HEAD</option>
            </select>

            {/* URL Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter any URL (e.g. https://api.github.com, http://localhost:8000/demo/html, YouTube link)..."
                className="w-full px-3.5 py-2 text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-blue-500 font-mono"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Inspecting...</span>
                </>
              ) : (
                <>
                  <span>Inspect URL</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Presets */}
          <div className="pt-2 border-t border-[var(--border-muted)] flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)] mr-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Try Demo:</span>
            </span>
            {PRESET_EXAMPLES.map((example) => {
              const IconComponent = example.icon
              return (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => handleSelectPreset(example.url)}
                  className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] rounded-md transition-colors"
                >
                  <IconComponent className="w-3 h-3 text-[var(--text-muted)]" />
                  <span>{example.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3 text-xs text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-rose-500">Exploration Error</div>
              <div className="mt-0.5 text-rose-400/90">{errorMsg}</div>
            </div>
          </div>
        )}

        {/* Results View */}
        {response && (
          <div className="space-y-4">
            {/* Metadata Summary Bar */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Code */}
                <span
                  className={`px-2.5 py-1 rounded-md font-bold font-mono border ${
                    response.status_code && response.status_code >= 200 && response.status_code < 300
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                  }`}
                >
                  {response.status_code || '---'} {response.status_text}
                </span>

                {/* Category Badge */}
                <span className={`px-2.5 py-1 rounded-md font-semibold uppercase text-[10px] border ${getCategoryBadgeClass(category)}`}>
                  {category}
                </span>

                {/* MIME Type */}
                <span className="text-[var(--text-secondary)] font-mono">
                  {contentMeta?.mime_type || response.content_type || 'Unknown Type'}
                </span>

                <span className="text-[var(--text-muted)]">•</span>

                {/* Payload Size */}
                <span className="text-[var(--text-primary)]">
                  {response.body_size !== null ? `${(response.body_size / 1024).toFixed(1)} KB` : '0 B'}
                </span>

                <span className="text-[var(--text-muted)]">•</span>

                {/* Duration */}
                <span className="text-[var(--text-primary)] font-mono">
                  {response.duration_ms ? `${response.duration_ms} ms` : '---'}
                </span>
              </div>

              {/* Target URL */}
              <div className="text-xs text-[var(--text-secondary)] font-mono truncate max-w-md" title={response.url || ''}>
                {response.url}
              </div>
            </div>

            {/* Download Manager Bar */}
            <DownloadManagerBar
              url={response.url || url}
              method={response.method || method}
              contentMetadata={contentMeta}
              artifactId={response.artifact_id}
            />

            {/* Tab Navigation */}
            <div className="flex border-b border-[var(--border-default)] space-x-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Interactive Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'raw'
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Raw Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'headers'
                    ? 'border-blue-500 text-blue-500 font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Headers ({response.headers ? Object.keys(response.headers).length : 0})
              </button>
              {response.request_journey && (
                <button
                  type="button"
                  onClick={() => setActiveTab('journey')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'journey'
                      ? 'border-blue-500 text-blue-500 font-bold'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Network Journey
                </button>
              )}
            </div>

            {/* Tab Content Display */}
            <div className="min-h-[480px]">
              {activeTab === 'preview' && (
                <>
                  {category === 'html' && (
                    <HtmlSandboxPreview htmlContent={response.body || ''} />
                  )}

                  {category === 'json' && (
                    <JsonExplorerView jsonString={response.body || '{}'} />
                  )}

                  {category === 'xml' && (
                    <XmlExplorerView xmlString={response.body || ''} />
                  )}

                  {category === 'image' && (
                    <ImageExplorerView
                      artifactId={response.artifact_id}
                      filename={contentMeta?.filename || 'image.png'}
                      fileSize={contentMeta?.file_size || response.body_size || 0}
                      mimeType={contentMeta?.mime_type || 'image/png'}
                    />
                  )}

                  {(category === 'audio' || category === 'video') && (
                    <MediaPlayerView
                      category={category}
                      artifactId={response.artifact_id}
                      filename={contentMeta?.filename || (category === 'video' ? 'video.mp4' : 'audio.mp3')}
                      fileSize={contentMeta?.file_size || response.body_size || 0}
                      mimeType={contentMeta?.mime_type || (category === 'video' ? 'video/mp4' : 'audio/mpeg')}
                    />
                  )}

                  {category === 'pdf' && (
                    <PdfExplorerView
                      artifactId={response.artifact_id}
                      filename={contentMeta?.filename || 'document.pdf'}
                      fileSize={contentMeta?.file_size || response.body_size || 0}
                    />
                  )}

                  {category === 'youtube' && contentMeta?.youtube_metadata && (
                    <YouTubeExplorerView metadata={contentMeta.youtube_metadata} />
                  )}

                  {(category === 'binary' || category === 'text') && (
                    <RawHexExplorerView
                      content={response.body}
                      fileSize={response.body_size || 0}
                      isBinary={contentMeta?.is_binary || false}
                    />
                  )}
                </>
              )}

              {activeTab === 'raw' && (
                <RawHexExplorerView
                  content={response.body}
                  fileSize={response.body_size || 0}
                  isBinary={contentMeta?.is_binary || false}
                />
              )}

              {activeTab === 'headers' && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3 shadow-xs">
                  <input
                    type="text"
                    value={headerFilter}
                    onChange={(e) => setHeaderFilter(e.target.value)}
                    placeholder="Filter headers..."
                    className="w-full px-3 py-1.5 text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md text-[var(--text-primary)] placeholder:[var(--text-muted)] focus:outline-none focus:border-blue-500 mb-2 font-mono"
                  />
                  <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-xs font-mono text-left">
                      <thead>
                        <tr className="border-b border-[var(--border-muted)] text-[var(--text-muted)] font-semibold">
                          <th className="py-2 px-3">Header Name</th>
                          <th className="py-2 px-3">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-muted)]">
                        {response.headers &&
                          Object.entries(response.headers)
                            .filter(
                              ([k, v]) =>
                                !headerFilter ||
                                k.toLowerCase().includes(headerFilter.toLowerCase()) ||
                                v.toLowerCase().includes(headerFilter.toLowerCase()),
                            )
                            .map(([key, val]) => (
                              <tr key={key} className="hover:bg-[var(--bg-hover)] transition-colors">
                                <td className="py-1.5 px-3 text-blue-500 font-semibold align-top">{key}</td>
                                <td className="py-1.5 px-3 text-[var(--text-secondary)] break-all">{val}</td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'journey' && response.request_journey && (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-[var(--border-muted)]">
                    <span className="font-semibold text-[var(--text-primary)]">Lifecycle Phases</span>
                    <span className="text-[var(--text-secondary)]">
                      Total Duration:{' '}
                      <strong className="text-blue-500 font-mono">
                        {response.request_journey.total_duration_ms} ms
                      </strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {response.request_journey.phases.map((phase) => (
                      <div
                        key={phase.name}
                        className="p-3 bg-[var(--bg-panel)] border border-[var(--border-muted)] rounded-lg flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase text-[var(--text-primary)]">{phase.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              phase.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div className="mt-2 text-sm font-mono text-blue-500 font-medium">
                          {phase.duration_ms !== null ? `${phase.duration_ms} ms` : '---'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
export default UniversalExplorer
