'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RateLimitErrorProps {
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
  /**
   * Additional CSS classes
   */
  className?: string
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
 * Rate limit error component that displays 429 responses with retry information
 */
export function RateLimitError({
  limit,
  remaining,
  reset,
  message,
  onRetry,
  showUpgrade = false,
  onUpgrade,
  className,
}: RateLimitErrorProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [canRetry, setCanRetry] = useState(false)

  // Calculate time remaining until reset
  useEffect(() => {
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
  }, [reset])

  const defaultMessage = showUpgrade
    ? 'İstek limitinizi aştınız. Daha yüksek limitler için planınızı yükseltin.'
    : 'Çok fazla istek gönderdiniz. Lütfen bir süre bekleyin.'

  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        İstek Limiti Aşıldı
        <Clock className="h-4 w-4" />
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message || defaultMessage}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Limit:</span> {limit} istek/dakika
          </div>
          <div>
            <span className="font-medium">Kalan:</span> {remaining} istek
          </div>
        </div>

        {timeRemaining > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-3 w-3" />
            <span>
              Yeniden deneyebilirsiniz: <strong>{formatTimeRemaining(timeRemaining)}</strong>
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {canRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Clock className="h-3 w-3" />
              Tekrar Dene
            </Button>
          )}
          
          {showUpgrade && onUpgrade && (
            <Button
              onClick={onUpgrade}
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap className="h-3 w-3" />
              Planı Yükselt
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}