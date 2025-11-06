# 🚀 Deployment Guide - Cloudflare Pages

> Complete guide for deploying Design Kit to Cloudflare Pages with production configuration

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Completed all development and testing
- [ ] Supabase project set up with production database
- [ ] Stripe account configured with live API keys
- [ ] Custom domain ready (optional but recommended)
- [ ] All environment variables documented
- [ ] Production build tested locally
- [ ] GitHub repository ready for deployment

---

## 🏗️ Build Configuration

### **Framework Settings**

```yaml
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Node Version: 18.x or higher
Root Directory: / (leave empty if repo root)
```

### **Build Environment**

Cloudflare Pages will automatically detect Next.js and configure the build environment. The build process will:

1. Install dependencies (`npm ci`)
2. Run TypeScript compilation
3. Build Next.js application (`npm run build`)
4. Generate static and server-side pages
5. Optimize assets and images

---

## 🔐 Environment Variables Setup

### **Required Variables**

Configure these in Cloudflare Pages Dashboard → Settings → Environment Variables:

#### **Application**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Design Kit
NODE_ENV=production
```

#### **Supabase (Backend & Authentication)**
```bash
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
```

⚠️ **Important**: Use your **production** Supabase project, not development!

#### **Stripe (Payment Processing)**
```bash
# Get from: https://dashboard.stripe.com/apikeys
# Use LIVE keys (pk_live_ and sk_live_), not test keys!
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Price IDs from Stripe Dashboard → Products
STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxx
```

⚠️ **Critical**: Never use test keys in production!

### **Optional Variables (Recommended for Production)**

#### **External API Services**
```bash
# Remove.bg API Key (Background Remover tool)
REMOVE_BG_API_KEY=your_production_removebg_key

# Replicate API Key (Image Upscaler tool)
REPLICATE_API_KEY=your_production_replicate_key
```

#### **Rate Limiting (Highly Recommended)**
```bash
# Upstash Redis for rate limiting
# Get from: https://console.upstash.com/
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

#### **Analytics**
```bash
# Plausible Analytics (privacy-friendly)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

#### **Error Tracking**
```bash
# Sentry (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=design-kit
```

### **Environment Variable Security**

✅ **Best Practices:**
- Use separate keys for development and production
- Never commit `.env.local` to git
- Rotate keys if accidentally exposed
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` server-side only
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser

---

## 🌐 Cloudflare Pages Setup

### **Step 1: Create Cloudflare Account**

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Sign up or log in
3. Navigate to "Workers & Pages" → "Pages"

### **Step 2: Connect GitHub Repository**

1. Click **"Create a project"**
2. Click **"Connect to Git"**
3. Authorize Cloudflare to access your GitHub account
4. Select your repository: `design-kit`
5. Click **"Begin setup"**

### **Step 3: Configure Build Settings**

```yaml
Project name: design-kit (or your preferred name)
Production branch: main
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: / (leave empty)
Environment variables: (add all from section above)
```

### **Step 4: Deploy**

1. Click **"Save and Deploy"**
2. Wait 2-5 minutes for initial build
3. Monitor build logs for any errors
4. Once complete, you'll get a URL: `https://design-kit-xxx.pages.dev`

---

## 🔧 Post-Deployment Configuration

### **1. Update Supabase Settings**

Go to Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://yourdomain.com
```

**Redirect URLs (add all):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/confirm
https://design-kit-xxx.pages.dev/auth/callback
https://design-kit-xxx.pages.dev/auth/confirm
```

### **2. Update Stripe Webhook**

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and update `STRIPE_WEBHOOK_SECRET` in Cloudflare

### **3. Configure OAuth Providers**

If using Google or GitHub OAuth:

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Update authorized redirect URIs:
   - `https://yourdomain.com/auth/callback`
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

**GitHub OAuth:**
1. Go to [GitHub Settings → Developer settings](https://github.com/settings/developers)
2. Update callback URL:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`

---

## 🌍 Custom Domain Setup

### **Option 1: Domain Already on Cloudflare**

1. Go to Cloudflare Pages → Your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain: `designkit.com`
4. Cloudflare automatically configures DNS
5. SSL certificate auto-generated (5-10 minutes)

### **Option 2: Domain on Another Registrar**

1. Go to Cloudflare Pages → Your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain: `designkit.com`
4. Cloudflare provides DNS records to add at your registrar:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: design-kit-xxx.pages.dev
   ```
5. Add records at your domain registrar
6. Wait for DNS propagation (5 minutes - 48 hours)
7. SSL certificate auto-generated once DNS is verified

### **Recommended DNS Configuration**

```
# Root domain
Type: CNAME
Name: @
Value: design-kit-xxx.pages.dev

# WWW subdomain
Type: CNAME
Name: www
Value: design-kit-xxx.pages.dev
```

---

## 🧪 Testing Production Build Locally

Before deploying, test the production build on your local machine:

### **Step 1: Build the Application**

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    XXX kB        XXX kB
├ ○ /color-picker                        XXX kB        XXX kB
├ ○ /login                               XXX kB        XXX kB
└ ○ /pricing                             XXX kB        XXX kB
```

### **Step 2: Start Production Server**

```bash
npm run start
```

### **Step 3: Test Critical Paths**

Open `http://localhost:3000` and verify:

- [ ] Landing page loads correctly
- [ ] Navigation works (header, footer)
- [ ] Color Picker tool functions
- [ ] Login/signup pages load
- [ ] Images and assets load
- [ ] No console errors
- [ ] Responsive design works

### **Step 4: Check Build Size**

```bash
# Analyze bundle size
npm run build

# Look for warnings:
# - Large page bundles (> 500 KB)
# - Unused dependencies
# - Missing optimizations
```

---

## 🔍 Verification Checklist

After deployment, verify everything works:

### **Functionality Tests**

- [ ] Landing page loads and displays correctly
- [ ] Navigation (header, footer) works
- [ ] Color Picker tool functions properly
- [ ] File upload works
- [ ] Color extraction works
- [ ] Copy to clipboard works
- [ ] Export palette works
- [ ] Mobile responsive design works
- [ ] Dark mode toggle works (if implemented)

### **Authentication Tests**

- [ ] Signup page loads
- [ ] Email signup works
- [ ] Verification email received
- [ ] Login works
- [ ] OAuth login works (Google, GitHub)
- [ ] Password reset works
- [ ] Logout works
- [ ] Session persistence works

### **Performance Tests**

- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Images optimized and lazy-loaded

### **Security Tests**

- [ ] HTTPS enforced (SSL certificate active)
- [ ] No sensitive data in client-side code
- [ ] Environment variables not exposed
- [ ] CSP headers configured
- [ ] CORS configured correctly

### **SEO Tests**

- [ ] Meta tags present (title, description)
- [ ] Open Graph tags configured
- [ ] Sitemap accessible
- [ ] Robots.txt configured
- [ ] Canonical URLs set

---

## 🚨 Troubleshooting

### **Build Fails**

**Error: "Module not found"**
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error: "Type errors"**
```bash
# Solution: Run type check locally
npm run type-check

# Fix all TypeScript errors before deploying
```

**Error: "Environment variable missing"**
```bash
# Solution: Check all required variables are set in Cloudflare
# Go to Settings → Environment Variables
# Verify NEXT_PUBLIC_SUPABASE_URL, etc.
```

### **Runtime Errors**

**Error: "Supabase connection failed"**
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is active
- Verify API keys are production keys

**Error: "Stripe webhook signature invalid"**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check webhook endpoint URL is correct
- Ensure using live webhook secret, not test

**Error: "CORS errors"**
- Add your domain to Supabase allowed origins
- Check API routes have correct CORS headers

### **Performance Issues**

**Slow page loads:**
- Enable Cloudflare caching
- Optimize images (use Next.js Image component)
- Enable code splitting
- Check bundle size with `npm run build`

**High memory usage:**
- Reduce image sizes
- Implement lazy loading
- Use dynamic imports for heavy components

---

## 📊 Monitoring & Analytics

### **Cloudflare Analytics**

Built-in analytics available at:
- Cloudflare Pages → Your project → **Analytics**

Metrics:
- Page views
- Unique visitors
- Bandwidth usage
- Request count
- Error rate

### **Plausible Analytics**

If configured, view at: `https://plausible.io/yourdomain.com`

Custom events tracked:
- Tool usage
- Signups
- Upgrades
- Downloads

### **Error Tracking (Sentry)**

If configured, view at: `https://sentry.io/organizations/your-org/issues/`

Monitors:
- JavaScript errors
- API errors
- Performance issues
- User sessions

---

## 🔄 Continuous Deployment

### **Automatic Deployments**

Cloudflare Pages automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys to production
# 4. Updates live site (2-5 minutes)
```

### **Preview Deployments**

Every pull request gets a preview URL:

```bash
# Create feature branch
git checkout -b feature/new-tool
git push origin feature/new-tool

# Open PR on GitHub
# Cloudflare creates preview: https://abc123.design-kit.pages.dev
```

### **Rollback**

If deployment fails or has issues:

1. Go to Cloudflare Pages → Your project → **Deployments**
2. Find previous successful deployment
3. Click **"..."** → **"Rollback to this deployment"**
4. Confirm rollback

---

## 📝 Deployment Logs

### **View Build Logs**

1. Go to Cloudflare Pages → Your project → **Deployments**
2. Click on deployment
3. View **Build log** tab

### **Common Log Messages**

**Success:**
```
✓ Build completed successfully
✓ Deployment complete
✓ Site is live at https://design-kit-xxx.pages.dev
```

**Warnings:**
```
⚠ Large bundle size detected
⚠ Unused dependencies found
⚠ Missing environment variable (non-critical)
```

**Errors:**
```
✗ Build failed: Module not found
✗ Type error in src/components/...
✗ Environment variable required: NEXT_PUBLIC_SUPABASE_URL
```

---

## 🎯 Production Optimization

### **Performance**

- [ ] Enable Cloudflare caching
- [ ] Configure cache headers
- [ ] Optimize images (WebP format)
- [ ] Enable Brotli compression
- [ ] Minify CSS and JavaScript
- [ ] Use CDN for static assets

### **Security**

- [ ] Enable Cloudflare WAF (Web Application Firewall)
- [ ] Configure rate limiting
- [ ] Enable DDoS protection
- [ ] Set up security headers
- [ ] Enable HSTS
- [ ] Configure CSP (Content Security Policy)

### **SEO**

- [ ] Submit sitemap to Google Search Console
- [ ] Configure robots.txt
- [ ] Add structured data (JSON-LD)
- [ ] Optimize meta tags
- [ ] Set up Google Analytics (or Plausible)

---

## 📞 Support

### **Cloudflare Support**

- Documentation: https://developers.cloudflare.com/pages/
- Community: https://community.cloudflare.com/
- Status: https://www.cloudflarestatus.com/

### **Project Support**

- GitHub Issues: https://github.com/yourusername/design-kit/issues
- Email: support@designkit.com

---

## ✅ Final Checklist

Before going live:

- [ ] Production build tested locally (`npm run build && npm run start`)
- [ ] All environment variables configured in Cloudflare
- [ ] Supabase production database set up and migrated
- [ ] Stripe live keys configured
- [ ] Stripe webhook endpoint configured and tested
- [ ] Custom domain connected (if applicable)
- [ ] SSL certificate active and verified
- [ ] OAuth redirect URLs updated
- [ ] All critical paths tested in production
- [ ] Error tracking configured (Sentry)
- [ ] Analytics configured (Plausible)
- [ ] Performance metrics verified (Lighthouse score > 90)
- [ ] Security headers configured
- [ ] Backup of database schema created
- [ ] Documentation updated with production URLs
- [ ] Team notified of deployment

---

## 🎉 Congratulations!

Your Design Kit application is now live in production! 🚀

**Next Steps:**
1. Monitor error logs for first 24 hours
2. Check analytics for user behavior
3. Gather user feedback
4. Plan next features and improvements

---

<p align="center">
  <strong>Happy Deploying! 🎨</strong>
</p>
