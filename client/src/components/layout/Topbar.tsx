import React from 'react'
import { Menu, Sun, Moon, Laptop } from 'lucide-react'
import { Breadcrumbs } from '../navigation/Breadcrumbs'
import { StatusIndicator } from '../feedback/StatusIndicator'
import { useThemeStore } from '../../store/themeStore'
import { toast } from '../../store/toastStore'

interface TopbarProps {
  onMobileMenuToggle: () => void
  backendStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
}

export const Topbar: React.FC<TopbarProps> = ({
  onMobileMenuToggle,
  backendStatus = 'connected',
}) => {
  const { themeMode, setThemeMode } = useThemeStore()

  const handleCycleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : themeMode === 'light' ? 'system' : 'dark'
    setThemeMode(nextMode)
    toast.info(`Theme set to ${nextMode.toUpperCase()}`)
  }

  return (
    <header
      className="h-11 shrink-0 border-b border-[#1E1E1E] bg-[#0A0A0A] flex items-center justify-between px-4 select-none"
      role="banner"
    >
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1 text-[#6B6B6B] hover:text-[#E8E8E8] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF6A00]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Mobile brand (hidden on desktop — sidebar has brand) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="bg-[#FF6A00] text-black font-black text-xs px-1.5 py-0.5 tracking-widest font-mono">
            TRACE
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: theme toggle & backend status */}
      <div className="flex items-center gap-2">
        {/* Theme Quick Toggle */}
        <button
          onClick={handleCycleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-[#1E1E1E] bg-[#111111] hover:border-[#333333] transition-colors text-xs font-mono text-[#888888] hover:text-[#E8E8E8]"
          title={`Current: ${themeMode.toUpperCase()} (Click to cycle Dark → Light → System)`}
          aria-label={`Toggle color theme. Current theme is ${themeMode}`}
        >
          {themeMode === 'light' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : themeMode === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-sky-400" />
          ) : (
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="text-[10px] uppercase hidden sm:inline">{themeMode}</span>
        </button>

        {/* Backend Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 border border-[#1E1E1E] bg-[#111111]">
          <span className="text-[10px] font-mono text-[#3A3A3A] tracking-wider uppercase">
            API
          </span>
          <StatusIndicator status={backendStatus} showLabel={false} />
          <span
            className="text-[10px] font-mono tracking-wider"
            style={{
              color:
                backendStatus === 'connected'
                  ? '#22C55E'
                  : backendStatus === 'error'
                    ? '#EF4444'
                    : '#F59E0B',
            }}
          >
            {backendStatus === 'connected'
              ? 'Connected'
              : backendStatus === 'connecting'
                ? 'Connecting'
                : backendStatus === 'error'
                  ? 'Error'
                  : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
