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
    <div className="flex flex-wrap items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl gap-3 shadow-xs">
      {/* File & Type Details */}
      <div className="flex items-center space-x-3 text-xs">
        {contentMetadata && (
          <>
            <span className="font-semibold text-[var(--text-primary)]">{contentMetadata.filename}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-secondary)] font-mono">{formatSize(contentMetadata.file_size)}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-secondary)]">{contentMetadata.mime_type}</span>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium rounded-lg border border-[var(--border-default)] transition-colors"
          title="Copy Target URL"
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Link2 className="w-3.5 h-3.5" />}
          <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyCurl}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium rounded-lg border border-[var(--border-default)] transition-colors"
          title="Copy as cURL command"
        >
          {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Terminal className="w-3.5 h-3.5" />}
          <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
        </button>

        {downloadUrl && contentMetadata && contentMetadata.category !== 'youtube' && (
          <a
            href={downloadUrl}
            download={contentMetadata.filename}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </a>
        )}

        {zipUrl && contentMetadata && contentMetadata.category !== 'youtube' && (
          <a
            href={zipUrl}
            download={`trace-export-${contentMetadata.filename}.zip`}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
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
