import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppShellProps {
  children: React.ReactNode
  backendStatus?: 'connected' | 'connecting' | 'disconnected' | 'error'
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  backendStatus = 'connected',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#000000] text-[#F5F5F5] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <Topbar
          onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          backendStatus={backendStatus}
        />

        {/* Page content */}
        <main className="flex-1 overflow-hidden bg-[#000000]" role="main">
          {children}
        </main>

        {/* Status footer bar */}
        <footer
          className="h-7 shrink-0 border-t border-[#1A1A1A] bg-[#080808] flex items-center justify-between px-4 select-none"
          role="contentinfo"
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-[#2A2A2A] tracking-wider">
              TRACE // API Testing &amp; Network Analysis
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#2A2A2A]">
              STEP 11 // FRONTEND SHELL
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
