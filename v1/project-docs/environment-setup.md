# ⚙️ Environment Setup Documentation

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Database Setup](#database-setup)
5. [Service Configurations](#service-configurations)
6. [Testing Setup](#testing-setup)
7. [Deployment Configuration](#deployment-configuration)

---

## 🛠️ Prerequisites

### Required Software

- **Node.js** v18+ (v20 recommended)
- **npm** v9+ (comes with Node.js) or **pnpm** v8+
- **Git** v2.30+
- **Supabase CLI** v1.100+ (`npm install -g supabase`)
- **Stripe CLI** v1.15+ (`brew install stripe/stripe-cli/stripe` or download from [Stripe CLI](https://stripe.com/docs/stripe-cli))

### Optional Tools

- **VS Code** (recommended IDE)
- **Docker Desktop** (for local Supabase development)
- **PostgreSQL** client (for database management)

---

## 🔐 Environment Variables

### Required Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Resend (Email) Configuration
RESEND_API_KEY=re_your_resend_api_key

# Upstash Redis (Rate Limiting) Configuration
UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

# Sentry Configuration (Optional but Recommended)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=DesinerKit
NEXT_PUBLIC_SUPPORT_EMAIL=support@desinerkit.com
```

### Development vs Production

For production environments, create `.env.production`:

```bash
# Use live keys instead of test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Use production URLs
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
```

---

## 🖥️ Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/desinerkit.git
cd desinerkit
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using pnpm (recommended)
pnpm install
```

### 3. Configure Environment

Copy example file and fill in your values:

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 4. Start Development Server

```bash
# Using npm
npm run dev

# Or using pnpm
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup

### 1. Start Local Supabase

```bash
supabase start
```

This will:
- Start PostgreSQL database
- Start Supabase services (Auth, Storage, Functions)
- Display local URLs and keys in terminal

### 2. Apply Database Migrations

```bash
supabase db reset
```

This will:
- Apply all migrations in `supabase/migrations/`
- Seed initial data
- Create required tables and relationships

### 3. Generate Types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

Or for local development:

```bash
supabase gen types typescript --local > lib/supabase/types.ts
```

### 4. Database Tables

Key tables:
- `profiles` - User profiles and subscription info
- `daily_limits` - Daily usage tracking
- `tool_usage` - Tool usage analytics
- `email_preferences` - User email preferences
- `subscriptions` - Stripe subscription records

---

## 🌐 Service Configurations

### Stripe Setup

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get test mode keys from Developers > API Keys
3. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Get webhook signing secret from Webhooks section

### Supabase Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Get project URL and keys from Project Settings > API
3. Configure Auth providers:
   - Enable Email provider
   - Enable OAuth providers (Google, GitHub)
4. Set up Storage buckets:
   - `uploads` bucket for user files (private)
   - `public` bucket for processed files (public)

### Resend (Email) Setup

1. Create Resend account at [resend.com](https://resend.com)
2. Get API key from API Keys section
3. Add domain (required for production):
   - Add DNS records as instructed
   - Verify domain ownership
4. Set up email templates in Resend dashboard

### Upstash Redis Setup (Rate Limiting)

1. Create Upstash account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Get REST URL and Token from database settings
4. Configure rate limiting plans in `lib/utils/rateLimit.ts`

### Sentry Setup (Error Monitoring)

1. Create Sentry account at [sentry.io](https://sentry.io)
2. Create Next.js project
3. Get DSN from Project Settings > Client Keys
4. Get Auth Token from Account Settings > API
5. Configure in `sentry.*.config.ts` files

---

## 🧪 Testing Setup

### Unit Tests

Run all unit tests:

```bash
# Using npm
npm run test

# Or using pnpm
pnpm test
```

Run tests in watch mode:

```bash
# Using npm
npm run test:watch

# Or using pnpm
pnpm test:watch
```

### Test Coverage

Generate coverage report:

```bash
# Using npm
npm run test:coverage

# Or using pnpm
pnpm test:coverage
```

Coverage requirements:
- Lines: ≥ 85%
- Functions: ≥ 85%
- Branches: ≥ 80%
- Statements: ≥ 85%

### E2E Tests

Run end-to-end tests:

```bash
# Using npm
npm run test:e2e

# Or using pnpm
pnpm test:e2e
```

### Performance Tests

Run performance benchmarks:

```bash
# Using npm
npm run test:performance

# Or using pnpm
pnpm test:performance
```

---

## ☁️ Deployment Configuration

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - All required variables from `.env.local`
   - Use production keys for live deployment
3. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. Add domain aliases if needed

### Cloudflare Pages Deployment

1. Connect GitHub repository to Cloudflare Pages
2. Set build settings:
   - Build Command: `npm run build`
   - Build Output Directory: `.next`
3. Configure environment variables:
   - All required variables
   - Use production keys
4. Set custom domain in Cloudflare dashboard

### Docker Deployment

Build Docker image:

```bash
docker build -t desinerkit .
```

Run container:

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
  desinerkit
```

### Environment-Specific Configurations

#### Development
- Test mode API keys
- Local database
- Debug logging enabled
- Hot reloading

#### Staging
- Test mode API keys
- Separate database
- Error reporting enabled
- Performance monitoring

#### Production
- Live mode API keys
- Production database
- Full error reporting
- Performance monitoring
- CDN enabled

---

## 🔧 Troubleshooting

### Common Issues

#### Environment Variables Not Loaded
- Ensure `.env.local` is in project root
- Restart development server after changes
- Check for typos in variable names

#### Database Connection Failed
- Verify Supabase URL and keys
- Check if Supabase services are running
- Ensure network connectivity

#### Stripe Webhook Not Working
- Verify webhook signing secret
- Check webhook endpoint URL
- Ensure events are properly configured

#### Rate Limiting Not Working
- Verify Upstash Redis credentials
- Check Redis connection
- Ensure rate limiting middleware is applied

#### Email Sending Fails
- Verify Resend API key
- Check domain verification status
- Ensure sender domain is approved

---

## 🔄 Maintenance

### Regular Tasks

1. **Update Dependencies**:
   ```bash
   npm outdated
   npm update
   ```

2. **Database Migrations**:
   ```bash
   supabase db diff -f migration_name
   supabase db push
   ```

3. **Regenerate Types**:
   ```bash
   supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
   ```

4. **Run Tests**:
   ```bash
   npm run test
   npm run test:e2e
   ```

5. **Check Security**:
   ```bash
   npm audit
   npm audit fix
   ```

### Backup Procedures

1. **Database Backup**:
   ```bash
   supabase db dump --file backup.sql
   ```

2. **Environment Variables**:
   - Store securely in password manager
   - Never commit to version control
   - Rotate keys periodically

3. **Documentation Backup**:
   - Keep copies of all setup guides
   - Maintain service account credentials
   - Document deployment procedures

---

**Last Updated:** 2025-01-17  
**Status:** ✅ Ready for Environment Setup