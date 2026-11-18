import React from 'react'
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
} from 'lucide-react'
import { PageContainer } from '../components/layout/PageContainer'
import { Panel } from '../components/ui/Panel'
import { Divider } from '../components/ui/Divider'
import { useThemeStore, type ThemeMode } from '../store/themeStore'
import { toast } from '../store/toastStore'

export const Settings: React.FC = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useThemeStore()

  const handleSelectTheme = (mode: ThemeMode) => {
    setThemeMode(mode)
    toast.success(`Appearance theme set to ${mode.toUpperCase()}`)
  }

  const themeOptions: Array<{
    id: ThemeMode
    label: string
    description: string
    icon: React.ReactNode
    preview: React.ReactNode
  }> = [
    {
      id: 'dark',
      label: 'Dark Theme',
      description: 'Near-black high contrast dark palette with TRACE orange accents.',
      icon: <Moon className="w-4 h-4 text-sky-400" />,
      preview: (
        <div className="w-full h-16 bg-[#000000] border border-[#222222] p-1.5 flex gap-1.5 rounded-none">
          <div className="w-1/4 h-full bg-[#0A0A0A] border-r border-[#1E1E1E] flex flex-col justify-between p-1">
            <div className="w-3 h-1.5 bg-[#FF6A00]" />
            <div className="w-full h-1 bg-[#222222]" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="w-full h-2.5 bg-[#0D0D0D] border border-[#1E1E1E] flex items-center px-1">
              <div className="w-8 h-1 bg-[#3A3A3A]" />
            </div>
            <div className="flex-1 bg-[#111111] border border-[#1E1E1E] p-1">
              <div className="w-12 h-1 bg-[#E8E8E8] mb-1" />
              <div className="w-6 h-1 bg-[#FF6A00]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'light',
      label: 'Light Theme',
      description: 'Clean off-white developer workspace with charcoal text and orange accents.',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      preview: (
        <div className="w-full h-16 bg-[#F6F8FA] border border-[#CBD5E1] p-1.5 flex gap-1.5 rounded-none">
          <div className="w-1/4 h-full bg-[#FFFFFF] border-r border-[#E2E8F0] flex flex-col justify-between p-1">
            <div className="w-3 h-1.5 bg-[#EA580C]" />
            <div className="w-full h-1 bg-[#E2E8F0]" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="w-full h-2.5 bg-[#FFFFFF] border border-[#E2E8F0] flex items-center px-1">
              <div className="w-8 h-1 bg-[#94A3B8]" />
            </div>
            <div className="flex-1 bg-[#FFFFFF] border border-[#E2E8F0] p-1">
              <div className="w-12 h-1 bg-[#0F172A] mb-1" />
              <div className="w-6 h-1 bg-[#EA580C]" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'system',
      label: 'System Preference',
      description: "Automatically match your operating system's light or dark mode setting.",
      icon: <Laptop className="w-4 h-4 text-emerald-400" />,
      preview: (
        <div className="w-full h-16 bg-gradient-to-r from-[#000000] to-[#F6F8FA] border border-[#333333] p-1.5 flex gap-1.5 rounded-none">
          <div className="w-1/4 h-full bg-[#0A0A0A] border-r border-[#1E1E1E] p-1">
            <div className="w-3 h-1.5 bg-[#FF6A00]" />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="w-full h-2.5 bg-[#111111]/80 border border-[#222222]" />
            <div className="flex-1 bg-gradient-to-r from-[#111111] to-[#FFFFFF] border border-[#222222]" />
          </div>
        </div>
      ),
    },
  ]

  const settingsGroups = [
    {
      heading: 'Request Defaults',
      items: [
        { label: 'Default timeout', value: '10s', description: 'Maximum wait for server response' },
        { label: 'Max redirects', value: '5', description: 'Redirect chain limit for outbound execution' },
        { label: 'Max response size', value: '2 MB', description: 'Payload size cap for in-memory response inspection' },
      ],
    },
    {
      heading: 'Security & SSRF Boundaries',
      items: [
        { label: 'SSRF Protection', value: 'Active (Strict)', description: 'Blocks private IPs, metadata endpoints (169.254.169.254), and loopback interfaces' },
        { label: 'Demo API Exception', value: 'Safe Isolated Loopback', description: 'Only local /demo endpoints on port 8000 permitted; path traversal blocked' },
        { label: 'Credential Sanitization', value: 'Enforced', description: 'Authorization tokens and sensitive headers are redacted before persistence' },
      ],
    },
    {
      heading: 'Backend & Endpoints',
      items: [
        { label: 'API base URL', value: 'http://localhost:8000/api', description: 'TRACE backend request execution and history endpoint' },
        { label: 'Demo base URL', value: 'http://localhost:8000/demo', description: 'In-tree controlled demo API catalogue' },
        { label: 'SQLite Database', value: 'sqlite:///./data/trace.db', description: 'Local persistent history and monitor fleet storage' },
      ],
    },
  ]

  return (
    <PageContainer
      title="Settings &amp; Preferences"
      description="System appearance, execution defaults, and security configurations."
      icon={<SettingsIcon className="w-4.5 h-4.5" />}
    >
      <div className="p-6 space-y-8 max-w-3xl animate-fade-in">
        {/* ── Appearance Section ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase font-semibold">
                Appearance &amp; Theme
              </p>
              <p className="text-xs text-[#888888] mt-0.5">
                Choose your preferred visual theme. Persists across sessions.
              </p>
            </div>
            <div className="text-[11px] font-mono px-2 py-0.5 bg-[#161616] border border-[#262626] text-[#A0A0A0]">
              ACTIVE: <span className="text-[#FF6A00] font-bold">{resolvedTheme.toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectTheme(opt.id)}
                  className={`flex flex-col text-left p-3.5 border transition-all relative ${
                    isSelected
                      ? 'border-[#FF6A00] bg-[#161616]/70 shadow-sm'
                      : 'border-[#1E1E1E] bg-[#0E0E0E] hover:border-[#333333] hover:bg-[#121212]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Top Bar with Icon and Radio Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span className="text-xs font-mono font-bold text-[#E8E8E8]">
                        {opt.label}
                      </span>
                    </div>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#FF6A00] bg-[#FF6A00]'
                          : 'border-[#444444] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-black stroke-[3]" />}
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="mb-3 overflow-hidden pointer-events-none">
                    {opt.preview}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[#888888] leading-snug">
                    {opt.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Settings Groups ──────────────────────────────────────── */}
        {settingsGroups.map((group) => (
          <div key={group.heading}>
            <p className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase font-semibold mb-3">
              {group.heading}
            </p>
            <Panel padding="none" className="overflow-hidden">
              {group.items.map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <Divider />}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-1">
                    <div>
                      <p className="text-xs font-mono text-[#E8E8E8]">{item.label}</p>
                      <p className="text-[11px] text-[#888888] mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-xs font-mono text-[#FF6A00] sm:ml-4 shrink-0 font-medium">
                      {item.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </Panel>
          </div>
        ))}

        {/* ── Keyboard Shortcuts Info ──────────────────────────────── */}
        <div>
          <p className="text-xs font-mono tracking-widest text-[#E8E8E8] uppercase font-semibold mb-3">
            Keyboard Shortcuts &amp; Accessibility
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0E0E0E] border border-[#1E1E1E] flex items-center justify-between">
              <span className="text-[#888888]">Execute Request</span>
              <kbd className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#E8E8E8] text-[11px]">
                Ctrl + Enter
              </kbd>
            </div>
            <div className="p-3 bg-[#0E0E0E] border border-[#1E1E1E] flex items-center justify-between">
              <span className="text-[#888888]">Close Drawer / Modal</span>
              <kbd className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#E8E8E8] text-[11px]">
                Escape
              </kbd>
            </div>
            <div className="p-3 bg-[#0E0E0E] border border-[#1E1E1E] flex items-center justify-between">
              <span className="text-[#888888]">Focus Navigation</span>
              <kbd className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#E8E8E8] text-[11px]">
                Tab / Shift+Tab
              </kbd>
            </div>
            <div className="p-3 bg-[#0E0E0E] border border-[#1E1E1E] flex items-center justify-between">
              <span className="text-[#888888]">Toggle Theme</span>
              <kbd className="px-2 py-0.5 bg-[#161616] border border-[#2A2A2A] text-[#E8E8E8] text-[11px]">
                Topbar Icon
              </kbd>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#111111] border border-[#222222] flex items-start gap-3 text-xs text-[#888888]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-[#E8E8E8]">Technical Honesty Guarantee:</strong> Network
            measurements and timings are captured honestly from actual socket and HTTP executions.
            TRACE does not fabricate packet captures, connection timings, or synthetic measurements.
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
