'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RateLimitError } from '@/components/shared/RateLimitError'
import { RateLimitDialog } from '@/components/shared/RateLimitDialog'
import { useRateLimitError, createRateLimitAwareFetch } from '@/lib/hooks/useRateLimitError'
import { useRouter } from 'next/navigation'

/**
 * Example component demonstrating rate limit error handling
 */
export function RateLimitExample() {
  const [loading, setLoading] = useState(false)
  const [showInlineError, setShowInlineError] = useState(false)
  const router = useRouter()
  
  // Use the rate limit error hook
  const {
    error,
    showDialog,
    setShowDialog,
    handleRateLimitError,
    retry,
    upgrade,
    canRetry,
    timeRemaining,
    showUpgrade,
  } = useRateLimitError({
    showUpgrade: true, // Show upgrade suggestions for free users
    onRetry: () => {
      console.log('Retrying operation...')
      // Implement retry logic here
    },
    onUpgrade: () => {
      router.push('/pricing')
    },
  })
  
  // Create rate limit aware fetch function
  const rateLimitAwareFetch = createRateLimitAwareFetch(handleRateLimitError)
  
  // Example API call that might hit rate limits
  const makeApiCall = async () => {
    setLoading(true)
    setShowInlineError(false)
    
    try {
      const response = await rateLimitAwareFetch('/api/example-rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test API call',
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('API call successful:', data)
      } else if (response.status !== 429) {
        // Handle other errors (429 is handled by the hook)
        console.error('API call failed:', response.statusText)
      }
    } catch (error) {
      console.error('Network error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Example of showing inline error
  const simulateRateLimitError = () => {
    const mockError = {
      limit: 10,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + 60,
      message: 'Bu bir örnek rate limit hatasıdır.',
    }
    
    handleRateLimitError(mockError)
    setShowInlineError(true)
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Rate Limit Error Handling Örneği</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={makeApiCall} 
              disabled={loading}
            >
              {loading ? 'Yükleniyor...' : 'API Çağrısı Yap'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={simulateRateLimitError}
            >
              Rate Limit Hatası Simüle Et
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Bu butonlar rate limit hatası durumlarını test etmek için kullanılabilir.
          </p>
        </CardContent>
      </Card>
      
      {/* Inline error display */}
      {showInlineError && error && (
        <RateLimitError
          limit={error.limit}
          remaining={error.remaining}
          reset={error.reset}
          message={error.message}
          showUpgrade={true}
          onRetry={canRetry ? retry : undefined}
          onUpgrade={upgrade}
        />
      )}
      
      {/* Dialog error display */}
      <RateLimitDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        limit={error?.limit || 0}
        remaining={error?.remaining || 0}
        reset={error?.reset || 0}
        message={error?.message}
        showUpgrade={showUpgrade}
        onRetry={canRetry ? retry : undefined}
        onUpgrade={upgrade}
      />
      
      {/* Status information */}
      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Limit:</span> {error.limit}
              </div>
              <div>
                <span className="font-medium">Kalan:</span> {error.remaining}
              </div>
              <div>
                <span className="font-medium">Tekrar deneme:</span> {canRetry ? 'Şimdi' : `${timeRemaining}s`}
              </div>
              <div>
                <span className="font-medium">Upgrade önerisi:</span> {showUpgrade ? 'Evet' : 'Hayır'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}