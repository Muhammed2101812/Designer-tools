'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

export default function VerifyEmailPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleResendEmail = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?return_to=/dashboard`,
        },
      })

      if (error) {
        toast({
          title: 'Failed to resend email',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Email sent!',
          description: 'Please check your inbox and spam folder.',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type: 'verification' }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Test verification email sent!',
          description: 'Check your inbox for a verification email to test delivery',
        })
      } else {
        toast({
          title: 'Test failed',
          description: data.error || 'Failed to send test email',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent you a verification link
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="text-sm font-medium">
            Please check your inbox and click the verification link to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, check your spam folder.
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">What happens next?</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            <li>Click the verification link in your email</li>
            <li>You&apos;ll be redirected to the welcome screen</li>
            <li>Start using Design Kit tools</li>
          </ol>
        </div>

        <div className="border-t pt-4 space-y-4">
          <h3 className="text-sm font-medium">Didn&apos;t receive the email?</h3>
          
          <div className="space-y-2">
            <Label htmlFor="email">Enter your email to resend verification</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleResendEmail} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Resend Verification'}
            </Button>
            <Button 
              onClick={handleTestEmail} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Test Email System
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Troubleshooting tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Check your spam/junk folder</li>
              <li>Wait 5-10 minutes (emails can be delayed)</li>
              <li>Try a different email provider (Gmail, Outlook, etc.)</li>
              <li>Use the &quot;Test Email System&quot; button to verify email delivery</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground text-center w-full">
          Already verified?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login to your account
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
