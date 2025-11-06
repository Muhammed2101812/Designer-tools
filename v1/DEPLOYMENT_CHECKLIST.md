# Production Deployment Checklist

## Pre-Deployment Checklist

Use this checklist before deploying Design Kit to production.

---

## 1. Environment Variables ✅

### Required Variables (Must Have)

**Application**:
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to production domain (e.g., https://designkit.com)
- [ ] `NEXT_PUBLIC_APP_URL` - Same as SITE_URL
- [ ] `NEXT_PUBLIC_APP_NAME` - "Design Kit"
- [ ] `NODE_ENV` - Set to "production"

**Supabase** (Critical):
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key (SECRET!)

**Stripe** (Critical):
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Live key (pk_live_...)
- [ ] `STRIPE_SECRET_KEY` - Live secret key (sk_live_...)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `STRIPE_PREMIUM_PRICE_ID` - Production Premium price ID
- [ ] `STRIPE_PRO_PRICE_ID` - Production Pro price ID

**Sentry** (Monitoring):
- [ ] `NEXT_PUBLIC_SENTRY_DSN` - Production Sentry DSN
- [ ] `SENTRY_AUTH_TOKEN` - For source maps upload
- [ ] `SENTRY_ORG` - Organization slug
- [ ] `SENTRY_PROJECT` - Project name

### Optional Variables

**External APIs** (If using):
- [ ] `REMOVE_BG_API_KEY` - For background remover tool
- [ ] `REPLICATE_API_KEY` - For image upscaler tool

**Rate Limiting** (Recommended):
- [ ] `UPSTASH_REDIS_URL` - Upstash Redis URL
- [ ] `UPSTASH_REDIS_TOKEN` - Upstash Redis token

**Analytics** (Optional):
- [ ] `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` - Your domain for Plausible

**Email** (Optional):
- [ ] `RESEND_API_KEY` - For transactional emails
- [ ] `EMAIL_FROM` - Verified sender email

---

## 2. Database Setup ✅

### Supabase Configuration

**Database Schema**:
- [ ] All migrations applied (001, 002, 003, 004, 005)
- [ ] Tables created: profiles, daily_limits, tool_usage, email_preferences, analytics_events, feedback
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies created and tested
- [ ] Database functions created (13 helper functions)
- [ ] Indexes created for performance

**Storage Buckets**:
- [ ] `avatars` bucket created
- [ ] `feedback-attachments` bucket created
- [ ] Storage policies configured
- [ ] Public access set correctly

**Authentication**:
- [ ] Email/Password provider enabled
- [ ] Email templates customized (optional)
- [ ] Redirect URLs configured:
  - [ ] `https://yourdomain.com/auth/callback`
  - [ ] `https://yourdomain.com/dashboard`
- [ ] OAuth providers configured (if using):
  - [ ] Google OAuth
  - [ ] GitHub OAuth

**Verify Connection**:
```bash
# Test database connection
npm run verify-env
```

---

## 3. Stripe Configuration ✅

### Products & Pricing

**Create Products**:
- [ ] Premium plan created in Stripe Dashboard
  - [ ] Monthly price: $9.99
  - [ ] 500 API operations/day
  - [ ] Price ID copied to env
- [ ] Pro plan created in Stripe Dashboard
  - [ ] Monthly price: $19.99
  - [ ] 2000 API operations/day
  - [ ] Price ID copied to env

**Webhook Setup**:
- [ ] Webhook endpoint created: `https://yourdomain.com/api/stripe/webhook`
- [ ] Events selected:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
- [ ] Webhook secret copied to env

**Test Mode vs Live Mode**:
- [ ] Switch to LIVE mode in Stripe Dashboard
- [ ] Confirm using live API keys (pk_live_, sk_live_)
- [ ] Test a payment with real card (small amount)

---

## 4. Build & Type Checking ✅

### Local Production Build

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Start production server locally
npm run start
```

**Check for**:
- [ ] No TypeScript errors
- [ ] Build completes successfully
- [ ] No build warnings (or only acceptable ones)
- [ ] Bundle sizes are reasonable
- [ ] All pages render correctly
- [ ] No console errors in browser

---

## 5. Performance Verification ✅

### Lighthouse Audit

Run Lighthouse on production build:
```bash
npm run perf:audit
```

**Target Scores**:
- [ ] Performance: 80+ (mobile), 90+ (desktop)
- [ ] Accessibility: 95+
- [ ] Best Practices: 95+
- [ ] SEO: 95+

**Core Web Vitals**:
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

---

## 6. Security Checklist ✅

### Code Security

- [ ] No API keys in client-side code
- [ ] Service role key only used server-side
- [ ] All API routes check authentication
- [ ] Rate limiting enabled (if Redis configured)
- [ ] Input validation on all forms (Zod schemas)
- [ ] File upload validation (size, type, content)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled (Next.js default)

### Environment Security

- [ ] `.env.local` in `.gitignore`
- [ ] No secrets committed to git
- [ ] Production keys different from development
- [ ] Service role keys rotated (if previously exposed)

### HTTP Security Headers

Check `next.config.js` has:
- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: origin-when-cross-origin`
- [ ] `X-XSS-Protection: 1; mode=block`

---

## 7. Functionality Testing ✅

### Critical User Flows

**Authentication Flow**:
- [ ] Sign up with email/password
- [ ] Verify email (check inbox)
- [ ] Log in successfully
- [ ] Password reset works
- [ ] Log out works
- [ ] Session persists on refresh

**Tool Usage (Client-Side)**:
- [ ] Color Picker: Upload image, pick colors
- [ ] Image Resizer: Resize and download
- [ ] Image Cropper: Crop and save
- [ ] Image Compressor: Compress with quality slider
- [ ] Gradient Generator: Create and export
- [ ] QR Generator: Generate and download
- [ ] Format Converter: Convert formats
- [ ] Mockup Generator: Create mockup

**Tool Usage (API-Powered)**:
- [ ] Background Remover: Remove background (quota check)
- [ ] Image Upscaler: Upscale image (quota check)
- [ ] Quota warning appears at 80%
- [ ] Quota limit enforced at 100%

**Subscription Flow**:
- [ ] View pricing page
- [ ] Click "Upgrade to Premium"
- [ ] Redirected to Stripe Checkout
- [ ] Complete payment (test with real card)
- [ ] Redirected back to dashboard
- [ ] Subscription status updated
- [ ] Quota limits increased

**Dashboard**:
- [ ] Stats load correctly
- [ ] Recent activity shows
- [ ] Usage charts display
- [ ] Profile loads
- [ ] Avatar upload works

---

## 8. Error Monitoring ✅

### Sentry Integration

**Test Sentry**:
- [ ] Visit `/test-sentry` (if exists)
- [ ] Trigger an error
- [ ] Check Sentry dashboard for error
- [ ] Verify source maps uploaded
- [ ] Check error grouping works

**Verify Monitoring**:
- [ ] Errors logged to Sentry
- [ ] User context included
- [ ] Breadcrumbs captured
- [ ] Performance tracking enabled
- [ ] Alerts configured (optional)

---

## 9. SEO & Social Media ✅

### Meta Tags

**Verify on Production**:
- [ ] Title tags present (view source)
- [ ] Meta descriptions present
- [ ] Open Graph tags present
- [ ] Twitter Card tags present
- [ ] Canonical URLs correct

**Test Social Sharing**:
- [ ] Facebook: https://developers.facebook.com/tools/debug/
- [ ] Twitter: https://cards-dev.twitter.com/validator
- [ ] LinkedIn: https://www.linkedin.com/post-inspector/

**Structured Data**:
- [ ] Test with: https://search.google.com/test/rich-results
- [ ] No errors in schemas
- [ ] Organization schema valid
- [ ] WebApplication schema valid
- [ ] FAQ schema valid

**Files Accessible**:
- [ ] `/sitemap.xml` returns XML
- [ ] `/robots.txt` returns text
- [ ] `/favicon.svg` loads
- [ ] `/site.webmanifest` loads

---

## 10. Analytics Setup ✅

### Plausible Analytics (if using)

- [ ] Domain added to Plausible
- [ ] Script loads on all pages
- [ ] Events tracking works
- [ ] Real-time dashboard shows data

### Custom Analytics

- [ ] Analytics events stored in Supabase
- [ ] Dashboard shows analytics
- [ ] User event tracking works

---

## 11. Email Configuration ✅

### Email Delivery

**Supabase Auth Emails** (Default):
- [ ] Welcome email sends on signup
- [ ] Password reset email works
- [ ] Email change confirmation works

**Transactional Emails** (If using Resend):
- [ ] Resend API key configured
- [ ] Sender domain verified
- [ ] Test quota warning email
- [ ] Test subscription update email
- [ ] Email preferences work

---

## 12. Mobile Testing ✅

### Responsive Design

**Test on Real Devices** (if possible):
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)

**Test Responsive Features**:
- [ ] Navigation collapses on mobile
- [ ] Tools work on touch screens
- [ ] File upload works on mobile
- [ ] Forms are easy to fill
- [ ] Buttons are large enough (44x44px min)
- [ ] Text is readable (16px+ base)

---

## 13. Browser Compatibility ✅

### Test Browsers

**Desktop**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile**:
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)

**Check for**:
- [ ] Canvas operations work
- [ ] File API works
- [ ] LocalStorage works
- [ ] CSS grid/flexbox renders correctly

---

## 14. Legal & Compliance ✅

### Legal Pages

- [ ] Privacy Policy accessible at `/privacy`
- [ ] Terms of Service accessible at `/terms`
- [ ] Cookie Policy (if using cookies beyond necessary)
- [ ] Footer links to legal pages

### GDPR Compliance

- [ ] Privacy Policy mentions data processing
- [ ] Users can delete their account
- [ ] Data export available (optional)
- [ ] Cookie consent (if using analytics cookies)

---

## 15. DNS & Domain Setup ✅

### Domain Configuration

**DNS Records**:
- [ ] A record or CNAME pointing to hosting
- [ ] WWW redirect to non-WWW (or vice versa)
- [ ] SSL certificate issued and valid

**Verify**:
```bash
# Check DNS propagation
nslookup yourdomain.com

# Check SSL certificate
curl -I https://yourdomain.com
```

---

## 16. Hosting Platform Setup ✅

### Cloudflare Pages (Recommended)

**Connect GitHub**:
- [ ] Repository connected to Cloudflare
- [ ] Branch: `main`
- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Node version: 18 or 20

**Environment Variables**:
- [ ] All production env vars added to Cloudflare
- [ ] Secrets marked as encrypted
- [ ] Preview branch env vars set (optional)

**Deploy Settings**:
- [ ] Production branch: `main`
- [ ] Automatic deployments enabled
- [ ] Build cache enabled
- [ ] Functions enabled (for API routes)

**Alternative: Vercel**:
- [ ] Project imported from GitHub
- [ ] Environment variables set
- [ ] Production domain configured
- [ ] Automatic deployments enabled

---

## 17. Post-Deployment Verification ✅

### Smoke Test (After Deploy)

**Homepage**:
- [ ] https://yourdomain.com loads
- [ ] Logo displays correctly
- [ ] Hero section renders
- [ ] All sections visible
- [ ] No console errors

**Authentication**:
- [ ] Signup creates account
- [ ] Email verification received
- [ ] Login works
- [ ] Dashboard accessible

**Tools**:
- [ ] Pick 3 tools and test end-to-end
- [ ] Client-side tools work offline
- [ ] API tools respect quota

**Payments**:
- [ ] Pricing page loads
- [ ] Stripe checkout opens
- [ ] Test payment with test card
- [ ] Subscription activates

---

## 18. Search Engine Submission ✅

### Google Search Console

- [ ] Site added to Search Console
- [ ] Ownership verified
- [ ] Sitemap submitted: `https://yourdomain.com/sitemap.xml`
- [ ] Request indexing for homepage
- [ ] Request indexing for key tool pages

### Bing Webmaster Tools

- [ ] Site added to Bing Webmaster
- [ ] Ownership verified
- [ ] Sitemap submitted

---

## 19. Monitoring & Alerts ✅

### Setup Monitoring

**Uptime Monitoring** (Optional):
- [ ] UptimeRobot or similar configured
- [ ] Alert email set
- [ ] Check every 5 minutes

**Error Alerts** (Sentry):
- [ ] Email alerts enabled
- [ ] Slack integration (optional)
- [ ] Alert threshold set (e.g., > 10 errors/hour)

**Performance Monitoring**:
- [ ] Sentry performance tracking enabled
- [ ] Slow transaction alerts (> 1s)

---

## 20. Documentation Updates ✅

### Update Documentation

- [ ] README updated with production URL
- [ ] API documentation current
- [ ] Deployment guide reflects production setup
- [ ] Environment variables documented
- [ ] Troubleshooting guide available

---

## 21. Backup & Rollback Plan ✅

### Backup Strategy

**Database**:
- [ ] Supabase daily backups enabled
- [ ] Manual backup before major changes
- [ ] Backup restoration tested

**Codebase**:
- [ ] Git tags for releases
- [ ] Previous version deployable
- [ ] Rollback procedure documented

**Environment Variables**:
- [ ] Env vars backed up securely
- [ ] Access to restore if needed

---

## 22. Load Testing ✅ (Optional but Recommended)

### Performance Under Load

```bash
# Test with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/

# Test API endpoint
ab -n 100 -c 5 https://yourdomain.com/api/tools/check-quota
```

**Check**:
- [ ] Server handles 100+ concurrent users
- [ ] Response times stay under 2s
- [ ] No errors under load
- [ ] Database connections stable

---

## 23. Final Pre-Launch Checks ✅

### Last Minute Checklist

**Code**:
- [ ] All TODO comments addressed
- [ ] Console.logs removed (or behind debug flag)
- [ ] Test pages removed or hidden
- [ ] Debug mode disabled

**Content**:
- [ ] Placeholder text replaced
- [ ] Images optimized
- [ ] Links tested (no 404s)
- [ ] Contact information correct

**SEO**:
- [ ] Meta descriptions compelling
- [ ] OG image created (1200x630px)
- [ ] Favicon displays correctly
- [ ] Site loads under 3 seconds

**Legal**:
- [ ] Privacy policy accurate
- [ ] Terms of service reviewed
- [ ] Copyright year current
- [ ] Contact email active

---

## 24. Launch Procedure ✅

### Deployment Steps

1. **Create Production Branch**:
   ```bash
   git checkout -b production
   git push origin production
   ```

2. **Set Environment Variables**:
   - In Cloudflare/Vercel dashboard
   - Double-check all values
   - Mark secrets as encrypted

3. **Deploy**:
   - Push to production branch
   - Or manually trigger deploy
   - Watch build logs for errors

4. **Verify Deployment**:
   - Check deployment status
   - Visit production URL
   - Run smoke tests

5. **Update DNS** (if needed):
   - Point domain to hosting
   - Wait for propagation (up to 48h)
   - Verify SSL certificate

6. **Enable Monitoring**:
   - Start uptime monitoring
   - Enable error alerts
   - Monitor first 24 hours closely

---

## 25. Post-Launch Tasks ✅

### First Week After Launch

**Day 1**:
- [ ] Monitor Sentry for errors
- [ ] Check analytics setup
- [ ] Test all critical flows again
- [ ] Respond to any user reports

**Day 2-7**:
- [ ] Monitor performance metrics
- [ ] Check Search Console for indexing
- [ ] Review user feedback
- [ ] Fix any critical bugs immediately

**Week 1 Review**:
- [ ] Analyze user behavior
- [ ] Identify most popular tools
- [ ] Check conversion rates
- [ ] Plan improvements

---

## Emergency Contacts ✅

### Key Service Contacts

**Hosting**:
- Cloudflare Support: [Link]
- Vercel Support: [Link]

**Services**:
- Supabase Support: support@supabase.io
- Stripe Support: [Dashboard]
- Sentry Support: [Dashboard]

**Team**:
- Developer: [Your contact]
- Domain Registrar: [Link]

---

## Rollback Procedure 🚨

If something goes wrong:

1. **Immediate Action**:
   ```bash
   # Revert to previous version
   git revert HEAD
   git push origin production
   ```

2. **Or Rollback in Platform**:
   - Cloudflare: Deployments → Previous deployment → Rollback
   - Vercel: Deployments → Previous deployment → Promote to Production

3. **Check Status**:
   - Verify old version is live
   - Test critical functionality
   - Monitor errors decrease

4. **Investigate**:
   - Check logs for root cause
   - Fix in development
   - Test thoroughly before re-deploying

---

## Success Criteria ✅

Deployment is successful when:
- [ ] Site is accessible at production URL
- [ ] All critical user flows work
- [ ] No errors in Sentry (first hour)
- [ ] Performance metrics green
- [ ] Payment processing works
- [ ] Database operations succeed
- [ ] Monitoring shows healthy status

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Version**: 1.0.0
**Status**: ☐ Pre-deployment ☐ In Progress ☐ Completed ☐ Verified

---

*This checklist should be completed before every production deployment.*
