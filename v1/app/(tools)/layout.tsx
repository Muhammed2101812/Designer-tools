'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { preloadLikelyRoutes } from '@/lib/utils/scriptOptimization'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Enable intelligent route preloading for better perceived performance
  useEffect(() => {
    const currentTool = pathname.split('/').pop()
    
    if (currentTool) {
      // Preload likely next routes after a short delay
      const timeoutId = setTimeout(() => {
        preloadLikelyRoutes(currentTool)
      }, 1000) // Wait 1 second to avoid interfering with current page load
      
      return () => clearTimeout(timeoutId)
    }
  }, [pathname])
  
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
    </div>
  )
}
