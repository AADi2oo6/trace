import React from 'react'
import {
  LayoutDashboard,
  Compass,
  Terminal,
  Network,
  Route,
  GitCompare,
  Clock,
  Activity,
  FlaskConical,
  BookOpen,
  Settings,
  X,
  Radio,
} from 'lucide-react'
import { NavItem } from '../navigation/NavItem'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

interface NavSection {
  title: string
  items: Array<{
    to: string
    icon: React.ReactNode
    label: string
    description: string
    end?: boolean
  }>
}

const navSections: NavSection[] = [
  {
    title: 'Core Tools',
    items: [
      {
        to: '/',
        icon: <LayoutDashboard className="w-4 h-4" />,
        label: 'Dashboard',
        description: 'Overview & telemetry',
        end: true,
      },
      {
        to: '/explorer',
        icon: <Compass className="w-4 h-4" />,
        label: 'Explorer',
        description: 'Universal content & URLs',
      },
      {
        to: '/tester',
        icon: <Terminal className="w-4 h-4" />,
        label: 'API Tester',
        description: 'Execute HTTP requests',
      },
    ],
  },
  {
    title: 'Network Analysis',
    items: [
      {
        to: '/analysis',
        icon: <Network className="w-4 h-4" />,
        label: 'Analysis',
        description: 'DNS, headers & CORS',
      },
      {
        to: '/journey',
        icon: <Route className="w-4 h-4" />,
        label: 'Journey',
        description: 'Network lifecycle & waterfall',
      },
      {
        to: '/compare',
        icon: <GitCompare className="w-4 h-4" />,
        label: 'Compare',
        description: 'Response & diff engine',
      },
    ],
  },
  {
    title: 'Observability',
    items: [
      {
        to: '/history',
        icon: <Clock className="w-4 h-4" />,
        label: 'History',
        description: 'Recorded requests & replay',
      },
      {
        to: '/monitor',
        icon: <Activity className="w-4 h-4" />,
        label: 'Monitoring',
        description: 'Health checks & uptime',
      },
      {
        to: '/demo',
        icon: <FlaskConical className="w-4 h-4" />,
        label: 'Demo API',
        description: 'Predictable test targets',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        to: '/docs',
        icon: <BookOpen className="w-4 h-4" />,
        label: 'Docs',
        description: 'Guides & reference',
      },
      {
        to: '/settings',
        icon: <Settings className="w-4 h-4" />,
        label: 'Settings',
        description: 'Themes & configuration',
      },
    ],
  },
]

const SidebarContent: React.FC<{ onMobileClose?: () => void }> = ({ onMobileClose }) => (
  <div className="flex flex-col h-full select-none">
    {/* Brand Header */}
    <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border-default)] shrink-0 bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-blue-600 dark:bg-blue-500 text-white font-black text-xs font-mono shadow-xs tracking-wider">
          TR
        </div>
        <div>
          <span className="font-mono font-bold text-xs tracking-wider text-[var(--text-primary)] block leading-none">
            TRACE <span className="text-[10px] text-blue-500 font-semibold">2.0</span>
          </span>
          <span className="text-[9px] text-[var(--text-dim)] font-mono tracking-widest uppercase block mt-0.5">
            Network Platform
          </span>
        </div>
      </div>
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 transition-colors lg:hidden"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Sectioned Navigation */}
    <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4" aria-label="Primary navigation">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          <div className="px-2.5 py-1">
            <span className="text-[9px] font-mono tracking-widest text-[var(--text-dim)] uppercase select-none font-semibold">
              {section.title}
            </span>
          </div>
          <ul role="list" className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavItem
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  end={item.end}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>

    {/* Platform Status Footer */}
    <div className="px-4 py-3 border-t border-[var(--border-default)] shrink-0 bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Engine Active</span>
        </div>
        <span className="text-[var(--text-dim)]">v2.1</span>
      </div>
    </div>
  </div>
)

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] h-full"
        aria-label="Sidebar navigation"
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-60 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] animate-slide-in-left">
            <SidebarContent onMobileClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  )
}
