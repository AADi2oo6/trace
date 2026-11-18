import React from 'react'
import { Music, Video, Download } from 'lucide-react'
import { getArtifactDownloadUrl, getArtifactRawUrl } from '../../lib/api'

interface MediaPlayerViewProps {
  category: 'audio' | 'video'
  artifactId?: string | null
  rawUrl?: string
  filename: string
  fileSize: number
  mimeType: string
}

export const MediaPlayerView: React.FC<MediaPlayerViewProps> = ({
  category,
  artifactId,
  rawUrl,
  filename,
  fileSize,
  mimeType,
}) => {
  const mediaSrc = rawUrl || (artifactId ? getArtifactRawUrl(artifactId) : '')
  const downloadUrl = artifactId ? getArtifactDownloadUrl(artifactId) : mediaSrc

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
            {category === 'video' ? (
              <Video className="w-4 h-4 text-purple-400" />
            ) : (
              <Music className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-semibold">{filename}</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 uppercase font-mono">{mimeType}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{formatSize(fileSize)}</span>
        </div>

        <a
          href={downloadUrl}
          download={filename}
          className="flex items-center space-x-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Media</span>
        </a>
      </div>

      {/* Media Player Container */}
      <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-950">
        {category === 'video' ? (
          <div className="w-full max-w-3xl bg-black rounded-lg overflow-hidden shadow-2xl border border-slate-800">
            <video
              src={mediaSrc}
              controls
              className="w-full max-h-[500px]"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center space-y-6 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Music className="w-10 h-10 animate-pulse" />
            </div>

            <div className="text-center">
              <h4 className="text-sm font-medium text-slate-200">{filename}</h4>
              <p className="text-xs text-slate-500 mt-1">{mimeType} audio stream</p>
            </div>

            <audio
              src={mediaSrc}
              controls
              className="w-full"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  )
}
