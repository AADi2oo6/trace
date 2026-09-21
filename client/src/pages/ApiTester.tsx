import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal, Send } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'

export const ApiTester: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageContainer
      title="API Tester"
      description="Send HTTP requests and inspect the full network response — headers, body, DNS, CORS, and journey."
      icon={<Terminal className="w-4.5 h-4.5" />}
    >
      <div className="p-6 space-y-4 animate-fade-in">
        {/* Placeholder request panel */}
        <Panel className="p-0 overflow-hidden">
          {/* Method + URL bar */}
          <div className="flex items-center gap-0 border-b border-[#1E1E1E]">
            <div className="px-4 py-3 border-r border-[#1E1E1E] bg-[#0D0D0D]">
              <span className="text-xs font-mono text-[#FF6A00] tracking-widest">GET</span>
            </div>
            <div className="flex-1 px-4 py-3 bg-[#0D0D0D]">
              <span className="text-xs font-mono text-[#3A3A3A]">
                https://api.example.com/endpoint
              </span>
            </div>
            <div className="px-4 py-2 border-l border-[#1E1E1E]">
              <Button variant="primary" size="sm" leftIcon={<Send className="w-3 h-3" />} disabled>
                Send
              </Button>
            </div>
          </div>

          {/* Coming soon body */}
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-px bg-[#2A2A2A]" />
              <Terminal className="w-4 h-4 text-[#3A3A3A]" aria-hidden="true" />
              <div className="w-6 h-px bg-[#2A2A2A]" />
            </div>
            <p className="text-xs font-mono tracking-widest text-[#3A3A3A] uppercase mb-2">
              API Tester
            </p>
            <p className="text-sm text-[#6B6B6B] max-w-sm leading-relaxed mb-6">
              Request construction, execution, and full network analysis will be
              available in the next build step.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
              Back to Dashboard
            </Button>
          </div>
        </Panel>

        {/* Analysis panels placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['Response', 'Headers', 'Journey'].map((label) => (
            <Panel key={label} className="py-8 text-center">
              <p className="text-[10px] font-mono tracking-widest text-[#2A2A2A] uppercase">
                {label}
              </p>
            </Panel>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
