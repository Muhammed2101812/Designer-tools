# Performance and Security Testing Guide

This document describes the comprehensive performance and security testing suite implemented for the Design Kit project.

## Overview

The testing suite includes four main categories of tests:

1. **Lighthouse Performance Audits** - Web performance metrics and Core Web Vitals
2. **Security Headers Validation** - HTTP security headers compliance
3. **Rate Limiting Tests** - API rate limiting functionality
4. **Security Vulnerability Tests** - SQL injection, XSS, and path traversal protection

## Performance Targets

The application must meet these performance targets:

- **Performance Score**: ≥90 (Lighthouse)
- **Accessibility Score**: ≥90 (Lighthouse)
- **Best Practices Score**: ≥90 (Lighthouse)
- **SEO Score**: ≥90 (Lighthouse)
- **First Contentful Paint (FCP)**: ≤1.5s
- **Largest Contentful Paint (LCP)**: ≤2.5s
- **Time to Interactive (TTI)**: ≤3.5s
- **Cumulative Layout Shift (CLS)**: ≤0.1
- **First Input Delay (FID)**: ≤100ms

## Security Requirements

### Required Security Headers

1. **Content-Security-Policy** - Prevents XSS attacks
2. **X-Frame-Options** - Prevents clickjacking (SAMEORIGIN)
3. **X-Content-Type-Options** - Prevents MIME sniffing (nosniff)
4. **Referrer-Policy** - Controls referrer information
5. **Strict-Transport-Security** - Enforces HTTPS (HTTPS only)
6. **Permissions-Policy** - Controls browser features

### Rate Limiting Requirements

- **IP-based limiting**: 10 requests/minute for public endpoints
- **User-based limiting**: 30 requests/minute for authenticated endpoints
- **API tool limiting**: 5 requests/minute for processing endpoints

### Vulnerability Protection

- **SQL Injection**: All database queries must be parameterized
- **XSS Protection**: All user input must be properly sanitized
- **Path Traversal**: File access must be restricted to allowed directories

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Individual Test Commands

```bash
# Lighthouse performance audit
npm run test:lighthouse

# Security headers validation
npm run test:security-headers

# Rate limiting tests
npm run test:rate-limit

# Security vulnerability tests
npm run test:security-vulns

# Run all performance and security tests
npm run test:performance-security
```

### Manual Test Execution

You can also run tests manually with custom base URLs:

```bash
# Test against localhost (default)
node scripts/lighthouse-audit.js

# Test against staging environment
node scripts/lighthouse-audit.js https://staging.designkit.com

# Test against production
node scripts/lighthouse-audit.js https://designkit.com
```

## Test Scripts

### 1. Lighthouse Audit (`scripts/lighthouse-audit.js`)

**Purpose**: Measures web performance metrics and validates against targets.

**Pages Tested**:
- Landing page (/)
- Pricing page (/pricing)
- Color Picker (/color-picker)
- Image Cropper (/image-cropper)
- QR Generator (/qr-generator)

**Output**: `lighthouse-report.json`

**Key Metrics**:
- Performance, Accessibility, Best Practices, SEO scores
- Core Web Vitals (FCP, LCP, TTI, CLS, FID)
- Detailed recommendations for improvements

### 2. Security Headers Test (`scripts/security-headers-test.js`)

**Purpose**: Validates HTTP security headers across all endpoints.

**Endpoints Tested**:
- / (landing page)
- /pricing
- /color-picker
- /api/health
- /dashboard
- /login

**Output**: `security-headers-report.json`

**Validation**:
- Presence of required security headers
- Correct header values and formats
- Coverage analysis across endpoints

### 3. Rate Limiting Test (`scripts/rate-limit-test.js`)

**Purpose**: Tests rate limiting implementation and proper 429 responses.

**Test Scenarios**:
- IP-based rate limiting on public endpoints
- User-based rate limiting on authenticated endpoints
- API tool rate limiting on processing endpoints

**Output**: `rate-limit-test-report.json`

**Validation**:
- Rate limits trigger at expected thresholds
- Proper rate limit headers (X-RateLimit-*)
- Retry-After headers on 429 responses

### 4. Security Vulnerability Test (`scripts/security-vulnerability-test.js`)

**Purpose**: Tests for common security vulnerabilities.

**Vulnerability Types**:
- SQL Injection (various payload types)
- Cross-Site Scripting (XSS)
- Path Traversal attacks

**Output**: `security-vulnerability-report.json`

**Test Endpoints**:
- User profile API
- Tool processing APIs
- Stripe integration APIs
- Tool pages with parameters

### 5. Comprehensive Test Suite (`scripts/performance-security-test-suite.js`)

**Purpose**: Orchestrates all tests and generates a unified report.

**Features**:
- Runs all tests in sequence
- Server health check before testing
- Unified pass/fail determination
- Comprehensive reporting
- Performance and security scoring

**Output**: `performance-security-report.json`

## Interpreting Results

### Performance Results

**Green (✅)**: All targets met
- Performance score ≥90
- All Core Web Vitals within targets
- Ready for production

**Red (❌)**: Targets not met
- Review specific metrics that failed
- Check recommendations in Lighthouse report
- Optimize before deployment

### Security Results

**Green (✅)**: Secure configuration
- All security headers present and valid
- Rate limiting working correctly
- No vulnerabilities detected

**Red (❌)**: Security issues found
- Review specific vulnerabilities
- Fix security headers or rate limiting
- Re-test after fixes

## Continuous Integration

### GitHub Actions Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Performance and Security Tests
  run: |
    npm run build
    npm run start &
    sleep 10
    npm run test:performance-security
    kill %1
```

### Pre-deployment Checklist

Before deploying to production:

1. ✅ All performance targets met
2. ✅ All security headers configured
3. ✅ Rate limiting functional
4. ✅ No security vulnerabilities
5. ✅ Tests pass in staging environment

## Troubleshooting

### Common Issues

**Lighthouse fails to connect**:
- Ensure server is running on correct port
- Check firewall settings
- Verify URL accessibility

**Security headers missing**:
- Check Next.js configuration in `next.config.js`
- Verify headers are not being overridden
- Test with curl: `curl -I http://localhost:3000`

**Rate limiting not working**:
- Verify Upstash Redis connection
- Check environment variables
- Review rate limiting middleware implementation

**False positive vulnerabilities**:
- Review payload detection logic
- Check if proper input sanitization is in place
- Verify database query parameterization

### Performance Optimization Tips

1. **Optimize images**: Use Next.js Image component
2. **Code splitting**: Implement dynamic imports
3. **Reduce bundle size**: Analyze with `npm run build`
4. **Enable compression**: Configure gzip/brotli
5. **Use CDN**: Serve static assets from CDN

### Security Hardening Tips

1. **Update dependencies**: Regular security updates
2. **Input validation**: Use Zod schemas
3. **Database security**: Use RLS and parameterized queries
4. **API security**: Implement proper authentication
5. **Monitoring**: Set up security alerts

## Reporting Issues

When tests fail:

1. **Capture full output**: Save console logs and reports
2. **Environment details**: Node version, OS, browser
3. **Reproduction steps**: Exact commands used
4. **Expected vs actual**: What should happen vs what happened
5. **Screenshots**: For UI-related issues

## Maintenance

### Regular Tasks

- **Weekly**: Run full test suite
- **Monthly**: Update performance targets
- **Quarterly**: Review security requirements
- **Before releases**: Full validation

### Updating Tests

When adding new features:

1. Add new endpoints to test configurations
2. Update performance targets if needed
3. Add new security test cases
4. Update documentation

## References

- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Web Performance Metrics](https://web.dev/metrics/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)