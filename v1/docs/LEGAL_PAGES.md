# 📜 Legal Pages Documentation

This document provides information about the Privacy Policy and Terms of Service pages.

## Overview

Design Kit includes comprehensive legal documentation to ensure compliance with:
- ✅ **GDPR** (General Data Protection Regulation)
- ✅ **CCPA** (California Consumer Privacy Act)
- ✅ **Standard legal best practices**

## Pages

### 1. Privacy Policy (`/privacy`)

**Location:** `app/(legal)/privacy/page.tsx`

**URL:** https://yoursite.com/privacy

**What it covers:**
- Information collection and usage
- Data sharing and disclosure
- Data security measures
- Data retention policies
- User rights (GDPR)
- Cookie usage
- Children's privacy
- International data transfers
- Contact information

**Key Features:**
- ✅ GDPR compliant
- ✅ Privacy-first approach highlighted
- ✅ Clear explanation of client-side vs API tools
- ✅ No cookies for analytics (Plausible)
- ✅ User rights clearly defined
- ✅ Third-party service disclosure

**Updates Required:**
- [ ] Update company contact email
- [ ] Add company address (if required)
- [ ] Adjust data retention periods if needed
- [ ] Update third-party services list if you add/remove any

### 2. Terms of Service (`/terms`)

**Location:** `app/(legal)/terms/page.tsx`

**URL:** https://yoursite.com/terms

**What it covers:**
- Service description
- User accounts and registration
- Subscription plans and billing
- Usage limits and quotas
- User content and files
- Prohibited uses
- Intellectual property
- Third-party services
- Warranties and liability
- Dispute resolution
- Termination policies

**Key Features:**
- ✅ Clear subscription terms
- ✅ Usage limits defined
- ✅ File ownership clarified
- ✅ Liability limitations
- ✅ Refund policy stated
- ✅ Termination rights defined

**Updates Required:**
- [ ] Add jurisdiction (e.g., "laws of California, USA")
- [ ] Update company contact information
- [ ] Customize dispute resolution process
- [ ] Adjust pricing/plan details if changed

## Footer Integration

Legal links are already integrated in the footer (`components/layout/Footer.tsx`):

```tsx
{
  label: 'Privacy Policy',
  href: '/privacy'
},
{
  label: 'Terms of Service',
  href: '/terms'
}
```

## Layout

Legal pages use a dedicated layout (`app/(legal)/layout.tsx`) that:
- Provides clean, minimal design
- Focuses on readability
- Uses prose styling for better typography

## Important Customizations Needed

Before going to production, update these placeholders:

### 1. Privacy Policy

**Line to update:** Contact section
```tsx
// Current:
<li><strong>Email:</strong> privacy@designkit.com</li>

// Update to your actual email:
<li><strong>Email:</strong> your-actual-email@yourdomain.com</li>
```

### 2. Terms of Service

**Line to update:** Governing Law section
```tsx
// Current:
<p>
  These Terms are governed by and construed in accordance with
  the laws of [Your Jurisdiction], without regard to conflict
  of law principles.
</p>

// Update to your jurisdiction:
<p>
  These Terms are governed by and construed in accordance with
  the laws of California, United States, without regard to
  conflict of law principles.
</p>
```

**Contact section:**
```tsx
// Current:
<li><strong>Email:</strong> support@designkit.com</li>

// Update to your actual email:
<li><strong>Email:</strong> your-actual-email@yourdomain.com</li>
```

## Legal Best Practices

### 1. Display Prominently

Legal links should be visible in:
- ✅ Footer (already done)
- ⚠️ Signup page (add checkbox: "I agree to Terms and Privacy Policy")
- ⚠️ Checkout page (show before payment)

### 2. Update Regularly

- Review every 6-12 months
- Update "Last updated" date when changed
- Notify users of significant changes
- Keep old versions archived

### 3. Get Legal Review

Consider having a lawyer review if:
- You handle sensitive data (health, financial)
- You target specific regulated industries
- You operate in multiple countries
- Your business grows significantly

### 4. User Consent

**Signup Flow:**
```tsx
<Checkbox id="terms">
  I agree to the{' '}
  <Link href="/terms" className="underline">Terms of Service</Link>
  {' '}and{' '}
  <Link href="/privacy" className="underline">Privacy Policy</Link>
</Checkbox>
```

**Checkout Flow:**
```tsx
<p className="text-sm text-muted-foreground">
  By completing your purchase, you agree to our{' '}
  <Link href="/terms" className="underline">Terms of Service</Link>
  {' '}and{' '}
  <Link href="/privacy" className="underline">Privacy Policy</Link>
</p>
```

## GDPR Compliance Checklist

- ✅ Privacy Policy exists and is accessible
- ✅ User rights clearly defined
- ✅ Data collection purposes explained
- ✅ Third-party data sharing disclosed
- ✅ Data retention periods specified
- ✅ User can access their data (profile page)
- ✅ User can delete their account
- ⚠️ Cookie consent banner (not needed - we use Plausible which doesn't use cookies)
- ✅ Email preferences management
- ⚠️ Data export functionality (can be added to profile)

## Additional Legal Pages (Optional)

### 1. Cookie Policy

Not required for Design Kit because:
- Plausible Analytics is cookie-less
- Only essential cookies (auth) are used
- No advertising or tracking cookies

### 2. Acceptable Use Policy

Can be added if you want more detail on prohibited uses. Currently covered in Terms of Service section 7.

### 3. DMCA Policy

Add if you allow user-generated content that could infringe copyright. Design Kit processes user files but doesn't host public content.

### 4. Refund Policy

Currently covered in Terms of Service (section 4.2). Can be extracted to separate page for clarity.

## Testing Legal Pages

### 1. Readability

- [ ] Test on mobile devices
- [ ] Check font sizes are readable
- [ ] Ensure proper spacing
- [ ] Test dark mode

### 2. Links

- [ ] All internal links work
- [ ] External links open in new tabs
- [ ] Email links work (mailto:)

### 3. SEO

```tsx
// Already included in both pages:
export const metadata: Metadata = {
  title: 'Privacy Policy - Design Kit',
  description: '...',
}
```

### 4. Accessibility

- [ ] Proper heading hierarchy (h1, h2, h3)
- [ ] Links have descriptive text
- [ ] Readable contrast ratios
- [ ] Screen reader friendly

## Changelog Template

When you update legal pages, document changes:

```markdown
## Privacy Policy Changes

### 2025-01-15
- Added information about new analytics provider
- Updated data retention periods
- Clarified file processing for API tools

### 2024-12-01
- Initial version published
```

## Contact for Legal Matters

Update these email addresses:
- **Privacy inquiries:** privacy@yourcompany.com
- **General support:** support@yourcompany.com
- **Legal department:** legal@yourcompany.com

## Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [Stripe's Legal Guide](https://stripe.com/guides/legal)
- [Supabase Privacy Compliance](https://supabase.com/privacy)
- [Privacy Policy Generator](https://www.privacypolicies.com/)
- [Terms Generator](https://www.termsofservicegenerator.net/)

## Disclaimer

**⚠️ Important:** This legal documentation is provided as a template and starting point. It is **not legal advice**. You should:

1. Consult with a qualified attorney in your jurisdiction
2. Customize based on your specific business model
3. Update regularly as your service evolves
4. Ensure compliance with local laws

---

**Last Updated:** {new Date().toLocaleDateString()}
