/**
 * TRACE Theme Store
 * Centralized state for Light / Dark / System theme preference.
 * Persists in localStorage and applies immediately to document.documentElement.
 */

import { create } from 'zustand'

export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedTheme = 'dark' | 'light'

const STORAGE_KEY = 'trace-theme-mode'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved
    }
  } catch {
    // Local storage access error (e.g. private mode)
  }
  return 'dark'
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return mode
}

function applyThemeToDOM(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  if (resolved === 'light') {
    root.classList.add('light')
  } else {
    root.classList.remove('light')
  }
}

interface ThemeState {
  themeMode: ThemeMode
  resolvedTheme: ResolvedTheme
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialMode = getInitialMode()
  const initialResolved = resolveMode(initialMode)

  // Apply immediately on store initialization
  applyThemeToDOM(initialResolved)

  // Listen to OS scheme changes if in system mode
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    mediaQuery.addEventListener('change', () => {
      if (get().themeMode === 'system') {
        const nextResolved = resolveMode('system')
        applyThemeToDOM(nextResolved)
        set({ resolvedTheme: nextResolved })
      }
    })
  }

  return {
    themeMode: initialMode,
    resolvedTheme: initialResolved,

    setThemeMode: (mode: ThemeMode) => {
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {
        // Fallback for restricted storage environments
      }
      const nextResolved = resolveMode(mode)
      applyThemeToDOM(nextResolved)
      set({ themeMode: mode, resolvedTheme: nextResolved })
    },

    toggleTheme: () => {
      const current = get().resolvedTheme
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark'
      get().setThemeMode(next)
    },
  }
})
