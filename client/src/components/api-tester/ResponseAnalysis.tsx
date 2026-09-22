import React from 'react'
import type {
  DnsAnalysis,
  CorsAnalysis,
  OptionsAnalysis,
  HeaderAnalysisItem,
} from '../../types/api'
import { DnsAnalysisPanel } from '../analysis/DnsAnalysisPanel'
import { HeaderAnalysisPanel } from '../analysis/HeaderAnalysisPanel'
import { CorsAnalysisPanel } from '../analysis/CorsAnalysisPanel'
import { OptionsAnalysisPanel } from '../analysis/OptionsAnalysisPanel'

interface ResponseAnalysisProps {
  dnsAnalysis: DnsAnalysis | null
  corsAnalysis: CorsAnalysis | null
  optionsAnalysis: OptionsAnalysis | null
  headerAnalysis: HeaderAnalysisItem[] | null
  currentMethod?: string
}

export const ResponseAnalysis: React.FC<ResponseAnalysisProps> = ({
  dnsAnalysis,
  corsAnalysis,
  optionsAnalysis,
  headerAnalysis,
  currentMethod = 'GET',
}) => {
  const hasAny =
    dnsAnalysis ||
    corsAnalysis ||
    optionsAnalysis ||
    (headerAnalysis && headerAnalysis.length > 0)

  if (!hasAny) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-xs font-mono text-[#3A3A3A]">No analysis data available.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4" aria-label="Response analysis">
      <DnsAnalysisPanel dnsAnalysis={dnsAnalysis} />
      <HeaderAnalysisPanel headerAnalysis={headerAnalysis} />
      <CorsAnalysisPanel corsAnalysis={corsAnalysis} />
      <OptionsAnalysisPanel
        optionsAnalysis={optionsAnalysis}
        currentMethod={currentMethod}
      />
    </div>
  )
}
