'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WelcomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get profile to check for full name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle()

        setUserName(profile?.full_name || user.email?.split('@')[0] || 'there')
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const handleGetStarted = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold">
          Welcome to Design Kit, {userName}! 🎉
        </CardTitle>
        <CardDescription className="text-base">
          Your account has been successfully created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="font-medium mb-2">What&apos;s included in your free plan:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Unlimited access to all client-side tools (Color Picker, Image Cropper, etc.)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>10 daily API operations for advanced tools</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Up to 10MB file uploads</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Privacy-first processing (files never leave your browser)</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ready to get started?</h3>
            <p className="text-sm text-muted-foreground">
              Explore our suite of professional design tools and start creating amazing designs.
            </p>
          </div>
        </div>

        <Button onClick={handleGetStarted} className="w-full" size="lg">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
