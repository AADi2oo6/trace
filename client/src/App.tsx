import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Terminal, Activity, ShieldCheck } from 'lucide-react'
import { Workspace } from './pages/Workspace'
import { Monitor } from './pages/Monitor'
import { useAppStore } from './store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const Shell: React.FC = () => {
  const systemStatus = useAppStore((state) => state.systemStatus)

  return (
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FF6A00] selection:text-[#000000]">
      {/* Top Console Navigation Bar */}
      <header className="h-14 border-b border-[#2A2A2A] bg-[#0A0A0A] flex items-center justify-between px-6 select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="bg-[#FF6A00] text-[#000000] font-black text-sm px-2 py-0.5 tracking-widest font-mono">
              TRACE
            </span>
            <div className="hidden sm:block">
              <span className="text-xs tracking-wider text-[#6B6B6B] uppercase font-mono">
                API Testing &amp; Network Analysis
              </span>
            </div>
          </div>

          <nav className="flex items-center border-l border-[#2A2A2A] pl-6 gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wider transition-colors border ${
                  isActive
                    ? 'border-[#FF6A00] text-[#FFFFFF] bg-[#1A1410]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#E8E8E8] hover:border-[#2A2A2A]'
                }`
              }
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>WORKSPACE</span>
            </NavLink>

            <NavLink
              to="/monitor"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1.5 text-xs font-mono tracking-wider transition-colors border ${
                  isActive
                    ? 'border-[#FF6A00] text-[#FFFFFF] bg-[#1A1410]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#E8E8E8] hover:border-[#2A2A2A]'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5" />
              <span>MONITOR</span>
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#121212] border border-[#2A2A2A]">
            <span className="w-2 h-2 bg-[#FF6A00] animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-widest text-[#FFFFFF] uppercase">
              SYSTEM {systemStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#000000]">
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/monitor" element={<Monitor />} />
        </Routes>
      </main>

      {/* Technical Footer Status Bar */}
      <footer className="h-8 border-t border-[#2A2A2A] bg-[#0A0A0A] flex items-center justify-between px-6 text-[11px] font-mono text-[#6B6B6B] select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#E8E8E8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A00]" />
            ENVIRONMENT: VERIFIED
          </span>
          <span className="text-[#2A2A2A]">|</span>
          <span>STACK: REACT + TS + VITE + TAILWIND + QUERY + ZUSTAND</span>
        </div>
        <div>
          <span className="text-[#6B6B6B]">PHASE 0 // STEP 1 COMPLETE</span>
        </div>
      </footer>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
