'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, User, Crown, Zap, Calendar, Mail, Settings, CreditCard } from 'lucide-react'
import type { ProfileUpdate } from '@/lib/supabase/types'
import type { EmailPreferences } from '@/types'

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp']

interface SubscriptionData {
  id: string
  stripe_subscription_id: string
  stripe_price_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  plan: 'premium' | 'pro'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, profile, setProfile } = useAuthStore()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [fullName, setFullName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [usageStats, setUsageStats] = useState({ current: 0, limit: 10 })
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences>({
    user_id: '',
    marketing_emails: true,
    quota_warnings: true,
    subscription_updates: true
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check authentication
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
          router.push('/login')
          return
        }

        // Load profile if not in store
        if (!profile) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            toast({
              title: 'Error',
              description: 'Failed to load profile data.',
              variant: 'destructive',
            })
          } else if (profileData) {
            setProfile(profileData)
            setFullName(profileData.full_name || '')
            setAvatarPreview(profileData.avatar_url)

            // Load related data with the profile
            if (profileData.plan === 'free') {
              await loadUsageStats(currentUser.id)
            }
            if (profileData.plan && ['premium', 'pro'].includes(profileData.plan)) {
              await loadSubscriptionData(currentUser.id)
            }
          }
        } else {
          setFullName(profile.full_name || '')
          setAvatarPreview(profile.avatar_url)

          // Load related data with existing profile
          if (profile.plan === 'free') {
            await loadUsageStats(currentUser.id)
          }
          if (profile.plan && ['premium', 'pro'].includes(profile.plan)) {
            await loadSubscriptionData(currentUser.id)
          }
        }

        // Load email preferences
        await loadEmailPreferences(currentUser.id)
      } catch (error) {
        console.error('Load data error:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Only run once on mount

  const loadUsageStats = async (userId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: dailyLimit, error } = await supabase
        .from('daily_limits')
        .select('api_tools_count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid 406 error

      if (error) {
        console.error('Usage stats error:', error)
      } else if (dailyLimit) {
        setUsageStats({ current: dailyLimit.api_tools_count, limit: 10 })
      } else {
        // No data yet, set to 0
        setUsageStats({ current: 0, limit: 10 })
      }
    } catch (error) {
      console.error('Load usage stats error:', error)
      // Set default values on error
      setUsageStats({ current: 0, limit: 10 })
    }
  }

  const loadSubscriptionData = async (userId: string) => {
    try {
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid 406 error

      if (error) {
        console.error('Subscription data error:', error)
      } else if (subscriptionData) {
        setSubscription(subscriptionData)
      }
    } catch (error) {
      console.error('Load subscription data error:', error)
    }
  }

  const loadEmailPreferences = async (userId: string) => {
    try {
      const response = await fetch('/api/user/email-preferences')

      if (!response.ok) {
        // Silently use default preferences if API fails
        const defaultPrefs = {
          user_id: userId,
          marketing_emails: true,
          quota_warnings: true,
          subscription_updates: true
        }
        setEmailPreferences(defaultPrefs)
        return
      }

      const preferences = await response.json()
      setEmailPreferences(preferences)
    } catch (error) {
      // Silently use default preferences on any error
      const defaultPrefs = {
        user_id: userId,
        marketing_emails: true,
        quota_warnings: true,
        subscription_updates: true
      }
      setEmailPreferences(defaultPrefs)
    }
  }

  const validateAvatarFile = (file: File): string | null => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPG, or WEBP.'
    }
    
    if (file.size > MAX_AVATAR_SIZE) {
      return 'File too large. Maximum size is 2MB.'
    }
    
    return null
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file) return

    const validationError = validateAvatarFile(file)
    
    if (validationError) {
      toast({
        title: 'Invalid file',
        description: validationError,
        variant: 'destructive',
      })
      e.target.value = '' // Reset input
      return
    }

    setAvatarFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    setUploading(true)
    
    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !profile) return

    setSaving(true)

    try {
      let avatarUrl = profile.avatar_url

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        } else {
          // Upload failed, don't proceed with profile update
          setSaving(false)
          return
        }
      }

      // Update profile
      const updates: ProfileUpdate = {
        id: user.id,
        full_name: fullName.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .maybeSingle()

      if (error) {
        throw error
      }

      // Update store
      setProfile(data)
      setAvatarFile(null)

      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      })
    } catch (error) {
      console.error('Profile update error:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEmailPreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    setSavingPreferences(true)

    try {
      const response = await fetch('/api/user/email-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          marketing_emails: emailPreferences.marketing_emails,
          quota_warnings: emailPreferences.quota_warnings,
          subscription_updates: emailPreferences.subscription_updates,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update email preferences')
      }

      const updatedPreferences = await response.json()
      setEmailPreferences(updatedPreferences)

      toast({
        title: 'Success',
        description: 'Email preferences updated successfully.',
      })
    } catch (error) {
      console.error('Email preferences update error:', error)
      toast({
        title: 'Update failed',
        description: 'Failed to update email preferences. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }
      
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Manage subscription error:', error)
      toast({
        title: 'Error',
        description: 'Failed to open subscription management. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const usagePercentage = (usageStats.current / usageStats.limit) * 100

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'premium':
        return Crown
      case 'pro':
        return Zap
      default:
        return User
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Trial</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and avatar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarChange}
                      disabled={saving || uploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG, or WEBP. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={saving || uploading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || uploading}
                className="w-full"
              >
                {saving || uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Details */}
        <div className="space-y-6">
          {/* Plan Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getPlanIcon(profile.plan)
                    return <Icon className="h-5 w-5 text-muted-foreground" />
                  })()}
                  <span className="text-lg font-semibold capitalize">
                    {profile.plan}
                  </span>
                </div>
                {subscription && getStatusBadge(subscription.status)}
              </div>

              {subscription && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Period</span>
                      <span>
                        {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                        {new Date(subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {subscription.cancel_at_period_end && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          Your subscription will cancel at the end of the current period.
                        </p>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleManageSubscription}
                    >
                      Manage Subscription
                    </Button>
                  </div>
                </>
              )}

              {profile.plan === 'free' && (
                <>
                  <Separator />
                  <Button
                    className="w-full"
                    onClick={() => router.push('/pricing')}
                  >
                    Upgrade Plan
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {profile.updated_at && (
                <div>
                  <p className="text-sm font-medium">Profile Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics (Free Plan Only) */}
          {profile.plan === 'free' && (
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Daily API operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {usageStats.current} / {usageStats.limit}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      operations
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Resets daily at midnight UTC
                  </p>
                  {usageStats.current >= usageStats.limit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Manage your email notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailPreferencesSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails" className="text-base">
                    Marketing Emails
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features, tips, and promotional offers
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={emailPreferences.marketing_emails}
                  onCheckedChange={(checked: boolean) =>
                    setEmailPreferences(prev => ({ ...prev, marketing_emails: checked }))
                  }
                  disabled={savingPreferences}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="quota-warnings" className="text-base">
                    Quota Warnings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your daily quota is running low (90% used)
                  </p>
                </div>
                <Switch
                  id="quota-warnings"
                  checked={emailPreferences.quota_warnings}
                  onCheckedChange={(checked: boolean) =>
                    setEmailPreferences(prev => ({ ...prev, quota_warnings: checked }))
                  }
                  disabled={savingPreferences}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="subscription-updates" className="text-base">
                    Subscription Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about billing, subscription changes, and renewals
                  </p>
                </div>
                <Switch
                  id="subscription-updates"
                  checked={emailPreferences.subscription_updates}
                  onCheckedChange={(checked: boolean) =>
                    setEmailPreferences(prev => ({ ...prev, subscription_updates: checked }))
                  }
                  disabled={savingPreferences}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={savingPreferences}
              className="w-full"
            >
              {savingPreferences ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Email Preferences'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
