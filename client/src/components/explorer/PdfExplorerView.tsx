import React from 'react'
import { FileText, Download, ExternalLink } from 'lucide-react'
import { getArtifactDownloadUrl, getArtifactRawUrl } from '../../lib/api'

interface PdfExplorerViewProps {
  artifactId?: string | null
  rawUrl?: string
  filename: string
  fileSize: number
}

export const PdfExplorerView: React.FC<PdfExplorerViewProps> = ({
  artifactId,
  rawUrl,
  filename,
  fileSize,
}) => {
  const pdfUrl = rawUrl || (artifactId ? getArtifactRawUrl(artifactId) : '')
  const downloadUrl = artifactId ? getArtifactDownloadUrl(artifactId) : pdfUrl

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="font-semibold">{filename}</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">PDF Document</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{formatSize(fileSize)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </a>

          <a
            href={downloadUrl}
            download={filename}
            className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* PDF View Container */}
      <div className="flex-1 min-h-[500px] relative bg-slate-950">
        <object
          data={pdfUrl}
          type="application/pdf"
          className="w-full h-full min-h-[550px] border-0"
        >
          {/* Fallback if browser doesn't embed PDF */}
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <FileText className="w-16 h-16 text-rose-400/80" />
            <h4 className="text-base font-medium text-slate-200">PDF Document Ready</h4>
            <p className="text-xs text-slate-400 max-w-md">
              Your browser does not support inline PDF rendering or has it disabled. You can view or download it directly.
            </p>
            <div className="flex items-center space-x-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700"
              >
                Open in New Tab
              </a>
              <a
                href={downloadUrl}
                download={filename}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-md shadow-sm"
              >
                Download File
              </a>
            </div>
          </div>
        </object>
      </div>
    </div>
  )
}
