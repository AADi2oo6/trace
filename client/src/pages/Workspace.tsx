import React from 'react'
import { Terminal } from 'lucide-react'

export const Workspace: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[#FF6A00]" />
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase text-[#FFFFFF]">
              Workspace
            </h1>
            <p className="text-xs text-[#6B6B6B] font-mono">
              API Testing & Network Inspection Console
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-[#FF6A00]" />
          <span className="text-xs font-mono text-[#6B6B6B] uppercase">
            Route: /
          </span>
        </div>
      </div>

      <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-6 text-center">
        <p className="text-xs font-mono text-[#6B6B6B] uppercase tracking-wider mb-2">
          Workspace Environment Ready
        </p>
        <p className="text-sm text-[#E8E8E8]">
          API testing and network inspection modules will be initialized in subsequent phases.
        </p>
      </div>
    </div>
  )
}
