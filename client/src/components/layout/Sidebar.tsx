import React from 'react'
import {
  LayoutDashboard,
  Terminal,
  Network,
  Clock,
  Activity,
  BookOpen,
  Settings,
  X,
} from 'lucide-react'
import { NavItem } from '../navigation/NavItem'
import { Divider } from '../ui/Divider'

interface SidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

const primaryNavItems = [
  {
    to: '/',
    icon: <LayoutDashboard className="w-4 h-4" />,
    label: 'Dashboard',
    description: 'Overview & quick access',
    end: true,
  },
  {
    to: '/tester',
    icon: <Terminal className="w-4 h-4" />,
    label: 'API Tester',
    description: 'Send & inspect HTTP requests',
  },
  {
    to: '/analysis',
    icon: <Network className="w-4 h-4" />,
    label: 'Analysis',
    description: 'DNS, headers & CORS analysis',
  },
  {
    to: '/history',
    icon: <Clock className="w-4 h-4" />,
    label: 'History',
    description: 'Past requests & replay',
  },
  {
    to: '/monitor',
    icon: <Activity className="w-4 h-4" />,
    label: 'Monitor',
    description: 'Endpoint health & uptime',
  },
]

const secondaryNavItems = [
  {
    to: '/docs',
    icon: <BookOpen className="w-4 h-4" />,
    label: 'Documentation',
    description: 'Reference & guides',
  },
  {
    to: '/settings',
    icon: <Settings className="w-4 h-4" />,
    label: 'Settings',
    description: 'Preferences & config',
  },
]

const SidebarContent: React.FC<{ onMobileClose?: () => void }> = ({ onMobileClose }) => (
  <div className="flex flex-col h-full">
    {/* Brand */}
    <div className="flex items-center justify-between h-14 px-4 border-b border-[#1E1E1E] shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="bg-[#FF6A00] text-black font-black text-xs px-1.5 py-0.5 tracking-widest font-mono select-none">
          TRACE
        </div>
        <span className="text-[10px] text-[#3A3A3A] font-mono tracking-wider uppercase select-none hidden sm:block">
          v0.11
        </span>
      </div>
      {onMobileClose && (
        <button
          onClick={onMobileClose}
          className="text-[#6B6B6B] hover:text-[#E8E8E8] p-1 transition-colors lg:hidden"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Primary Navigation */}
    <nav className="flex-1 py-3 overflow-y-auto" aria-label="Primary navigation">
      <div className="px-3 mb-1">
        <span className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase select-none px-1">
          Navigation
        </span>
      </div>
      <ul role="list" className="space-y-0.5">
        {primaryNavItems.map((item) => (
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

      <div className="px-4 my-3">
        <Divider />
      </div>

      {/* Secondary Navigation */}
      <div className="px-3 mb-1">
        <span className="text-[9px] font-mono tracking-widest text-[#3A3A3A] uppercase select-none px-1">
          System
        </span>
      </div>
      <ul role="list" className="space-y-0.5">
        {secondaryNavItems.map((item) => (
          <li key={item.to}>
            <NavItem
              to={item.to}
              icon={item.icon}
              label={item.label}
              description={item.description}
            />
          </li>
        ))}
      </ul>
    </nav>

    {/* Footer */}
    <div className="px-4 py-3 border-t border-[#1E1E1E] shrink-0">
      <p className="text-[9px] font-mono text-[#2A2A2A] tracking-wider">
        API Testing &amp; Network Analysis
      </p>
    </div>
  </div>
)

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex w-56 shrink-0 flex-col border-r border-[#1E1E1E] bg-[#0A0A0A] h-full"
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
          <aside className="absolute left-0 top-0 bottom-0 w-56 flex flex-col border-r border-[#1E1E1E] bg-[#0A0A0A] animate-slide-in-left">
            <SidebarContent onMobileClose={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  )
}
