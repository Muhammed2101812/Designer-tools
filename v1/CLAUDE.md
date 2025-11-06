# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Design Kit** is a privacy-first, browser-based design tools suite built with Next.js 14 App Router, offering both client-side and API-powered image processing tools with a freemium subscription model.

**Core Architecture Principles:**
- **Privacy-First**: Client-side tools process files entirely in the browser (no uploads)
- **Performance-Optimized**: Aggressive bundle splitting, lazy loading, and memoization throughout
- **Type-Safe**: Strict TypeScript with generated Supabase types
- **Component-Driven**: Reusable shared components with consistent patterns

## Development Commands

### Primary Commands
```bash
npm run dev                    # Start development server on port 3000
npm run build                  # Production build
npm run start                  # Start production server
npm run type-check             # TypeScript validation
npm run lint                   # ESLint
npm run lint:fix               # Auto-fix linting issues
```

### Testing Commands
```bash
npm run test                   # Run unit tests (Vitest)
npm run test:watch             # Test watch mode
npm run test:e2e               # End-to-end tests (Playwright)
npm run test:performance       # Performance benchmarks
```

### Database & Environment
```bash
npm run db:generate            # Generate Supabase TypeScript types
npm run verify-env             # Validate environment variables
npm run verify-deployment      # Pre-deployment checks
npm run verify-production      # Production readiness validation
```

### Performance Analysis
```bash
npm run cache:clear            # Clear Next.js build cache
npm run analyze                # Bundle analysis (production build)
npm run perf:audit             # Performance audit
npm run perf:processing        # Measure processing times
npm run perf:memory            # Memory profiling
```

## High-Level Architecture

### App Router Structure

The project uses Next.js 14 App Router with **route groups** for organizational clarity:

```
app/
├── (auth)/              # Authentication routes - isolated layout
│   ├── login/
│   ├── signup/
│   ├── reset-password/
│   └── layout.tsx       # Auth-specific layout (no Header/Footer)
│
├── (dashboard)/         # User dashboard - protected routes
│   ├── dashboard/       # Main dashboard page
│   ├── profile/         # User profile management
│   └── layout.tsx       # Dashboard layout with navigation
│
├── (tools)/             # All tool pages - shared tool navigation
│   ├── color-picker/
│   ├── image-cropper/
│   ├── background-remover/
│   └── layout.tsx       # Tools layout with ToolsNav
│
└── api/                 # API routes
    ├── auth/            # Supabase auth callbacks
    ├── tools/           # Tool processing endpoints
    └── stripe/          # Stripe webhooks

```

**Key Insight**: Route groups `(auth)`, `(dashboard)`, `(tools)` allow different layouts without affecting URLs. Each has its own `layout.tsx` controlling the visual structure.

### State Management Architecture

**Zustand Stores** (in `/store/`):
- **`authStore.ts`**: Global authentication state with Supabase integration
  - Persisted to localStorage via `zustand/middleware`
  - Handles session initialization, user profile fetching, logout
  - **Critical**: `initialize()` must be called on app mount

- **`uiStore.ts`**: UI preferences (theme, etc.)
- **`toolStore.ts`**: Tool-specific state (quotas, usage tracking)

**Pattern**: Use Zustand for **global** state (auth, theme), React `useState` for **local** component state (form inputs, UI toggles).

### Supabase Client Architecture

**Three Client Types** (in `/lib/supabase/`):
1. **`client.ts`** - Browser client (Client Components)
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Respects Row Level Security (RLS)
   - Use for: Client Components, hooks

2. **`server.ts`** - Server client (Server Components, API Routes)
   - Creates new client per request with cookies
   - Respects RLS
   - Use for: Server Components, Route Handlers

3. **Service Role Key** - Admin operations only
   - Bypasses RLS - use with extreme caution
   - Only in API routes, never exposed to client

**Critical Rule**: Never import service role key in client code. Always use appropriate client type.

### Tool Component Pattern

All tools follow a **standardized structure** using `ToolWrapper`:

```tsx
// Example: app/(tools)/color-picker/page.tsx
import { ToolWrapper } from '@/components/shared/ToolWrapper'
import { ColorCanvas } from './components/ColorCanvas'
import { ColorDisplay } from './components/ColorDisplay'

export default function ColorPickerPage() {
  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image"
      icon={<Pipette />}
      isClientSide={true}          // Shows privacy notice
      infoContent={<Instructions />}  // Optional help modal
      keyboardShortcuts={shortcuts}   // Optional keyboard hints
    >
      {/* Tool-specific components */}
      <ColorCanvas />
      <ColorDisplay />
    </ToolWrapper>
  )
}
```

**ToolWrapper Benefits:**
- Consistent header/footer layout
- Breadcrumb navigation
- Related tools section
- Keyboard shortcuts display
- Mobile-responsive info modal (Dialog on desktop, BottomSheet on mobile)
- Privacy notice for client-side tools

### Performance Optimization Patterns

**1. Database Query Optimization** (See `PERFORMANCE_FINAL_REPORT.md`):
```typescript
// ❌ BAD: Sequential queries (waterfall)
const profile = await supabase.from('profiles').select()
const limits = await supabase.from('daily_limits').select()
const usage = await supabase.from('tool_usage').select()

// ✅ GOOD: Parallel queries
const [profileRes, limitsRes, usageRes] = await Promise.all([
  supabase.from('profiles').select(),
  supabase.from('daily_limits').select(),
  supabase.from('tool_usage').select()
])
```

**2. Component Lazy Loading**:
```typescript
// Heavy components loaded on-demand
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false  // For client-only components
})
```

**3. Bundle Splitting** (See `next.config.js`):
- Aggressive splitting: maxSize 150KB chunks
- Separate chunks for: framework, radix-ui, icons, framer-motion
- Tree-shaking enabled via `modularizeImports`

**4. Route Segment Config**:
```typescript
// In slow pages (e.g., dashboard)
export const dynamic = 'force-dynamic'
export const revalidate = 60  // Cache for 60 seconds
```

### Security Architecture

**Multi-Layer Security**:
1. **Row Level Security (RLS)** - All Supabase tables
2. **API Route Authentication** - Check user session in every API handler
3. **Quota Management** - Rate limiting via `checkQuota()` / `incrementQuota()`
4. **Input Validation** - Zod schemas for all API inputs
5. **File Validation** - Size limits, MIME type checks, sanitization

**Authentication Flow**:
1. User signs in → Supabase Auth creates session
2. Session stored in HTTP-only cookies (SSR-safe)
3. `authStore.initialize()` fetches session + profile on mount
4. Protected routes check `user` in authStore or redirect

**Quota System** (See `lib/utils/quotaManagement.ts`):
- Free: 10 API operations/day
- Premium: 500/day
- Pro: 2000/day
- Tracked in `daily_limits` table with automatic reset at midnight

### API Route Pattern

**Standard Structure** for tool API endpoints:
```typescript
// app/api/tools/[tool-name]/route.ts
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const inputSchema = z.object({ /* ... */ })

export async function POST(req: NextRequest) {
  // 1. Authentication
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Quota check (for API tools)
  const quota = await checkQuota(user.id)
  if (!quota.allowed) return NextResponse.json({ error: 'Quota exceeded' }, { status: 403 })

  // 3. Input validation
  const body = await req.json()
  const result = inputSchema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

  // 4. Process
  const output = await processTool(result.data)

  // 5. Update quota
  await incrementQuota(user.id, 'tool-name')

  // 6. Return result
  return NextResponse.json({ success: true, result: output })
}
```

### Shared Component Patterns

**Key Shared Components** (in `/components/shared/`):
- **`ToolWrapper`**: Universal tool page wrapper
- **`FileUploader`**: Drag-and-drop file upload with validation
- **`DownloadButton`**: File download with format selection
- **`ComparisonSlider`**: Before/after image comparison
- **`ProcessingOverlay`**: Loading state with progress
- **`UsageIndicator`**: Quota usage visualization

**All shared components**:
- Have TypeScript interfaces for props
- Include loading states and error handling
- Support keyboard navigation
- Are responsive (mobile/desktop)
- Have example files (`.example.tsx`) for reference

### Testing Strategy

**Unit Tests** (Vitest):
- Utils: `lib/utils/__tests__/*.test.ts`
- Components: `components/**/__tests__/*.test.tsx`
- Focus: Business logic, transformations, calculations

**Integration Tests** (Playwright):
- User flows: Auth, tool usage, payments
- Cross-browser: Chrome, Firefox, Safari
- Location: `e2e/` directory

**Performance Tests**:
- `npm run perf:processing` - Measures tool processing times
- `npm run perf:memory` - Memory leak detection
- `npm run test:lighthouse` - Lighthouse CI scores

### Key Files & Patterns to Reference

**Before writing code, check these patterns**:
1. **Component Structure**: See `ToolWrapper.tsx` - memo, useCallback, useMemo patterns
2. **API Routes**: Check existing `app/api/tools/*/route.ts` for auth/quota patterns
3. **Database Queries**: See `app/(dashboard)/dashboard/page.tsx` for parallel query pattern
4. **State Management**: Review `authStore.ts` for Zustand + persistence pattern
5. **Validation**: See `lib/utils/validation.ts` and `lib/utils/fileSecurity.ts`

**Configuration Files**:
- **`next.config.js`**: Webpack optimization, bundle splitting, security headers
- **`tailwind.config.ts`**: Design system tokens, theme configuration
- **`tsconfig.json`**: TypeScript settings, path aliases (`@/*`)
- **`vitest.config.ts`**: Test configuration

### Common Development Tasks

#### Adding a New Tool

1. Create tool page: `app/(tools)/[tool-name]/page.tsx`
2. Use `ToolWrapper` for consistent layout
3. Create component directory: `app/(tools)/[tool-name]/components/`
4. Add to tools config: `config/tools.ts`
5. If API-powered, create route: `app/api/tools/[tool-name]/route.ts`
6. Update quota tracking if API tool

#### Adding a Database Table

1. Write SQL migration in Supabase dashboard
2. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
3. Add policies for user access
4. Generate types: `npm run db:generate`
5. Import types: `import type { Database } from '@/lib/supabase/types'`

#### Adding Environment Variables

1. Add to `.env.example` with description
2. Add validation in `lib/env.ts` if critical
3. Add to deployment docs
4. Update Cloudflare Pages environment variables

### Critical Performance Considerations

**From Recent Optimization** (See `PERFORMANCE_FINAL_REPORT.md`):
- Dashboard page reduced from 6.65s to 1-2s via parallel queries
- Bundle size reduced from 2.5MB to ~800KB via code splitting
- All pages use loading states (app/loading.tsx, app/(dashboard)/loading.tsx)
- Icons use tree-shaking: `import { Icon } from 'lucide-react'` auto-optimized
- Prefetch enabled on navigation links: `<Link prefetch={true}>`

**Always Consider**:
- Will this add to bundle size? Consider dynamic import
- Can this query be parallelized?
- Does this need to be in global state or can it be local?
- Is there a loading state?
- Is there error handling?

### Documentation References

**Core Docs** (in `/docs/`):
- `AUTHENTICATION.md` - Auth flows, OAuth setup
- `ERROR_HANDLING.md` - Error patterns and monitoring
- `RESPONSIVE_DESIGN_GUIDE.md` - Breakpoints, mobile patterns
- `ACCESSIBILITY.md` - WCAG compliance guidelines

**Supabase Docs** (in `/supabase/`):
- `README.md` - Complete database setup
- `SCHEMA_REFERENCE.md` - Table structures and relationships
- `migrations/` - SQL migration files

**Business Docs** (in `/project-docs/`):
- `user-roles.md` - Plans and permissions
- `business-rules.md` - Pricing, quotas, billing
- `api-documentation.md` - API specifications

### Common Pitfalls

1. **Never use service role key in client code**
2. **Always validate API inputs with Zod**
3. **Check quota before processing API tools**
4. **Use `Promise.all()` for parallel database queries**
5. **Memoize expensive computations and callbacks**
6. **Add loading states for all async operations**
7. **Test auth flows - session can be null**
8. **Mobile test all UI changes** (useIsMobile hook available)

### Environment Variables

**Required for Development**:
```bash
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=          # Server-only, never expose
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe public key
STRIPE_SECRET_KEY=                  # Stripe secret key
STRIPE_WEBHOOK_SECRET=              # Webhook signing secret
```

**Optional (for specific tools)**:
```bash
REMOVE_BG_API_KEY=      # Background remover tool
REPLICATE_API_KEY=      # Image upscaler tool
UPSTASH_REDIS_URL=      # Rate limiting (production)
UPSTASH_REDIS_TOKEN=    # Rate limiting (production)
```

Run `npm run verify-env` to validate configuration.

### Recent Major Changes

**Performance Optimization** (November 2025):
- Dashboard database queries: 8 sequential → 4 parallel
- Bundle splitting: Maxsize reduced to 150KB
- Lazy loading: Marketing components, heavy UI
- Loading skeletons: All major routes
- Cache strategy: 60-second revalidation on slow pages

See `PERFORMANCE_FINAL_REPORT.md` for complete details.

**Project Cleanup** (November 2025):
- Test pages removed from production
- Documentation reorganized to `docs/history/` and `docs/guides/`
- AI tool artifacts archived to `.archive/`
- Build artifacts cleaned

See `PROJECT_CLEANUP_SUMMARY.md` for complete details.

### Deployment

**Target**: Cloudflare Pages with automatic GitHub deployments

**Pre-deployment checks**:
```bash
npm run build               # Must succeed
npm run type-check          # No TypeScript errors
npm run verify-deployment   # Environment validation
```

**Post-deployment**:
- Update Supabase redirect URLs to production domain
- Update Stripe webhook URL to production endpoint
- Run `npm run verify-production` against live site

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions.

---

**Last Updated**: November 5, 2025
**Version**: 0.1.0 (Alpha)

