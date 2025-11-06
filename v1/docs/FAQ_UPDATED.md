# ❓ Sık Sorulan Sorular (FAQ)

## 🚀 Genel Sorular

### Platform Hakkında

**S: Design Kit nedir?**
C: Design Kit, tarayıcı tabanlı görüntü işleme ve tasarım araçları sunan bir SaaS platformudur. Hem client-side (tarayıcıda çalışan) hem de API-powered (sunucu tabanlı) araçlar içerir.

**S: Hangi araçlar mevcut?**
C: 
- **Client-side**: Color Picker, Image Cropper, Image Resizer, Format Converter, QR Generator, Gradient Generator
- **API-powered**: Background Remover, Image Upscaler, Mockup Generator, Image Compressor

**S: Verilerim güvenli mi?**
C: Evet. Client-side araçlar dosyalarınızı hiç sunucuya yüklemez, tamamen tarayıcınızda işler. API araçları için dosyalar işlendikten hemen sonra silinir.

**S: Hangi dosya formatları destekleniyor?**
C: PNG, JPG, JPEG, WEBP formatları desteklenir. SVG desteği yakında eklenecek.

**S: Mobil cihazlarda çalışır mı?**
C: Evet, tüm araçlar responsive tasarıma sahip ve mobil cihazlarda çalışır. En iyi deneyim için tablet veya masaüstü önerilir.

### Hesap ve Kayıt

**S: Hesap oluşturmak ücretsiz mi?**
C: Evet, hesap oluşturmak tamamen ücretsizdir ve Free plan ile 10 günlük API işlemi hakkınız vardır.

**S: E-posta doğrulaması gerekli mi?**
C: Evet, hesap güvenliği için e-posta doğrulaması zorunludur.

**S: Sosyal medya ile giriş yapabilir miyim?**
C: Evet, Google ve GitHub ile giriş yapabilirsiniz.

**S: Şifremi unuttum, ne yapmalıyım?**
C: Login sayfasında "Şifremi Unuttum" linkine tıklayın, e-postanıza sıfırlama linki gelecektir.

**S: Hesabımı silebilir miyim?**
C: Evet, profile ayarlarından hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.

## 💰 Fiyatlandırma ve Planlar

### Plan Seçimi

**S: Hangi planı seçmeliyim?**
C: 
- **Free**: Hobi kullanımı, günde 10 API işlemi yeterli
- **Premium**: Freelancer'lar, günde 500 işlem
- **Pro**: Ajanslar ve ekipler, günde 2000 işlem + API erişimi

**S: Plan değişikliği nasıl yapılır?**
C: Dashboard'dan "Planı Yükselt" veya "Aboneliği Yönet" butonlarını kullanarak istediğiniz zaman plan değiştirebilirsiniz.

**S: Planımı düşürebilir miyim?**
C: Evet, ancak düşürme işlemi mevcut fatura döneminin sonunda geçerli olur.

**S: İptal ettiğimde ne olur?**
C: Mevcut dönem sonuna kadar premium özelliklerinizi kullanmaya devam edersiniz, sonra Free plana geçersiniz.

### Faturalama

**S: Ne zaman ücretlendirilirim?**
C: İlk abonelik tarihinden itibaren her ay aynı tarihte otomatik olarak ücretlendirilirsiniz.

**S: Hangi ödeme yöntemleri kabul edilir?**
C: Kredi kartı, banka kartı (Stripe üzerinden). PayPal ve diğer yöntemler yakında eklenecek.

**S: Fatura alabilir miyim?**
C: Evet, her ödeme sonrası e-posta ile fatura gönderilir. Customer Portal'dan geçmiş faturaları görüntüleyebilirsiniz.

**S: Para iade politikanız nedir?**
C: İlk 30 gün içinde koşulsuz para iadesi. Kullanım miktarına bakılmaz.

**S: Vergi dahil mi?**
C: Hayır, vergiler bulunduğunuz ülkeye göre ayrıca hesaplanır.

## 📊 Kota ve Kullanım

### Kota Sistemi

**S: Kota nasıl çalışır?**
C: API araçları günlük kotanızdan düşer. Client-side araçlar kota kullanmaz. Kotalar her gün gece yarısı UTC'de sıfırlanır.

**S: Kotam ne zaman sıfırlanır?**
C: Her gün gece yarısı UTC saatinde (Türkiye saati 03:00).

**S: Kullanmadığım kotalar birikiyor mu?**
C: Hayır, günlük kotalar birikmiyor. Her gün sıfırlanır.

**S: Kotam bitti, ne yapabilirim?**
C: 
1. Ertesi güne kadar bekleyebilirsiniz
2. Client-side araçları kullanabilirsiniz
3. Planınızı yükseltebilirsiniz

### Kullanım Takibi

**S: Kullanımımı nasıl takip edebilirim?**
C: Dashboard'da günlük kullanımınızı, kalan kotanızı ve son 7 günün grafiğini görebilirsiniz.

**S: Hangi araçlar kota kullanır?**
C: Background Remover, Image Upscaler, Mockup Generator ve Image Compressor kota kullanır.

**S: Batch işleme kota nasıl etkiler?**
C: Her dosya ayrı ayrı kotadan düşer. 10 dosyalık batch işleme = 10 kota.

## 🛠️ Araçlar ve Özellikler

### Background Remover

**S: Hangi tür görsellerde en iyi çalışır?**
C: Yüksek kontrastlı, tek kişi/obje içeren, net arka plan sınırları olan görsellerde en iyi sonucu verir.

**S: Maksimum dosya boyutu nedir?**
C: Free: 10MB, Premium: 50MB, Pro: 100MB

**S: Sonuç her zaman mükemmel mi?**
C: AI tabanlı olduğu için %95+ başarı oranı vardır, ancak karmaşık arka planlar zor olabilir.

### Image Upscaler

**S: Hangi upscale faktörleri mevcut?**
C: 2x, 4x ve 8x seçenekleri mevcuttur. 4x genelde optimal sonuç verir.

**S: İşlem süresi ne kadar?**
C: Dosya boyutu ve upscale faktörüne göre 30 saniye - 3 dakika arası.

**S: Hangi tür görseller için uygun?**
C: Fotoğraflar, illüstrasyonlar, logolar için uygundur. Çok düşük kaliteli görsellerde sınırlı iyileştirme sağlar.

### Mockup Generator

**S: Kaç tane template var?**
C: 15+ template (5 device, 5 print, 5 apparel) ve sürekli yenileri ekleniyor.

**S: Kendi template'imi ekleyebilir miyim?**
C: Şu anda hayır, ancak önerilerinizi feedback@designerkit.com'a gönderebilirsiniz.

**S: Hangi tasarım formatları en iyi çalışır?**
C: Şeffaf arka planlı PNG dosyalar en iyi sonucu verir.

### Client-Side Araçlar

**S: İnternet bağlantısı olmadan çalışır mı?**
C: İlk yükleme sonrası client-side araçlar offline çalışabilir.

**S: Dosyalarım sunucuya gönderiliyor mu?**
C: Hayır, client-side araçlar tamamen tarayıcınızda çalışır, hiçbir dosya sunucuya gönderilmez.

## 🔧 Teknik Sorular

### Sistem Gereksinimleri

**S: Hangi tarayıcılar destekleniyor?**
C: Chrome, Firefox, Safari, Edge'in güncel sürümleri. Chrome en iyi performansı verir.

**S: Minimum sistem gereksinimleri nedir?**
C: 4GB RAM, modern tarayıcı, stabil internet bağlantısı. Büyük dosyalar için 8GB+ RAM önerilir.

**S: Neden Chrome öneriliyor?**
C: Canvas API ve WebGL desteği en iyi Chrome'da çalışır, işlem süreleri daha hızlıdır.

### Performans

**S: Araçlar neden yavaş çalışıyor?**
C: Büyük dosya boyutu, eski tarayıcı, düşük RAM veya yavaş internet bağlantısı nedeniyle olabilir.

**S: İşlem sırasında tarayıcım donuyor**
C: Çok büyük dosyalar RAM'i doldurabilir. Dosya boyutunu küçültmeyi deneyin.

**S: Sonuç indirme neden uzun sürüyor?**
C: Büyük dosyalar indirme süresini artırır. Sıkıştırma seçeneklerini kullanabilirsiniz.

### Güvenlik

**S: Dosyalarım ne kadar süre saklanıyor?**
C: API araçları için dosyalar işlem sonrası hemen silinir. Client-side araçlarda hiç sunucuya gitmez.

**S: Hesap güvenliği nasıl sağlanıyor?**
C: Şifreler hash'lenir, HTTPS kullanılır, session token'ları düzenli yenilenir.

**S: İki faktörlü doğrulama var mı?**
C: Yakında eklenecek. Şimdilik güçlü şifre kullanmanızı öneriyoruz.

## 🚨 Sorun Giderme

### Yaygın Hatalar

**S: "Upload failed" hatası alıyorum**
C: 
1. İnternet bağlantınızı kontrol edin
2. Dosya boyutunu kontrol edin
3. Desteklenen format olduğundan emin olun
4. Tarayıcı cache'ini temizleyin

**S: "Processing failed" hatası**
C:
1. Farklı bir dosya deneyin
2. Dosya bozuk olabilir
3. Birkaç dakika sonra tekrar deneyin
4. Destek ekibine bildirin

**S: Sonuç indiremiyor**
C:
1. Pop-up blocker'ı kapatın
2. Farklı tarayıcı deneyin
3. İndirme klasörü izinlerini kontrol edin

### Hesap Sorunları

**S: Giriş yapamıyorum**
C:
1. Şifrenizi sıfırlayın
2. E-posta doğrulaması yapıldığından emin olun
3. Farklı tarayıcı deneyin
4. Caps Lock kapalı olduğundan emin olun

**S: E-posta doğrulama linki çalışmıyor**
C:
1. Spam klasörünü kontrol edin
2. Linkin süresi dolmuş olabilir, yeni talep edin
3. E-posta adresinizi doğru yazdığınızdan emin olun

**S: Dashboard yüklenmiyor**
C:
1. Sayfayı yenileyin (F5)
2. Cache'i temizleyin
3. Ad blocker'ı kapatın
4. Farklı tarayıcı deneyin

## 📞 Destek ve İletişim

### Destek Kanalları

**S: Nasıl destek alabilirim?**
C:
- **E-posta**: support@designerkit.com
- **Discord**: [Topluluk Kanalı](https://discord.gg/designerkit)
- **Twitter**: [@DesignerKit](https://twitter.com/designerkit)

**S: Yanıt süresi ne kadar?**
C:
- **Free**: 48-72 saat (topluluk desteği)
- **Premium**: 24 saat içinde
- **Pro**: 4 saat içinde (öncelikli)

**S: Hangi bilgileri paylaşmalıyım?**
C:
- Hata mesajının tam metni
- Kullandığınız tarayıcı ve sürümü
- İşletim sistemi
- Ekran görüntüsü (varsa)
- Kullanıcı ID'niz (dashboard'da bulunur)

### Özellik Talepleri

**S: Yeni araç önerebilir miyim?**
C: Evet! feedback@designerkit.com adresine önerilerinizi gönderin. Popüler talepler öncelikle geliştirilir.

**S: API dokümantasyonu nerede?**
C: Pro plan kullanıcıları için dashboard'da API dokümantasyonu ve anahtarları bulunur.

**S: Roadmap'i görebilir miyim?**
C: [roadmap.designerkit.com](https://roadmap.designerkit.com) adresinde gelecek özellikler ve zaman çizelgesi bulunur.

## 🔄 Güncellemeler

### Platform Güncellemeleri

**S: Ne sıklıkla güncelleme yapılıyor?**
C: Haftalık küçük iyileştirmeler, aylık yeni özellikler eklenir.

**S: Güncellemeler nasıl duyurulur?**
C: E-posta, Discord, Twitter ve platform içi bildirimler ile duyurulur.

**S: Beta özelliklerini test edebilir miyim?**
C: Pro kullanıcılar beta programına katılabilir. Beta erişimi için destek ekibine yazın.

### Versiyon Geçmişi

**S: Değişiklik logları nerede?**
C: [changelog.designerkit.com](https://changelog.designerkit.com) adresinde tüm güncellemeler listelenir.

**S: Eski versiyona dönebilir miyim?**
C: Hayır, platform sürekli güncellenir. Sorun yaşıyorsanız destek ekibine bildirin.

---

**Son Güncelleme**: 2024-10-24  
**Versiyon**: 2.0  
**Toplam Soru Sayısı**: 80+

**Bulamadığınız bir soru mu var?**  
📧 faq@designerkit.com adresine yazın, 24 saat içinde ekleyelim!