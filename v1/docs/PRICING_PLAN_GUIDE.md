# 💰 Pricing ve Plan Değişikliği Rehberi

## Plan Seçenekleri

### Free Plan - $0/ay
- **Günlük API İşlemleri**: 10
- **Maksimum Dosya Boyutu**: 10MB
- **Erişilebilir Araçlar**: Tüm client-side araçlar + sınırlı API araçları
- **Batch İşleme**: Yok
- **Destek**: Topluluk desteği
- **API Erişimi**: Yok

**Kimler İçin Uygun:**
- Hobi amaçlı kullanıcılar
- Ara sıra tasarım ihtiyacı olanlar
- Ürünü test etmek isteyenler

### Premium Plan - $9/ay
- **Günlük API İşlemleri**: 500
- **Maksimum Dosya Boyutu**: 50MB
- **Erişilebilir Araçlar**: Tüm araçlar
- **Batch İşleme**: 10 dosyaya kadar
- **Destek**: E-posta desteği (24 saat içinde yanıt)
- **API Erişimi**: Yok

**Kimler İçin Uygun:**
- Freelance tasarımcılar
- Küçük işletmeler
- Düzenli tasarım ihtiyacı olanlar

### Pro Plan - $29/ay
- **Günlük API İşlemleri**: 2000
- **Maksimum Dosya Boyutu**: 100MB
- **Erişilebilir Araçlar**: Tüm araçlar
- **Batch İşleme**: 50 dosyaya kadar
- **Destek**: Öncelikli destek (4 saat içinde yanıt)
- **API Erişimi**: REST API erişimi

**Kimler İçin Uygun:**
- Tasarım ajansları
- Büyük ekipler
- Yoğun kullanım gerektiren projeler
- API entegrasyonu isteyenler

## Plan Değişikliği Süreci

### Ücretsiz'den Premium/Pro'ya Geçiş

1. **Dashboard'a Giriş**
   - [Dashboard](/dashboard) sayfasına gidin
   - Plan kartınızda "Planı Yükselt" butonuna tıklayın

2. **Plan Seçimi**
   - [Pricing](/pricing) sayfasında istediğiniz planı seçin
   - "Premium'a Geç" veya "Pro'ya Geç" butonuna tıklayın

3. **Ödeme İşlemi**
   - Stripe Checkout sayfasına yönlendirileceksiniz
   - Kredi kartı bilgilerinizi girin
   - Ödemeyi onaylayın

4. **Aktivasyon**
   - Ödeme başarılı olduktan sonra planınız anında aktif olur
   - Dashboard'da yeni kotanızı görebilirsiniz
   - Onay e-postası alacaksınız

### Plan Yükseltme (Premium'dan Pro'ya)

1. **Mevcut Aboneliği Yönet**
   - Dashboard'da "Aboneliği Yönet" butonuna tıklayın
   - Stripe Customer Portal'a yönlendirileceksiniz

2. **Plan Değişikliği**
   - "Update subscription" seçeneğini seçin
   - Pro planını seçin ve onaylayın

3. **Faturalama**
   - Fark tutarı orantılı olarak hesaplanır
   - Yeni plan anında aktif olur

### Plan Düşürme

1. **Customer Portal Erişimi**
   - Dashboard'dan "Aboneliği Yönet" butonuna tıklayın

2. **Plan Değişikliği**
   - Daha düşük bir plan seçin
   - Değişikliği onaylayın

3. **Geçiş Süreci**
   - Düşürme işlemi mevcut fatura döneminin sonunda geçerli olur
   - O zamana kadar mevcut planınızın özelliklerini kullanmaya devam edersiniz
   - Geçiş tarihinden önce bilgilendirme e-postası alırsınız

### Abonelik İptali

1. **İptal İşlemi**
   - Customer Portal'dan "Cancel subscription" seçeneğini seçin
   - İptal nedenini belirtin (isteğe bağlı)
   - İptali onaylayın

2. **Geçiş Süreci**
   - Abonelik mevcut dönem sonunda iptal olur
   - O zamana kadar premium özelliklerinizi kullanabilirsiniz
   - İptal tarihinden sonra Free plana geçersiniz

## Faturalama Detayları

### Fatura Dönemleri
- **Aylık**: Her ay aynı tarihte yenilenir
- **Yıllık**: Yakında eklenecek (%20 indirim ile)

### Ödeme Yöntemleri
- Kredi kartı (Visa, Mastercard, American Express)
- Banka kartı
- Yakında: PayPal, Apple Pay, Google Pay

### Fatura Bilgileri
- Faturalar e-posta ile gönderilir
- Customer Portal'dan geçmiş faturaları görüntüleyebilirsiniz
- PDF olarak indirebilirsiniz

### Para İade Politikası
- **30 gün para iade garantisi**
- İlk 30 gün içinde tam iade
- Kullanım miktarına bakılmaksızın
- İade işlemi 5-10 iş günü sürer

## Sık Sorulan Sorular

### Faturalama Hakkında

**S: Planımı ne zaman değiştirebilirim?**
C: İstediğiniz zaman. Yükseltmeler anında, düşürmeler dönem sonunda geçerli olur.

**S: Kullanmadığım günler için ücret alınır mı?**
C: Evet, abonelik aylık sabit ücrettir. Kullanım miktarına göre değişmez.

**S: Fatura tarihimi değiştirebilir miyim?**
C: Hayır, fatura tarihi ilk abonelik tarihine göre belirlenir.

**S: Vergi dahil mi?**
C: Hayır, vergiler ayrıca hesaplanır ve bulunduğunuz ülkeye göre değişir.

### Plan Özellikleri

**S: Free plan ile hangi araçları kullanabilirim?**
C: Tüm client-side araçları sınırsız, API araçlarını günde 10 kez kullanabilirsiniz.

**S: Pro plan API erişimi nasıl çalışır?**
C: REST API dokümantasyonu ve API anahtarınız dashboard'da bulunur.

**S: Batch işleme nedir?**
C: Birden fazla dosyayı aynı anda işleme alabilme özelliğidir.

### Teknik Sorular

**S: Plan değişikliği kotamı etkiler mi?**
C: Evet, yeni kotanız anında aktif olur. Günlük sıfırlama saati değişmez.

**S: Downgrade sonrası verilerim silinir mi?**
C: Hayır, hiçbir veri silinmez. Sadece yeni plan limitleri geçerli olur.

**S: Abonelik iptal edersem ne olur?**
C: Free plan özelliklerine geçersiniz. Verileriniz korunur.

## Destek ve İletişim

### Faturalama Sorunları
- **E-posta**: billing@designerkit.com
- **Yanıt Süresi**: 24 saat içinde

### Plan Önerileri
- **E-posta**: sales@designerkit.com
- **Canlı Chat**: Yakında eklenecek

### Teknik Destek
- **E-posta**: support@designerkit.com
- **Discord**: [Topluluk Kanalı](https://discord.gg/designerkit)

---

**Son Güncelleme**: 2024-10-24  
**Versiyon**: 1.0