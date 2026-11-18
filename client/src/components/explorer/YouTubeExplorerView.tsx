import React from 'react'
import { ExternalLink, ShieldAlert, Video } from 'lucide-react'
import type { YouTubeMetadata } from '../../types/api'

interface YouTubeExplorerViewProps {
  metadata: YouTubeMetadata
}

export const YouTubeExplorerView: React.FC<YouTubeExplorerViewProps> = ({ metadata }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Notice Banner */}
      <div className="flex items-start space-x-3 px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-amber-200">YouTube Intelligence Mode: </span>
          Direct media extraction or stream downloading from YouTube is prohibited to protect user security and comply with terms of service. TRACE provides the official sandboxed YouTube player and public metadata.
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 flex flex-col space-y-6 bg-slate-950 flex-1">
        {/* Official Sandboxed Embed Player */}
        <div className="w-full max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
          <iframe
            title="Official YouTube Player"
            src={metadata.embed_url}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Metadata Card */}
        <div className="w-full max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={metadata.thumbnail_url}
              alt="YouTube Video Thumbnail"
              className="w-24 h-16 object-cover rounded-lg border border-slate-800 shadow"
            />
            <div>
              <div className="flex items-center space-x-2">
                <Video className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-slate-100">YouTube Video Identified</h4>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                <span>ID: <code className="text-slate-300 font-mono">{metadata.video_id}</code></span>
                <span>•</span>
                <span className="text-emerald-400">Sandboxed Privacy Player Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={metadata.watch_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Watch on YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
