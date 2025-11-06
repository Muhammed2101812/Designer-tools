'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, Zap, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RateLimitDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean
  /**
   * Callback when dialog should be closed
   */
  onOpenChange: (open: boolean) => void
  /**
   * Rate limit information from the API response
   */
  limit: number
  remaining: number
  reset: number
  /**
   * Custom error message (optional)
   */
  message?: string
  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void
  /**
   * Show upgrade suggestion for free users
   */
  showUpgrade?: boolean
  /**
   * Callback when upgrade button is clicked
   */
  onUpgrade?: () => void
}

/**
 * Formats seconds into human-readable time
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} saniye`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes} dakika ${remainingSeconds} saniye`
      : `${minutes} dakika`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0
    ? `${hours} saat ${remainingMinutes} dakika`
    : `${hours} saat`
}

/**
 * Rate limit dialog component for prominent error display
 */
export function RateLimitDialog({
  open,
  onOpenChange,
  limit,
  remaining,
  reset,
  message,
  onRetry,
  showUpgrade = false,
  onUpgrade,
}: RateLimitDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [canRetry, setCanRetry] = useState(false)

  // Calculate time remaining until reset
  useEffect(() => {
    if (!open) return

    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = Math.max(0, reset - now)
      setTimeRemaining(remaining)
      setCanRetry(remaining === 0)
    }

    // Update immediately
    updateTimeRemaining()

    // Update every second
    const interval = setInterval(updateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [reset, open])

  const defaultMessage = showUpgrade
    ? 'İstek limitinizi aştınız. Daha yüksek limitler için planınızı yükseltin veya sıfırlanmasını bekleyin.'
    : 'Çok fazla istek gönderdiniz. Lütfen limit sıfırlanana kadar bekleyin.'

  const handleRetry = () => {
    onRetry?.()
    onOpenChange(false)
  }

  const handleUpgrade = () => {
    onUpgrade?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            İstek Limiti Aşıldı
          </DialogTitle>
          <DialogDescription className="text-left">
            {message || defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rate limit info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{limit}</div>
              <div className="text-sm text-muted-foreground">İstek/Dakika</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{remaining}</div>
              <div className="text-sm text-muted-foreground">Kalan İstek</div>
            </div>
          </div>

          {/* Countdown timer */}
          {timeRemaining > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Yeniden deneyebilirsiniz: <strong>{formatTimeRemaining(timeRemaining)}</strong>
              </span>
            </div>
          )}

          {/* Upgrade suggestion for free users */}
          {showUpgrade && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Daha Yüksek Limitler İstiyorsanız
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Premium plan ile dakikada 120 istek, Pro plan ile 300 istek hakkınız olur.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Kapat
          </Button>
          
          {canRetry && onRetry && (
            <Button
              onClick={handleRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-3 w-3" />
              Tekrar Dene
            </Button>
          )}
          
          {showUpgrade && onUpgrade && (
            <Button
              onClick={handleUpgrade}
              className="flex items-center gap-2"
            >
              <Zap className="h-3 w-3" />
              Planı Yükselt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}