'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

/**
 * Hook to initialize theme on app load
 * Applies the stored theme preference to the document
 * 
 * Should be called once in the root layout or app component
 */
export function useInitializeTheme() {
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)

  useEffect(() => {
    // Apply theme on mount
    setTheme(theme)

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(mediaQuery.matches ? 'dark' : 'light')
      }

      mediaQuery.addEventListener('change', handleChange)
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [theme, setTheme])
}
