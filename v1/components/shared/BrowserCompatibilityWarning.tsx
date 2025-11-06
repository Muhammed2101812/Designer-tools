'use client'

/**
 * Browser Compatibility Warning Component
 * Displays warnings for unsupported browsers or missing features
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  checkRequiredFeatures,
  checkOptionalFeatures,
  getBrowserUpgradeMessage,
  isSupportedBrowser,
} from '@/lib/utils/browser-compat'

export function BrowserCompatibilityWarning() {
  const [warnings, setWarnings] = useState<string[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const newWarnings: string[] = []

    // Check required features
    const { supported, missing } = checkRequiredFeatures()
    if (!supported) {
      newWarnings.push(
        `Your browser is missing required features: ${missing.join(', ')}. Some tools may not work properly.`
      )
    }

    // Check browser version
    const upgradeMessage = getBrowserUpgradeMessage()
    if (upgradeMessage) {
      newWarnings.push(upgradeMessage)
    }

    // Check optional features
    const optionalFeatures = checkOptionalFeatures()
    const unsupportedOptional = optionalFeatures.filter(f => !f.supported)
    
    if (unsupportedOptional.length > 0) {
      unsupportedOptional.forEach(feature => {
        if (feature.fallback) {
          newWarnings.push(`${feature.feature} not supported. ${feature.fallback}`)
        }
      })
    }

    setWarnings(newWarnings)

    // Check if user has dismissed warnings before
    const dismissedKey = 'browser-compat-dismissed'
    const wasDismissed = sessionStorage.getItem(dismissedKey)
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('browser-compat-dismissed', 'true')
  }

  if (warnings.length === 0 || dismissed) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <Alert variant="destructive" className="relative">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Browser Compatibility Warning</AlertTitle>
        <AlertDescription className="mt-2 space-y-1">
          {warnings.map((warning, index) => (
            <p key={index} className="text-sm">
              {warning}
            </p>
          ))}
          <p className="text-sm mt-2">
            For the best experience, please use the latest version of Chrome, Firefox, Safari, or Edge.
          </p>
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDismiss}
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  )
}

/**
 * Minimal inline warning for critical issues
 */
export function CriticalBrowserWarning() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const { supported } = checkRequiredFeatures()
    setShow(!supported)
  }, [])

  if (!show) {
    return null
  }

  return (
    <div className="bg-destructive text-destructive-foreground p-4 text-center">
      <p className="text-sm font-medium">
        ⚠️ Your browser does not support required features. Please upgrade to use this application.
      </p>
    </div>
  )
}
