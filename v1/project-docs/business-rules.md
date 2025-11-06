# 💼 Business Rules & Policies

## 💰 Pricing Strategy

### **Plan Pricing**

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| Free | $0 | $0 | - |
| Premium | $9 | $90 | $18 (2 months free) |
| Pro | $29 | $290 | $58 (2 months free) |

### **Add-ons (Pro Only)**
- **Team Member:** +$10/user/month
- **Extra API Quota:** +$5 per 1000 operations/month
- **Dedicated Support:** +$50/month

---

## 🎯 Usage Limit Calculation

### **Daily Quota System**

```typescript
// Quota limits by plan
const DAILY_LIMITS = {
  free: {
    api_operations: 10,
    max_file_size_mb: 10,
    batch_files: 0,
    concurrent_jobs: 1
  },
  premium: {
    api_operations: 500,
    max_file_size_mb: 50,
    batch_files: 10,
    concurrent_jobs: 3
  },
  pro: {
    api_operations: 2000,
    max_file_size_mb: 100,
    batch_files: 50,
    concurrent_jobs: 10,
    burst_limit: 100 // Can use 100 in quick succession
  }
}
```

### **Reset Time: 00:00 UTC**
- Tüm günlük limitler UTC gece yarısında sıfırlanır
- Kullanılmayan quotalar bir sonraki güne **aktarılmaz**
- Real-time countdown gösterilir: "Resets in 5h 23m"

### **API Operation Definition**
Bir "API Operation" şunları içerir:
- ✅ Background removal (1 işlem)
- ✅ Image upscaling (1 işlem)
- ✅ Mockup generation (1 işlem)
- ✅ Image compression (1 işlem)
- ❌ Client-side tools **sayılmaz** (Color Picker, Cropper, etc.)

### **Batch Processing Rules**
```typescript
// Premium: 10 dosya batch
const batch = {
  max_files: 10,
  counted_as: 10, // Her dosya 1 operation
  failure_handling: "partial_success", // Bazı başarısız olabilir
  retry: true // Failed ones can be retried
}

// Pro: 50 dosya batch
const proBatch = {
  max_files: 50,
  concurrent_processing: 10, // Aynı anda 10 dosya
  priority_queue: true
}
```

---

## 📅 Billing Cycle & Payment Rules

### **Subscription Start**
```typescript
{
  billing_cycle: "monthly", // or "yearly"
  start_date: "immediate", // Ödeme anında başlar
  first_charge: "full_amount", // Pro-rata YOK, tam ücret
  trial: {
    enabled: false, // Default olarak trial yok
    duration_days: 14, // Eğer aktif edilirse
    requires_card: true
  }
}
```

### **Recurring Billing**
- **Monthly:** Her ayın aynı gününde faturalandırma
  - Örnek: 15 Ocak'ta başladıysa, her ayın 15'inde
  - Eğer ay 31 günse ve başlangıç 31 ise, sonraki ayın son günü
  
- **Yearly:** 12 ay sonra otomatik yenileme
  - %20 indirim (2 ay bedava)
  - Tek seferde ödeme

### **Failed Payment Handling**
```typescript
const failedPaymentFlow = {
  retry_1: "24 hours later",
  retry_2: "3 days later",
  retry_3: "5 days later",
  
  after_3_failures: {
    subscription_status: "past_due",
    access: "limited", // API tools disabled
    email_notification: true,
    grace_period: "7 days total"
  },
  
  after_grace_period: {
    subscription_status: "canceled",
    plan: "free",
    data_retention: "90 days"
  }
}
```

### **Email Notifications**
1. **Payment Failed (1st attempt):**
   - Subject: "Payment Failed - Please Update Your Card"
   - CTA: "Update Payment Method"

2. **Payment Failed (Final attempt):**
   - Subject: "Urgent: Update Payment to Keep Premium Access"
   - Warning: "Your subscription will be canceled in 2 days"

3. **Subscription Canceled:**
   - Subject: "Your Premium subscription has ended"
   - Info: "You've been moved to the Free plan"

---

## 🔄 Upgrade/Downgrade Rules

### **Upgrade: Free → Premium/Pro**

```typescript
const upgradeFlow = {
  timing: "immediate",
  access: "instant", // Ödeme sonrası anında Premium
  charges: {
    first_payment: "full_month", // Pro-rata yok
    next_payment: "same_day_next_month"
  },
  limits: {
    updated: "immediately",
    quota_reset: "keeps_current_usage" // Bugünkü kullanım korunur
  }
}
```

**Örnek:**
- Kullanıcı Free planında bugün 8/10 işlem kullandı
- Premium'a upgrade ediyor
- Upgrade sonrası: 8/500 olur
- Bugünkü 8 işlem sayılmaya devam eder

### **Upgrade: Premium → Pro**

```typescript
const premiumToProUpgrade = {
  timing: "immediate",
  billing: {
    method: "proration", // Kalan gün için kredi
    calculation: "unused_days * daily_rate",
    applied_to: "next_invoice"
  },
  example: {
    scenario: "Premium $9/ay, 15 gün kaldı",
    premium_daily: "$0.30",
    unused_credit: "$4.50",
    pro_charge: "$29",
    first_charge: "$24.50" // $29 - $4.50
  }
}
```

### **Downgrade: Premium/Pro → Free**

```typescript
const downgradeFlow = {
  timing: "end_of_billing_cycle", // Cycle sonunda
  immediate_effect: false,
  access: {
    until_cycle_end: "full_premium_access",
    after_cycle_end: "free_plan_limits"
  },
  refund: "none", // Hiç iade yok
  cancellation: {
    user_initiated: true,
    can_reactivate: "until_cycle_end"
  }
}
```

**Örnek Timeline:**
1. **Ocak 15:** User cancels Premium ($9/ay)
2. **Ocak 15-31:** Still has Premium access (16 gün kaldı)
3. **Şubat 1:** Automatically becomes Free user
4. **No refund** for remaining 16 days

### **Downgrade: Pro → Premium**
- Premium'a downgrade talep edebilir
- Cycle sonunda otomatik geçiş
- API access kapatılır
- Limitler düşer (2000 → 500)

---

## 💳 Refund & Cancellation Policy

### **Refund Policy**

```typescript
const refundPolicy = {
  trial_period: {
    duration: "14 days", // Eğer trial varsa
    refund: "full", // Tam iade
    condition: "if_not_satisfied"
  },
  
  regular_subscription: {
    refund_window: "none", // Trial sonrası iade yok
    exceptions: [
      "technical_issues", // Platform çökmesi, bug
      "double_charge", // Yanlışlıkla 2 kez ücret
      "unauthorized_charge" // Hesap hack
    ]
  },
  
  annual_plan: {
    refund_window: "30_days", // İlk 30 gün
    refund_amount: "prorated", // Kullanılan süre düşülür
    condition: "usage < 100 operations" // Çok az kullanmışsa
  }
}
```

### **Cancellation Types**

#### 1. **User-Initiated Cancellation**
```typescript
{
  process: "self_service", // Settings'den iptal
  confirmation: "required", // Double-check modal
  feedback: "optional", // "Why are you leaving?"
  retention: {
    offer: "pause_subscription", // 1-3 ay dondur
    discount: "20% off for 3 months"
  },
  effect: {
    access: "until_period_end",
    data: "retained_90_days"
  }
}
```

#### 2. **Payment Failure Cancellation**
- Otomatik iptal (7 gün grace period sonrası)
- Email notification (3 kez)
- Reactivate option (update card)

#### 3. **Admin-Initiated Cancellation**
```typescript
{
  reasons: [
    "terms_violation",
    "fraud_detected",
    "abuse_of_service"
  ],
  effect: "immediate",
  refund: "case_by_case",
  appeal: "support@designkit.com"
}
```

---

## 🎁 Promo Codes & Discounts

### **Promo Code System**

```typescript
interface PromoCode {
  code: string
  type: "percentage" | "fixed"
  amount: number
  duration: number // months
  plans: ("premium" | "pro")[]
  maxUses: number
  expiresAt: Date
  restrictions: {
    newCustomersOnly?: boolean
    emailDomain?: string // e.g., ".edu"
    minimumPlan?: "premium" | "pro"
  }
}

// Examples:
const promoCodes = [
  {
    code: "LAUNCH50",
    type: "percentage",
    amount: 50, // 50% off
    duration: 3, // 3 months
    plans: ["premium", "pro"],
    maxUses: 100,
    expiresAt: "2025-03-31",
    restrictions: { newCustomersOnly: true }
  },
  {
    code: "STUDENT20",
    type: "percentage",
    amount: 20,
    duration: 12,
    plans: ["premium"],
    maxUses: 1000,
    restrictions: { emailDomain: ".edu" }
  }
]
```

### **Discount Rules**
- ✅ Can combine with yearly discount? **NO**
- ✅ Auto-applied? **User must enter code**
- ✅ One code per user? **YES**
- ✅ Expires after X months? **YES**

---

## ⚖️ Fair Use Policy

### **API Rate Limiting**

```typescript
const rateLimits = {
  free: {
    requests_per_minute: 5,
    requests_per_hour: 60,
    burst: 10 // Max 10 in quick succession
  },
  premium: {
    requests_per_minute: 50,
    requests_per_hour: 1000,
    burst: 100
  },
  pro: {
    requests_per_minute: 200,
    requests_per_hour: 5000,
    burst: 500
  }
}
```

### **Abuse Detection**

```typescript
const abuseFlags = {
  // Trigger investigation if:
  suspicious_patterns: [
    "100+ requests in 1 minute (non-Pro)",
    "Same file processed 50+ times/day",
    "Different IPs, same account (VPN rotation)",
    "Batch processing with tiny files (testing limits)"
  ],
  
  consequences: {
    warning: "email_notification",
    temporary_ban: "24h_suspension",
    permanent_ban: "account_termination",
    refund: "none_if_abuse_confirmed"
  }
}
```

### **Acceptable Use**
- ✅ Personal projects
- ✅ Client work (freelancers)
- ✅ Small business use
- ✅ Educational use
- ✅ Commercial use (Pro plan recommended)
- ❌ Reselling API access
- ❌ Scraping/automation (beyond rate limits)
- ❌ Bulk processing for competitors

---

## 🔒 Data Retention & Privacy

### **User Data Storage**

```typescript
const dataRetention = {
  active_user: {
    profile: "indefinite",
    usage_logs: "plan_specific", // 7/30/90 days
    processed_files: "temporary", // Deleted after download
    payment_history: "indefinite"
  },
  
  canceled_user: {
    profile: "90_days", // Then anonymized
    usage_logs: "30_days",
    processed_files: "immediate_deletion",
    payment_history: "7_years" // Legal requirement
  },
  
  deleted_account: {
    profile: "immediate_deletion",
    usage_logs: "30_days", // For abuse detection
    processed_files: "immediate_deletion",
    payment_history: "7_years" // Legal requirement
  }
}
```

### **GDPR Compliance**
- ✅ Right to access (data export)
- ✅ Right to deletion (account deletion)
- ✅ Right to portability (JSON export)
- ✅ Consent for cookies
- ✅ Email opt-out

---

## 📊 Analytics & Tracking

### **What We Track**

```typescript
const tracking = {
  anonymous: {
    page_views: true,
    tool_usage: true, // Which tools are popular
    conversion_funnel: true,
    performance_metrics: true
  },
  
  authenticated: {
    user_journey: true,
    feature_usage: true,
    api_calls: true, // For billing
    error_logs: true
  },
  
  never_tracked: {
    file_contents: false, // Privacy-first
    personal_data_in_files: false,
    payment_card_details: false // Stripe handles
  }
}
```

---

## 💡 Business Metrics & KPIs

### **Revenue Targets**

```typescript
const targets = {
  monthly_recurring_revenue: {
    month_3: "$1,000",
    month_6: "$5,000",
    month_12: "$20,000"
  },
  
  customer_acquisition: {
    cost_per_acquisition: "< $20",
    lifetime_value: "> $100",
    ltv_cac_ratio: "> 3:1"
  },
  
  conversion_rates: {
    visitor_to_signup: "10%",
    free_to_premium: "5%",
    premium_to_pro: "10%"
  },
  
  churn_rate: {
    target: "< 5% monthly",
    acceptable: "< 10%",
    critical: "> 15%"
  }
}
```

### **Growth Levers**

1. **Freemium Conversion**
   - Limit reached notifications
   - Feature comparison tooltips
   - Success stories

2. **Referral Program** (Future)
   - Give 1 month free
   - Get $10 credit

3. **Annual Upsell**
   - Save 2 months
   - Locked-in pricing

4. **Pro Upsell**
   - API access showcase
   - Team collaboration
   - Custom branding

---

## 🎯 Customer Support Tiers

### **Support Response Times**

| Plan | Channel | Response Time | Availability |
|------|---------|---------------|--------------|
| Free | Email | 72h | Business hours |
| Premium | Email | 24h | 24/7 |
| Pro | Email + Chat | 4h | 24/7 priority |

### **Support Scope**

#### Free Users
- ✅ Technical issues
- ✅ Account problems
- ✅ Basic "how to use"
- ❌ Feature requests
- ❌ Custom solutions

#### Premium Users
- ✅ All Free support
- ✅ Feature guidance
- ✅ Workflow optimization
- ✅ Bug priority
- ❌ Custom development

#### Pro Users
- ✅ All Premium support
- ✅ API integration help
- ✅ Custom workflow design
- ✅ Dedicated account manager (optional)
- ✅ Feature request priority

---

## 📋 Terms of Service Highlights

### **User Responsibilities**
1. Provide accurate information
2. Keep account secure
3. Don't share login credentials
4. Respect usage limits
5. No illegal content processing
6. No copyright infringement

### **Service Guarantees**
1. **Uptime:** 99.5% (excluding maintenance)
2. **Data Security:** Industry-standard encryption
3. **Privacy:** No selling user data
4. **Support:** Response within SLA

### **Service Limitations**
1. Beta features may change
2. API limits may adjust (30-day notice)
3. Third-party service dependencies (Remove.bg, etc.)
4. Force majeure exceptions

### **Liability**
- Not liable for lost profits
- Max liability: Amount paid in last 12 months
- No warranty on output quality
- User responsible for copyright compliance

---

## 🚀 Future Business Rules (Roadmap)

### **Enterprise Plan** (Later)
```typescript
{
  price: "Custom",
  features: [
    "Unlimited operations",
    "Dedicated infrastructure",
    "SSO integration",
    "Custom SLA",
    "White-label option"
  ]
}
```

### **Team Collaboration** (Pro Add-on)
```typescript
{
  price: "+$10/user/month",
  features: [
    "Shared workspace",
    "Role-based permissions",
    "Shared history",
    "Team analytics"
  ]
}
```

### **API Marketplace** (Future)
- Developers can build integrations
- Revenue sharing: 70/30 split

---

## ✅ Implementation Checklist

### Stripe Setup
- [ ] Create products (Premium, Pro)
- [ ] Set up recurring prices
- [ ] Configure webhooks
- [ ] Test checkout flow
- [ ] Set up customer portal

### Usage Tracking
- [ ] Implement quota middleware
- [ ] Real-time counter
- [ ] Reset cron job (daily)
- [ ] Usage dashboard
- [ ] Limit notifications

### Billing Logic
- [ ] Upgrade flow
- [ ] Downgrade flow
- [ ] Proration calculation
- [ ] Failed payment handling
- [ ] Cancellation flow

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund Policy
- [ ] Cookie Consent
- [ ] GDPR compliance

---

**Son Güncelleme:** 2025-01-17  
**Durum:** ✅ Ready for Implementation
