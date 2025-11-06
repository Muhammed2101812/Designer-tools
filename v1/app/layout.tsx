import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import dynamic from 'next/dynamic'
import './globals.css'
import { StoreInitializer } from '@/components/providers/StoreInitializer'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getCriticalCSS } from '@/lib/utils/scriptOptimization'

// Lazy load non-critical components only
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => ({ default: mod.Toaster })), {
  ssr: false
})

const OptimizedScripts = dynamic(() => import('@/components/shared/OptimizedScripts'), {
  ssr: false
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

export { defaultMetadata as metadata } from '@/config/seo'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical CSS inlined for faster rendering */}
        <style dangerouslySetInnerHTML={{ __html: getCriticalCSS() }} />
        
        {/* DNS prefetch for critical domains only */}
        <link rel="dns-prefetch" href="//supabase.co" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://supabase.co" crossOrigin="anonymous" />
        
        
        {/* Font optimization - removed problematic preload */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Optimize font loading with font-display: swap */
            @font-face {
              font-family: 'Inter';
              font-display: swap;
            }
            
            /* Prevent layout shift during font loading */
            .font-loading { visibility: hidden; }
            .font-loaded { visibility: visible; }
          `
        }} />
      </head>
      <body className={inter.className}>
        {/* Skip to main content link for keyboard navigation */}
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <StoreInitializer />
        {/* Temporarily disabled for performance testing */}
        {/* <PerformanceMonitor /> */}
        <ThemeProvider>
          <div className="flex min-h-screen flex-col transition-colors duration-300">
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
        <OptimizedScripts />
      </body>
    </html>
  )
}