# Quick Setup Guide

Bu rehber Design Kit projesini hızlıca kurmak için gerekli minimum adımları içerir. Detaylı bilgi için [Environment Setup Guide](./ENVIRONMENT_SETUP.md) dökümanına bakın.

## 🚀 Hızlı Başlangıç (5 dakika)

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/your-username/design-kit.git
cd design-kit
npm install
```

### 2. Environment Dosyasını Oluşturun

```bash
cp .env.example .env.local
```

### 3. Minimum Servis Kurulumu

#### Supabase (Zorunlu)
1. [supabase.com](https://supabase.com) → New Project
2. Proje adı: `design-kit-dev`
3. Settings → API → URL ve Keys'i kopyalayın

#### Stripe (API tools için gerekli)
1. [stripe.com](https://stripe.com) → Dashboard
2. Developers → API keys → Test keys'i kopyalayın
3. Products → Premium ($9) ve Pro ($29) planları oluşturun

### 4. Environment Variables

`.env.local` dosyasını minimum değerlerle doldurun:

```bash
# Supabase (Zorunlu)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Stripe (API tools için)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Veritabanı Kurulumu

Supabase SQL Editor'de `supabase/migrations/` dosyalarını çalıştırın.

### 6. Çalıştırın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 🔧 Tam Kurulum (Production için)

Production deployment için aşağıdaki servisleri de kurmanız gerekir:

### Upstash Redis (Rate Limiting)
```bash
# .env.local'e ekleyin
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

### Sentry (Error Tracking)
```bash
# .env.local'e ekleyin
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

### Resend (Email)
```bash
# .env.local'e ekleyin
RESEND_API_KEY=re_your-key
```

## ✅ Kurulum Doğrulama

Tüm servislerin doğru çalıştığını kontrol edin:

```bash
npm run verify-env
```

Bu komut tüm servisleri test eder ve sorunları rapor eder.

## 🐛 Sorun Giderme

### Yaygın Hatalar

**Supabase Connection Error:**
- URL ve API key'lerin doğru olduğunu kontrol edin
- Proje aktif olduğunu kontrol edin

**Stripe Error:**
- Test mode'da olduğunuzu kontrol edin
- API key'lerin doğru olduğunu kontrol edin

**Build Error:**
- `npm install` komutunu tekrar çalıştırın
- Node.js versiyonunun 18+ olduğunu kontrol edin

### Yardım Alma

1. [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) kontrol edin
2. [Environment Setup Guide](./ENVIRONMENT_SETUP.md) detaylı kurulum için
3. [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) production için

## 📚 Sonraki Adımlar

1. **Development**: Client-side tools tamamen çalışır
2. **API Tools**: Stripe kurulumu gerekli (Background Remover, Upscaler)
3. **Production**: Tüm servisleri kurun ve [Production Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) takip edin

## 🔗 Faydalı Linkler

- [API Documentation](./API_DOCUMENTATION.md)
- [User Documentation](./USER_DOCUMENTATION.md)
- [FAQ](./FAQ_UPDATED.md)
- [Quota Management Guide](./QUOTA_MANAGEMENT_GUIDE.md)

---

**Not**: Bu quick setup guide minimum çalışan bir ortam oluşturur. Production deployment için mutlaka [Environment Setup Guide](./ENVIRONMENT_SETUP.md) ve [Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) dökümanlarını takip edin.