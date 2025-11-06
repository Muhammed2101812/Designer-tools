'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, RefreshCw, Mail, HelpCircle } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const message = searchParams.get('message')

  // Get specific error information
  const getErrorInfo = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Denied',
          description: 'You cancelled the authentication process or denied access.',
          suggestions: [
            'Try logging in again and approve the permissions',
            'Use email/password login instead',
            'Check if you have the correct account selected'
          ]
        }
      case 'invalid_request':
        return {
          title: 'Invalid Request',
          description: 'The authentication link is malformed or expired.',
          suggestions: [
            'Try logging in again from the login page',
            'Clear your browser cache and cookies',
            'Request a new verification email if needed'
          ]
        }
      case 'server_error':
        return {
          title: 'Server Error',
          description: 'Our authentication server is experiencing issues.',
          suggestions: [
            'Wait a few minutes and try again',
            'Check our status page for any ongoing issues',
            'Contact support if the problem persists'
          ]
        }
      case 'temporarily_unavailable':
        return {
          title: 'Service Temporarily Unavailable',
          description: 'The authentication service is temporarily down.',
          suggestions: [
            'Try again in a few minutes',
            'Use email/password login if available',
            'Check our status page for updates'
          ]
        }
      default:
        return {
          title: 'Authentication Error',
          description: message || 'Something went wrong during authentication.',
          suggestions: [
            'Try logging in again',
            'Clear your browser cache and cookies',
            'Request a new verification email',
            'Contact support if the problem persists'
          ]
        }
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold flex items-center">
          <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
          {errorInfo.title}
        </CardTitle>
        <CardDescription>
          {errorInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            What you can do:
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Need help?</strong> If you continue to experience issues, please contact our support team with the error code: <code className="bg-background px-1 py-0.5 rounded text-xs">{error || 'AUTH_ERROR'}</code>
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button asChild className="w-full">
          <Link href="/login">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Login Again
          </Link>
        </Button>
        <div className="flex w-full space-x-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/signup">Create Account</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/reset-password">
              <Mail className="mr-2 h-4 w-4" />
              Reset Password
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
