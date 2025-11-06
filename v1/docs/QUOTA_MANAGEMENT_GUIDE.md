# 📊 Kota Yönetimi Rehberi

## Kota Sistemi Nasıl Çalışır?

### Temel Prensipler

1. **Günlük Sıfırlama**: Tüm kotalar her gün gece yarısı UTC saatinde sıfırlanır
2. **Plan Bazlı Limitler**: Her plan farklı günlük API işlem limiti sunar
3. **Gerçek Zamanlı Takip**: Kullanımınız anlık olarak güncellenir
4. **Adil Kullanım**: Rate limiting ile sistem kaynaklarını koruruz

### Kota Türleri

#### API İşlem Kotası
- **Free**: 10 işlem/gün
- **Premium**: 500 işlem/gün  
- **Pro**: 2000 işlem/gün

**API İşlemi Sayılan Araçlar:**
- Background Remover
- Image Upscaler
- Mockup Generator (template kullanımı)
- Image Compressor (gelişmiş sıkıştırma)

#### Client-Side Araçlar (Kota Dışı)
- Color Picker
- Image Cropper
- Image Resizer
- Format Converter
- QR Generator
- Gradient Generator

### Kota Takibi

#### Dashboard'da Görüntüleme

1. **Ana Kota Kartı**
   - Günlük kullanım: "8/10 kullanıldı"
   - Kalan işlem: "2 kalan"
   - Progress bar ile görsel gösterim
   - Sıfırlanma zamanı: "Gece yarısı"

2. **Renk Kodlaması**
   - 🟢 Yeşil: %50'den fazla kota kaldı
   - 🟡 Sarı: %20-50 arası kota kaldı
   - 🔴 Kırmızı: %20'den az kota kaldı

3. **Kullanım Grafiği**
   - Son 7 günün kullanım trendi
   - Günlük bazda detay
   - En çok kullanılan araçlar

#### Tool Sayfalarında Takip

Her API aracının sayfasında:
- Üst kısımda kota göstergesi
- Gerçek zamanlı güncelleme
- Kota aşımında uyarı mesajı

## Kota Yönetimi Stratejileri

### Verimli Kullanım İpuçları

1. **Batch İşleme Kullanın**
   - Premium: 10 dosyayı birlikte işleyin
   - Pro: 50 dosyayı birlikte işleyin
   - Tek seferde daha fazla iş yapın

2. **Dosya Boyutunu Optimize Edin**
   - Gereksiz yüksek çözünürlük kullanmayın
   - Uygun format seçin (WEBP daha küçük)
   - Sıkıştırma öncesi boyutu kontrol edin

3. **Zamanlamayı Planlayın**
   - Yoğun işleri gece yarısından sonra yapın
   - Hafta sonu daha az yoğunluk olur
   - Acil olmayan işleri erteleyin

### Kota Aşımı Durumunda

#### Anlık Çözümler

1. **Client-Side Araçları Kullanın**
   - Kota gerektirmeyen araçlara geçin
   - Temel düzenlemeler için yeterli
   - Sınırsız kullanım

2. **Ertesi Güne Bekleyin**
   - Gece yarısı UTC'de kota sıfırlanır
   - Türkiye saati: 03:00
   - Otomatik bildirim alırsınız

3. **Plan Yükseltmesi**
   - Anında daha yüksek kota
   - Orantılı faturalama
   - Hemen kullanıma hazır

#### Uzun Vadeli Çözümler

1. **Plan Değerlendirmesi**
   - Son 30 günün kullanım ortalaması
   - Gelecek projeler için tahmin
   - Maliyet-fayda analizi

2. **İş Akışı Optimizasyonu**
   - Hangi araçları ne sıklıkla kullandığınız
   - Alternatif yöntemler
   - Batch işleme fırsatları

## Kota Uyarıları ve Bildirimler

### Otomatik Uyarılar

#### %80 Kota Uyarısı
- Dashboard'da sarı uyarı kartı
- E-posta bildirimi (tercihe bağlı)
- Upgrade önerisi

#### %90 Kota Uyarısı  
- Dashboard'da turuncu uyarı kartı
- Acil e-posta bildirimi
- Plan yükseltme linki

#### %100 Kota Aşımı
- Kırmızı uyarı mesajı
- İşlem butonları devre dışı
- Upgrade dialog'u açılır

### Bildirim Ayarları

#### E-posta Tercihleri
- Kota uyarıları: Açık/Kapalı
- Günlük özet: Açık/Kapalı
- Haftalık rapor: Açık/Kapalı

#### Bildirim Zamanlaması
- Anlık: İşlem sırasında
- Günlük: Akşam 18:00'da özet
- Haftalık: Pazartesi sabahı rapor

## Kota İstatistikleri

### Dashboard Metrikleri

#### Günlük Kullanım
- Bugün kullanılan işlem sayısı
- Kalan işlem sayısı
- Kullanım yüzdesi
- Sıfırlanma zamanı

#### Haftalık Trend
- Son 7 günün grafiği
- Ortalama günlük kullanım
- En yoğun günler
- Trend analizi

#### Aylık Özet
- Toplam işlem sayısı
- En çok kullanılan araçlar
- Başarı oranı
- Ortalama işlem süresi

### Detaylı Raporlar

#### Araç Bazlı Kullanım
- Background Remover: X işlem
- Image Upscaler: Y işlem
- Mockup Generator: Z işlem
- Başarı/hata oranları

#### Zaman Bazlı Analiz
- Saatlik dağılım
- Günlük dağılım
- Haftalık pattern
- Mevsimsel trendler

## Kota Optimizasyonu

### Teknik İpuçlar

#### Dosya Hazırlığı
1. **Boyut Optimizasyonu**
   - Gereksiz yüksek çözünürlük kullanmayın
   - Crop işlemini önce yapın
   - Format dönüşümünü son adım yapın

2. **Kalite Ayarları**
   - Background Remover: Orta kalite genelde yeterli
   - Upscaler: 4x genelde optimal
   - Compressor: %80 kalite önerilen

#### Batch İşleme Stratejileri
1. **Dosya Gruplandırma**
   - Benzer boyutları birlikte işleyin
   - Aynı ayarları kullanacakları gruplandırın
   - Öncelik sırasına göre organize edin

2. **Zamanlama**
   - Büyük batch'leri gece yapın
   - Acil işleri tek tek yapın
   - Test işlemlerini az dosya ile yapın

### İş Akışı Önerileri

#### Tasarım Projesi Planlaması
1. **Proje Başında**
   - Toplam işlem ihtiyacını hesaplayın
   - Plan yeterliliğini kontrol edin
   - Alternatif yöntemleri değerlendirin

2. **Proje Sırasında**
   - Günlük kullanımı takip edin
   - Kritik işlemleri önceliklendirin
   - Yedek planları hazır tutun

3. **Proje Sonunda**
   - Kullanım raporunu inceleyin
   - Gelecek projeler için not alın
   - Plan ihtiyacını yeniden değerlendirin

## Sorun Giderme

### Yaygın Kota Sorunları

#### "Kota Aşıldı" Hatası
**Belirtiler:**
- İşlem butonları gri/devre dışı
- "Daily quota exceeded" mesajı
- Upgrade dialog'u açılır

**Çözümler:**
1. Kota sıfırlanmasını bekleyin (gece yarısı UTC)
2. Client-side araçları kullanın
3. Planınızı yükseltin
4. Ertesi gün için planlayın

#### Kota Sayacı Yanlış Gösteriyor
**Belirtiler:**
- Dashboard'da yanlış sayı
- İşlem yapıldı ama sayaç artmadı
- Sıfırlama zamanı geçti ama sıfırlanmadı

**Çözümler:**
1. Sayfayı yenileyin (F5)
2. Browser cache'ini temizleyin
3. Farklı browser'da kontrol edin
4. Destek ekibine bildirin

#### E-posta Bildirimleri Gelmiyor
**Belirtiler:**
- Kota uyarısı e-postası yok
- Günlük özet gelmiyor
- Spam klasöründe de yok

**Çözümler:**
1. Profile ayarlarından e-posta tercihlerini kontrol edin
2. E-posta adresinizi doğrulayın
3. Spam/junk klasörünü kontrol edin
4. E-posta sağlayıcınızın filtrelerini kontrol edin

### Performans Sorunları

#### Yavaş İşlem Süreleri
**Nedenler:**
- Büyük dosya boyutu
- Yoğun saatler
- Ağ bağlantısı sorunları

**Çözümler:**
- Dosya boyutunu küçültün
- Farklı saatlerde deneyin
- Bağlantı hızınızı kontrol edin

#### İşlem Başarısız Oluyor
**Nedenler:**
- Desteklenmeyen format
- Bozuk dosya
- Sunucu yoğunluğu

**Çözümler:**
- Dosya formatını kontrol edin
- Farklı dosya deneyin
- Birkaç dakika sonra tekrar deneyin

## Destek ve İletişim

### Kota ile İlgili Sorular
- **E-posta**: quota@designerkit.com
- **Konu**: "Kota Sorunu - [Kullanıcı ID]"
- **Bilgiler**: Mevcut plan, hata mesajı, ekran görüntüsü

### Acil Durum Desteği
- **Premium/Pro Kullanıcılar**: Öncelikli destek
- **Yanıt Süresi**: 4-24 saat
- **Çözüm Süresi**: 1-3 iş günü

### Topluluk Desteği
- **Discord**: [#kota-sorulari kanalı](https://discord.gg/designerkit)
- **Forum**: [community.designerkit.com](https://community.designerkit.com)
- **FAQ**: Bu dokümandaki sık sorulan sorular

---

**Son Güncelleme**: 2024-10-24  
**Versiyon**: 1.0