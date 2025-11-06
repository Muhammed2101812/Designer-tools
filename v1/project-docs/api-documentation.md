# 🔌 API Documentation

## 📋 Overview

Bu doküman iki tür API'yi kapsar:
1. **Internal API** - Frontend'in kullandığı Next.js API routes
2. **External API** (Pro users için) - REST API erişimi

---

## 🏠 Internal API Routes

### **Base URL**
```
Development: http://localhost:3000/api
Production: https://designkit.com/api
```

### **Authentication**
```typescript
// All authenticated routes use Supabase session
headers: {
  'Authorization': 'Bearer <supabase_jwt_token>'
}
```

---

## 1️⃣ Authentication Endpoints

### **POST /api/auth/signup**

Yeni kullanıcı kaydı.

**Request:**
```typescript
{
  email: string          // Required
  password: string       // Required, min 8 chars
  full_name?: string     // Optional
}
```

**Response (Success):**
```typescript
{
  success: true,
  message: "Verification email sent",
  user: {
    id: string,
    email: string,
    email_confirmed_at: null
  }
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: {
    code: "email_already_exists" | "weak_password" | "invalid_email",
    message: string
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation error
- `409` - Email already exists
- `500` - Server error

---

### **POST /api/auth/login**

Kullanıcı girişi.

**Request:**
```typescript
{
  email: string,
  password: string
}
```

**Response (Success):**
```typescript
{
  success: true,
  user: {
    id: string,
    email: string,
    plan: "free" | "premium" | "pro"
  },
  session: {
    access_token: string,
    refresh_token: string,
    expires_at: number
  }
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: {
    code: "invalid_credentials" | "email_not_confirmed",
    message: string
  }
}
```

---

### **POST /api/auth/logout**

Kullanıcı çıkışı.

**Request:**
```typescript
// No body, uses session cookie
```

**Response:**
```typescript
{
  success: true,
  message: "Logged out successfully"
}
```

---

### **POST /api/auth/reset-password**

Şifre sıfırlama isteği.

**Request:**
```typescript
{
  email: string
}
```

**Response:**
```typescript
{
  success: true,
  message: "Password reset email sent"
}
```

---

### **GET /api/auth/callback**

OAuth callback handler (Google, GitHub).

**Query Params:**
```
?code=xxx&state=xxx
```

**Response:**
```
Redirect to /dashboard
```

---

## 2️⃣ User Endpoints

### **GET /api/user/profile**

Kullanıcı profil bilgilerini getirir.

**Auth:** Required

**Response:**
```typescript
{
  id: string,
  email: string,
  full_name: string,
  avatar_url: string | null,
  plan: "free" | "premium" | "pro",
  created_at: string,
  updated_at: string
}
```

---

### **PATCH /api/user/profile**

Profil güncelleme.

**Auth:** Required

**Request:**
```typescript
{
  full_name?: string,
  avatar_url?: string
}
```

**Response:**
```typescript
{
  success: true,
  profile: { /* updated profile */ }
}
```

---

### **GET /api/user/stats**

Kullanım istatistikleri.

**Auth:** Required

**Query Params:**
```
?period=today|week|month|all
```

**Response:**
```typescript
{
  period: "today",
  stats: {
    api_operations: {
      used: 127,
      limit: 500,
      remaining: 373,
      reset_at: "2025-01-18T00:00:00Z"
    },
    tools_used: {
      "background-remover": 45,
      "image-upscaler": 32,
      "mockup-generator": 50
    },
    total_files_processed: 127,
    total_processing_time: "15m 32s"
  }
}
```

---

### **GET /api/user/history**

İşlem geçmişi.

**Auth:** Required

**Query Params:**
```
?page=1&limit=20&tool=background-remover
```

**Response:**
```typescript
{
  items: [
    {
      id: string,
      tool_name: string,
      file_name: string,
      file_size_mb: number,
      processing_time_ms: number,
      success: boolean,
      created_at: string
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 127,
    total_pages: 7
  }
}
```

---

## 3️⃣ Tool Usage Endpoints

### **POST /api/tools/usage/check**

Quota kontrolü (bir tool kullanmadan önce).

**Auth:** Required

**Request:**
```typescript
{
  tool_name: "background-remover" | "image-upscaler" | "mockup-generator"
}
```

**Response (Can Use):**
```typescript
{
  allowed: true,
  usage: {
    current: 127,
    limit: 500,
    remaining: 373,
    reset_at: "2025-01-18T00:00:00Z"
  },
  plan: "premium"
}
```

**Response (Limit Reached):**
```typescript
{
  allowed: false,
  usage: {
    current: 500,
    limit: 500,
    remaining: 0,
    reset_at: "2025-01-18T00:00:00Z"
  },
  plan: "premium",
  upgrade_available: true
}
```

---

### **POST /api/tools/usage/increment**

Quota artırma (tool kullanıldıktan sonra).

**Auth:** Required (Server-side only)

**Request:**
```typescript
{
  user_id: string,
  tool_name: string,
  file_size_mb?: number,
  processing_time_ms?: number,
  success: boolean,
  error_message?: string
}
```

**Response:**
```typescript
{
  success: true,
  new_count: 128
}
```

---

## 4️⃣ API Tool Endpoints

### **POST /api/tools/background-remover**

Arkaplan kaldırma.

**Auth:** Required

**Request (multipart/form-data):**
```typescript
{
  file: File,              // Max 10/50/100MB based on plan
  output_format?: "png" | "jpg"  // Default: "png"
}
```

**Response:**
```typescript
{
  success: true,
  result: {
    url: string,           // Temporary download URL
    expires_at: string,    // URL expiry
    file_size_mb: number,
    processing_time_ms: number
  },
  usage: {
    remaining: 372         // Operations left today
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: "quota_exceeded" | "file_too_large" | "invalid_format" | "processing_failed",
    message: string
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `403` - Quota exceeded
- `413` - File too large
- `500` - Processing error

---

### **POST /api/tools/image-upscaler**

Görsel çözünürlük artırma.

**Auth:** Required

**Request (multipart/form-data):**
```typescript
{
  file: File,
  scale: 2 | 4 | 8,       // Free: 2x, Premium: 4x, Pro: 8x
  output_format?: "png" | "jpg"
}
```

**Response:**
```typescript
{
  success: true,
  result: {
    url: string,
    original_size: { width: number, height: number },
    upscaled_size: { width: number, height: number },
    file_size_mb: number,
    processing_time_ms: number
  },
  usage: {
    remaining: 371
  }
}
```

---

### **POST /api/tools/mockup-generator**

Mockup oluşturma.

**Auth:** Required

**Request (multipart/form-data):**
```typescript
{
  design_file: File,
  template_id: string,    // e.g., "iphone-14-pro"
  position?: {
    x: number,
    y: number,
    width: number,
    height: number
  },
  background_color?: string
}
```

**Response:**
```typescript
{
  success: true,
  result: {
    url: string,
    template_name: string,
    file_size_mb: number
  },
  usage: {
    remaining: 370
  }
}
```

---

## 5️⃣ Subscription & Billing

### **POST /api/stripe/create-checkout**

Stripe checkout session oluşturma.

**Auth:** Required

**Request:**
```typescript
{
  plan: "premium" | "pro",
  billing_cycle: "monthly" | "yearly",
  promo_code?: string
}
```

**Response:**
```typescript
{
  success: true,
  checkout_url: string,   // Redirect user here
  session_id: string
}
```

---

### **POST /api/stripe/webhook**

Stripe webhook handler (internal).

**Auth:** Stripe signature

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

### **POST /api/stripe/portal**

Stripe customer portal URL.

**Auth:** Required

**Response:**
```typescript
{
  success: true,
  portal_url: string      // Redirect user here
}
```

---

### **GET /api/user/subscription**

Abonelik bilgileri.

**Auth:** Required

**Response:**
```typescript
{
  active: true,
  plan: "premium",
  status: "active" | "past_due" | "canceled",
  current_period_start: string,
  current_period_end: string,
  cancel_at_period_end: boolean,
  stripe_customer_id: string
}
```

---

### **POST /api/user/subscription/cancel**

Abonelik iptali.

**Auth:** Required

**Response:**
```typescript
{
  success: true,
  message: "Subscription will be canceled at period end",
  ends_at: string
}
```

---

## 6️⃣ Pro API (External REST API)

### **Base URL**
```
https://api.designkit.com/v1
```

### **Authentication**
```typescript
headers: {
  'Authorization': 'Bearer <api_key>',
  'Content-Type': 'application/json'
}
```

### **API Key Management**

Pro users can create API keys in dashboard:
```
Dashboard → Settings → API Keys → Create New Key
```

**Rate Limits:**
- **Pro Plan:** 1000 requests/hour
- **Burst:** 100 requests/minute

---

### **POST /v1/tools/remove-background**

**Request:**
```bash
curl -X POST https://api.designkit.com/v1/tools/remove-background \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@/path/to/image.jpg" \
  -F "output_format=png"
```

**Request (JSON with base64):**
```typescript
{
  image: string,          // Base64 encoded
  output_format: "png" | "jpg"
}
```

**Response:**
```typescript
{
  status: "success",
  data: {
    result_url: string,
    result_base64?: string,    // If requested
    file_size_kb: number,
    processing_time_ms: number
  },
  usage: {
    remaining_today: 1873
  }
}
```

---

### **POST /v1/tools/upscale**

**Request:**
```typescript
{
  image: string,          // Base64 or URL
  scale: 2 | 4 | 8,
  output_format?: "png" | "jpg"
}
```

**Response:**
```typescript
{
  status: "success",
  data: {
    result_url: string,
    original_dimensions: { width: number, height: number },
    upscaled_dimensions: { width: number, height: number },
    file_size_kb: number
  }
}
```

---

### **POST /v1/tools/mockup**

**Request:**
```typescript
{
  design_image: string,   // Base64 or URL
  template_id: string,
  position?: { x: number, y: number, width: number, height: number }
}
```

**Response:**
```typescript
{
  status: "success",
  data: {
    result_url: string,
    template_name: string
  }
}
```

---

### **GET /v1/usage**

Kullanım istatistikleri.

**Response:**
```typescript
{
  status: "success",
  data: {
    today: {
      used: 127,
      limit: 2000,
      remaining: 1873,
      reset_at: "2025-01-18T00:00:00Z"
    },
    this_month: {
      total_operations: 3847,
      total_processing_time_ms: 1247893
    }
  }
}
```

---

### **GET /v1/history**

İşlem geçmişi.

**Query Params:**
```
?page=1&limit=20&start_date=2025-01-01&end_date=2025-01-31
```

**Response:**
```typescript
{
  status: "success",
  data: {
    items: [
      {
        id: string,
        tool: string,
        timestamp: string,
        success: boolean,
        processing_time_ms: number
      }
    ],
    pagination: {
      page: 1,
      per_page: 20,
      total: 3847,
      total_pages: 193
    }
  }
}
```

---

## 🚨 Error Responses

### **Standard Error Format**

```typescript
{
  status: "error",
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### **Common Error Codes**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Invalid or missing API key |
| `forbidden` | 403 | Insufficient permissions |
| `quota_exceeded` | 429 | Daily limit reached |
| `rate_limit` | 429 | Too many requests |
| `invalid_request` | 400 | Missing or invalid parameters |
| `file_too_large` | 413 | File exceeds size limit |
| `invalid_format` | 400 | Unsupported file format |
| `processing_failed` | 500 | Tool processing error |
| `service_unavailable` | 503 | External service down |

---

## 🔒 Rate Limiting

### **Internal API (Web App)**

```typescript
const rateLimits = {
  guest: {
    per_minute: 30,      // 30 requests/minute
    per_hour: 100
  },
  authenticated: {
    free: {
      per_minute: 60,
      per_hour: 500
    },
    premium: {
      per_minute: 120,
      per_hour: 2000
    },
    pro: {
      per_minute: 300,
      per_hour: 10000
    }
  }
}
```

### **External API (Pro Plan)**

```typescript
const externalRateLimits = {
  per_second: 10,
  per_minute: 100,
  per_hour: 1000,
  per_day: 2000      // Same as daily operations quota
}
```

**Headers Returned:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 873
X-RateLimit-Reset: 1642377600
```

---

## 📊 Webhooks (Pro Feature)

Pro users can receive webhooks for events.

### **Setup**

1. Go to Dashboard → Settings → Webhooks
2. Add webhook URL
3. Select events to receive
4. Get webhook secret

### **Supported Events**

```typescript
const webhookEvents = [
  "tool.completed",
  "tool.failed",
  "quota.warning",      // 90% used
  "quota.exceeded",
  "subscription.updated"
]
```

### **Webhook Payload**

```typescript
{
  event: string,
  timestamp: string,
  data: {
    user_id: string,
    tool_name?: string,
    success?: boolean,
    error?: string,
    // Event-specific data
  }
}
```

### **Signature Verification**

```typescript
// Webhook secret provided in dashboard
const signature = req.headers['x-designkit-signature']

const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')

if (signature !== expectedSignature) {
  throw new Error('Invalid signature')
}
```

---

## 📝 SDK Examples (Future)

### **JavaScript/TypeScript**

```typescript
import DesignKit from '@designkit/sdk'

const client = new DesignKit({
  apiKey: 'your_api_key'
})

// Remove background
const result = await client.tools.removeBackground({
  file: fs.readFileSync('image.jpg'),
  outputFormat: 'png'
})

console.log(result.url)
```

### **Python**

```python
from designkit import DesignKit

client = DesignKit(api_key='your_api_key')

# Upscale image
result = client.tools.upscale(
    file='image.jpg',
    scale=4,
    output_format='png'
)

print(result['url'])
```

---

## 🧪 Testing

### **Postman Collection**

Available at: https://designkit.com/api/postman

### **Test API Key**

```
Test Key: dk_test_1234567890abcdef
Rate Limit: 100/hour
Quota: 50 operations/day
```

---

## 📚 Code Examples

### **Check Quota Before Processing**

```typescript
// Frontend
async function processImage(file: File, tool: string) {
  // 1. Check quota
  const quotaCheck = await fetch('/api/tools/usage/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_name: tool })
  })
  
  const { allowed, usage } = await quotaCheck.json()
  
  if (!allowed) {
    showUpgradeModal(usage)
    return
  }
  
  // 2. Process
  const formData = new FormData()
  formData.append('file', file)
  
  const result = await fetch(`/api/tools/${tool}`, {
    method: 'POST',
    body: formData
  })
  
  return result.json()
}
```

---

### **Handle Quota Exceeded**

```typescript
async function handleToolRequest(req: NextRequest) {
  const userId = await getUserId(req)
  
  // Check quota
  const canUse = await checkQuota(userId, 'background-remover')
  
  if (!canUse.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'quota_exceeded',
          message: `Daily limit reached (${canUse.usage.limit}/${canUse.usage.limit})`,
          upgrade_available: true,
          reset_at: canUse.usage.reset_at
        }
      },
      { status: 403 }
    )
  }
  
  // Process tool...
  const result = await processBackgroundRemoval(file)
  
  // Increment quota
  await incrementQuota(userId, 'background-remover', {
    success: true,
    file_size_mb: file.size / 1024 / 1024,
    processing_time_ms: result.time
  })
  
  return NextResponse.json({ success: true, result })
}
```

---

## ✅ API Implementation Checklist

### Backend
- [ ] Authentication middleware
- [ ] Rate limiting middleware
- [ ] Quota checking system
- [ ] Usage tracking
- [ ] Error handling
- [ ] Webhook system (Pro)

### Documentation
- [ ] OpenAPI/Swagger spec
- [ ] Postman collection
- [ ] Code examples
- [ ] SDK documentation

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Error scenario testing

### Monitoring
- [ ] API logs
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Usage analytics

---

**Son Güncelleme:** 2025-01-17  
**Durum:** ✅ Ready for API Development
