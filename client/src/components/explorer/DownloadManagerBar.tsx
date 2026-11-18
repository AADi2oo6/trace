import React, { useState } from 'react'
import { Download, Archive, Link2, Terminal, Check } from 'lucide-react'
import { getArtifactDownloadUrl, getArtifactZipUrl } from '../../lib/api'
import type { ContentMetadata } from '../../types/api'

interface DownloadManagerBarProps {
  url: string
  method: string
  contentMetadata?: ContentMetadata | null
  artifactId?: string | null
}

export const DownloadManagerBar: React.FC<DownloadManagerBarProps> = ({
  url,
  method,
  contentMetadata,
  artifactId,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  const downloadUrl = artifactId ? getArtifactDownloadUrl(artifactId) : null
  const zipUrl = artifactId ? getArtifactZipUrl(artifactId) : null

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // ignore
    }
  }

  const handleCopyCurl = async () => {
    const curl = `curl -X ${method} "${url}"`
    try {
      await navigator.clipboard.writeText(curl)
      setCopiedCurl(true)
      setTimeout(() => setCopiedCurl(false), 2000)
    } catch {
      // ignore
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-lg gap-3">
      {/* File & Type Details */}
      <div className="flex items-center space-x-3 text-xs">
        {contentMetadata && (
          <>
            <span className="font-medium text-slate-200">{contentMetadata.filename}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{formatSize(contentMetadata.file_size)}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{contentMetadata.mime_type}</span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded border border-slate-700 transition-colors"
          title="Copy Target URL"
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
          <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyCurl}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded border border-slate-700 transition-colors"
          title="Copy as cURL command"
        >
          {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
          <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
        </button>

        {downloadUrl && contentMetadata && contentMetadata.category !== 'youtube' && (
          <a
            href={downloadUrl}
            download={contentMetadata.filename}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </a>
        )}

        {zipUrl && contentMetadata && contentMetadata.category !== 'youtube' && (
          <a
            href={zipUrl}
            download={`trace-export-${contentMetadata.filename}.zip`}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
            title="Download payload, headers, metadata, and README as a ZIP archive"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Download All (ZIP)</span>
          </a>
        )}
      </div>
    </div>
  )
}
