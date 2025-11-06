# Quota Loading Issue - Debug

## Sorun
"API Quota" bölümü "Loading..." durumunda takılı kalıyor.

## Olası Nedenler

### 1. API Yanıt Vermiyor
- `/api/tools/check-quota` endpoint'i hata veriyor olabilir
- Yanıt çok yavaş geliyordur
- API timeout oluyor olabilir

### 2. useQuota Hook Sorunu
- `isLoading` state'i false olmuyor
- `fetchQuota` fonksiyonu tamamlanmıyor
- Dependency loop var

### 3. Supabase RLS Policy Sorunu
- Profile erişemiyor (RLS)
- Daily limits erişemiyor (RLS)

## Test Adımları

### Manuel API Testi:
Browser console'da şunu çalıştırın:
```javascript
fetch('/api/tools/check-quota')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Beklenen Yanıt**:
```json
{
  "canUse": true,
  "currentUsage": 0,
  "dailyLimit": 10,
  "remaining": 10,
  "plan": "free",
  "resetAt": "2025-11-07T00:00:00.000Z"
}
```

### Browser Console'da Bakılacak Hatalar:
1. Network tab'da `/api/tools/check-quota` isteğini görüyor musunuz?
2. Status code nedir? (200, 401, 403, 500?)
3. Response body nedir?
4. Console'da error var mı?

## Geçici Çözüm

UsageIndicator'ı realTimeUpdates=false ile kullanın:
```tsx
<UsageIndicator realTimeUpdates={false} />
```

## Kalıcı Çözüm

1. ✅ useQuota hook dependency loop düzeltildi
2. ⏳ API endpoint test edilmeli
3. ⏳ Supabase RLS policies kontrol edilmeli
4. ⏳ Error handling iyileştirilmeli

---

**Not**: Stripe ve Plausible anahtarları eksik olduğu için bazı özellikler çalışmayabilir ama quota check bunlardan bağımsız çalışmalı.
