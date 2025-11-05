import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { StoreInitializer } from '@/components/providers/StoreInitializer'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PerformanceMonitor } from '@/components/providers/PerformanceMonitor'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Design Kit - Professional Design Tools Suite',
  description: 'Privacy-first browser-based image processing and design tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="">{/* Temporarily disabled Google Fonts: inter.className */}
        {/* Skip to main content link for keyboard navigation */}
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <StoreInitializer />
        <PerformanceMonitor />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col transition-colors duration-300">
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
