import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, ExternalLink } from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'

const sections = [
  {
    title: 'Getting Started',
    items: ['Sending your first request', 'Understanding the response', 'Reading DNS analysis'],
  },
  {
    title: 'Analysis Tools',
    items: ['Header Analyzer', 'CORS Analyzer', 'OPTIONS Inspector', 'Request Journey'],
  },
  {
    title: 'Backend API',
    items: ['POST /api/requests', 'Response schema reference', 'Error codes'],
  },
]

export const Docs: React.FC = () => {
  const navigate = useNavigate()

  return (
    <PageContainer
      title="Documentation"
      description="Reference guides and technical documentation for TRACE."
      icon={<BookOpen className="w-4.5 h-4.5" />}
    >
      <div className="p-6 space-y-6 animate-fade-in">
        <Panel className="p-0 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-12 px-8 text-center">
            <BookOpen className="w-6 h-6 text-[#2A2A2A] mb-4" aria-hidden="true" />
            <p className="text-xs font-mono tracking-widest text-[#3A3A3A] uppercase mb-2">
              Documentation
            </p>
            <p className="text-sm text-[#6B6B6B] max-w-sm leading-relaxed mb-6">
              Full documentation will be available here. In the meantime, refer to
              the backend API spec at{' '}
              <span className="font-mono text-[#555555]">/docs</span> when the
              dev server is running.
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink className="w-3 h-3" />}
                onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              >
                Backend API Docs
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                Dashboard
              </Button>
            </div>
          </div>
        </Panel>

        {/* Section outlines */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sections.map((section) => (
            <Panel key={section.title} padding="sm">
              <p className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase mb-3">
                {section.title}
              </p>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-[#2A2A2A] shrink-0" aria-hidden="true" />
                    <span className="text-xs text-[#555555]">{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
