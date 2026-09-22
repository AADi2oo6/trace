import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { ApiTester } from './pages/ApiTester'
import { NetworkAnalysis } from './pages/NetworkAnalysis'
import { History } from './pages/History'
import { Monitor } from './pages/Monitor'
import { Docs } from './pages/Docs'
import { Settings } from './pages/Settings'
import { useAppStore } from './store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const AppRoutes: React.FC = () => {
  const backendStatus = useAppStore((state) => state.backendStatus)

  return (
    <AppShell backendStatus={backendStatus}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tester" element={<ApiTester />} />
        <Route path="/analysis" element={<NetworkAnalysis />} />
        <Route path="/history" element={<History />} />
        <Route path="/monitor" element={<Monitor />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
