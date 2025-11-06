# 🤖 AI Development Guidelines - Design Kit

> **Purpose**: This file provides comprehensive guidelines for AI assistants (Claude, ChatGPT, Copilot, etc.) to help develop the Design Kit project consistently and efficiently.

---

## 📋 Project Overview

**Design Kit** is a professional design tools suite offering:
- **Client-side tools**: Color picker, image cropper, resizer, format converter, QR generator, gradient generator
- **API-powered tools**: Image compressor, background remover, upscaler, mockup generator
- **Subscription model**: Free (10 daily ops), Premium ($9/mo, 500 ops), Pro ($29/mo, 2000 ops)

### Core Principles
1. **Privacy-first**: Client-side tools never upload files to servers
2. **Performance**: Fast loading, minimal bundle size
3. **User experience**: Simple, intuitive, professional UI
4. **Security**: Authentication, rate limiting, input validation
5. **Scalability**: Designed for growth (API access, webhooks, teams)

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14.2+ (App Router)
- **Language**: TypeScript 5.4+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui
- **State Management**: Zustand v4
- **Icons**: Lucide React

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **File Processing**: Browser APIs (client-side), External APIs (server-side)
- **Rate Limiting**: Upstash Redis (optional)

### External Services
- **Remove.bg**: Background removal
- **Replicate**: Image upscaling
- **Plausible**: Analytics

---

## 📁 Project Structure

```
design-kit/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Dashboard
│   ├── (tools)/           # Tool pages
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── shared/            # Reusable components
│   └── layout/            # Layout components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── stripe/            # Stripe integration
│   ├── utils/             # Utility functions
│   └── hooks/             # Custom hooks
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

---

## 🎯 Development Guidelines

### 1. Code Style & Conventions

#### TypeScript
```typescript
// ✅ DO: Use proper typing
interface UserProfile {
  id: string
  email: string
  plan: 'free' | 'premium' | 'pro'
  created_at: string
}

async function getUser(id: string): Promise<UserProfile> {
  // Implementation
}

// ❌ DON'T: Use any or implicit types
async function getUser(id) {
  // Bad: no types
}
```

#### React Components
```typescript
// ✅ DO: Functional components with proper typing
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}

// ❌ DON'T: Use default props or class components
```

#### File Naming
- **Components**: PascalCase (`ColorPicker.tsx`, `UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`, `validateEmail.ts`)
- **Pages**: lowercase with hyphens (`color-picker/page.tsx`)
- **Types**: PascalCase (`User.ts`, `ToolConfig.ts`)

#### Import Order
```typescript
// 1. React & Next.js
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { toast } from 'react-hot-toast'
import { z } from 'zod'

// 3. Internal components
import { Button } from '@/components/ui/button'
import { ColorCanvas } from './components/ColorCanvas'

// 4. Utils & hooks
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/lib/hooks/useAuth'

// 5. Types
import type { Color } from '@/types'
```

---

### 2. Component Architecture

#### Shared Tool Wrapper
Every tool should use the `ToolWrapper` component:

```typescript
import { ToolWrapper } from '@/components/shared/ToolWrapper'

export default function ColorPickerPage() {
  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image"
      icon="Pipette"
    >
      {/* Tool content */}
    </ToolWrapper>
  )
}
```

#### Component Structure
```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces
interface ColorPickerProps {
  onColorSelect: (color: string) => void
}

// 3. Component
export function ColorPicker({ onColorSelect }: ColorPickerProps) {
  // 3a. State
  const [color, setColor] = useState<string>('#000000')
  
  // 3b. Hooks
  const { user } = useAuth()
  
  // 3c. Handlers
  const handleColorChange = (newColor: string) => {
    setColor(newColor)
    onColorSelect(newColor)
  }
  
  // 3d. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

---

### 3. API Routes

#### Structure
```typescript
// app/api/tools/background-remover/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 1. Input validation schema
const requestSchema = z.object({
  file: z.instanceof(File),
  output_format: z.enum(['png', 'jpg']).optional()
})

// 2. Main handler
export async function POST(req: NextRequest) {
  try {
    // 2a. Authentication
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // 2b. Quota check
    const canUse = await checkQuota(user.id)
    if (!canUse.allowed) {
      return NextResponse.json(
        { error: 'Quota exceeded', ...canUse },
        { status: 403 }
      )
    }
    
    // 2c. Input validation
    const formData = await req.formData()
    const result = requestSchema.safeParse({
      file: formData.get('file'),
      output_format: formData.get('output_format')
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.flatten() },
        { status: 400 }
      )
    }
    
    // 2d. Process
    const processedImage = await removeBackground(result.data.file)
    
    // 2e. Update quota
    await incrementQuota(user.id, 'background-remover')
    
    // 2f. Return result
    return NextResponse.json({
      success: true,
      result: processedImage
    })
    
  } catch (error) {
    console.error('Background removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### 4. Database Operations

#### Always Use RLS
```typescript
// ✅ DO: Use Supabase client (respects RLS)
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// ❌ DON'T: Bypass RLS without reason
const { data } = await supabaseAdmin
  .from('profiles')
  .select('*')
```

#### Typed Queries
```typescript
// Generate types: npm run db:generate
import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

const { data } = await supabase
  .from('profiles')
  .select('*')
  .returns<Profile[]>()
```

---

### 5. State Management

#### Use Zustand for Global State
```typescript
// store/authStore.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))
```

#### Use React State for Local State
```typescript
// For component-specific state
const [isOpen, setIsOpen] = useState(false)
const [color, setColor] = useState('#000000')
```

---

### 6. Error Handling

#### User-Facing Errors
```typescript
import { toast } from 'react-hot-toast'

try {
  await processImage(file)
  toast.success('Image processed successfully!')
} catch (error) {
  if (error instanceof QuotaExceededError) {
    toast.error('Daily limit reached. Upgrade to continue.')
  } else if (error instanceof InvalidFileError) {
    toast.error('Invalid file format. Please use PNG or JPG.')
  } else {
    toast.error('Something went wrong. Please try again.')
  }
}
```

#### API Errors
```typescript
// Return structured errors
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'quota_exceeded',
      message: 'Daily limit reached',
      details: {
        current: 500,
        limit: 500,
        reset_at: '2025-01-18T00:00:00Z'
      }
    }
  },
  { status: 403 }
)
```

---

### 7. Security Best Practices

#### Input Validation
```typescript
// Always validate user input
import { z } from 'zod'

const emailSchema = z.string().email()
const fileSchema = z.instanceof(File)
  .refine(file => file.size <= 10 * 1024 * 1024, 'File too large')
  .refine(
    file => ['image/png', 'image/jpeg'].includes(file.type),
    'Invalid file type'
  )
```

#### Environment Variables
```typescript
// ✅ DO: Validate on startup
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_')
})

export const env = envSchema.parse(process.env)

// ❌ DON'T: Use raw process.env without validation
```

#### API Keys
```typescript
// ✅ DO: Hash API keys in database
import crypto from 'crypto'

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// Store only hashed version
await db.apiKeys.create({
  key_hash: hashApiKey(apiKey),
  user_id: userId
})
```

---

### 8. Performance Optimization

#### Code Splitting
```typescript
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic'

const ImageEditor = dynamic(() => import('./ImageEditor'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Disable SSR for client-only components
})
```

#### Image Optimization
```typescript
import Image from 'next/image'

// ✅ DO: Use Next.js Image component
<Image
  src="/logo.png"
  alt="Design Kit Logo"
  width={200}
  height={50}
  priority // For above-the-fold images
/>

// ❌ DON'T: Use regular img tags
<img src="/logo.png" alt="Logo" />
```

#### Memoization
```typescript
import { useMemo, useCallback } from 'react'

// Expensive calculations
const processedData = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// Event handlers
const handleClick = useCallback(() => {
  doSomething()
}, [dependency])
```

---

### 9. Testing Approach

#### Unit Tests
```typescript
// Use Jest + React Testing Library
import { render, screen } from '@testing-library/react'
import { ColorPicker } from './ColorPicker'

describe('ColorPicker', () => {
  it('renders color input', () => {
    render(<ColorPicker onColorSelect={jest.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
  
  it('calls onColorSelect when color changes', () => {
    const onColorSelect = jest.fn()
    render(<ColorPicker onColorSelect={onColorSelect} />)
    // Test interaction
  })
})
```

#### Integration Tests
```typescript
// Test API routes
import { POST } from './route'

describe('Background Remover API', () => {
  it('returns 401 when not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/tools/background-remover')
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})
```

---

## 📚 Reference Documentation

When working on the project, always reference these files:

### Core Documentation
- **DesignKit_plan.md**: Complete project plan, architecture, timeline
- **README.md**: Setup instructions, quick start guide

### Business & Rules
- **docs/user-roles.md**: User permissions, plan limits, quotas
- **docs/business-rules.md**: Pricing, billing, refund policies

### Technical Guides
- **docs/user-flows.md**: User journeys, authentication flows
- **docs/api-documentation.md**: API endpoints, request/response formats
- **docs/security-guidelines.md**: Security best practices, RLS policies

### Configuration
- **.env.example**: All environment variables with descriptions

---

## 🎯 Common Tasks

### Adding a New Tool

1. **Create tool page**
```bash
app/(tools)/new-tool/page.tsx
```

2. **Create components**
```bash
app/(tools)/new-tool/components/
├── ToolCanvas.tsx
├── ToolControls.tsx
└── ToolPreview.tsx
```

3. **Use ToolWrapper**
```typescript
export default function NewToolPage() {
  return (
    <ToolWrapper
      title="New Tool"
      description="Tool description"
      icon="IconName"
    >
      {/* Tool content */}
    </ToolWrapper>
  )
}
```

4. **Add to navigation**
```typescript
// config/tools.ts
export const tools = [
  // ... existing tools
  {
    id: 'new-tool',
    name: 'New Tool',
    path: '/new-tool',
    icon: 'IconName',
    category: 'client-side'
  }
]
```

### Adding an API Endpoint

1. **Create route file**
```bash
app/api/tools/new-tool/route.ts
```

2. **Implement handler** (see API Routes section above)

3. **Add quota tracking** (if API tool)
```typescript
await checkQuota(user.id)
await incrementQuota(user.id, 'new-tool')
```

4. **Update database** (if needed)
```sql
-- Add tool to allowed tools enum
ALTER TYPE tool_name ADD VALUE 'new-tool';
```

### Adding a Database Table

1. **Write migration SQL**
```sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  -- columns
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own data"
  ON new_table FOR SELECT
  USING (auth.uid() = user_id);
```

2. **Run migration in Supabase dashboard**

3. **Generate types**
```bash
npm run db:generate
```

---

## ⚠️ Common Pitfalls to Avoid

### 1. Security Issues
```typescript
// ❌ DON'T: Expose service role key to client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // WRONG!
)

// ✅ DO: Use anon key for client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Correct
)
```

### 2. State Management
```typescript
// ❌ DON'T: Prop drill through many levels
<ParentComponent>
  <ChildComponent user={user}>
    <GrandchildComponent user={user}>
      <GreatGrandchildComponent user={user} />

// ✅ DO: Use Zustand for global state
const { user } = useAuthStore()
```

### 3. Error Handling
```typescript
// ❌ DON'T: Silent failures
try {
  await saveData()
} catch (error) {
  // Nothing
}

// ✅ DO: Handle and show errors
try {
  await saveData()
  toast.success('Saved!')
} catch (error) {
  console.error('Save error:', error)
  toast.error('Failed to save')
}
```

### 4. Performance
```typescript
// ❌ DON'T: Fetch data in loops
for (const id of userIds) {
  const user = await fetchUser(id) // N+1 queries
}

// ✅ DO: Batch fetch
const users = await fetchUsers(userIds) // 1 query
```

---

## 🚀 Deployment Checklist

Before deploying:
- [ ] Run `npm run build` locally and verify no errors
- [ ] Run `npm run type-check` to ensure no TypeScript errors
- [ ] Run `npm run lint` and fix any issues
- [ ] Test authentication flow
- [ ] Test payment flow (use Stripe test mode)
- [ ] Verify all environment variables are set in Cloudflare
- [ ] Test API endpoints with proper authentication
- [ ] Check database RLS policies are active
- [ ] Verify rate limiting is working
- [ ] Test on mobile devices

---

## 📖 Additional Resources

### Documentation to Read
1. [Next.js App Router Docs](https://nextjs.org/docs/app)
2. [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
3. [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
4. [shadcn/ui Components](https://ui.shadcn.com/)

### Useful Commands
```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Fix linting issues
npm run type-check             # TypeScript checking
npm run format                 # Format with Prettier

# Database
npm run db:generate            # Generate Supabase types
npm run db:migrate             # Run migrations

# Testing
npm run test                   # Run tests
npm run test:watch             # Watch mode
npm run test:coverage          # Coverage report
```

---

## 💡 Tips for AI Assistants

### When Writing Code
1. **Always check existing patterns** in the codebase first
2. **Follow the established architecture** (don't introduce new patterns)
3. **Use TypeScript strictly** (no `any` types unless absolutely necessary)
4. **Validate all inputs** with Zod schemas
5. **Handle errors gracefully** with user-friendly messages
6. **Add comments** for complex logic
7. **Keep functions small** (single responsibility principle)

### When Asked to Debug
1. **Check the error message** first
2. **Verify environment variables** are set correctly
3. **Check database RLS policies** for permission issues
4. **Look at browser console** for client-side errors
5. **Check API responses** in Network tab
6. **Verify Stripe webhook** is receiving events

### When Suggesting Features
1. **Consider the plan** (Free, Premium, Pro)
2. **Think about quota limits** (will it consume API operations?)
3. **Consider performance** (will it slow down the app?)
4. **Check security implications** (does it expose sensitive data?)
5. **Verify it aligns** with the project roadmap

---

## ✅ Final Checklist

When completing a task:
- [ ] Code follows style guidelines
- [ ] TypeScript types are proper (no `any`)
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Success/error messages are displayed
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Tested locally
- [ ] No console errors
- [ ] Git commit message is descriptive

---

**Last Updated**: January 17, 2025
**Version**: 1.0.0

---

> **Note**: This is a living document. Update it as the project evolves and new patterns emerge.
