import { create } from 'zustand'

type SystemStatus = 'online' | 'standby' | 'offline'
type BackendStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

interface AppState {
  // System status
  systemStatus: SystemStatus
  setSystemStatus: (status: SystemStatus) => void

  // Backend connectivity
  backendStatus: BackendStatus
  setBackendStatus: (status: BackendStatus) => void

  // Sidebar mobile state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  systemStatus: 'online',
  setSystemStatus: (status) => set({ systemStatus: status }),

  backendStatus: 'connected',
  setBackendStatus: (status) => set({ backendStatus: status }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
