# Production Deployment Checklist

Bu checklist, Design Kit projesini production ortamına deploy etmeden önce tamamlanması gereken tüm adımları içerir.

## Pre-Deployment Checklist

### 1. Environment Variables ✅

- [ ] Tüm production environment variables'ları ayarlandı
- [ ] Development/test değerleri production değerleriyle değiştirildi
- [ ] API keys ve secrets güvenli şekilde saklandı
- [ ] `NEXT_PUBLIC_APP_URL` production domain'e ayarlandı
- [ ] `NODE_ENV=production` ayarlandı

### 2. Supabase Production Setup ✅

- [ ] Production Supabase projesi oluşturuldu
- [ ] Database migration'ları production'da çalıştırıldı
- [ ] RLS (Row Level Security) politikaları aktif
- [ ] Auth settings production domain'e ayarlandı
- [ ] OAuth sağlayıcıları production'da konfigüre edildi
- [ ] E-posta template'leri özelleştirildi
- [ ] Database backup stratejisi oluşturuldu

### 3. Stripe Production Setup ✅

- [ ] Stripe hesabı live mode'a geçirildi
- [ ] Production API keys alındı ve ayarlandı
- [ ] Webhook endpoint production URL'e güncellendi
- [ ] Webhook signing secret güncellendi
- [ ] Tax settings konfigüre edildi (gerekirse)
- [ ] Business information tamamlandı
- [ ] Payout settings ayarlandı

### 4. Upstash Redis Production ✅

- [ ] Production Redis database oluşturuldu
- [ ] Production credentials ayarlandı
- [ ] Rate limiting kuralları test edildi
- [ ] Redis connection pool ayarları optimize edildi

### 5. Sentry Production Setup ✅

- [ ] Production Sentry projesi oluşturuldu
- [ ] Production DSN ayarlandı
- [ ] Error alerting kuralları oluşturuldu
- [ ] Performance monitoring aktif
- [ ] Release tracking konfigüre edildi
- [ ] Source maps upload edildi

### 6. Resend Production Setup ✅

- [ ] Production API key alındı
- [ ] Domain doğrulaması tamamlandı
- [ ] SPF, DKIM, DMARC kayıtları eklendi
- [ ] E-posta template'leri test edildi
- [ ] Bounce ve complaint handling ayarlandı

## Code Quality Checklist

### 7. Testing ✅

- [ ] Tüm unit testler geçiyor
- [ ] Integration testler geçiyor
- [ ] E2E testler geçiyor
- [ ] API endpoint testleri geçiyor
- [ ] Stripe webhook testleri geçiyor
- [ ] Rate limiting testleri geçiyor

### 8. Security ✅

- [ ] Security headers konfigüre edildi
- [ ] HTTPS zorunluluğu aktif
- [ ] Content Security Policy (CSP) ayarlandı
- [ ] Input validation tüm endpoint'lerde mevcut
- [ ] File upload güvenlik kontrolleri aktif
- [ ] Rate limiting tüm API route'larda aktif
- [ ] SQL injection koruması aktif (RLS)
- [ ] XSS koruması aktif

### 9. Performance ✅

- [ ] Lighthouse audit skoru >90
- [ ] Core Web Vitals hedefleri karşılanıyor
- [ ] Image optimization aktif
- [ ] Code splitting implement edildi
- [ ] Bundle size optimize edildi
- [ ] Database query'leri optimize edildi
- [ ] Caching stratejisi implement edildi

### 10. Monitoring ✅

- [ ] Error tracking (Sentry) aktif
- [ ] Performance monitoring aktif
- [ ] Uptime monitoring kuruldu
- [ ] Database monitoring aktif
- [ ] API response time monitoring
- [ ] User analytics kuruldu (opsiyonel)

## Deployment Process

### 11. Build ve Deploy ✅

- [ ] Production build başarıyla tamamlandı
- [ ] Build artifacts kontrol edildi
- [ ] Static assets CDN'e yüklendi
- [ ] Database migration'ları çalıştırıldı
- [ ] Environment variables deploy platformunda ayarlandı

### 12. DNS ve Domain ✅

- [ ] Domain DNS ayarları yapıldı
- [ ] SSL sertifikası aktif
- [ ] WWW redirect ayarlandı
- [ ] Subdomain'ler konfigüre edildi (gerekirse)

### 13. Post-Deployment Testing ✅

- [ ] Homepage yükleniyor
- [ ] User registration çalışıyor
- [ ] Login/logout çalışıyor
- [ ] Stripe checkout çalışıyor
- [ ] Webhook'lar çalışıyor
- [ ] E-posta gönderimi çalışıyor
- [ ] API tools çalışıyor
- [ ] Rate limiting çalışıyor
- [ ] Error handling çalışıyor

## Production Environment Variables Template

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Supabase Production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-role-key

# Stripe Production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_live_...
STRIPE_PRO_PRICE_ID=price_live_...

# Upstash Redis Production
UPSTASH_REDIS_REST_URL=https://prod-database-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=prod-token

# Sentry Production
SENTRY_DSN=https://prod-dsn@sentry.io/prod-project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=prod-auth-token

# Resend Production
RESEND_API_KEY=re_prod_...

# External APIs (if used)
REMOVE_BG_API_KEY=your-removebg-key
REPLICATE_API_KEY=your-replicate-key
```

## Rollback Plan

### 14. Rollback Hazırlığı ✅

- [ ] Previous version backup'ı mevcut
- [ ] Database rollback script'i hazır
- [ ] DNS rollback planı hazır
- [ ] Rollback prosedürü dokümante edildi
- [ ] Rollback test edildi

## Monitoring ve Alerting Setup

### 15. Alert Kuralları ✅

- [ ] Error rate > 5% alert
- [ ] Response time > 2s alert
- [ ] Database connection error alert
- [ ] Payment failure rate > 10% alert
- [ ] Disk space < 20% alert
- [ ] Memory usage > 80% alert

### 16. Dashboard'lar ✅

- [ ] Application health dashboard
- [ ] Business metrics dashboard
- [ ] Error tracking dashboard
- [ ] Performance metrics dashboard

## Post-Launch Tasks

### 17. İlk 24 Saat ✅

- [ ] Error rate'i izle
- [ ] Performance metrics'leri kontrol et
- [ ] User feedback'i topla
- [ ] Payment flow'unu test et
- [ ] Database performance'ını izle

### 18. İlk Hafta ✅

- [ ] User analytics'i analiz et
- [ ] Conversion rate'i ölç
- [ ] Performance optimization'ları uygula
- [ ] Bug fix'leri deploy et
- [ ] User feedback'e göre iyileştirmeler yap

## Maintenance Plan

### 19. Düzenli Bakım ✅

- [ ] Haftalık database backup kontrolü
- [ ] Aylık security update'leri
- [ ] Quarterly dependency update'leri
- [ ] Yıllık SSL sertifika yenileme
- [ ] Performance audit (3 ayda bir)

### 20. Scaling Plan ✅

- [ ] Database scaling stratejisi
- [ ] CDN scaling planı
- [ ] API rate limit artırma planı
- [ ] Cost optimization stratejisi

## Emergency Contacts

```
Development Team: dev-team@company.com
DevOps Team: devops@company.com
Stripe Support: https://support.stripe.com
Supabase Support: https://supabase.com/support
Sentry Support: https://sentry.io/support
```

## Deployment Commands

```bash
# Build production
npm run build

# Start production server
npm run start

# Run production tests
npm run test:prod

# Check environment
npm run check-env

# Database migration
npm run db:migrate

# Verify deployment
npm run verify-deployment
```

Bu checklist'i tamamladıktan sonra projeniz production ortamında güvenli ve stabil bir şekilde çalışacaktır. Her adımı dikkatlice kontrol edin ve gerekli testleri yapmayı unutmayın.