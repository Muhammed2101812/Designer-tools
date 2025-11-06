# Environment Setup Guide

Bu rehber, Design Kit projesini geliştirme ve production ortamında çalıştırmak için gerekli tüm servislerin kurulumunu adım adım açıklar.

## Genel Bakış

Design Kit aşağıdaki servisleri kullanır:
- **Supabase**: Veritabanı ve kimlik doğrulama
- **Stripe**: Ödeme işleme ve abonelik yönetimi
- **Upstash Redis**: Rate limiting ve caching
- **Sentry**: Hata izleme ve performans monitoring
- **Resend**: E-posta gönderimi

## Ön Gereksinimler

- Node.js 18+ ve npm
- Git
- Bir metin editörü (VS Code önerilir)

## 1. Supabase Kurulumu

### 1.1 Proje Oluşturma

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adını girin (örn: "design-kit")
4. Güçlü bir veritabanı şifresi oluşturun
5. Bölge seçin (en yakın lokasyon)
6. "Create new project" butonuna tıklayın

### 1.2 Environment Variables

Proje oluşturulduktan sonra Settings > API'den aşağıdaki değerleri alın:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 1.3 Veritabanı Şeması

1. SQL Editor'e gidin
2. `supabase/migrations/` klasöründeki migration dosyalarını sırayla çalıştırın
3. RLS (Row Level Security) politikalarının aktif olduğunu kontrol edin

### 1.4 Authentication Ayarları

1. Authentication > Settings'e gidin
2. Site URL'i ayarlayın:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. OAuth sağlayıcılarını aktifleştirin (Google, GitHub)
4. E-posta template'lerini özelleştirin

## 2. Stripe Kurulumu

### 2.1 Hesap Oluşturma

1. [Stripe Dashboard](https://dashboard.stripe.com)'a gidin
2. Hesap oluşturun veya giriş yapın
3. İş bilgilerinizi tamamlayın

### 2.2 API Keys

Developers > API keys'den aşağıdaki değerleri alın:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 2.3 Ürün ve Fiyat Oluşturma

1. Products > Add product'a tıklayın
2. Premium Plan oluşturun:
   - Name: "Premium Plan"
   - Description: "500 daily API operations"
   - Pricing: $9.00 monthly recurring
   - Price ID'yi kaydedin
3. Pro Plan oluşturun:
   - Name: "Pro Plan"
   - Description: "2000 daily API operations"
   - Pricing: $29.00 monthly recurring
   - Price ID'yi kaydedin

```bash
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

### 2.4 Webhook Kurulumu

1. Developers > Webhooks'a gidin
2. "Add endpoint" butonuna tıklayın
3. Endpoint URL'i girin:
   - Development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - Production: `https://your-domain.com/api/stripe/webhook`
4. Aşağıdaki event'leri seçin:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Webhook signing secret'ı kaydedin:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2.5 Test Kartları

Development ortamında test için kullanabileceğiniz kartlar:
- Başarılı ödeme: `4242 4242 4242 4242`
- Başarısız ödeme: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## 3. Upstash Redis Kurulumu

### 3.1 Hesap Oluşturma

1. [Upstash Console](https://console.upstash.com)'a gidin
2. GitHub veya Google ile giriş yapın
3. "Create Database" butonuna tıklayın

### 3.2 Database Oluşturma

1. Database adını girin (örn: "design-kit-redis")
2. Bölge seçin (Supabase ile aynı bölge önerilir)
3. "Create" butonuna tıklayın

### 3.3 Environment Variables

Database oluşturulduktan sonra Details sekmesinden:

```bash
UPSTASH_REDIS_REST_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3.4 Rate Limiting Konfigürasyonu

Redis database'i aşağıdaki rate limiting kuralları için kullanılır:
- IP bazlı: 10 istek/dakika
- User bazlı: 30 istek/dakika
- API tool: 5 istek/dakika

## 4. Sentry Kurulumu

### 4.1 Proje Oluşturma

1. [Sentry](https://sentry.io)'ye gidin
2. "Create Project" butonuna tıklayın
3. Platform olarak "Next.js" seçin
4. Proje adını girin (örn: "design-kit")
5. Team seçin veya yeni team oluşturun

### 4.2 Environment Variables

Proje oluşturulduktan sonra:

```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token
```

### 4.3 Sentry Configuration

`sentry.client.config.ts`, `sentry.server.config.ts` ve `sentry.edge.config.ts` dosyalarını oluşturun:

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
});
```

### 4.4 Alert Kuralları

1. Alerts > Create Alert Rule'a gidin
2. Aşağıdaki alert'leri oluşturun:
   - Error rate > 5% (5 dakika içinde)
   - Response time > 2 saniye
   - Yeni error türleri

## 5. Resend Kurulumu

### 5.1 Hesap Oluşturma

1. [Resend](https://resend.com)'e gidin
2. Hesap oluşturun
3. E-posta adresinizi doğrulayın

### 5.2 API Key Oluşturma

1. API Keys sekmesine gidin
2. "Create API Key" butonuna tıklayın
3. Key adını girin (örn: "design-kit-production")
4. Permissions'ı "Sending access" olarak ayarlayın

```bash
RESEND_API_KEY=re_...
```

### 5.3 Domain Doğrulama (Production için)

1. Domains sekmesine gidin
2. "Add Domain" butonuna tıklayın
3. Domain adınızı girin (örn: "mail.yourdomain.com")
4. DNS kayıtlarını domain sağlayıcınıza ekleyin
5. Doğrulamayı bekleyin

### 5.4 E-posta Template'leri

Aşağıdaki e-posta türleri için template'ler oluşturun:
- Hoş geldin e-postası
- Abonelik onayı
- Kota uyarısı
- Abonelik iptali

## 6. Environment Variables Dosyası

Tüm servisleri kurduktan sonra `.env.local` dosyanızı oluşturun:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-auth-token

# Resend
RESEND_API_KEY=re_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 7. Development Ortamı Kurulumu

### 7.1 Proje Klonlama

```bash
git clone https://github.com/your-username/design-kit.git
cd design-kit
npm install
```

### 7.2 Environment Variables

```bash
cp .env.example .env.local
# .env.local dosyasını yukarıdaki değerlerle doldurun
```

### 7.3 Veritabanı Migration'ları

```bash
# Supabase CLI kurulumu (opsiyonel)
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase db push
```

### 7.4 Development Server

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 8. Test Ortamı Kurulumu

### 8.1 Test Environment Variables

Test ortamı için ayrı bir `.env.test` dosyası oluşturun:

```bash
# Test Supabase projesi
NEXT_PUBLIC_SUPABASE_URL=https://test-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key

# Stripe test mode
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Test Redis database
UPSTASH_REDIS_REST_URL=https://test-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=test-token

# Sentry test environment
SENTRY_DSN=https://test-dsn@sentry.io/test-project-id
```

### 8.2 Test Komutları

```bash
# Unit testler
npm run test

# E2E testler
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

## 9. Güvenlik Kontrolleri

### 9.1 Environment Variables Validation

`lib/env.ts` dosyasında Zod schema ile tüm environment variables'ları validate edin:

```typescript
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  // ... diğer değişkenler
})

export const env = envSchema.parse(process.env)
```

### 9.2 Güvenlik Headers

`next.config.js` dosyasında güvenlik header'larını ayarlayın:

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 10. Troubleshooting

### 10.1 Yaygın Sorunlar

**Supabase Connection Error:**
- URL ve API key'lerin doğru olduğunu kontrol edin
- RLS politikalarının doğru ayarlandığını kontrol edin

**Stripe Webhook Hatası:**
- Webhook URL'inin doğru olduğunu kontrol edin
- Webhook secret'ın doğru olduğunu kontrol edin
- ngrok kullanıyorsanız URL'in güncel olduğunu kontrol edin

**Redis Connection Error:**
- URL ve token'ın doğru olduğunu kontrol edin
- Network bağlantısını kontrol edin

**Sentry Hatası:**
- DSN'in doğru olduğunu kontrol edin
- Sentry paketlerinin yüklendiğini kontrol edin

### 10.2 Debug Komutları

```bash
# Environment variables'ları kontrol et
npm run check-env

# Database bağlantısını test et
npm run test-db

# Stripe webhook'unu test et
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Redis bağlantısını test et
npm run test-redis
```

## 11. Monitoring ve Logging

### 11.1 Sentry Monitoring

- Error tracking otomatik olarak aktif
- Performance monitoring için tracesSampleRate ayarlayın
- Custom tags ve context ekleyin

### 11.2 Supabase Monitoring

- Dashboard'dan database performansını izleyin
- Auth metrics'leri kontrol edin
- API usage'ı takip edin

### 11.3 Stripe Monitoring

- Dashboard'dan payment success rate'i izleyin
- Failed payment'ları analiz edin
- Churn rate'i takip edin

## 12. Backup ve Recovery

### 12.1 Database Backup

```bash
# Supabase backup
supabase db dump --file backup.sql

# Restore
supabase db reset --file backup.sql
```

### 12.2 Environment Variables Backup

- Environment variables'ları güvenli bir yerde saklayın
- Production ve development değerlerini ayrı tutun
- Secrets'ları version control'e eklemeyin

Bu rehberi takip ederek Design Kit projesini başarıyla kurabilir ve çalıştırabilirsiniz. Herhangi bir sorun yaşarsanız troubleshooting bölümüne bakın veya ilgili servisin dokümantasyonunu kontrol edin.