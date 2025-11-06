'use client'

import { useInitializeAuth } from '@/lib/hooks/useInitializeAuth'
import { useInitializeTheme } from '@/lib/hooks/useInitializeTheme'

/**
 * Client component that initializes all Zustand stores on app load
 * This component should be included in the root layout
 */
export function StoreInitializer() {
  useInitializeAuth()
  useInitializeTheme()
  
  return null
}
