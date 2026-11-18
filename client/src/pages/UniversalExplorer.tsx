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
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
      <div>
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Universal Content Explorer</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Explore, inspect, and download web pages, APIs, media assets, documents, and network streams.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
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
            className="px-3 py-2 text-xs font-semibold bg-slate-950 border border-slate-800 rounded-lg text-sky-400 focus:outline-none focus:border-sky-500"
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
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
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
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Try Demo:</span>
          </span>
          {PRESET_EXAMPLES.map((example) => {
            const IconComponent = example.icon
            return (
              <button
                key={example.label}
                type="button"
                onClick={() => handleSelectPreset(example.url)}
                className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-md transition-colors"
              >
                <IconComponent className="w-3 h-3 text-slate-400" />
                <span>{example.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start space-x-3 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-rose-200">Exploration Error</div>
            <div className="mt-0.5 text-rose-300/90">{errorMsg}</div>
          </div>
        </div>
      )}

      {/* Results View */}
      {response && (
        <div className="space-y-4">
          {/* Metadata Summary Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status Code */}
              <span
                className={`px-2.5 py-1 rounded-md font-bold font-mono border ${
                  response.status_code && response.status_code >= 200 && response.status_code < 300
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {response.status_code || '---'} {response.status_text}
              </span>

              {/* Category Badge */}
              <span className={`px-2.5 py-1 rounded-md font-semibold uppercase text-[10px] border ${getCategoryBadgeClass(category)}`}>
                {category}
              </span>

              {/* MIME Type */}
              <span className="text-slate-400 font-mono">
                {contentMeta?.mime_type || response.content_type || 'Unknown Type'}
              </span>

              <span className="text-slate-600">•</span>

              {/* Payload Size */}
              <span className="text-slate-300">
                {response.body_size !== null ? `${(response.body_size / 1024).toFixed(1)} KB` : '0 B'}
              </span>

              <span className="text-slate-600">•</span>

              {/* Duration */}
              <span className="text-slate-300 font-mono">
                {response.duration_ms ? `${response.duration_ms} ms` : '---'}
              </span>
            </div>

            {/* Target URL */}
            <div className="text-xs text-slate-400 font-mono truncate max-w-md" title={response.url || ''}>
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
          <div className="flex border-b border-slate-800 space-x-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Interactive Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'raw'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Content
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('headers')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'headers'
                  ? 'border-sky-500 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
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
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
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
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  value={headerFilter}
                  onChange={(e) => setHeaderFilter(e.target.value)}
                  placeholder="Filter headers..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 mb-2"
                />
                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1.5 px-3 font-semibold">Header Name</th>
                        <th className="py-1.5 px-3 font-semibold">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {response.headers &&
                        Object.entries(response.headers)
                          .filter(
                            ([k, v]) =>
                              !headerFilter ||
                              k.toLowerCase().includes(headerFilter.toLowerCase()) ||
                              v.toLowerCase().includes(headerFilter.toLowerCase()),
                          )
                          .map(([key, val]) => (
                            <tr key={key} className="hover:bg-slate-800/40">
                              <td className="py-1.5 px-3 text-sky-400 font-semibold align-top">{key}</td>
                              <td className="py-1.5 px-3 text-slate-300 break-all">{val}</td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'journey' && response.request_journey && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
                  <span className="font-semibold text-slate-200">Lifecycle Phases</span>
                  <span className="text-slate-400">
                    Total Duration:{' '}
                    <strong className="text-sky-400 font-mono">
                      {response.request_journey.total_duration_ms} ms
                    </strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {response.request_journey.phases.map((phase) => (
                    <div
                      key={phase.name}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-slate-300">{phase.name}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            phase.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-sm font-mono text-sky-400 font-medium">
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
    </div>
  )
}
export default UniversalExplorer
