'use client'

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error messages
 */

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { logError, storeErrorForDebug } from '@/lib/utils/error-logger'
import { getUserErrorMessage } from '@/lib/utils/errors'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  retryCount: number
  isRetrying: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    logError(error, {
      componentStack: errorInfo.componentStack,
    })
    
    // Store for debugging
    storeErrorForDebug(error, {
      componentStack: errorInfo.componentStack,
    })
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo)
    
    this.setState({
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    })
  }

  handleRetry = async () => {
    if (this.state.retryCount >= 3) return

    this.setState(prevState => ({
      isRetrying: true,
      retryCount: prevState.retryCount + 1
    }))

    // Add delay for network errors
    const isNetworkError = this.isNetworkError(this.state.error)
    if (isNetworkError) {
      const delay = Math.pow(2, this.state.retryCount) * 1000 // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    })
  }

  isNetworkError = (error: Error | null): boolean => {
    if (!error) return false
    const networkErrorMessages = [
      'fetch',
      'network',
      'ERR_NETWORK',
      'ERR_INTERNET_DISCONNECTED',
      'ERR_FAILED',
      'ERR_ABORTED',
      'TypeError: Failed to fetch',
      'NetworkError'
    ]
    return networkErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase()) ||
      error.stack?.toLowerCase().includes(msg.toLowerCase())
    )
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      const errorMessage = this.state.error 
        ? getUserErrorMessage(this.state.error)
        : 'Something went wrong'
      
      const isNetworkError = this.isNetworkError(this.state.error)
      const canRetry = this.state.retryCount < 3 && !this.state.isRetrying

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>
                  {isNetworkError ? 'Connection Error' : 'Something went wrong'}
                </CardTitle>
              </div>
              <CardDescription>
                {isNetworkError 
                  ? 'Please check your internet connection and try again.'
                  : errorMessage
                }
                {this.state.retryCount > 0 && (
                  <span className="block mt-1 text-xs">
                    Retry attempt: {this.state.retryCount}/3
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
            
            <CardFooter className="flex gap-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="flex-1"
                  disabled={this.state.isRetrying}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className={canRetry ? "flex-1" : "w-full"}
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary wrapper
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
