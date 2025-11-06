'use client'

import Script from 'next/script'
import { useEffect } from 'react'

export default function OptimizedScripts() {
  useEffect(() => {
    // Minimal inline script for critical performance
    if (typeof window !== 'undefined') {
      // Network status
      let isOnline = navigator.onLine

      const handleOnline = () => {
        if (!isOnline) {
          console.log('Network restored')
          isOnline = true
        }
      }

      const handleOffline = () => {
        if (isOnline) {
          console.warn('Network lost')
          isOnline = false
        }
      }

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Font loading optimization
      if ('fonts' in document && document.fonts) {
        document.fonts.ready.then(() => {
          document.documentElement.classList.add('font-loaded')
        })
      }

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  return (
    <>
      {/* Stripe - Only load on pricing/checkout pages */}
      {typeof window !== 'undefined' &&
       (window.location.pathname.includes('/pricing') ||
        window.location.pathname.includes('/checkout')) && (
        <Script
          src="https://js.stripe.com/v3/"
          strategy="lazyOnload"
          onError={(e) => console.error('Stripe failed to load:', e)}
        />
      )}
    </>
  )
}
