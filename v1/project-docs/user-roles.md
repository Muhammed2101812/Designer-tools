# 👥 User Roles & Permissions

## 📊 Plan Karşılaştırması

| Özellik | Free | Premium | Pro |
|---------|------|---------|-----|
| **Fiyat** | $0/ay | $9/ay | $29/ay |
| **Client-Side Tools** | ✅ Sınırsız | ✅ Sınırsız | ✅ Sınırsız |
| **API Tools (Günlük)** | 10 işlem | 500 işlem | 2000 işlem |
| **Max File Size** | 10 MB | 50 MB | 100 MB |
| **Batch Processing** | ❌ | ✅ 10 dosya | ✅ 50 dosya |
| **Watermark** | ✅ Var | ❌ Yok | ❌ Yok |
| **History** | 7 gün | 30 gün | 90 gün |
| **Priority Support** | ❌ | ✅ Email | ✅ Email + Chat |
| **API Access** | ❌ | ❌ | ✅ REST API |
| **Custom Branding** | ❌ | ❌ | ✅ Logo eklenebilir |

---

## 🎯 Detaylı Özellik Erişimleri

### **1. Client-Side Tools (Tüm Planlar İçin Ücretsiz)**

#### ✅ Herkes Kullanabilir:
- 🎨 **Color Picker** - Sınırsız kullanım
- ✂️ **Image Cropper** - Sınırsız kullanım
- 📐 **Image Resizer** - Sınırsız kullanım
- 🔄 **Format Converter** - Sınırsız kullanım
- 📱 **QR Generator** - Sınırsız kullanım
- 🌈 **Gradient Generator** - Sınırsız kullanım

**Özellikler:**
- Browser'da çalışır (dosyalar sunucuya gitmez)
- Anlık sonuç
- Gizlilik garantisi
- Kayıt gerektirmez (opsiyonel)

---

### **2. API Tools (Plan Bazlı Kısıtlamalı)**

#### 🗜️ **Image Compressor**
| Plan | Günlük Limit | Max Boyut | Kalite Kontrolü |
|------|--------------|-----------|-----------------|
| Free | 10 | 10 MB | Standart |
| Premium | 500 | 50 MB | Gelişmiş |
| Pro | 2000 | 100 MB | Tam Kontrol |

#### 🎭 **Background Remover**
| Plan | Günlük Limit | Max Boyut | Batch |
|------|--------------|-----------|-------|
| Free | 10 | 10 MB | ❌ |
| Premium | 500 | 50 MB | ✅ 10 |
| Pro | 2000 | 100 MB | ✅ 50 |

#### 🔍 **Image Upscaler**
| Plan | Günlük Limit | Max Boyut | Upscale Factor |
|------|--------------|-----------|----------------|
| Free | 10 | 10 MB | 2x |
| Premium | 500 | 50 MB | 4x |
| Pro | 2000 | 100 MB | 8x |

#### 🖼️ **Mockup Generator**
| Plan | Günlük Limit | Templates | Custom Upload |
|------|--------------|-----------|---------------|
| Free | 10 | 5 temel | ❌ |
| Premium | 500 | 50+ pro | ✅ |
| Pro | 2000 | Tümü + Custom | ✅ |

---

## 🔒 Kullanıcı Rolleri ve Yetkiler

### **Role: Guest (Kayıtsız Kullanıcı)**

**Erişebileceği Özellikler:**
- ✅ Client-side tools kullanımı
- ✅ Landing page görüntüleme
- ✅ Pricing sayfası
- ❌ API tools
- ❌ Usage tracking
- ❌ History

**Kısıtlamalar:**
- İşlem geçmişi kayıt edilmez
- Watermark eklenir (opsiyonel, tool bazlı)
- Batch işlem yapamaz

---

### **Role: Free User (Ücretsiz Kayıtlı)**

**Kimlik Doğrulama:**
- Email + Password
- Google OAuth
- GitHub OAuth (opsiyonel)

**Erişebileceği Özellikler:**
- ✅ Tüm client-side tools
- ✅ API tools (günlük 10 işlem)
- ✅ Usage dashboard
- ✅ 7 günlük işlem geçmişi
- ✅ Basic profil ayarları
- ❌ Batch processing
- ❌ API access
- ❌ Priority support

**Günlük Limitler:**
```typescript
{
  apiTools: {
    daily: 10,
    resetTime: "00:00 UTC",
    carry_over: false
  },
  fileSize: {
    max: 10 * 1024 * 1024, // 10 MB
    per_file: true
  },
  storage: {
    history_days: 7,
    max_saved_files: 0 // sadece geçici işlem
  }
}
```

**Upgrade Teşvikleri:**
- API tool kullanımında limit uyarısı
- Dashboard'da "Upgrade to Premium" banner
- Dosya boyutu sınırı aşıldığında premium önerisi

---

### **Role: Premium User ($9/ay)**

**Kimlik Doğrulama:**
- Free user + Stripe subscription

**Erişebileceği Özellikler:**
- ✅ Tüm client-side tools
- ✅ API tools (günlük 500 işlem)
- ✅ Usage dashboard + analytics
- ✅ 30 günlük işlem geçmişi
- ✅ Batch processing (10 dosya)
- ✅ Watermark kaldırma
- ✅ Priority email support
- ✅ Gelişmiş export seçenekleri
- ❌ API access (REST)
- ❌ Custom branding

**Günlük Limitler:**
```typescript
{
  apiTools: {
    daily: 500,
    resetTime: "00:00 UTC",
    carry_over: false
  },
  fileSize: {
    max: 50 * 1024 * 1024, // 50 MB
    per_file: true
  },
  batch: {
    max_files: 10,
    concurrent: 3
  },
  storage: {
    history_days: 30,
    max_saved_files: 100 // opsiyonel feature
  }
}
```

**Premium Özellikleri:**
- 🚫 Watermark yok
- 📊 Gelişmiş analytics
- 🎨 Daha fazla mockup template
- 📧 Priority support (24-48 saat)

---

### **Role: Pro User ($29/ay)**

**Kimlik Doğrulama:**
- Free user + Stripe subscription (Pro plan)

**Erişebileceği Özellikler:**
- ✅ Tüm client-side tools
- ✅ API tools (günlük 2000 işlem)
- ✅ Advanced usage dashboard
- ✅ 90 günlük işlem geçmişi
- ✅ Batch processing (50 dosya)
- ✅ Watermark kaldırma
- ✅ Priority email + chat support
- ✅ **REST API access**
- ✅ Custom branding
- ✅ Webhook notifications
- ✅ Team collaboration (opsiyonel: +$10/user)

**Günlük Limitler:**
```typescript
{
  apiTools: {
    daily: 2000,
    resetTime: "00:00 UTC",
    carry_over: false,
    burst: 100 // Anlık 100 işlem yapabilir
  },
  fileSize: {
    max: 100 * 1024 * 1024, // 100 MB
    per_file: true
  },
  batch: {
    max_files: 50,
    concurrent: 10 // Aynı anda 10 dosya işleme
  },
  storage: {
    history_days: 90,
    max_saved_files: 1000
  },
  api: {
    rate_limit: "1000 req/hour",
    api_keys: 5 // 5 farklı API key oluşturabilir
  }
}
```

**Pro Özellikleri:**
- 🔑 REST API access
- 🎨 Custom logo ve branding
- 🔔 Webhook notifications
- 👥 Team collaboration
- 📊 Advanced analytics & reports
- ⚡ Priority processing queue
- 💬 Live chat support

---

## 🔄 Upgrade/Downgrade Senaryoları

### **Free → Premium**
1. Stripe checkout açılır
2. Ödeme tamamlanınca anında aktif
3. Günlük limit 10 → 500'e çıkar
4. Geçmiş işlemler korunur
5. Watermark otomatik kaldırılır

**Pro-rated:** Hayır, aylık faturalandırma

### **Free → Pro**
- Premium'a benzer akış
- Doğrudan Pro'ya geçiş yapılabilir
- API keys otomatik oluşturulur

### **Premium → Pro**
1. Plan değişikliği anında
2. Kalan gün için pro-rated kredi
3. API access açılır
4. Limitler otomatik güncellenir

### **Downgrade: Premium → Free**
1. Subscription iptal edilir
2. Billing cycle sonuna kadar Premium kalır
3. Cycle sonunda otomatik Free'ye düşer
4. 30 günlük geçmiş 7 güne düşer (eski kayıtlar silinmez, görüntülenemez)
5. API limit 500 → 10'a düşer

**Veri Kaybı:**
- ❌ 7 günden eski geçmiş görüntülenemez (silinmez)
- ❌ Saved files silinir (optional feature ise)
- ✅ Account bilgileri korunur

### **Downgrade: Pro → Premium**
- Cycle sonuna kadar Pro kalır
- API access kapatılır
- Webhook notifications durdurulur
- Limitler Premium'a düşer

### **Cancel Subscription**
1. "Cancel" butonu tıklanır
2. Feedback formu (opsiyonel)
3. Cycle sonuna kadar aktif kalır
4. `cancel_at_period_end = true` set edilir
5. Email gönderilir: "Your subscription will end on [date]"

---

## 🎁 Promo Codes & Trials (Opsiyonel)

### **Free Trial**
```typescript
{
  duration: 14, // gün
  plan: "premium",
  auto_convert: false, // trial sonunda otomatik ücretlendirme YOK
  limits: {
    same_as: "premium",
    restrictions: [] // hiç kısıtlama yok
  }
}
```

### **Promo Codes**
```typescript
{
  "LAUNCH50": {
    discount: 50, // %
    duration: 3, // ay
    plans: ["premium", "pro"],
    max_uses: 100,
    expires: "2025-12-31"
  },
  "STUDENT20": {
    discount: 20,
    duration: 12,
    plans: ["premium"],
    requires_verification: true // .edu email
  }
}
```

---

## 📊 Usage Tracking & Quota Management

### **Quota Check Algoritması**
```typescript
async function canUseApiTool(userId: string, toolName: string): Promise<{
  allowed: boolean
  current: number
  limit: number
  resetTime: Date
  plan: string
}> {
  // 1. Get user's plan
  const user = await getUser(userId)
  const plan = user.plan // 'free', 'premium', 'pro'
  
  // 2. Get daily limit based on plan
  const limits = {
    free: 10,
    premium: 500,
    pro: 2000
  }
  const dailyLimit = limits[plan]
  
  // 3. Get today's usage
  const today = new Date().toISOString().split('T')[0]
  const usage = await getDailyUsage(userId, today)
  
  // 4. Check if under limit
  const allowed = usage.count < dailyLimit
  
  return {
    allowed,
    current: usage.count,
    limit: dailyLimit,
    resetTime: getNextMidnightUTC(),
    plan
  }
}
```

### **Quota Increment**
```typescript
async function incrementUsage(userId: string, toolName: string) {
  // Insert into tool_usage table
  await db.toolUsage.create({
    user_id: userId,
    tool_name: toolName,
    is_api_tool: true,
    created_at: new Date()
  })
  
  // Update daily_limits table
  await db.query(`
    INSERT INTO daily_limits (user_id, date, api_tools_count)
    VALUES ($1, CURRENT_DATE, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      api_tools_count = daily_limits.api_tools_count + 1
  `, [userId])
}
```

---

## 🚨 Limit Aşımı Senaryoları

### **Free User Limit Aşımı**
```typescript
// Kullanıcı 10. işlemi tamamladığında:
{
  message: "Daily limit reached (10/10)",
  action: "upgrade_prompt",
  ui: {
    modal: true,
    title: "You've reached your daily limit",
    description: "Upgrade to Premium for 500 daily operations",
    cta: "Upgrade Now",
    dismiss: "Maybe Later"
  }
}
```

### **Premium User Limit Aşımı**
```typescript
// Kullanıcı 500. işlemi tamamladığında:
{
  message: "Daily limit reached (500/500)",
  action: "wait_or_upgrade",
  ui: {
    message: "You've used all your daily operations. Resets in 8 hours.",
    upgradeCta: "Upgrade to Pro for 2000 daily operations",
    countdown: true
  }
}
```

---

## 🎯 Feature Flags (Opsiyonel Özellikler)

```typescript
interface FeatureFlags {
  // User bazlı
  saved_files: boolean // Premium+ için dosya saklama
  webhooks: boolean // Pro için
  team_collaboration: boolean // Pro + addon
  api_access: boolean // Sadece Pro
  custom_branding: boolean // Pro
  
  // Global
  maintenance_mode: boolean
  new_tool_beta: boolean
  promo_banner: boolean
}

// Kullanımı:
const features = await getFeatureFlags(userId)
if (features.api_access && user.plan === 'pro') {
  // Show API keys section
}
```

---

## 📝 Role Permissions Matrix

| Permission | Guest | Free | Premium | Pro |
|------------|-------|------|---------|-----|
| **Tools** |
| Use client-side tools | ✅ | ✅ | ✅ | ✅ |
| Use API tools | ❌ | ✅ (10) | ✅ (500) | ✅ (2000) |
| Batch processing | ❌ | ❌ | ✅ (10) | ✅ (50) |
| **Storage** |
| View history | ❌ | ✅ (7d) | ✅ (30d) | ✅ (90d) |
| Save files | ❌ | ❌ | ✅ (100) | ✅ (1000) |
| **Features** |
| Watermark removed | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Custom branding | ❌ | ❌ | ❌ | ✅ |
| Webhooks | ❌ | ❌ | ❌ | ✅ |
| **Support** |
| Community support | ✅ | ✅ | ✅ | ✅ |
| Email support | ❌ | ❌ | ✅ | ✅ |
| Live chat | ❌ | ❌ | ❌ | ✅ |
| Priority queue | ❌ | ❌ | ✅ | ✅ |

---

## 🔐 Database: User Plan Management

```sql
-- Get user's current plan and limits
SELECT 
  p.plan,
  COALESCE(dl.api_tools_count, 0) as today_usage,
  CASE 
    WHEN p.plan = 'free' THEN 10
    WHEN p.plan = 'premium' THEN 500
    WHEN p.plan = 'pro' THEN 2000
  END as daily_limit,
  s.status as subscription_status,
  s.current_period_end
FROM profiles p
LEFT JOIN daily_limits dl ON dl.user_id = p.id AND dl.date = CURRENT_DATE
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.id = $1;
```

---

## ✅ Checklist: User Role Implementation

### Backend
- [ ] Database schema (profiles, subscriptions, daily_limits)
- [ ] RLS policies for data access
- [ ] Usage tracking functions
- [ ] Quota check middleware
- [ ] Plan upgrade/downgrade logic

### Frontend
- [ ] Plan comparison UI
- [ ] Usage indicator component
- [ ] Limit reached modals
- [ ] Upgrade CTAs
- [ ] Settings page (plan management)

### Stripe Integration
- [ ] Products & prices setup
- [ ] Checkout session creation
- [ ] Webhook handler (subscription events)
- [ ] Customer portal integration

### Testing
- [ ] Test free user limits
- [ ] Test premium features
- [ ] Test upgrade flow
- [ ] Test downgrade flow
- [ ] Test quota reset

---

**Son Güncelleme:** 2025-01-17  
**Durum:** ✅ Ready for Development
