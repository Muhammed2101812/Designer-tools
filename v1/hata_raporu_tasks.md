[ ] [HATA 1] - kritik — Sorumlu: Belirlenecek
Tanım: Stripe sunucu istemcisi geçersiz API sürümüyle başlatılıyor. `lib/stripe/server.ts` içindeki `apiVersion: '2025-09-30.clover'` ayarı, Stripe SDK başlatılırken veya herhangi bir API rotası (ör. `/api/stripe/create-checkout`) Stripe çağrısı yaptığında çalışma zamanı hatası (geçersiz/var olmayan sürüm) üretir.
Sebep: Kodda geçersiz API sürümü sabit kullanımı. Örnek: `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' })`.
Çözüm: 1) `apiVersion` alanını kaldırın ya da geçerli bir sürüme (ör. `'2023-10-16'`) güncelleyin; 2) `validateStripeConfig()` fonksiyonunu uygulama başlangıcında çağırarak zorunlu ortam değişkenlerini doğrulayın; 3) `.env` dosyasında Stripe anahtarlarını ve fiyat ID’lerini doğru ayarlayın; 4) Değişiklikten sonra build/test çalıştırın.
Test: 1) `npm run test -- app/api/__tests__/stripe/create-checkout.test.ts` geçmeli; 2) `npm run type-check` ve `npm run build` hatasız tamamlanmalı; 3) Checkout oturumu mock’larıyla oluşturulduğunda oturum ID ve URL bekleneni vermeli.

[ ] [HATA 2] - yüksek — Sorumlu: Belirlenecek
Tanım: İçerik Güvenlik Politikası (CSP) prod ortamda gereğinden geniş. `middleware.ts` ve `next.config.js` içinde `script-src` direktifinde `'unsafe-eval'` ve bazı durumlarda `'unsafe-inline'` izinleri bulunuyor; `connect-src` aşırı geniş kaynaklara açık. Bu, XSS ve script istismarı riskini artırır. Ek olarak `X-Frame-Options` farklı kaynaklarda farklı değerlerle ayarlanıyor.
Sebep: Geliştirme kolaylığı için esnek CSP kullanımı ve güvenlik başlıklarının iki farklı yerde (middleware ve next.config) çakışmalı yapılandırılması.
Çözüm: 1) Üretimde `'unsafe-eval'` ve mümkünse `'unsafe-inline'` kaldırın; 2) Gerekliyse nonce/hash tabanlı script yükleme kullanın (`next/script` ile nonce); 3) `connect-src` ve diğer direktifleri minimum gerekli kaynaklarla sınırlandırın; 4) `X-Frame-Options` ve `frame-ancestors` direktiflerini tek bir kaynaktan tutarlı olarak `'DENY'` şeklinde hizalayın; 5) Ortam bazlı (dev/prod) CSP ayrımı uygulayın.
Test: 1) `npm run test -- e2e/performance-security.spec.ts` ve `e2e/performance-security.e2e.ts` içinde CSP başlıkları doğrulanmalı; 2) Playwright ile sayfa yanıt başlıklarında `content-security-policy` beklenen direktifleri içermeli, inline/eval script kısıtlamaları görülmeli; 3) `x-frame-options` tekil ve `'DENY'` olmalı.

[ ] [HATA 3] - yüksek — Sorumlu: Belirlenecek
Tanım: ESM test dosyasında `require` kullanımı runtime hatası üretiyor. `app/api/__tests__/stripe/create-checkout.test.ts` satır 397 civarında `const { validateRequestBody } = require('@/lib/utils/apiSecurity')` kullanımı `ReferenceError: require is not defined` hatasına neden oluyor.
Sebep: Test dosyası ESM formatında iken CommonJS `require` kullanılmış; Vitest ESM modunda `require` mevcut değil.
Çözüm: 1) İlgili satırları `const { validateRequestBody } = await import('@/lib/utils/apiSecurity')` şeklinde dinamik ESM import ile değiştirin; 2) Aynı sorunu yaşayan diğer testlerde (ör. `rateLimit.test.ts`, `rateLimitBehavior.test.ts`, `auth/callback/route.test.ts`) `require` yerine `await import` veya statik `import` kullanın; 3) `vi.mocked(...)` çağrılarını ESM import ile uyumlu hale getirin.
Test: 1) `npm run test -- app/api/__tests__/stripe/create-checkout.test.ts` hatasız geçmeli; 2) Diğer testlerde `ReferenceError` tekrarlanmamalı; 3) Mock’lar doğru uygulanıp beklenen davranış sağlanmalı.

[ ] [HATA 4] - yüksek — Sorumlu: Belirlenecek
Tanım: Supabase `createClient()` mock’ı testlerde beklenen instance’ı döndürmüyor; route yeni bir client oluşturduğu için testler enjekte edilen hatayı tetikleyemiyor. Sonuçta “Failed to fetch user profile” beklenirken “Failed to create Stripe customer” dönebiliyor.
Sebep: `vi.mock('@/lib/supabase/server', ...)` içindeki `createClient` her çağrıda yeni obje döndürüyor; testte değiştirilen `mockSupabaseClient` yerine route farklı instance kullanıyor.
Çözüm: 1) `createClient` mock’unu tek bir `mockSupabaseClient` örneğini döndürecek şekilde ayarlayın: `vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabaseClient) }))`; 2) Spesifik senaryolarda `mockSupabaseClient.from.mockReturnValueOnce(...)` ile profil hatası veya veri kurgulayın; 3) Stripe müşteri oluşturma çağrısını bu hata senaryosunda tetiklemeyecek şekilde düzenleyin.
Test: 1) İlgili test case’lerinde beklenen hata mesajı (“Failed to fetch user profile”) dönmeli; 2) `npm run test -- app/api/__tests__/stripe/create-checkout.test.ts` tüm senaryolarda geçmeli; 3) Mock’ların çağrı sayıları ve parametreleri bekleneni sağlamalı.

[ ] [HATA 5] - yüksek — Sorumlu: Belirlenecek
Tanım: React hook’ları koşullu çağrılıyor. `lib/utils/responsive.ts` içindeki `useMediaQuery` SSR ortamında `typeof window === 'undefined'` kontrolüyle hook’lar çağrılmadan erken `return` ediyor, client’da ise hook’lar çağrılıyor. Bu durum `react-hooks/rules-of-hooks` lint hatasına ve SSR/CSR render sırası uyumsuzluğuna yol açabilir.
Sebep: Hook’ların koşullu/erken dönüşle çağrılması, React’in hook kurallarını ihlal eder.
Çözüm: 1) Erken `return` kaldırın ve hook’ları her zaman aynı sırada çağırın; 2) Başlangıç state’ini SSR için güvenli bir varsayılanla ayarlayın (ör. `false` veya `matchMedia` sonucu yalnızca `window` varsa hesaplanmalı); 3) `useEffect` içinde `if (typeof window === 'undefined') return;` guard’ı kullanarak dinleyici ekleme/temizleme yapın; 4) Medya sorgusu değişimini dinleyip state’i güncelleyin.
Test: 1) `npm run lint` sonrası `react-hooks/rules-of-hooks` hatası kalmamalı; 2) SSR sayfalarında hydration uyarıları çıkmamalı; 3) Farklı viewport’larda `useIsMobile/useIsTablet/useIsDesktop` beklenen sonuçları vermeli.

[ ] [HATA 6] - yüksek — Sorumlu: Belirlenecek
Tanım: `lib/utils/scriptLoading.tsx` içinde geçersiz ve tekrarlı importlar var: `import { crossOrigin } from '../../next.config'` satırları birden fazla kez kullanılmış ve `next.config.js` CommonJS olduğundan named export bulunmuyor. Derleme ve tip kontrol hatasına yol açabilir.
Sebep: Yanlış modül dışa aktarımları varsayılarak named import yapılması ve kopyalama kaynaklı tekrar importlar.
Çözüm: 1) Tüm `import { crossOrigin } from '../../next.config'` satırlarını kaldırın; 2) Dosyadaki gereksiz/tekrarlı importları temizleyin; 3) `next.config.js`’den veri gerekiyorsa CJS uyumlu import veya yapılandırma sabitlerini TypeScript tarafında ayrı bir module ile yönetin.
Test: 1) `npm run type-check` hatasız tamamlanmalı; 2) `npm run build` derlemesi başarısız olmamalı; 3) Script bileşenleri (Stripe/Sentry) sayfada beklendiği gibi render edilmeli.

[ ] [HATA 7] - yüksek — Sorumlu: Belirlenecek
Tanım: `inlineCriticalCSS` yanlış modül yolunu ve `require` kullanıyor. Fonksiyon, `require('./criticalCSS')` ile import yapıyor, ancak `getCriticalCSS` aslında `lib/utils/scriptOptimization.ts` dosyasında bulunuyor ve TSX/ESM bağlamında `require` uygun değil.
Sebep: Yanlış dosya yolu ve CommonJS `require`’ın ESM/TSX ortamında kullanımı.
Çözüm: 1) Üstte `import { getCriticalCSS } from './scriptOptimization'` ekleyin; 2) `inlineCriticalCSS` içinde `return getCriticalCSS()` kullanın; 3) Tüm `require` kullanımlarını ESM `import` ile değiştirin.
Test: 1) `npm run build` ve `npm run start` sırasında kritik CSS inlining hatasız çalışmalı; 2) `app/layout.tsx` içindeki kritik CSS kullanımında hata olmamalı; 3) Performans testlerinde kritik stil yüklemesi gözlemlenmeli.

[ ] [HATA 8] - yüksek — Sorumlu: Belirlenecek
Tanım: `lib/utils/scriptLoading.tsx` içinde `import { type } from 'os'` satırları tekrarlı ve geçersiz. `os` modülünde `type` şeklinde named export yoktur; bu import derleme hatasına neden olur.
Sebep: TS type-only import yanlış kullanımı ve yanlış isimli export varsayımı.
Çözüm: 1) Tüm `import { type } from 'os'` satırlarını kaldırın; 2) Gerçekten tip import edilecekse `import type { <GerçekTip> } from 'os'` şeklinde doğru isimle ve tekil kullanın; 3) Dosyayı tekrar derleyerek hataları kontrol edin.
Test: 1) `npm run type-check` ve `npm run build` hatasız geçmeli; 2) Script bileşenleri normal şekilde çalışmalı.

[ ] [HATA 9] - orta — Sorumlu: Belirlenecek
Tanım: `lib/utils/reactOptimizations.ts` içinde `useEffect` ve memo hook’larında eksik/uygunsuz bağımlılık dizileri var. Linter uyarıları (`react-hooks/exhaustive-deps`) görülüyor ve beklenmedik yeniden hesaplamalara yol açabilir.
Sebep: Hook bağımlılıklarının tam tanımlanmaması veya her render’da çalıştırma niyetiyle bırakılması.
Çözüm: 1) `useEffect/useMemo/useCallback` için gerekli bağımlılıkları eksiksiz ekleyin; 2) Eğer bilinçli olarak her render’da çalıştırılacaksa ilgili satırda kuralı yorumla devre dışı bırakın ve sebebini açıklayan kısa not ekleyin; 3) Ölçüm hook’larında (performans uyarıları) yeniden hesaplama eşiği ve sayacı mantığını gözden geçirin.
Test: 1) `npm run lint` sonrası uyarılar azalmalı veya gerekçeli ignore ile tutarlı olmalı; 2) Performans log’ları beklenen aralıklarda tetiklenmeli; 3) Render davranışı stabilize olmalı.

[ ] [HATA 10] - düşük — Sorumlu: Belirlenecek
Tanım: Tarayıcı ortamında `NodeJS.Timeout` tipi kullanımı tip uyuşmazlığına neden olabilir. `lib/utils/reactOptimizations.ts` içindeki `useDebouncedCallback` ve `useThrottledCallback` birimleri tarayıcıda `setTimeout` dönüş tipini `number` kabul ederken Node tipini kullanıyor.
Sebep: Ambient tip farkı (Node vs tarayıcı) nedeniyle TS type-check uyarısı/hatası.
Çözüm: 1) `const timeoutRef = useRef<ReturnType<typeof setTimeout>>()` biçiminde tip tanımlayın; 2) Alternatif olarak `number | NodeJS.Timeout` birleşim tipi kullanın; 3) İlgili tüm yerlerde aynı düzeltmeyi uygulayın.
Test: 1) `npm run type-check` hatasız geçmeli; 2) Debounce/throttle davranışları etkilemeden çalışmalı; 3) Tarayıcıda runtime hatası olmamalı.

[ ] [HATA 11] - orta — Sorumlu: Belirlenecek
Tanım: Ortam değişkenleri erken doğrulanmıyor; eksik Stripe/Supabase konfigürasyonu geç aşamada çalışma zamanı hatası üretebilir. `validateStripeConfig` mevcut ancak merkezi başlangıç noktalarında çağrılmıyor.
Sebep: Konfigürasyon doğrulamasının uygulama başlangıcında çalıştırılmaması.
Çözüm: 1) `instrumentation.ts` veya uygulama girişinde `validateStripeConfig()` çağrısını ekleyin; 2) `lib/env.ts`’te Zod şeması ile tüm kritik env değerlerini zorunlu kılın; 3) CI/CD’de `npm run check-env` aşaması ekleyin.
Test: 1) Eksik env ile `npm run build` veya `npm run check-env` erken hataya düşmeli; 2) Tam konfigürasyon ile build ve testler geçmeli.

[ ] [HATA 12] - orta — Sorumlu: Belirlenecek
Tanım: Güvenlik başlıklarında çakışma mevcut. `next.config.js` `X-Frame-Options: SAMEORIGIN` ayarlarken `middleware.ts` `X-Frame-Options: DENY` ayarlıyor. Bu durum, hangi başlığın etkili olduğuna bağlı olarak beklenmeyen davranış veya tutarsızlık oluşturabilir.
Sebep: Güvenlik başlıklarının iki farklı yerde farklı değerlerle tanımlanması.
Çözüm: 1) Tek bir otorite belirleyin (tercihen middleware) ve `X-Frame-Options` değerini `'DENY'` olarak sabitleyin; 2) `next.config.js` içindeki başlığı kaldırın veya middleware ile uyumlu hale getirin; 3) CSP `frame-ancestors 'none'` ile tutarlılığı sağlayın.
Test: 1) Playwright testlerinde yanıt başlıkları incelendiğinde `x-frame-options` tek ve `'DENY'` olmalı; 2) E2E güvenlik testleri çerçeveleme girişimlerini engellemeli; 3) Header çakışması görülmemeli.

