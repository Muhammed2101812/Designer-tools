# 🎨 Design Kit

> Professional design tools suite built with Next.js 14, TypeScript, and Supabase. Privacy-first, browser-based image processing with premium features.

[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Features

### **Client-Side Tools** (100% Browser-Based, No Upload)
- 🎨 **Color Picker** - Extract colors from images with precision
- ✂️ **Image Cropper** - Crop with custom aspect ratios
- 📐 **Image Resizer** - Resize with quality preservation
- 🔄 **Format Converter** - Convert between PNG, JPG, WEBP
- 📱 **QR Generator** - Create customizable QR codes
- 🌈 **Gradient Generator** - CSS gradient creator with export

### **API-Powered Tools** (Premium Features)
- 🗜️ **Image Compressor** - Smart compression with quality control
- 🎭 **Background Remover** - AI-powered background removal
- 🔍 **Image Upscaler** - Enhance resolution up to 8x
- 🖼️ **Mockup Generator** - Place designs in realistic mockups

### **Subscription Plans**
- **Free**: 10 daily API operations, all client-side tools
- **Premium**: $9/mo - 500 daily operations, 50MB files, batch processing
- **Pro**: $29/mo - 2000 daily operations, 100MB files, REST API access

---

## 🚀 Quick Start

### **5-Minute Setup**

For a quick development setup, follow our [Quick Setup Guide](./docs/QUICK_SETUP_GUIDE.md).

### **Complete Setup**

For production deployment, follow our comprehensive [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md).

### **Prerequisites**

- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (for payments)

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/design-kit.git
cd design-kit
npm install
```

2. **Environment setup**
```bash
cp .env.example .env.local
# Edit .env.local with your service credentials
```

3. **Verify setup**
```bash
npm run verify-env
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### **Setup Documentation**

- 📖 **[Quick Setup Guide](./docs/QUICK_SETUP_GUIDE.md)** - 5-minute development setup
- 📖 **[Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md)** - Complete service configuration
- 📖 **[Production Deployment Checklist](./docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Production deployment guide

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

### **Required**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### **Optional (For API Tools)**
```bash
# Remove.bg (Background Remover)
REMOVE_BG_API_KEY=your_removebg_api_key

# Replicate (Image Upscaler)
REPLICATE_API_KEY=your_replicate_api_key
```

### **Production Only**
```bash
# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=designkit.com

# Redis (Rate Limiting)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

See `.env.example` for detailed descriptions.

---

## 📁 Project Structure

```
design-kit/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                  # Auth pages (login, signup)
│   ├── (dashboard)/             # User dashboard
│   ├── (tools)/                 # Tool pages
│   │   ├── color-picker/
│   │   ├── image-cropper/
│   │   ├── background-remover/
│   │   └── ...
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── tools/
│   │   ├── stripe/
│   │   └── user/
│   ├── pricing/
│   └── page.tsx                 # Landing page
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Header, Footer, Sidebar
│   ├── shared/                  # Reusable tool components
│   ├── marketing/               # Landing page sections
│   └── dashboard/               # Dashboard components
│
├── lib/
│   ├── supabase/               # Supabase client & server
│   ├── stripe/                 # Stripe integration
│   ├── api-clients/            # External API clients
│   ├── utils/                  # Utility functions
│   └── hooks/                  # Custom React hooks
│
├── store/                       # Zustand state management
├── types/                       # TypeScript types
├── config/                      # App configuration
├── public/                      # Static assets
└── docs/                        # Documentation
    ├── user-roles.md
    ├── business-rules.md
    ├── user-flows.md
    ├── api-documentation.md
    └── security-guidelines.md
```

---

## 🗄️ Database Setup

### **Supabase Configuration**

Complete setup guide available in [`supabase/README.md`](./supabase/README.md)

**Quick Setup:**
1. Create a new Supabase project at https://supabase.com
2. Copy API credentials to `.env.local`
3. Run SQL migration: `supabase/migrations/001_initial_schema.sql`
4. Verify setup: `supabase/verify_setup.sql`
5. Configure authentication providers (Email, Google, GitHub)

**Setup Checklist:** Follow [`supabase/SETUP_CHECKLIST.md`](./supabase/SETUP_CHECKLIST.md) for step-by-step instructions.

### **Key Tables**
- `profiles` - User profiles with plan information
- `subscriptions` - Stripe subscription tracking
- `tool_usage` - Tool usage logging and analytics
- `daily_limits` - Daily API quota tracking

### **Database Functions**
- `can_use_api_tool(user_id)` - Check if user has remaining quota
- `increment_api_usage(user_id)` - Increment daily usage counter
- `get_or_create_daily_limit(user_id)` - Get/create daily limit record

### **Security**
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Service role key for server-side operations only

See full schema reference in [`supabase/SCHEMA_REFERENCE.md`](./supabase/SCHEMA_REFERENCE.md)

---

## 💳 Stripe Setup

### **1. Create Products**

In Stripe Dashboard → Products:

**Premium Plan**
- Name: Design Kit Premium
- Monthly Price: $9
- Price ID: Save to `STRIPE_PREMIUM_PRICE_ID`

**Pro Plan**
- Name: Design Kit Pro
- Monthly Price: $29
- Price ID: Save to `STRIPE_PRO_PRICE_ID`

### **2. Configure Webhook**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 🔐 Authentication

### **Supabase Auth Setup**

1. Enable authentication providers in Supabase Dashboard:
   - **Email/Password** (enabled by default)
   - **Google OAuth** (optional)
   - **GitHub OAuth** (optional)

2. Configure redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

3. Email templates:
   - Customize confirmation email
   - Password reset email

---

## 🎨 Design System

Built with **Tailwind CSS v3.4** and **shadcn/ui**

### **Install shadcn Components**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add slider
npx shadcn-ui@latest add toast
```

### **Color Palette**

```css
/* Primary */
--primary: 221.2 83.2% 53.3%        /* Blue */

/* Secondary */
--secondary: 210 40% 96.1%          /* Light Gray */

/* Accent */
--accent: 217.2 91.2% 59.8%         /* Bright Blue */
```

See full design system in `tailwind.config.ts`

---

## 🧪 Testing

### **Automated Tests**

```bash
# Unit tests
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

### **Manual Testing**

Comprehensive manual testing documentation available:

```bash
# Run pre-testing verification
npx tsx scripts/pre-test-check.ts

# Start development server
npm run dev
```

**Testing Documentation:**
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Step-by-step testing instructions
- **[MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)** - Complete testing checklist
- **[TEST_REPORT_TEMPLATE.md](./TEST_REPORT_TEMPLATE.md)** - Professional test report template
- **[TESTING_QUICK_REFERENCE.md](./TESTING_QUICK_REFERENCE.md)** - Quick reference card
- **[scripts/test-helpers.md](./scripts/test-helpers.md)** - Helper scripts and commands

**Testing Coverage:**
- ✅ Browser compatibility (Chrome, Firefox, Safari, Edge)
- ✅ Mobile devices (iOS and Android)
- ✅ Keyboard navigation
- ✅ Screen reader accessibility (NVDA, VoiceOver, TalkBack)
- ✅ Responsive design (5+ breakpoints)
- ✅ Error states and edge cases
- ✅ Performance metrics
- ✅ Security and privacy verification

**Quick Start:**
1. Review `TESTING_GUIDE.md` for instructions
2. Use `MANUAL_TESTING_CHECKLIST.md` to track progress
3. Follow the recommended 4-day testing schedule
4. Document results in `TEST_REPORT_TEMPLATE.md`

### **Test Coverage**

- Authentication flows
- Tool functionality (Color Picker, Image Cropper, etc.)
- Quota management
- Payment processing
- API endpoints
- Accessibility compliance (WCAG 2.1 Level AA)
- Cross-browser compatibility
- Mobile responsiveness

---

## 🚀 Deployment

### **Quick Start**

```bash
# 1. Test production build locally
npm run build
npm run start

# 2. Verify deployment readiness
npm run verify-deployment

# 3. Push to GitHub (triggers automatic deployment)
git push origin main
```

### **Cloudflare Pages Setup**

**Build Configuration:**
```yaml
Framework preset: Next.js
Build command: npm run build
Output directory: .next
Node version: 18.x
```

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `NODE_ENV=production`

**Optional (Stripe, if ready):**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_)
- `STRIPE_SECRET_KEY` (sk_live_)
- `STRIPE_WEBHOOK_SECRET` (whsec_)

See `.env.production.example` for complete list.

### **Comprehensive Guides**

📖 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment guide with:
- Step-by-step Cloudflare Pages setup
- Environment variables configuration
- Supabase production setup
- Stripe webhook configuration
- Custom domain setup
- Troubleshooting guide
- Performance optimization
- Security checklist

✅ **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Interactive checklist covering:
- Pre-deployment testing
- Environment setup
- Supabase configuration
- Stripe setup
- Cloudflare Pages deployment
- Post-deployment verification
- Monitoring setup

### **Deployment Steps**

1. **Prepare Environment**
   ```bash
   # Verify all checks pass
   npm run verify-deployment
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Connect your GitHub repository
   - Configure build settings (see above)

3. **Set Environment Variables**
   - Add all required variables in Cloudflare dashboard
   - Use production values (not test keys!)
   - Verify Stripe keys start with `pk_live_` and `sk_live_`

4. **Deploy**
   ```bash
   git push origin main
   # Cloudflare automatically builds and deploys
   ```

5. **Post-Deployment**
   - Update Supabase redirect URLs
   - Update Stripe webhook URL
   - Test all functionality in production
   - Monitor error logs

### **Custom Domain**

1. Add domain in Cloudflare Pages → Custom domains
2. Configure DNS (automatic if domain on Cloudflare)
3. Wait for SSL certificate (5-10 minutes)
4. Update `NEXT_PUBLIC_APP_URL` with new domain

### **Verification**

After deployment, verify:
- [ ] Landing page loads correctly
- [ ] Color Picker tool works
- [ ] Authentication flows work
- [ ] HTTPS is enforced
- [ ] No console errors
- [ ] Mobile responsive design works
- [ ] Performance score > 90 (Lighthouse)

### **Troubleshooting**

**Build fails?**
- Check build logs in Cloudflare dashboard
- Verify all environment variables are set
- Test build locally: `npm run build`

**Runtime errors?**
- Check Supabase URL is correct
- Verify API keys are production keys
- Check browser console for errors

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

---

## 📊 Analytics

### **Plausible Analytics** (Privacy-Friendly)

1. Add domain to Plausible
2. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in .env
3. Script auto-loaded in root layout

### **Custom Events**

```typescript
// Track tool usage
plausible('Tool Used', { props: { tool: 'color-picker' } })

// Track conversions
plausible('Upgrade', { props: { plan: 'premium' } })
```

---

## 🛡️ Security

### **Best Practices Implemented**

- ✅ Row Level Security (RLS) on all tables
- ✅ API key hashing (SHA-256)
- ✅ Rate limiting (Upstash Redis)
- ✅ Input validation (Zod)
- ✅ CORS & CSP headers
- ✅ File upload validation
- ✅ Secure session management
- ✅ Environment variable protection

See [security-guidelines.md](./docs/security-guidelines.md) for details.

---

## 📚 Documentation

Comprehensive documentation available in `/docs`:

- **[user-roles.md](./docs/user-roles.md)** - User permissions & plans
- **[business-rules.md](./docs/business-rules.md)** - Pricing & quotas
- **[user-flows.md](./docs/user-flows.md)** - User journeys
- **[api-documentation.md](./docs/api-documentation.md)** - API reference
- **[security-guidelines.md](./docs/security-guidelines.md)** - Security practices

---

## 🔨 Development Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier formatting
npm run type-check       # TypeScript checking

# Database
npm run db:generate      # Generate Supabase types
npm run db:migrate       # Run migrations (if using migration files)

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## 🗺️ Roadmap

### **Phase 1: MVP** (Weeks 1-3) ✅
- [x] Client-side tools (6 tools)
- [x] Authentication & user management
- [x] Landing page
- [x] Basic dashboard

### **Phase 2: Backend & Payments** (Week 4-5)
- [ ] Supabase setup
- [ ] Stripe integration
- [ ] Quota management
- [ ] Image compression

### **Phase 3: API Tools** (Week 6-7)
- [ ] Background remover
- [ ] Image upscaler
- [ ] Mockup generator

### **Phase 4: Polish & Launch** (Week 7-8)
- [ ] Performance optimization
- [ ] SEO
- [ ] Analytics
- [ ] Public beta launch

### **Future Features**
- [ ] REST API for Pro users
- [ ] Webhook notifications
- [ ] Team collaboration
- [ ] Custom branding
- [ ] Mobile apps

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **Code Style**

- ESLint configuration (`.eslintrc.json`)
- Prettier formatting (`.prettierrc`)
- TypeScript strict mode
- Conventional commits

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Backend**: [Your Name]
- **Frontend**: [Your Name]
- **Design**: [Your Name]

---

## 🆘 Support

### **Community**
- Discord: [Join our server](https://discord.gg/designkit)
- GitHub Issues: [Report bugs](https://github.com/yourusername/design-kit/issues)

### **Premium Support**
- Email: support@designkit.com
- Live Chat: Available for Pro users

---

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend & Auth
- [Stripe](https://stripe.com/) - Payments
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Lucide](https://lucide.dev/) - Icons
- [Remove.bg](https://remove.bg/) - Background removal
- [Replicate](https://replicate.com/) - Image upscaling

---

## 📈 Status

- **Current Version**: 0.1.0 (Alpha)
- **Build Status**: ![Build](https://img.shields.io/badge/build-passing-brightgreen)
- **Test Coverage**: ![Coverage](https://img.shields.io/badge/coverage-80%25-yellow)
- **Last Updated**: January 17, 2025

---

<p align="center">
  Made with ❤️ by the Design Kit Team
</p>

<p align="center">
  <a href="https://designkit.com">Website</a> •
  <a href="https://docs.designkit.com">Documentation</a> •
  <a href="https://twitter.com/designkit">Twitter</a>
</p>
