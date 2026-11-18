import React, { useState } from 'react'
import { Copy, Check, Binary } from 'lucide-react'

interface RawHexExplorerViewProps {
  content: string | null
  fileSize: number
  isBinary: boolean
}

export const RawHexExplorerView: React.FC<RawHexExplorerViewProps> = ({
  content,
  fileSize,
  isBinary,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Binary className="w-3.5 h-3.5 text-slate-400" />
          <span>Raw Payload Inspection ({fileSize} bytes)</span>
          {isBinary && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
              Binary Stream
            </span>
          )}
        </div>

        {content && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}
      </div>

      <div className="p-4 overflow-auto max-h-[580px] text-xs font-mono bg-slate-950 text-slate-300">
        {content ? (
          <pre className="whitespace-pre-wrap break-all">{content}</pre>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Raw payload is stored as binary data. Use the download buttons above to inspect the original binary bytes.
          </div>
        )}
      </div>
    </div>
  )
}
