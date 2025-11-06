# 👤 User Documentation

Design Kit kullanıcı dokümantasyonuna hoş geldiniz! Bu rehber, platformu etkili bir şekilde kullanmanız için ihtiyacınız olan tüm bilgileri içerir.

## 📋 İçindekiler

1. [Hızlı Başlangıç](#hızlı-başlangıç)
2. [Hesap Yönetimi](#hesap-yönetimi)
3. [Araç Kullanım Rehberi](#araç-kullanım-rehberi)
4. [Abonelik ve Faturalama](#abonelik-ve-faturalama)
5. [Sorun Giderme](#sorun-giderme)
6. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## 📚 Detaylı Rehberler

Daha kapsamlı bilgi için özel rehberlerimizi inceleyin:

- **[📊 Kota Yönetimi Rehberi](./QUOTA_MANAGEMENT_GUIDE.md)** - Kotanızı etkili kullanma stratejileri
- **[💰 Pricing ve Plan Rehberi](./PRICING_PLAN_GUIDE.md)** - Plan seçimi ve değişiklik süreçleri  
- **[🔧 Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Detaylı sorun giderme rehberi
- **[❓ Güncellenmiş FAQ](./FAQ_UPDATED.md)** - 80+ soru ve yanıt

---

## 🚀 Hızlı Başlangıç

### Creating an Account

1. Navigate to the [Sign Up](/signup) page
2. Enter your email address and password (min 8 characters)
3. Click "Create Account"
4. Check your email for verification link
5. Click verification link to activate account
6. Sign in with your credentials

### Signing In

1. Go to the [Login](/login) page
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to your dashboard

### Forgot Password

1. On the login page, click "Forgot Password"
2. Enter your email address
3. Check your inbox for reset link
4. Follow instructions to set new password

---

## 👤 Hesap Yönetimi

### Profile Settings

Access your profile settings from the dashboard:

- **Full Name**: Update your display name
- **Email**: Change your email (requires verification)
- **Avatar**: Upload or change profile picture
- **Password**: Update your password

### Email Preferences

Control which emails you receive:

- **Marketing Emails**: Product updates and promotions
- **Quota Warnings**: Notifications when approaching limits
- **Subscription Updates**: Billing and plan changes

### Account Security

- Enable two-factor authentication (coming soon)
- View login history
- Manage connected devices

---

## 🛠️ Araç Kullanım Rehberi

### Background Remover

Remove image backgrounds with AI-powered precision:

1. Navigate to [Background Remover](/tools/background-remover)
2. Upload PNG, JPG, or WEBP image (max 12MB)
3. Click "Remove Background"
4. Download transparent PNG result

**Tips:**
- Use high-contrast images for best results
- Ensure subject is clearly visible
- Works best with single subjects

### Image Upscaler

Enhance image resolution with AI:

1. Go to [Image Upscaler](/tools/image-upscaler)
2. Upload PNG, JPG, or WEBP image (max 10MB)
3. Select upscale factor (2x, 4x, or 8x)
4. Click "Upscale Image"
5. Download enhanced result

**Tips:**
- Start with 4x for best balance
- Use 2x for faster processing
- Use 8x for maximum quality

### Mockup Generator

Create realistic product mockups:

1. Visit [Mockup Generator](/tools/mockup-generator)
2. Upload your design (PNG with transparency recommended)
3. Select a mockup template
4. Adjust design position, scale, and rotation
5. Click "Generate Mockup"
6. Download high-resolution PNG

**Categories:**
- **Devices**: Phones, tablets, laptops
- **Print**: Business cards, posters, flyers
- **Apparel**: T-shirts, hoodies, tote bags

**Tips:**
- Use transparent PNG designs for best results
- Position design within the highlighted area
- Experiment with perspective transforms

### Color Picker

Extract colors from images:

1. Go to [Color Picker](/tools/color-picker)
2. Upload an image (PNG, JPG, WEBP)
3. Click anywhere on the image to pick colors
4. Copy color values (HEX, RGB, HSL)
5. Export color palette

**Features:**
- Real-time color picking
- Color history
- Palette export (CSS, JSON, SCSS)
- WCAG contrast checking

### QR Code Generator

Create custom QR codes:

1. Navigate to [QR Code Generator](/tools/qr-code-generator)
2. Enter text or URL to encode
3. Customize design (colors, logo, size)
4. Click "Generate QR Code"
5. Download as PNG or SVG

**Customization Options:**
- Foreground/background colors
- Logo overlay
- Size adjustment
- Error correction level

---

## 💰 Abonelik ve Faturalama

> **Detaylı bilgi için:** [Pricing ve Plan Değişikliği Rehberi](./PRICING_PLAN_GUIDE.md)

### Plans

| Plan | Price | Daily Operations | Features |
|------|-------|------------------|----------|
| Free | $0 | 10 | All client-side tools |
| Premium | $9/month | 500 | All tools + higher limits |
| Pro | $29/month | 2000 | All tools + highest limits |

### Managing Subscription

1. Go to [Dashboard](/dashboard)
2. Click "Manage Subscription" in Plan Card
3. Access Stripe Customer Portal
4. Update payment methods, view invoices
5. Cancel or change plans

### Kota Sistemi

> **Detaylı kota yönetimi için:** [Kota Yönetimi Rehberi](./QUOTA_MANAGEMENT_GUIDE.md)

- Kotalar her gün gece yarısı UTC'de sıfırlanır
- API araçları kota kullanır, client-side araçlar kullanmaz
- Dashboard'da gerçek zamanlı takip
- Plan yükselterek daha yüksek kotalar alabilirsiniz

**Günlük Kota Limitleri:**
- **Free Plan**: 10 API işlemi
- **Premium Plan**: 500 API işlemi  
- **Pro Plan**: 2000 API işlemi

---

## 🛠️ Sorun Giderme

> **Kapsamlı rehber için:** [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)

Bu bölüm en yaygın sorunlar ve hızlı çözümleri içerir. Detaylı sorun giderme için yukarıdaki linki takip edin.

### Common Issues

#### Upload Problems
- **Error**: "File too large"
  - Solution: Reduce image size or upgrade plan
- **Error**: "Invalid file type"
  - Solution: Convert to PNG, JPG, or WEBP
- **Error**: "Upload failed"
  - Solution: Check internet connection, try again

#### Processing Issues
- **Error**: "Processing failed"
  - Solution: Try a different image or contact support
- **Error**: "Quota exceeded"
  - Solution: Wait for reset or upgrade plan
- **Slow Processing**
  - Solution: Use smaller images or try during off-peak hours

#### Account Issues
- **Can't sign in**
  - Solution: Reset password, check email verification
- **Wrong plan shown**
  - Solution: Refresh page, clear browser cache
- **Billing portal issues**
  - Solution: Contact support with Stripe customer ID

---

## ❓ Sık Sorulan Sorular

> **Güncellenmiş ve genişletilmiş FAQ için:** [FAQ Rehberi](./FAQ_UPDATED.md)

Bu bölüm en sık sorulan soruları içerir. 80+ soru ve detaylı yanıtlar için yukarıdaki linki takip edin.

### General Questions

**Q: Is my data secure?**
A: Yes. All processing happens client-side when possible, and we use industry-standard encryption for data in transit and at rest.

**Q: Do you store my images?**
A: No. Images are processed and discarded immediately. We never store user-uploaded content.

**Q: What browsers do you support?**
A: Latest versions of Chrome, Firefox, Safari, and Edge. Mobile browsers supported.

**Q: Can I use the tools offline?**
A: Client-side tools work offline after initial load. API tools require internet connection.

### Billing Questions

**Q: When does my subscription renew?**
A: Monthly on the same date you signed up. You'll receive email notifications.

**Q: Can I cancel anytime?**
A: Yes. Cancel through the billing portal. You'll keep access until end of billing period.

**Q: What payment methods do you accept?**
A: Credit/debit cards via Stripe. More options coming soon.

**Q: Do unused operations carry over?**
A: No. Daily quotas reset each day at midnight UTC.

### Technical Questions

**Q: Why do API tools have rate limits?**
A: To ensure fair usage and maintain service quality for all users.

**Q: How can I get higher limits?**
A: Upgrade to Premium or Pro plans for significantly higher daily quotas.

**Q: Are there any file size limits?**
A: Yes. Client-side tools: 20MB. API tools: 12MB (Background Remover) or 10MB (Image Upscaler).

**Q: Can I integrate with my own tools?**
A: Pro plan users get access to our REST API. Contact support for documentation.

### Support Questions

**Q: How do I contact support?**
A: Email us at support@desinerkit.com or join our Discord community.

**Q: What's your refund policy?**
A: All plans come with a 30-day money-back guarantee.

**Q: How often do you add new tools?**
A: We release new tools monthly based on user feedback and demand.

**Q: Can I suggest new features?**
A: Absolutely! Email your suggestions to feedback@desinerkit.com or join our Discord.

### Troubleshooting Questions

**Q: My tool isn't working properly**
A: Try clearing your browser cache, disabling ad blockers, or using incognito mode.

**Q: I'm getting rate limit errors**
A: Wait a minute and try again, or upgrade your plan for higher limits.

**Q: My file upload keeps failing**
A: Check your internet connection and try a smaller file or different format.

**Q: I lost my work**
A: Unfortunately, we don't store user files for privacy reasons. Always download your results immediately.

---

## 📞 Support

Need help? Contact us at:

- **Email**: support@desinerkit.com
- **Twitter**: [@DesinerKit](https://twitter.com/DesinerKit)
- **Discord**: [Join Community](https://discord.gg/desinerkit)

Include:
- Description of issue
- Screenshots if applicable
- Browser and OS information
- Your user ID (found on dashboard)

---

**Last Updated:** 2023-12-01  
**Status:** ✅ Ready for User Documentation