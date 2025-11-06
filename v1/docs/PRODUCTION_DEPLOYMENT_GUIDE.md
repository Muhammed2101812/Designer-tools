# Production Deployment Guide

Bu rehber, Design Kit projesini production ortamına deploy etmek için gereken tüm adımları detaylı olarak açıklar.

## Ön Hazırlık

### 1. Gerekli Hesaplar ve Servisler

Aşağıdaki servislerde hesaplarınızın olduğundan emin olun:

- **Supabase** (Database & Auth): https://supabase.com
- **Stripe** (Payments): https://stripe.com
- **Upstash** (Redis - Rate Limiting): https://upstash.com
- **Sentry** (Error Tracking): https://sentry.io
- **Resend** (Email Service): https://resend.com
- **Hosting Platform** (Vercel, Netlify, Cloudflare Pages, vb.)

### 2. Domain ve SSL

- Production domain'inizi hazırlayın
- SSL sertifikası otomatik olarak sağlanacak (hosting platform tarafından)

## Adım 1: Environment Variables Hazırlığı

### 1.1 Production Environment Variables Oluşturma

```bash
# Mevcut environment'ı validate et
npm run validate:env

# Production environment template oluştur
npm run deploy:setup
```

### 1.2 Gerekli Environment Variables

`.env.production` dosyasını oluşturun ve aşağıdaki değişkenleri doldurun:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe Production (Live Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Optional Services
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=design-kit
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@your-domain.com
REMOVE_BG_API_KEY=...
REPLICATE_API_KEY=...
```

## Adım 2: Supabase Production Setup

### 2.1 Production Projesi Oluşturma

1. Supabase Dashboard'a gidin: https://app.supabase.com
2. "New Project" tıklayın
3. Production için uygun bir isim verin
4. Güçlü bir database password seçin
5. Projeyi oluşturun

### 2.2 Database Migration'ları

```bash
# Supabase CLI kurulumu (eğer yoksa)
npm install -g supabase

# Supabase'e login
supabase login

# Projeyi bağla
supabase link --project-ref YOUR_PROJECT_REF

# Migration'ları çalıştır
supabase db push

# Veya script ile
npm run run-production-migrations
```

### 2.3 Auth Settings

1. Supabase Dashboard > Authentication > Settings
2. Site URL'i production domain'e ayarlayın
3. Redirect URLs'e production domain'i ekleyin
4. OAuth providers'ı konfigüre edin (Google, GitHub)

### 2.4 RLS Policies

Database'de Row Level Security (RLS) politikalarının aktif olduğunu kontrol edin:

```sql
-- Profiles tablosu için RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Subscriptions tablosu için RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Tool usage tablosu için RLS
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- Daily limits tablosu için RLS
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;
```

## Adım 3: Stripe Production Setup

### 3.1 Live Mode'a Geçiş

1. Stripe Dashboard'a gidin: https://dashboard.stripe.com
2. Sol üstteki toggle'ı "Live" mode'a çevirin
3. Business information'ı tamamlayın
4. Tax settings'i konfigüre edin (gerekirse)

### 3.2 Products ve Prices Oluşturma

```bash
# Premium Plan
- Name: Premium
- Price: $9.00 USD
- Billing: Monthly recurring
- Price ID'yi kopyalayın (price_...)

# Pro Plan
- Name: Pro
- Price: $29.00 USD
- Billing: Monthly recurring
- Price ID'yi kopyalayın (price_...)
```

### 3.3 Webhook Endpoint Konfigürasyonu

```bash
# Webhook helper script'i çalıştır
npm run update-stripe-webhook
```

Manuel olarak:
1. Stripe Dashboard > Developers > Webhooks
2. "Add endpoint" tıklayın
3. Endpoint URL: `https://your-domain.com/api/stripe/webhook`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Webhook signing secret'ı kopyalayın

### 3.4 API Keys

1. Stripe Dashboard > Developers > API keys
2. Publishable key'i kopyalayın (pk_live_...)
3. Secret key'i kopyalayın (sk_live_...)

## Adım 4: Optional Services Setup

### 4.1 Upstash Redis (Rate Limiting)

1. Upstash Console'a gidin: https://console.upstash.com
2. "Create Database" tıklayın
3. Region seçin (kullanıcılarınıza yakın)
4. Database name: `design-kit-production`
5. REST API credentials'ı kopyalayın

### 4.2 Sentry (Error Tracking)

1. Sentry'e gidin: https://sentry.io
2. "Create Project" tıklayın
3. Platform: Next.js
4. Project name: `design-kit`
5. DSN'i kopyalayın
6. Auth token oluşturun (Settings > Auth Tokens)

### 4.3 Resend (Email Service)

1. Resend'e gidin: https://resend.com
2. API key oluşturun
3. Domain ekleyin ve verify edin
4. SPF, DKIM, DMARC kayıtlarını DNS'e ekleyin

## Adım 5: Build ve Deploy

### 5.1 Production Build Test

```bash
# Environment'ı validate et
npm run validate:env

# Production build
npm run build

# Build'i test et
npm run start
```

### 5.2 Hosting Platform'a Deploy

#### Vercel

```bash
# Vercel CLI kurulumu
npm install -g vercel

# Deploy
vercel --prod

# Environment variables'ı Vercel dashboard'dan ekleyin
```

#### Netlify

```bash
# Netlify CLI kurulumu
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next

# Environment variables'ı Netlify dashboard'dan ekleyin
```

#### Cloudflare Pages

1. Cloudflare Dashboard > Pages
2. "Create a project" tıklayın
3. GitHub repository'nizi bağlayın
4. Build settings:
   - Build command: `npm run build`
   - Build output directory: `.next`
5. Environment variables'ı ekleyin

### 5.3 DNS Konfigürasyonu

Domain'inizi hosting platform'a yönlendirin:

```bash
# A Record (Vercel örneği)
Type: A
Name: @
Value: 76.76.19.61

# CNAME Record
Type: CNAME
Name: www
Value: your-app.vercel.app
```

## Adım 6: Post-Deployment Verification

### 6.1 Otomatik Verification

```bash
# Production deployment'ı verify et
npm run verify:production
```

### 6.2 Manuel Test Checklist

- [ ] Homepage yükleniyor
- [ ] User registration çalışıyor
- [ ] Login/logout çalışıyor
- [ ] Stripe checkout çalışıyor
- [ ] Webhook'lar çalışıyor (Stripe dashboard'dan test edin)
- [ ] E-posta gönderimi çalışıyor
- [ ] API tools çalışıyor
- [ ] Rate limiting çalışıyor
- [ ] Error tracking çalışıyor (Sentry'de görünüyor)

### 6.3 Performance Test

```bash
# Lighthouse audit
npm run test:lighthouse

# Security headers test
npm run test:security-headers

# Performance test suite
npm run test:performance-security
```

## Adım 7: Monitoring ve Alerting

### 7.1 Sentry Alerts

1. Sentry Dashboard > Alerts
2. "Create Alert Rule" tıklayın
3. Conditions:
   - Error rate > 5%
   - New issue created
   - Performance degradation
4. Actions: Email, Slack, vb.

### 7.2 Uptime Monitoring

Ücretsiz uptime monitoring servisleri:
- UptimeRobot: https://uptimerobot.com
- Pingdom: https://pingdom.com
- StatusCake: https://statuscake.com

### 7.3 Database Monitoring

Supabase Dashboard'da:
- Database health
- Connection pool usage
- Query performance
- Storage usage

## Adım 8: Backup ve Recovery

### 8.1 Database Backup

```bash
# Otomatik backup script
npm run backup-db

# Manuel backup (Supabase CLI)
supabase db dump --file backup.sql
```

### 8.2 Environment Variables Backup

Environment variables'ları güvenli bir yerde saklayın (1Password, Bitwarden, vb.)

## Adım 9: Maintenance Plan

### 9.1 Düzenli Görevler

**Haftalık:**
- Error rate kontrolü
- Performance metrics kontrolü
- Database backup kontrolü

**Aylık:**
- Security updates
- Dependency updates
- Cost optimization review

**Quarterly:**
- Full security audit
- Performance optimization
- User feedback review

### 9.2 Scaling Plan

**Database Scaling:**
- Supabase plan upgrade
- Read replicas (gerekirse)
- Connection pooling optimization

**Application Scaling:**
- CDN optimization
- Image optimization
- Code splitting optimization

## Troubleshooting

### Common Issues

**Build Errors:**
```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Environment validation
npm run validate:env
```

**Database Connection Issues:**
- Supabase service role key kontrolü
- RLS policies kontrolü
- Network connectivity kontrolü

**Stripe Webhook Issues:**
- Webhook URL kontrolü
- Webhook secret kontrolü
- Event types kontrolü

**Email Delivery Issues:**
- Resend API key kontrolü
- Domain verification kontrolü
- SPF/DKIM records kontrolü

### Support Contacts

- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com
- **Sentry Support:** https://sentry.io/support
- **Resend Support:** https://resend.com/support

## Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] Database RLS enabled
- [ ] API rate limiting active
- [ ] Input validation implemented
- [ ] File upload restrictions active
- [ ] Error messages don't expose sensitive data
- [ ] Webhook signatures validated
- [ ] CORS properly configured

Bu rehberi takip ederek Design Kit projenizi güvenli ve stabil bir şekilde production'a deploy edebilirsiniz. Her adımı dikkatlice takip edin ve gerekli testleri yapmayı unutmayın.