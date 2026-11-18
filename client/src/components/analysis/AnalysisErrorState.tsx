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
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md border border-rose-500/40 bg-rose-500/20 text-rose-500 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-rose-500 uppercase font-bold">
                Network Failure
              </span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                (No HTTP Response Received)
              </span>
            </div>

            <h2 className="text-sm font-mono font-semibold text-[var(--text-primary)]">
              {response.message || 'The outbound request could not reach the target server.'}
            </h2>

            {response.error && (
              <div className="p-3 rounded-md border border-rose-500/20 bg-[var(--bg-panel)] space-y-1 text-xs font-mono">
                <p className="text-[9px] uppercase tracking-wider text-rose-500 font-semibold">
                  Error Code: {response.error.code}
                </p>
                <p className="text-[var(--text-secondary)] leading-relaxed">
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
