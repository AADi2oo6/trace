import { create } from 'zustand'

interface AppState {
  systemStatus: 'online' | 'standby' | 'offline'
  setSystemStatus: (status: 'online' | 'standby' | 'offline') => void
}

export const useAppStore = create<AppState>((set) => ({
  systemStatus: 'online',
  setSystemStatus: (status) => set({ systemStatus: status }),
}))
