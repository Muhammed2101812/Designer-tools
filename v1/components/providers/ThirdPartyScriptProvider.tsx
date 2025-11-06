/**
 * Third-party script provider for optimized loading
 * Manages script loading lifecycle and fallbacks
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { scriptManager, THIRD_PARTY_SCRIPTS, initializeThirdPartyScripts } from '@/lib/utils/thirdPartyScripts'

interface ThirdPartyScriptContextType {
  isStripeLoaded: boolean
  isSentryLoaded: boolean
  isAnalyticsLoaded: boolean
  loadScript: (scriptId: string) => Promise<void>
  getScriptStatus: (scriptId: string) => 'not-loaded' | 'loading' | 'loaded' | 'failed'
}

const ThirdPartyScriptContext = createContext<ThirdPartyScriptContextType | null>(null)

interface ThirdPartyScriptProviderProps {
  children: ReactNode
}

export function ThirdPartyScriptProvider({ children }: ThirdPartyScriptProviderProps) {
  const [scriptStatuses, setScriptStatuses] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize third-party scripts
    initializeThirdPartyScripts()

    // Monitor script loading status
    const checkStatuses = () => {
      const newStatuses: Record<string, string> = {}
      Object.keys(THIRD_PARTY_SCRIPTS).forEach(scriptId => {
        newStatuses[scriptId] = scriptManager.getStatus(scriptId)
      })
      setScriptStatuses(newStatuses)
    }

    // Check statuses periodically
    const interval = setInterval(checkStatuses, 1000)
    checkStatuses() // Initial check

    return () => clearInterval(interval)
  }, [])

  const loadScript = async (scriptId: string): Promise<void> => {
    const script = THIRD_PARTY_SCRIPTS[scriptId]
    if (!script) {
      throw new Error(`Script ${scriptId} not found`)
    }

    await scriptManager.loadScript(script)
    
    // Update status
    setScriptStatuses(prev => ({
      ...prev,
      [scriptId]: scriptManager.getStatus(scriptId)
    }))
  }

  const getScriptStatus = (scriptId: string) => {
    return scriptStatuses[scriptId] as 'not-loaded' | 'loading' | 'loaded' | 'failed' || 'not-loaded'
  }

  const contextValue: ThirdPartyScriptContextType = {
    isStripeLoaded: getScriptStatus('stripe') === 'loaded',
    isSentryLoaded: getScriptStatus('sentry') === 'loaded',
    isAnalyticsLoaded: getScriptStatus('analytics') === 'loaded',
    loadScript,
    getScriptStatus,
  }

  return (
    <ThirdPartyScriptContext.Provider value={contextValue}>
      {children}
    </ThirdPartyScriptContext.Provider>
  )
}

export function useThirdPartyScripts() {
  const context = useContext(ThirdPartyScriptContext)
  if (!context) {
    throw new Error('useThirdPartyScripts must be used within ThirdPartyScriptProvider')
  }
  return context
}

/**
 * Hook for conditional script loading
 */
export function useConditionalScript(scriptId: string, condition: boolean = true) {
  const { loadScript, getScriptStatus } = useThirdPartyScripts()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!condition) return

    const status = getScriptStatus(scriptId)
    if (status === 'not-loaded') {
      setIsLoading(true)
      loadScript(scriptId)
        .catch(error => {
          console.error(`Failed to load script ${scriptId}:`, error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [condition, scriptId, loadScript, getScriptStatus])

  return {
    isLoaded: getScriptStatus(scriptId) === 'loaded',
    isLoading: isLoading || getScriptStatus(scriptId) === 'loading',
    hasFailed: getScriptStatus(scriptId) === 'failed',
  }
}

/**
 * Component for loading scripts on demand
 */
interface ScriptLoaderProps {
  scriptId: string
  fallback?: ReactNode
  loading?: ReactNode
  children: (isLoaded: boolean) => ReactNode
}

export function ScriptLoader({ scriptId, fallback, loading, children }: ScriptLoaderProps) {
  const { getScriptStatus } = useThirdPartyScripts()
  const status = getScriptStatus(scriptId)

  if (status === 'failed') {
    return <>{fallback || <div>Script failed to load</div>}</>
  }

  if (status === 'loading') {
    return <>{loading || <div>Loading script...</div>}</>
  }

  return <>{children(status === 'loaded')}</>
}

/**
 * Stripe-specific hook with enhanced error handling
 */
export function useStripe() {
  const { isStripeLoaded, loadScript } = useThirdPartyScripts()
  const [stripe, setStripe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isStripeLoaded) return

    try {
      // Initialize Stripe when script is loaded
      if (window.Stripe && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        const stripeInstance = window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
        setStripe(stripeInstance)
      } else {
        setError('Stripe configuration missing')
      }
    } catch (err) {
      setError('Failed to initialize Stripe')
      console.error('Stripe initialization error:', err)
    }
  }, [isStripeLoaded])

  const ensureStripeLoaded = async () => {
    if (!isStripeLoaded) {
      try {
        await loadScript('stripe')
      } catch (err) {
        setError('Failed to load Stripe')
        throw err
      }
    }
  }

  return {
    stripe,
    isLoaded: isStripeLoaded,
    error,
    ensureStripeLoaded,
  }
}