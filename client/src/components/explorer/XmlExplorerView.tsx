import React, { useState } from 'react'
import { Copy, Check, Code, FileCode } from 'lucide-react'

interface XmlExplorerViewProps {
  xmlString: string
}

export const XmlExplorerView: React.FC<XmlExplorerViewProps> = ({ xmlString }) => {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted')

  const formatXml = (xml: string) => {
    let formatted = ''
    let indent = 0
    const tab = '  '
    xml.split(/>\s*</).forEach((node) => {
      if (node.match(/^\/\w/)) indent = Math.max(0, indent - 1)
      formatted += tab.repeat(indent) + '<' + node + '>\r\n'
      if (node.match(/^<?\w[^>]*[^/]$/)) indent += 1
    })
    return formatted.substring(1, formatted.length - 3)
  }

  const formattedXml = React.useMemo(() => {
    try {
      return formatXml(xmlString)
    } catch {
      return xmlString
    }
  }, [xmlString])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedXml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800">
        <div className="text-xs font-medium text-slate-400">XML Document Payload</div>
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-md p-0.5 bg-slate-900 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('formatted')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'formatted'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Formatted</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors ${
                viewMode === 'raw'
                  ? 'bg-sky-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Raw</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 overflow-auto max-h-[580px] text-xs font-mono bg-slate-950">
        <pre className="text-slate-300 whitespace-pre">
          {viewMode === 'formatted' ? formattedXml : xmlString}
        </pre>
      </div>
    </div>
  )
}
