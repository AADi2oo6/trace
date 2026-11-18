import React, { useState } from 'react'
import { ShieldCheck, Code, Eye, Copy, Check } from 'lucide-react'

interface HtmlSandboxPreviewProps {
  htmlContent: string
}

export const HtmlSandboxPreview: React.FC<HtmlSandboxPreviewProps> = ({
  htmlContent,
}) => {
  const [viewMode, setViewMode] = useState<'sandbox' | 'source'>('sandbox')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2 text-xs text-sky-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium text-slate-300">
            Rendered in an isolated sandbox. External scripts and network resources are blocked for your protection.
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('sandbox')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'sandbox'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Sandbox Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('source')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'source'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Source HTML</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            title="Copy HTML to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-[480px] relative bg-slate-950">
        {viewMode === 'sandbox' ? (
          <iframe
            title="Sandboxed HTML Preview"
            srcDoc={htmlContent}
            sandbox="allow-forms"
            className="w-full h-full border-0 bg-white"
            style={{ minHeight: '520px' }}
          />
        ) : (
          <div className="p-4 overflow-auto h-full max-h-[600px] text-xs font-mono text-slate-300 whitespace-pre">
            {htmlContent}
          </div>
        )}
      </div>
    </div>
  )
}
