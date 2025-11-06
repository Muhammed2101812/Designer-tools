'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { createBrowserClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Loader2, Mail, Bell, Megaphone } from 'lucide-react'

interface EmailPreferencesData {
  marketing_emails: boolean
  quota_warnings: boolean
  subscription_updates: boolean
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferencesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        throw error
      }

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            marketing_emails: true,
            quota_warnings: true,
            subscription_updates: true,
          })
          .select()
          .maybeSingle()

        if (insertError) throw insertError
        setPreferences(newPrefs)
      } else {
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error loading email preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!preferences) return

    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('email_preferences')
        .update({
          marketing_emails: preferences.marketing_emails,
          quota_warnings: preferences.quota_warnings,
          subscription_updates: preferences.subscription_updates,
        })
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Email preferences updated successfully',
      })
    } catch (error) {
      console.error('Error saving email preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleToggle(key: keyof EmailPreferencesData) {
    if (!preferences) return
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    })
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Failed to load preferences</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Email Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Manage which emails you receive from Design Kit
          </p>
        </div>

        <div className="space-y-4">
          {/* Quota Warnings */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-0.5">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="quota-warnings"
                  className="text-base font-medium cursor-pointer"
                >
                  Quota Warnings
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you're running low on API quota (at 80% and 100%)
                </p>
              </div>
            </div>
            <button
              id="quota-warnings"
              type="button"
              role="switch"
              aria-checked={preferences.quota_warnings}
              onClick={() => handleToggle('quota_warnings')}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${preferences.quota_warnings ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                  transform ring-0 transition duration-200 ease-in-out
                  ${preferences.quota_warnings ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Subscription Updates */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-0.5">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="subscription-updates"
                  className="text-base font-medium cursor-pointer"
                >
                  Subscription Updates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important updates about your subscription, billing, and plan changes
                </p>
              </div>
            </div>
            <button
              id="subscription-updates"
              type="button"
              role="switch"
              aria-checked={preferences.subscription_updates}
              onClick={() => handleToggle('subscription_updates')}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${preferences.subscription_updates ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                  transform ring-0 transition duration-200 ease-in-out
                  ${preferences.subscription_updates ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>

          {/* Marketing Emails */}
          <div className="flex items-start justify-between space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-start space-x-3 flex-1">
              <div className="mt-0.5">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <Label
                  htmlFor="marketing-emails"
                  className="text-base font-medium cursor-pointer"
                >
                  Marketing Emails
                </Label>
                <p className="text-sm text-muted-foreground">
                  Tips, feature announcements, and special offers (max 1-2 per month)
                </p>
              </div>
            </div>
            <button
              id="marketing-emails"
              type="button"
              role="switch"
              aria-checked={preferences.marketing_emails}
              onClick={() => handleToggle('marketing_emails')}
              className={`
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${preferences.marketing_emails ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                  transform ring-0 transition duration-200 ease-in-out
                  ${preferences.marketing_emails ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            You can change these settings at any time
          </p>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </div>
    </Card>
  )
}
