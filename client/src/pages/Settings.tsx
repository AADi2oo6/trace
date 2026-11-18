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
              <p className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold">
                Appearance &amp; Theme
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Choose your preferred visual theme. Persists across sessions.
              </p>
            </div>
            <div className="text-[11px] font-mono px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-md text-[var(--text-secondary)]">
              ACTIVE: <span className="text-blue-500 font-bold">{resolvedTheme.toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectTheme(opt.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-blue-500 bg-[var(--bg-active)] shadow-xs'
                      : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-hover)]'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Top Bar with Icon and Radio Indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        {opt.label}
                      </span>
                    </div>
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-[var(--border-default)] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                  </div>

                  {/* Visual Preview */}
                  <div className="mb-3 rounded-lg overflow-hidden pointer-events-none">
                    {opt.preview}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
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
            <p className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold mb-3">
              {group.heading}
            </p>
            <Panel padding="none" className="overflow-hidden rounded-xl">
              {group.items.map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <Divider />}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-1">
                    <div>
                      <p className="text-xs font-mono text-[var(--text-primary)] font-medium">{item.label}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
                    </div>
                    <span className="text-xs font-mono text-blue-500 sm:ml-4 shrink-0 font-semibold">
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
          <p className="text-xs font-mono tracking-widest text-[var(--text-primary)] uppercase font-semibold mb-3">
            Keyboard Shortcuts &amp; Accessibility
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg flex items-center justify-between shadow-xs">
              <span className="text-[var(--text-secondary)]">Execute Request</span>
              <kbd className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-[11px] rounded-md font-semibold">
                Ctrl + Enter
              </kbd>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg flex items-center justify-between shadow-xs">
              <span className="text-[var(--text-secondary)]">Close Drawer / Modal</span>
              <kbd className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-[11px] rounded-md font-semibold">
                Escape
              </kbd>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg flex items-center justify-between shadow-xs">
              <span className="text-[var(--text-secondary)]">Focus Navigation</span>
              <kbd className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-[11px] rounded-md font-semibold">
                Tab / Shift+Tab
              </kbd>
            </div>
            <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg flex items-center justify-between shadow-xs">
              <span className="text-[var(--text-secondary)]">Toggle Theme</span>
              <kbd className="px-2 py-0.5 bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-primary)] text-[11px] rounded-md font-semibold">
                Topbar Icon
              </kbd>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl flex items-start gap-3 text-xs text-[var(--text-secondary)] shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-[var(--text-primary)]">Technical Honesty Guarantee:</strong> Network
            measurements and timings are captured honestly from actual socket and HTTP executions.
            TRACE does not fabricate packet captures, connection timings, or synthetic measurements.
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
