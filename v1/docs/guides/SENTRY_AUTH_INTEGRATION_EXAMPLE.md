# Sentry Auth Integration Example

This document shows how to integrate Sentry user tracking with your authentication flow.

## Auth Store Integration

Update your `store/authStore.ts` to set/clear Sentry user context:

```typescript
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { setSentryUser, clearSentryUser } from '@/lib/utils/error-logger'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Set Sentry user context
    if (data.user && profile) {
      setSentryUser({
        id: data.user.id,
        email: data.user.email,
        username: profile.full_name,
        plan: profile.plan,
      })
    }

    set({ user: data.user, profile })
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()

    // Clear Sentry user context
    clearSentryUser()

    set({ user: null, profile: null })
  },

  initialize: async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Set Sentry user context on app initialization
      if (profile) {
        setSentryUser({
          id: user.id,
          email: user.email,
          username: profile.full_name,
          plan: profile.plan,
        })
      }

      set({ user, profile, loading: false })
    } else {
      set({ user: null, profile: null, loading: false })
    }
  },
}))
```

## Root Layout Integration

Update your `app/layout.tsx` to initialize auth and Sentry:

```typescript
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { setupGlobalErrorHandler } from '@/lib/utils/error-logger'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    // Setup global error handler
    setupGlobalErrorHandler()

    // Initialize auth (this will also set Sentry user if logged in)
    initialize()
  }, [initialize])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Login Page Integration

Update your login page to track authentication events:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { reportError, addBreadcrumb } from '@/lib/utils/error-logger'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const signIn = useAuthStore((state) => state.signIn)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Add breadcrumb for login attempt
    addBreadcrumb('Login attempt', 'auth', 'info', { email })

    try {
      await signIn(email, password)

      // Add breadcrumb for successful login
      addBreadcrumb('Login successful', 'auth', 'info')

      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error) {
      // Report login error to Sentry
      reportError(error as Error, {
        action: 'login',
        email,
      })

      // Add breadcrumb for failed login
      addBreadcrumb('Login failed', 'auth', 'error', {
        error: (error as Error).message,
      })

      toast.error('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your login form */}
    </form>
  )
}
```

## API Route Integration

Update your API routes to track errors:

```typescript
// app/api/tools/background-remover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError, addBreadcrumb } from '@/lib/utils/error-logger'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Add breadcrumb for API call
    addBreadcrumb('Background removal started', 'api', 'info', {
      userId: user.id,
      endpoint: '/api/tools/background-remover',
    })

    const result = await removeBackground(data)

    // Add breadcrumb for success
    addBreadcrumb('Background removal completed', 'api', 'info', {
      processingTime: result.processingTime,
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    // Report error to Sentry
    reportError(error as Error, {
      endpoint: '/api/tools/background-remover',
      method: 'POST',
      userId: user.id,
      userPlan: user.plan,
    })

    // Add breadcrumb for error
    addBreadcrumb('Background removal failed', 'api', 'error', {
      error: (error as Error).message,
    })

    return NextResponse.json(
      { error: 'Failed to remove background' },
      { status: 500 }
    )
  }
}
```

## Tool Component Integration

Update your tool components to track usage:

```typescript
'use client'

import { useState } from 'react'
import { reportError, addBreadcrumb, setSentryContext } from '@/lib/utils/error-logger'
import { toast } from 'react-hot-toast'

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null)

  // Set tool context when component mounts
  useEffect(() => {
    setSentryContext('tool', {
      name: 'image-compressor',
      version: '1.0.0',
    })
  }, [])

  const handleCompress = async () => {
    if (!file) return

    // Add breadcrumb for compression start
    addBreadcrumb('Compression started', 'tool-action', 'info', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    try {
      const result = await compressImage(file)

      // Add breadcrumb for success
      addBreadcrumb('Compression completed', 'tool-action', 'info', {
        originalSize: file.size,
        compressedSize: result.size,
        compressionRatio: (result.size / file.size * 100).toFixed(2),
      })

      toast.success('Image compressed successfully!')
    } catch (error) {
      // Report error to Sentry
      reportError(error as Error, {
        toolName: 'image-compressor',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      // Add breadcrumb for error
      addBreadcrumb('Compression failed', 'tool-action', 'error', {
        error: (error as Error).message,
      })

      toast.error('Failed to compress image')
    }
  }

  return (
    <div>
      {/* Your tool UI */}
    </div>
  )
}
```

## Summary

By integrating Sentry into your authentication flow and tool components, you'll get:

✅ **User Context** - All errors associated with specific users
✅ **Breadcrumbs** - Complete user journey leading to errors
✅ **Tool Context** - Know which tool and settings caused errors
✅ **API Tracking** - Monitor API route performance and errors
✅ **Auth Events** - Track login/logout and authentication errors

This makes debugging production issues much easier!
