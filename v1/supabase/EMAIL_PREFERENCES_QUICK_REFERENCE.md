# Email Preferences - Quick Reference

## Quick Start

### Get User Preferences
```typescript
const { data: prefs } = await supabase
  .rpc('get_email_preferences', { p_user_id: userId })
```

### Create Default Preferences (Signup)
```typescript
await supabase
  .rpc('create_default_email_preferences', { p_user_id: userId })
```

### Update Preferences (Settings Page)
```typescript
await supabase
  .from('email_preferences')
  .update({
    marketing_emails: false,
    quota_warnings: true,
    subscription_updates: true
  })
  .eq('user_id', userId)
```

### Check Before Sending Email
```typescript
const { data } = await supabase
  .from('email_preferences')
  .select('quota_warnings')
  .eq('user_id', userId)
  .single()

if (data?.quota_warnings) {
  await sendEmail(...)
}
```

## Preference Types

| Field | Description | Default |
|-------|-------------|---------|
| `marketing_emails` | Promotional emails, feature announcements | `true` |
| `quota_warnings` | Alerts when quota reaches 90% | `true` |
| `subscription_updates` | Billing and subscription changes | `true` |

## Common Patterns

### Pattern 1: Signup Flow
```typescript
// After user signs up
const { data: { user } } = await supabase.auth.signUp({ email, password })
if (user) {
  await supabase.rpc('create_default_email_preferences', { 
    p_user_id: user.id 
  })
}
```

### Pattern 2: Settings UI
```typescript
// Load preferences
const { data: prefs } = await supabase
  .from('email_preferences')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Update on change
const handleToggle = async (field: string, value: boolean) => {
  await supabase
    .from('email_preferences')
    .update({ [field]: value })
    .eq('user_id', user.id)
}
```

### Pattern 3: Email Service
```typescript
async function shouldSendEmail(
  userId: string, 
  type: 'marketing_emails' | 'quota_warnings' | 'subscription_updates'
): Promise<boolean> {
  const { data } = await supabase
    .from('email_preferences')
    .select(type)
    .eq('user_id', userId)
    .single()
  
  return data?.[type] ?? true // Default to true if not found
}

// Usage
if (await shouldSendEmail(userId, 'quota_warnings')) {
  await sendQuotaWarningEmail(userEmail)
}
```

## React Component Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function EmailPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState({
    marketing_emails: true,
    quota_warnings: true,
    subscription_updates: true,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    const { data } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (data) {
      setPrefs({
        marketing_emails: data.marketing_emails,
        quota_warnings: data.quota_warnings,
        subscription_updates: data.subscription_updates,
      })
    }
    setLoading(false)
  }

  async function updatePreference(field: string, value: boolean) {
    setPrefs(prev => ({ ...prev, [field]: value }))
    
    await supabase
      .from('email_preferences')
      .update({ [field]: value })
      .eq('user_id', userId)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="marketing">Marketing Emails</Label>
        <Switch
          id="marketing"
          checked={prefs.marketing_emails}
          onCheckedChange={(checked) => 
            updatePreference('marketing_emails', checked)
          }
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="quota">Quota Warnings</Label>
        <Switch
          id="quota"
          checked={prefs.quota_warnings}
          onCheckedChange={(checked) => 
            updatePreference('quota_warnings', checked)
          }
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="subscription">Subscription Updates</Label>
        <Switch
          id="subscription"
          checked={prefs.subscription_updates}
          onCheckedChange={(checked) => 
            updatePreference('subscription_updates', checked)
          }
        />
      </div>
    </div>
  )
}
```

## API Route Example

```typescript
// app/api/email/send-quota-warning/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendQuotaWarningEmail } from '@/lib/email/client'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check if user wants quota warnings
  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('quota_warnings')
    .eq('user_id', user.id)
    .single()
  
  if (!prefs?.quota_warnings) {
    return NextResponse.json({ 
      message: 'User has disabled quota warnings' 
    })
  }
  
  // Send email
  await sendQuotaWarningEmail(user.email!, user.id)
  
  return NextResponse.json({ success: true })
}
```

## SQL Queries

### Get all users who want quota warnings
```sql
SELECT p.id, p.email, p.full_name
FROM profiles p
JOIN email_preferences ep ON ep.user_id = p.id
WHERE ep.quota_warnings = true;
```

### Count users by preference type
```sql
SELECT 
  COUNT(*) FILTER (WHERE marketing_emails = true) as marketing_enabled,
  COUNT(*) FILTER (WHERE quota_warnings = true) as quota_enabled,
  COUNT(*) FILTER (WHERE subscription_updates = true) as subscription_enabled,
  COUNT(*) as total_users
FROM email_preferences;
```

### Find users without preferences
```sql
SELECT p.id, p.email
FROM profiles p
LEFT JOIN email_preferences ep ON ep.user_id = p.id
WHERE ep.id IS NULL;
```

## Troubleshooting

### Preferences not found
```typescript
// Always use get_email_preferences which creates if not exists
const { data } = await supabase
  .rpc('get_email_preferences', { p_user_id: userId })
```

### RLS blocking access
```typescript
// Ensure user is authenticated
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Handle unauthenticated state
}
```

### Unique constraint violation
```typescript
// Use upsert instead of insert
await supabase
  .from('email_preferences')
  .upsert({
    user_id: userId,
    marketing_emails: true,
    quota_warnings: true,
    subscription_updates: true
  })
```

## Best Practices

1. ✅ Always check preferences before sending emails
2. ✅ Use `get_email_preferences()` function for automatic creation
3. ✅ Default to `true` if preferences not found (opt-out model)
4. ✅ Update preferences optimistically in UI
5. ✅ Respect user choices - never override to `true`
6. ✅ Log email sends for audit trail
7. ✅ Handle errors gracefully (don't block user actions)

## Related Documentation

- [Migration Guide](./MIGRATION_003_GUIDE.md)
- [Schema Reference](./SCHEMA_REFERENCE.md)
- [Verification Script](./verify_migration_003.sql)
