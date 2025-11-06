# Supabase Quick Start Guide

Quick reference for using Supabase in Design Kit.

## Setup

1. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your Supabase credentials:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Test connection:**
   ```bash
   npm run dev
   # Visit: http://localhost:3000/api/test-supabase
   ```

## Usage Cheat Sheet

### Client Component (Browser)

```typescript
'use client'
import { supabase } from '@/lib/supabase/client'

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Query data
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
```

### Server Component

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Query data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()
  
  return <div>{profile?.full_name}</div>
}
```

### API Route

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  return NextResponse.json({ data })
}
```

### Server Action

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.get('full_name') as string,
    })
    .eq('id', user.id)
  
  if (error) throw error
  
  revalidatePath('/profile')
}
```

## Common Operations

### Authentication

```typescript
// Sign up
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
})

// Sign in
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Sign in with OAuth
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Get session
const { data: { session } } = await supabase.auth.getSession()
```

### Database Queries

```typescript
// Select all
const { data } = await supabase
  .from('profiles')
  .select('*')

// Select specific columns
const { data } = await supabase
  .from('profiles')
  .select('id, email, full_name')

// Filter
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('plan', 'premium')

// Single row
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Insert
const { data } = await supabase
  .from('tool_usage')
  .insert({
    user_id: userId,
    tool_name: 'color-picker',
    success: true,
  })
  .select()
  .single()

// Update
const { data } = await supabase
  .from('profiles')
  .update({ full_name: 'New Name' })
  .eq('id', userId)
  .select()

// Delete
const { data } = await supabase
  .from('tool_usage')
  .delete()
  .eq('id', usageId)
```

### Database Functions

```typescript
// Check if user can use API tool
const { data: canUse } = await supabase
  .rpc('can_use_api_tool', { p_user_id: userId })

// Get or create daily limit
const { data: limit } = await supabase
  .rpc('get_or_create_daily_limit', { p_user_id: userId })

// Increment API usage
const { data: updated } = await supabase
  .rpc('increment_api_usage', { p_user_id: userId })
```

## Type Safety

```typescript
import type { Profile, ToolUsage, DailyLimit } from '@/lib/supabase/types'

// Typed query results
const { data } = await supabase
  .from('profiles')
  .select('*')
  .single()

// data is typed as Profile
const email: string = data.email
const plan: 'free' | 'premium' | 'pro' = data.plan
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')

if (error) {
  console.error('Database error:', error.message)
  // Handle error
}

// Or use try-catch
try {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .throwOnError()
} catch (error) {
  console.error('Error:', error)
}
```

## Protected Routes

The middleware automatically protects routes:

- `/dashboard/*` - Requires authentication
- `/settings/*` - Requires authentication
- `/profile/*` - Requires authentication
- `/login`, `/signup` - Redirects to dashboard if authenticated

## Testing

```bash
# Test connection
curl http://localhost:3000/api/test-supabase

# Expected response:
{
  "success": true,
  "message": "Supabase connection successful",
  "tests": {
    "database": { "status": "connected" },
    "auth": { "status": "configured" },
    "functions": { "status": "tested" }
  }
}
```

## Troubleshooting

**Connection failed:**
- Check `.env.local` has correct values
- Verify Supabase project is active
- Check API keys are valid

**Type errors:**
- Run `npm run db:generate` to regenerate types
- Restart TypeScript server

**Auth not working:**
- Check redirect URLs in Supabase dashboard
- Verify middleware is configured
- Check cookies are enabled

## Next Steps

- Read full documentation: `lib/supabase/README.md`
- Review database schema: `supabase/SCHEMA_REFERENCE.md`
- Check RLS policies: `supabase/tests/test_rls_policies.sql`
