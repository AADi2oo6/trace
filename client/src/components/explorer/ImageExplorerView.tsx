import React, { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Image as ImageIcon } from 'lucide-react'
import { getArtifactDownloadUrl } from '../../lib/api'

interface ImageExplorerViewProps {
  artifactId?: string | null
  rawUrl?: string
  filename: string
  fileSize: number
  mimeType: string
}

export const ImageExplorerView: React.FC<ImageExplorerViewProps> = ({
  artifactId,
  rawUrl,
  filename,
  fileSize,
  mimeType,
}) => {
  const [zoom, setZoom] = useState(100)
  const [fit, setFit] = useState(true)
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null)

  const imageUrl = rawUrl || (artifactId ? getArtifactDownloadUrl(artifactId) : '')
  const downloadUrl = artifactId ? getArtifactDownloadUrl(artifactId) : imageUrl

  const handleZoomIn = () => {
    setFit(false)
    setZoom((z) => Math.min(z + 25, 400))
  }

  const handleZoomOut = () => {
    setFit(false)
    setZoom((z) => Math.max(z - 25, 25))
  }

  const handleResetZoom = () => {
    setFit(false)
    setZoom(100)
  }

  const handleToggleFit = () => {
    setFit(!fit)
    if (!fit) {
      setZoom(100)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <div className="flex items-center space-x-1.5">
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{filename}</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{mimeType}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{formatSize(fileSize)}</span>
          {naturalDimensions && (
            <>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-mono">
                {naturalDimensions.width} × {naturalDimensions.height} px
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 w-10 text-center">{fit ? 'Fit' : `${zoom}%`}</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white rounded ml-1"
              title="100% Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleFit}
              className={`p-1 rounded ml-1 ${fit ? 'text-sky-400 bg-sky-950/40' : 'text-slate-400 hover:text-white'}`}
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <a
            href={downloadUrl}
            download={filename}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </a>
        </div>
      </div>

      {/* Canvas View with transparency checkerboard */}
      <div
        className="flex-1 min-h-[460px] max-h-[620px] overflow-auto flex items-center justify-center p-6 bg-slate-950"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #18202f 25%, transparent 25%), linear-gradient(-45deg, #18202f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18202f 75%), linear-gradient(-45deg, transparent 75%, #18202f 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      >
        <img
          src={imageUrl}
          alt={filename}
          onLoad={(e) => {
            const img = e.currentTarget
            setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight })
          }}
          style={
            fit
              ? { maxWidth: '100%', maxHeight: '540px', objectFit: 'contain' }
              : { width: `${zoom}%`, maxWidth: 'none', height: 'auto' }
          }
          className="rounded shadow-2xl transition-all border border-slate-700/50"
        />
      </div>
    </div>
  )
}
