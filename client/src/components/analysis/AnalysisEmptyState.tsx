import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Network, ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

export const AnalysisEmptyState: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-md mx-auto">
      {/* Icon frame */}
      <div className="w-12 h-12 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center mb-6 text-blue-500 shadow-xs">
        <Network className="w-6 h-6" />
      </div>

      <p className="text-[10px] font-mono tracking-widest text-blue-500 uppercase font-semibold mb-2">
        Awaiting Execution
      </p>

      <h2 className="text-sm font-mono font-semibold text-[var(--text-primary)] tracking-wider uppercase mb-3">
        No Network Analysis
      </h2>

      <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed mb-6">
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
