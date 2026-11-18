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
      className="h-11 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-between px-4 select-none"
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
          <div className="bg-blue-600 dark:bg-blue-500 text-white font-black text-xs px-2 py-0.5 tracking-widest font-mono rounded">
            TRACE
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right: theme toggle & backend status */}
      <div className="flex items-center gap-2.5">
        {/* Theme Quick Toggle */}
        <button
          onClick={handleCycleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-[var(--border-default)] bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-hover)] transition-colors text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded"
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
          <span className="text-[10px] uppercase hidden sm:inline font-semibold">{themeMode}</span>
        </button>

        {/* Backend Status */}
        <div className="flex items-center gap-2 px-2.5 py-1 border border-[var(--border-default)] bg-[var(--bg-panel)] rounded">
          <span className="text-[10px] font-mono text-[var(--text-dim)] tracking-wider uppercase font-semibold">
            API
          </span>
          <StatusIndicator status={backendStatus} showLabel={false} />
          <span
            className="text-[10px] font-mono tracking-wider font-semibold"
            style={{
              color:
                backendStatus === 'connected'
                  ? '#10B981'
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
