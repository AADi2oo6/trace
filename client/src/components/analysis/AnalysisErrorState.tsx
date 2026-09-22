import React from 'react'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { RequestResponse } from '../../types/api'
import { DnsAnalysisPanel } from './DnsAnalysisPanel'
import { Button } from '../ui/Button'

interface AnalysisErrorStateProps {
  response: RequestResponse
}

export const AnalysisErrorState: React.FC<AnalysisErrorStateProps> = ({ response }) => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Network Error Card */}
      <div className="border border-[#EF444430] bg-[#EF444408] p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 border border-[#EF444440] bg-[#EF444415] text-[#EF4444] shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-[#EF4444] uppercase font-bold">
                Network Failure
              </span>
              <span className="text-[10px] font-mono text-[#666666]">
                (No HTTP Response Received)
              </span>
            </div>

            <h2 className="text-sm font-mono font-semibold text-[#E8E8E8]">
              {response.message || 'The outbound request could not reach the target server.'}
            </h2>

            {response.error && (
              <div className="p-3 border border-[#EF444420] bg-[#0A0A0A] space-y-1 text-xs font-mono">
                <p className="text-[9px] uppercase tracking-wider text-[#EF4444] font-semibold">
                  Error Code: {response.error.code}
                </p>
                <p className="text-[#888888] leading-relaxed">
                  {response.error.message}
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/tester')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Return to API Tester
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* If DNS was performed before the failure, display it */}
      {response.dns_analysis && (
        <div>
          <p className="text-[9px] font-mono tracking-widest text-[#555555] uppercase mb-2">
            Associated Diagnostics
          </p>
          <DnsAnalysisPanel dnsAnalysis={response.dns_analysis} />
        </div>
      )}
    </div>
  )
}
