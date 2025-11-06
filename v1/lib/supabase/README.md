# Supabase Client Configuration

This directory contains all Supabase client utilities for the Design Kit application.

## Overview

The Supabase client configuration provides type-safe database access, authentication, and session management for both client-side and server-side code.

## Files

- **`client.ts`** - Browser client for Client Components
- **`server.ts`** - Server client for Server Components, Server Actions, and API Routes
- **`middleware.ts`** - Session refresh middleware
- **`types.ts`** - TypeScript types generated from database schema
- **`index.ts`** - Convenience exports
- **`test-connection.ts`** - Connection testing utilities

## Usage

### Client Components

Use the browser client in Client Components (components with `'use client'` directive):

```typescript
import { supabase } from '@/lib/supabase/client'

export default function MyComponent() {
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user@example.com',
      password: 'password',
    })
  }
  
  return <div>...</div>
}
```

### Server Components

Use the server client in Server Components, Server Actions, and API Routes:

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createClient()
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
  
  return <div>...</div>
}
```

### API Routes

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data })
}
```

### Admin Operations

For operations that need to bypass Row Level Security (use with caution):

```typescript
import { createAdminClient } from '@/lib/supabase/server'

export async function adminOperation() {
  const supabase = createAdminClient()
  
  // This bypasses RLS - use only for admin operations
  const { data } = await supabase
    .from('profiles')
    .select('*')
  
  return data
}
```

### Middleware

The middleware automatically refreshes Supabase sessions on every request:

```typescript
// middleware.ts (already configured)
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

## Type Safety

All database operations are fully typed using the generated `Database` type:

```typescript
import type { Profile, ToolUsage } from '@/lib/supabase/types'

// Type-safe queries
const { data } = await supabase
  .from('profiles')
  .select('*')
  .single()

// data is typed as Profile
```

## Database Functions

Call database functions with type safety:

```typescript
const { data: canUse } = await supabase
  .rpc('can_use_api_tool', { p_user_id: userId })

const { data: limit } = await supabase
  .rpc('get_or_create_daily_limit', { p_user_id: userId })

const { data: updated } = await supabase
  .rpc('increment_api_usage', { p_user_id: userId })
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Public (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-only (never expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

All environment variables are validated using Zod schemas in `lib/env.ts`.

## Testing

### Test Connection

Use the test API route to verify your Supabase configuration:

```bash
# Start the dev server
npm run dev

# Visit the test endpoint
curl http://localhost:3000/api/test-supabase
```

### Manual Testing

Use the test utilities in `test-connection.ts`:

```typescript
import { testConnection, testAuth } from '@/lib/supabase/test-connection'

// Test database connection
await testConnection()

// Test authentication
await testAuth()
```

## Common Patterns

### Check Authentication

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // User is not authenticated
  redirect('/login')
}
```

### Query with RLS

Row Level Security automatically filters results based on the authenticated user:

```typescript
const supabase = await createClient()

// Only returns the current user's profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

### Insert with Relationships

```typescript
const { data: usage } = await supabase
  .from('tool_usage')
  .insert({
    user_id: user.id,
    tool_name: 'color-picker',
    is_api_tool: false,
    success: true,
  })
  .select()
  .single()
```

### Real-time Subscriptions

```typescript
const channel = supabase
  .channel('profile-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${user.id}`,
    },
    (payload) => {
      console.log('Profile updated:', payload.new)
    }
  )
  .subscribe()

// Cleanup
channel.unsubscribe()
```

## Security Best Practices

1. **Never expose service role key** - Only use in server-side code
2. **Use RLS policies** - All tables have RLS enabled
3. **Validate inputs** - Use Zod schemas for all user inputs
4. **Check authentication** - Always verify user is authenticated before operations
5. **Use admin client sparingly** - Only for operations that truly need to bypass RLS

## Troubleshooting

### Connection Issues

If you see connection errors:

1. Verify environment variables are set correctly
2. Check Supabase project is active
3. Verify API keys are valid
4. Check network connectivity

### Type Errors

If you see TypeScript errors:

1. Regenerate types: `npm run db:generate`
2. Restart TypeScript server in your editor
3. Check database schema matches types

### Authentication Issues

If authentication isn't working:

1. Check middleware is configured correctly
2. Verify auth providers are enabled in Supabase
3. Check redirect URLs are configured
4. Verify session cookies are being set

## Generating Types

To regenerate TypeScript types from your database schema:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

Or use the npm script (if configured):

```bash
npm run db:generate
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Integration](https://supabase.com/docs/guides/auth/server-side/nextjs)
