# Production Deployment Guide

Complete step-by-step guide for deploying Design Kit to production.

---

## Overview

This guide covers deploying Design Kit to **Cloudflare Pages** (recommended) or **Vercel**. Both platforms offer:
- ✅ Automatic deployments from GitHub
- ✅ Edge network (CDN)
- ✅ Serverless functions for API routes
- ✅ Free SSL certificates
- ✅ Built-in analytics

**Estimated Time**: 30-45 minutes

---

## Prerequisites

Before starting, ensure you have:

- [x] GitHub account with repository access
- [x] Completed development and testing
- [x] Supabase project created and configured
- [x] Stripe account with products created
- [x] Domain name (optional, can use provided subdomain)
- [x] Access to all API keys and secrets

---

## Part 1: Pre-Deployment Setup

### 1.1 Create OG Image

Create social media preview image:

**Requirements**:
- Size: 1200x630px
- Format: PNG or JPG
- Content: App screenshot or logo + tagline
- Location: `public/og-image.png`

**Tools**:
- Figma (recommended)
- Canva
- Photoshop
- Online OG image generators

**Template**:
```
[Logo Icon]

Design Kit
Professional Design Tools Suite

Privacy-first | Browser-based | Free to Start
```

### 1.2 Verify Database Migrations

```bash
# Check all migrations are applied
cd supabase
cat migrations/*.sql

# Verify in Supabase Dashboard
# SQL Editor → Run: SELECT * FROM profiles LIMIT 1;
```

**Required Tables**:
- profiles
- daily_limits
- tool_usage
- email_preferences
- analytics_events
- feedback
- feedback_attachments

### 1.3 Test Build Locally

```bash
# Run production build test
npm run build
npm run start

# Or use the test script
bash scripts/test-production-build.sh
```

**Check**:
- Build completes without errors
- No TypeScript errors
- Server starts on :3000
- Homepage loads
- Tools work

---

## Part 2: Environment Variables Setup

### 2.1 Prepare Production Environment Variables

Create a secure document (password manager or encrypted file) with all production values:

```bash
# Application
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Design Kit
NODE_ENV=production

# Supabase (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # SECRET!

# Stripe (LIVE Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...  # SECRET!
STRIPE_WEBHOOK_SECRET=whsec_...  # SECRET!
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# Sentry (Production)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...  # SECRET!
SENTRY_ORG=your-org
SENTRY_PROJECT=design-kit

# External APIs (Optional)
REMOVE_BG_API_KEY=...  # SECRET!
REPLICATE_API_KEY=...  # SECRET!

# Rate Limiting (Recommended)
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...  # SECRET!

# Analytics (Optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Email (Optional)
RESEND_API_KEY=re_...  # SECRET!
EMAIL_FROM=noreply@yourdomain.com
```

### 2.2 Security Checklist

Before proceeding:
- [ ] All keys are from PRODUCTION accounts
- [ ] Stripe keys are LIVE (pk_live_, sk_live_)
- [ ] Service role key is kept secret
- [ ] Keys are different from development
- [ ] No keys committed to git

---

## Part 3: Option A - Deploy to Cloudflare Pages

### 3.1 Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Pages** in sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Authorize Cloudflare to access GitHub
6. Select your repository: `your-username/design-kit`
7. Click **Begin setup**

### 3.2 Configure Build Settings

**Production branch**: `main`

**Build Configuration**:
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: (leave empty)
```

**Environment variables**: `Node.js`

### 3.3 Add Environment Variables

In Cloudflare Pages:
1. Go to **Settings** → **Environment variables**
2. Click **Add variable** for each secret
3. Select **Encrypt** for all secret values
4. Set **Environment**: Production

**Add all variables from Part 2.1**

**Important**:
- Mark all API keys and secrets as "Encrypted"
- Don't add `.env` file to git

### 3.4 Configure Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain: `yourdomain.com`
4. Follow DNS configuration instructions
5. Wait for SSL certificate (automatic, ~15 minutes)

**DNS Setup** (if domain is in Cloudflare):
- Automatically configured
- SSL certificate auto-issued

**DNS Setup** (if domain is elsewhere):
- Add CNAME record: `@ → your-project.pages.dev`
- Or A records provided by Cloudflare

### 3.5 Deploy

1. Click **Save and Deploy**
2. Watch build logs in real-time
3. Wait for deployment (3-5 minutes)
4. Visit `https://your-project.pages.dev`

**If Build Fails**:
- Check build logs for errors
- Verify environment variables
- Ensure Node.js 18+
- Check `next.config.js` compatibility

---

## Part 4: Option B - Deploy to Vercel

### 4.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Select `design-kit` repo
5. Click **Import**

### 4.2 Configure Project

**Framework Preset**: Next.js (auto-detected)

**Root Directory**: `./` (leave as default)

**Build and Output Settings**:
```
Build Command: npm run build  (auto-filled)
Output Directory: .next  (auto-filled)
Install Command: npm ci  (auto-filled)
```

### 4.3 Add Environment Variables

1. Expand **Environment Variables** section
2. Add each variable from Part 2.1
3. Set **Environment**: Production
4. Click **Add** for each

**Tip**: You can paste multiple variables at once:
```
KEY1=value1
KEY2=value2
```

### 4.4 Configure Custom Domain (Optional)

1. In project settings, go to **Domains**
2. Click **Add**
3. Enter: `yourdomain.com`
4. Configure DNS as instructed:
   - CNAME: `@ → cname.vercel-dns.com`
   - Or A record to Vercel IP
5. Wait for SSL (automatic, ~5 minutes)

### 4.5 Deploy

1. Click **Deploy**
2. Watch deployment progress
3. Wait 2-3 minutes
4. Visit your production URL

---

## Part 5: Post-Deployment Configuration

### 5.1 Update Supabase Redirect URLs

In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/dashboard
   https://yourdomain.com/welcome
   ```
3. Update **Site URL**: `https://yourdomain.com`
4. Save changes

### 5.2 Configure Stripe Webhook

In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy **Signing secret**
6. Update `STRIPE_WEBHOOK_SECRET` in hosting platform

### 5.3 Verify Sentry Integration

1. Visit production site
2. Trigger a test error (if test page exists)
3. Check Sentry dashboard
4. Verify error appears
5. Check source maps loaded

**Upload Source Maps** (if not automatic):
```bash
# In project directory
npx @sentry/cli sourcemaps upload \
  --org your-org \
  --project design-kit \
  .next/static
```

---

## Part 6: DNS & SSL Configuration

### 6.1 DNS Propagation

After adding custom domain:
```bash
# Check DNS propagation
nslookup yourdomain.com

# Check from multiple locations
https://www.whatsmydns.net/
```

**Wait Time**: 5 minutes to 48 hours (usually < 1 hour)

### 6.2 Verify SSL Certificate

```bash
# Check SSL certificate
curl -vI https://yourdomain.com 2>&1 | grep "SSL certificate"

# Or visit in browser
# Look for padlock icon in address bar
```

**SSL Issues**:
- Wait 15-30 minutes after DNS propagation
- Ensure domain is verified
- Check DNS records are correct
- Contact hosting support if issues persist

### 6.3 Force HTTPS Redirect

Both Cloudflare Pages and Vercel automatically redirect HTTP → HTTPS.

**Verify**:
```bash
curl -I http://yourdomain.com
# Should return 301/302 to https://
```

---

## Part 7: Search Engine Setup

### 7.1 Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console/)
2. Click **Add property**
3. Enter: `https://yourdomain.com`
4. Verify ownership:
   - **Method 1**: HTML file upload
   - **Method 2**: DNS TXT record
   - **Method 3**: HTML meta tag (in `layout.tsx`)
5. After verification, submit sitemap:
   - URL: `https://yourdomain.com/sitemap.xml`
6. Request indexing for homepage

### 7.2 Bing Webmaster Tools

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters/)
2. Add site: `https://yourdomain.com`
3. Verify with Google Search Console (easy method)
4. Submit sitemap: `https://yourdomain.com/sitemap.xml`

---

## Part 8: Monitoring Setup

### 8.1 Error Monitoring (Sentry)

Sentry is already configured. Verify:
1. Visit Sentry dashboard
2. Check **Issues** for any errors
3. Set up alerts:
   - Email notifications
   - Slack integration (optional)
4. Configure alert rules:
   - New issue created
   - \> 10 errors per hour
   - Error spike detected

### 8.2 Uptime Monitoring (Optional)

Recommended services:
- **UptimeRobot** (free for 50 monitors)
- **Pingdom** (paid, more features)
- **Better Uptime** (developer-friendly)

**Setup**:
1. Create account
2. Add monitor: `https://yourdomain.com`
3. Check interval: 5 minutes
4. Set alert email
5. Add status page (optional)

### 8.3 Analytics Verification

**Plausible** (if using):
1. Visit production site
2. Check Plausible dashboard
3. Verify events tracking
4. Test custom events

**Supabase Analytics**:
1. Login to production site
2. Use some tools
3. Check dashboard shows analytics

---

## Part 9: Smoke Testing

### 9.1 Critical User Flows

After deployment, test:

**Homepage**:
- [ ] Loads within 2-3 seconds
- [ ] Logo displays
- [ ] All sections render
- [ ] CTA buttons work
- [ ] No console errors

**Authentication**:
- [ ] Signup creates account
- [ ] Email verification received
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Logout works

**Tools** (test 3):
- [ ] Color Picker works
- [ ] Image Resizer works
- [ ] Background Remover works
- [ ] Files process correctly
- [ ] Download works

**Subscription**:
- [ ] Pricing page loads
- [ ] Checkout opens
- [ ] Test payment (use test card if test mode)
- [ ] Subscription activates
- [ ] Quota increases

### 9.2 Performance Check

```bash
# Lighthouse audit
npx lighthouse https://yourdomain.com \
  --output html \
  --output-path ./lighthouse-report.html

# Open report
open lighthouse-report.html
```

**Target Scores**:
- Performance: 80+ (mobile), 90+ (desktop)
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### 9.3 Browser Testing

Test in:
- [ ] Chrome (Windows/Mac)
- [ ] Firefox (Windows/Mac)
- [ ] Safari (Mac/iOS)
- [ ] Edge (Windows)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Part 10: Social Media Setup

### 10.1 Test Social Sharing

**Facebook**:
1. Go to [Facebook Debugger](https://developers.facebook.com/tools/debug/)
2. Enter: `https://yourdomain.com`
3. Click **Debug**
4. Verify OG image and meta tags
5. Click **Scrape Again** if needed

**Twitter**:
1. Go to [Twitter Card Validator](https://cards-dev.twitter.com/validator)
2. Enter: `https://yourdomain.com`
3. Click **Preview card**
4. Verify image and description

**LinkedIn**:
1. Go to [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
2. Enter: `https://yourdomain.com`
3. Verify preview

### 10.2 Create Social Accounts (Optional)

If launching publicly:
- [ ] Twitter/X: @designkit
- [ ] GitHub: github.com/designkit
- [ ] Product Hunt listing
- [ ] LinkedIn company page

---

## Part 11: Final Verification

### 11.1 Checklist Review

Go through [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) and ensure all items are checked.

### 11.2 Performance Baseline

Record initial metrics:
- Homepage load time: _____ seconds
- Time to Interactive: _____ seconds
- Lighthouse Performance: _____ / 100
- First load JS: _____ KB
- Sentry error rate: _____ errors/hour

### 11.3 Backup Configuration

Save copies of:
- [ ] All environment variables (encrypted file)
- [ ] Database schema (SQL export)
- [ ] DNS configuration
- [ ] Stripe product/price IDs
- [ ] API keys (in password manager)

---

## Part 12: Launch Announcement (Optional)

### 12.1 Prepare Announcement

**Product Hunt**:
- Create compelling tagline
- Upload screenshots
- Write description
- Set launch date
- Invite team members

**Social Media**:
- Tweet announcement
- LinkedIn post
- Reddit (r/webdev, r/SideProject)
- Designer communities

**Email** (if you have list):
- Welcome email to early signups
- Feature highlights
- Call-to-action

### 12.2 Monitor Launch Day

First 24 hours:
- Check Sentry every hour
- Monitor uptime
- Respond to user feedback quickly
- Fix critical bugs immediately
- Celebrate! 🎉

---

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

**Error: TypeScript errors**
```bash
# Run type check locally
npm run type-check
# Fix all errors before deploying
```

### Deployment Succeeds but Site Doesn't Work

**White screen / App doesn't load**:
- Check browser console for errors
- Verify environment variables are set
- Check Sentry for server errors
- Review deployment logs

**API routes return 500**:
- Check Supabase connection (keys correct?)
- Verify database tables exist
- Check API route logs in hosting platform

### Database Connection Issues

**Error: Could not connect to Supabase**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure RLS policies allow access
- Test connection in Supabase Dashboard

### Stripe Webhook Not Working

**Payments complete but subscriptions don't activate**:
- Verify webhook URL is correct
- Check webhook secret matches env var
- Test webhook with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- Check webhook logs in Stripe Dashboard

---

## Rollback Procedure

If deployment fails or critical issues found:

### Method 1: Platform Rollback

**Cloudflare Pages**:
1. Go to deployments
2. Find previous working deployment
3. Click **···** → **Rollback to this deployment**

**Vercel**:
1. Go to Deployments
2. Find previous version
3. Click **···** → **Promote to Production**

### Method 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

---

## Post-Launch Checklist

### Week 1
- [ ] Monitor error rate daily
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Fix critical bugs
- [ ] Improve based on analytics

### Month 1
- [ ] Review Search Console data
- [ ] Analyze user behavior
- [ ] Plan feature improvements
- [ ] Optimize slow pages
- [ ] Update documentation

---

## Support Resources

**Documentation**:
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

**Community**:
- Next.js Discord
- Supabase Discord
- Stack Overflow

**Emergency Contacts**:
- Hosting support
- Supabase support: support@supabase.io
- Your team/developer

---

## Conclusion

Congratulations! Your Design Kit is now live in production. 🚀

**Next Steps**:
1. Monitor closely for first 24-48 hours
2. Gather user feedback
3. Plan improvements
4. Market your product
5. Iterate based on data

**Remember**:
- Deploy frequently (when stable)
- Monitor actively
- Respond to issues quickly
- Keep improving

---

**Deployment Date**: _____________
**Production URL**: _____________
**Version**: 1.0.0
**Status**: ☐ Not Started ☐ In Progress ☐ Deployed ☐ Verified

Good luck! 🍀
