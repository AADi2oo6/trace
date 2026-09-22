import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Terminal,
  FileJson,
  ListFilter,
  Globe,
  ShieldCheck,
  Route,
  ArrowRight,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { NetworkAnimation } from '../components/network/NetworkAnimation'

interface CapabilityCardProps {
  icon: React.ReactNode
  label: string
  description: string
  to?: string
  onClick?: () => void
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({
  icon,
  label,
  description,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={[
      'group relative flex flex-col gap-3 p-4 text-left w-full',
      'border border-[#1E1E1E] bg-[#0D0D0D]',
      'hover:border-[#333333] hover:bg-[#111111]',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]',
      'transition-colors duration-150',
    ].join(' ')}
    aria-label={`${label}: ${description}`}
  >
    {/* Top row */}
    <div className="flex items-center justify-between">
      <span
        className="text-[#3A3A3A] group-hover:text-[#FF6A00] transition-colors duration-150"
        aria-hidden="true"
      >
        {icon}
      </span>
      <ArrowRight
        className="w-3 h-3 text-[#222222] group-hover:text-[#555555] transition-colors duration-150"
        aria-hidden="true"
      />
    </div>

    {/* Label */}
    <div>
      <p className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase leading-none">
        {label}
      </p>
      <p className="text-[11px] text-[#555555] group-hover:text-[#6B6B6B] mt-1 transition-colors duration-150 leading-snug">
        {description}
      </p>
    </div>
  </button>
)

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()

  const capabilities = [
    {
      icon: <Terminal className="w-4 h-4" />,
      label: 'HTTP',
      description: 'Execute requests across all standard methods',
      to: '/tester',
    },
    {
      icon: <FileJson className="w-4 h-4" />,
      label: 'Response',
      description: 'Inspect status, headers, and body',
      to: '/tester',
    },
    {
      icon: <ListFilter className="w-4 h-4" />,
      label: 'Headers',
      description: 'Analyze and understand HTTP headers',
      to: '/analysis',
    },
    {
      icon: <Globe className="w-4 h-4" />,
      label: 'DNS',
      description: 'Resolve hostnames and inspect records',
      to: '/analysis',
    },
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: 'CORS',
      description: 'Diagnose cross-origin configurations',
      to: '/analysis',
    },
    {
      icon: <Route className="w-4 h-4" />,
      label: 'Journey',
      description: 'Visualize the full request lifecycle',
      to: '/tester',
    },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-12 animate-fade-in">

        {/* ── Hero ─────────────────────────────────────── */}
        <section>
          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-1 bg-[#FF6A00]" aria-hidden="true" />
            <span className="text-[10px] font-mono tracking-widest text-[#FF6A00] uppercase">
              API Testing &amp; Network Analysis
            </span>
          </div>

          {/* Wordmark */}
          <div className="mb-3">
            <span className="bg-[#FF6A00] text-black font-black text-2xl px-3 py-1 tracking-widest font-mono select-none">
              TRACE
            </span>
          </div>

          {/* Tagline */}
          <p className="text-lg text-[#E8E8E8] font-light leading-snug mb-2">
            Network visibility for every API request.
          </p>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-md mb-8">
            Send a request. Understand what happened behind it — DNS resolution,
            headers, CORS policy, and the complete network journey.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/tester')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Launch API Tester
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => navigate('/docs')}
            >
              Documentation
            </Button>
          </div>
        </section>

        {/* ── Network Animation ─────────────────────────── */}
        <section aria-label="Request journey visualization">
          <div className="border border-[#1A1A1A] bg-[#080808] px-6 py-6">
            <p className="text-[10px] font-mono tracking-widest text-[#2A2A2A] uppercase mb-5">
              TRACE follows your request
            </p>
            <NetworkAnimation />
          </div>
        </section>

        {/* ── Capabilities ─────────────────────────────── */}
        <section aria-labelledby="tools-heading">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <span
              id="tools-heading"
              className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase"
            >
              Analysis Tools
            </span>
            <div className="flex-1 h-px bg-[#1A1A1A]" aria-hidden="true" />
          </div>

          {/* Grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[#1A1A1A]"
            role="list"
          >
            {capabilities.map((cap) => (
              <div key={cap.label} role="listitem">
                <CapabilityCard
                  {...cap}
                  onClick={() => navigate(cap.to ?? '/tester')}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────── */}
        <section aria-labelledby="how-heading">
          <div className="flex items-center gap-3 mb-4">
            <span
              id="how-heading"
              className="text-[10px] font-mono tracking-widest text-[#3A3A3A] uppercase"
            >
              How TRACE works
            </span>
            <div className="flex-1 h-px bg-[#1A1A1A]" aria-hidden="true" />
          </div>

          <div className="border border-[#1A1A1A] bg-[#080808] divide-y divide-[#141414]">
            {[
              {
                step: '01',
                title: 'Configure your request',
                desc: 'Choose method, URL, headers, and body.',
              },
              {
                step: '02',
                title: 'TRACE executes it safely',
                desc: 'Sent through a secured backend proxy with SSRF protection.',
              },
              {
                step: '03',
                title: 'Inspect every layer',
                desc: 'DNS records, headers, CORS policy, journey timing — all structured.',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4 px-5 py-4">
                <span className="font-mono text-xs text-[#2A2A2A] tracking-widest shrink-0 mt-0.5">
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-mono text-[#B0B0B0] mb-0.5">{item.title}</p>
                  <p className="text-[11px] text-[#555555]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
