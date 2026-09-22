import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Network, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

export const AnalysisEmptyState: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-md mx-auto">
      {/* Icon frame */}
      <div className="w-12 h-12 border border-[#222222] bg-[#0D0D0D] flex items-center justify-center mb-6 text-[#444444]">
        <Network className="w-6 h-6" />
      </div>

      <p className="text-[10px] font-mono tracking-widest text-[#FF6A00] uppercase mb-2">
        Awaiting Execution
      </p>

      <h2 className="text-sm font-mono font-semibold text-[#E8E8E8] tracking-wider uppercase mb-3">
        No Network Analysis
      </h2>

      <p className="text-xs font-mono text-[#666666] leading-relaxed mb-6">
        Execute a request in the API Tester to inspect its DNS resolution, headers, CORS configuration, and server capabilities.
      </p>

      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate('/tester')}
        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
      >
        Open API Tester
      </Button>
    </div>
  )
}
