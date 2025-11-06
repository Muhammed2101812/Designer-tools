# 📊 Monitoring and Alerting Setup

## 📋 Table of Contents

1. [Overview](#overview)
2. [Sentry Setup](#sentry-setup)
3. [Performance Monitoring](#performance-monitoring)
4. [Error Tracking](#error-tracking)
5. [Rate Limit Monitoring](#rate-limit-monitoring)
6. [Usage Analytics](#usage-analytics)
7. [Alerting Configuration](#alerting-configuration)
8. [Security Monitoring](#security-monitoring)
9. [Infrastructure Monitoring](#infrastructure-monitoring)

---

## 🔍 Overview

Monitoring and alerting systems are crucial for maintaining application health, identifying issues, and ensuring optimal user experience. Our monitoring stack includes:

- **Sentry**: Error tracking and performance monitoring
- **Custom Analytics**: Usage tracking and business metrics
- **Rate Limit Monitoring**: API usage tracking
- **Security Monitoring**: Suspicious activity detection
- **Infrastructure Monitoring**: System health tracking

---

## 🐛 Sentry Setup

### Installation

Sentry is already integrated in the project via:

```bash
npm install @sentry/nextjs
```

### Configuration Files

1. `sentry.client.config.ts` - Client-side error tracking
2. `sentry.server.config.ts` - Server-side error tracking
3. `sentry.edge.config.ts` - Edge runtime error tracking

### Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your_dsn@sentry.io/project_id
SENTRY_AUTH_TOKEN=your_auth_token
```

### Key Features Enabled

- Automatic error capture
- Performance tracing (100% sample rate in development, 10% in production)
- Session replay (opt-in)
- User feedback collection
- Release tracking

---

## 🚀 Performance Monitoring

### Web Vitals Tracking

Automatically tracks Core Web Vitals:
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **TTFB** (Time to First Byte)

### Custom Metrics

Tracks tool-specific performance:
- Image processing time
- File upload duration
- API response times
- Canvas operations

### Performance Thresholds

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| FCP | < 1.5s | > 2.5s |
| LCP | < 2.5s | > 4.0s |
| CLS | < 0.1 | > 0.25 |
| FID | < 100ms | > 300ms |
| TTFB | < 200ms | > 1000ms |

### Monitoring Endpoints

- `/api/tools/background-remover` - Background removal performance
- `/api/tools/image-upscaler` - Image upscaling performance
- `/api/tools/mockup-generator` - Mockup generation performance
- `/api/stripe/*` - Payment processing performance

---

## ⚠️ Error Tracking

### Error Categories

1. **Client-Side Errors**
   - JavaScript exceptions
   - React component errors
   - Browser compatibility issues

2. **Server-Side Errors**
   - API route failures
   - Database errors
   - External service failures

3. **Edge Runtime Errors**
   - Middleware failures
   - Serverless function errors

### Error Context

Automatically captures:
- User ID and session info
- Request URL and headers
- Environment details
- Stack traces
- Browser/device info

### Error Severity Levels

- **Fatal**: Application crash or data loss
- **Error**: Significant functionality issue
- **Warning**: Minor issue or degraded performance
- **Info**: Informational events
- **Debug**: Development/debugging events

---

## 🚦 Rate Limit Monitoring

### Rate Limit Tracking

Monitors API usage across plans:
- Free: 60 requests/minute
- Premium: 120 requests/minute
- Pro: 300 requests/minute

### Key Metrics

- Requests per minute (RPM)
- Rate limit hits
- User quota usage
- Daily tool usage

### Rate Limit Alerts

Triggers alerts when:
- 80% of rate limit reached
- Rate limit exceeded
- Unusual usage patterns detected

---

## 📈 Usage Analytics

### Tool Usage Tracking

Tracks usage for each tool:
- Background Remover
- Image Upscaler
- Mockup Generator
- Color Picker
- QR Code Generator

### User Behavior Analytics

- Feature adoption rates
- User journey tracking
- Conversion funnels
- Retention metrics

### Database Tables

Analytics data stored in:
- `tool_usage` - Individual tool operations
- `daily_limits` - Daily quota usage
- `user_stats` - Aggregated user statistics
- `conversion_metrics` - Funnel tracking

### Analytics Dashboard

Accessible at `/admin/analytics` for admins with:
- Real-time usage charts
- Tool popularity rankings
- User retention graphs
- Revenue tracking

---

## 🔔 Alerting Configuration

### Alert Channels

1. **Slack**
   - Critical errors: #alerts channel
   - Performance issues: #performance channel
   - Security events: #security channel

2. **Email**
   - System administrators
   - Engineering team leads

3. **SMS**
   - Critical system outages
   - Security incidents

### Alert Rules

#### Critical Alerts (Immediate Response)

- Server errors > 5% for 5 minutes
- Response time > 5s for 10 minutes
- Database connection failures
- Payment processing errors

#### Warning Alerts (Within 1 Hour)

- Server errors > 1% for 15 minutes
- Response time > 3s for 30 minutes
- Rate limit exceeded > 100 times/hour
- User quota exceeded > 1000 times/hour

#### Info Alerts (Daily Digest)

- New feature adoption reports
- Daily usage summaries
- Performance trend reports
- Security scan results

### Alert Suppression

Prevents alert spam:
- Deduplication for repeated errors
- Rate limiting for frequent alerts
- Maintenance windows
- Known issue filtering

---

## 🔐 Security Monitoring

### Threat Detection

Monitors for:
- Brute force attacks
- Suspicious login attempts
- Rate limit abuse
- Data exfiltration attempts

### Security Events

Tracks:
- Authentication failures
- Unauthorized access attempts
- API abuse patterns
- Suspicious file uploads

### Security Alerting

Triggers alerts for:
- > 10 failed login attempts/user/hour
- > 100 API requests/user/minute
- File type mismatches
- Large file uploads from new IPs

### Compliance Monitoring

Ensures:
- GDPR compliance
- Data retention policies
- Access logging
- Audit trail maintenance

---

## ⚙️ Infrastructure Monitoring

### Application Health

Monitors:
- Server uptime
- Database connectivity
- External service availability
- CDN performance

### Resource Usage

Tracks:
- CPU utilization
- Memory consumption
- Disk space
- Network bandwidth

### Third-Party Services

Monitors uptime for:
- Supabase
- Stripe
- Resend
- Replicate
- Remove.bg

### Deployment Monitoring

Tracks:
- Deployment success/failure
- Rollback events
- Canary deployments
- Feature flag usage

---

## 🛠️ Setting Up Monitoring

### 1. Sentry Configuration

1. Create Sentry account at [sentry.io](https://sentry.io)
2. Create Next.js project
3. Get DSN from Project Settings > Client Keys
4. Get Auth Token from Account Settings > API
5. Add to environment variables:

```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### 2. Slack Integration

1. Create Slack app with Incoming Webhooks
2. Get webhook URLs for each channel
3. Add to environment variables:

```bash
SLACK_ALERTS_WEBHOOK=https://hooks.slack.com/services/xxx
SLACK_PERFORMANCE_WEBHOOK=https://hooks.slack.com/services/yyy
SLACK_SECURITY_WEBHOOK=https://hooks.slack.com/services/zzz
```

### 3. Email Alerts

Configure SMTP or use Resend:
```bash
RESEND_API_KEY=re_your_resend_api_key
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. SMS Alerts

Configure Twilio or similar service:
```bash
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
ADMIN_PHONE_NUMBER=+0987654321
```

---

## 📊 Monitoring Dashboard

### Admin Analytics Page

Located at `/admin/analytics` with:

1. **Real-time Metrics**
   - Active users
   - API requests
   - Tool usage
   - Error rates

2. **Historical Data**
   - Daily usage trends
   - Weekly growth
   - Monthly comparisons

3. **Performance Charts**
   - Response time trends
   - Tool processing times
   - User satisfaction scores

4. **Business Metrics**
   - Revenue tracking
   - Conversion rates
   - User retention
   - Feature adoption

### Custom Reports

Scheduled reports:
- **Daily**: Usage summary
- **Weekly**: Performance and growth
- **Monthly**: Business metrics and trends

### Export Capabilities

Export data as:
- CSV
- JSON
- PDF reports

---

## 🛡️ Incident Response

### Escalation Process

1. **Level 1** - Engineering team (within 15 minutes)
2. **Level 2** - Team leads (within 1 hour)
3. **Level 3** - CTO/Founder (within 4 hours)
4. **Level 4** - External support (within 24 hours)

### Incident Documentation

For each incident:
1. Create ticket in issue tracker
2. Assign priority and owner
3. Document root cause
4. Implement fix
5. Update monitoring rules
6. Communicate to users if needed

### Post-Mortem Process

After critical incidents:
1. Schedule post-mortem meeting
2. Document timeline and impact
3. Identify contributing factors
4. Create action items
5. Update documentation
6. Share learnings with team

---

## 📈 Monitoring Best Practices

### 1. Balanced Alerting

- Avoid alert fatigue with meaningful thresholds
- Use progressive alerting (info → warning → critical)
- Include contextual information in alerts

### 2. Performance Baselines

- Establish baseline metrics for normal operation
- Monitor trends, not just absolute values
- Set realistic targets based on user expectations

### 3. Security Hygiene

- Regular security scans
- Monitor for unusual patterns
- Keep dependencies updated
- Review access logs regularly

### 4. Data Retention

- Keep analytics for 1 year minimum
- Archive old data for compliance
- Maintain backup copies
- Implement GDPR-compliant deletion

### 5. Continuous Improvement

- Regular review of monitoring effectiveness
- Update thresholds based on historical data
- Add new metrics as features evolve
- Remove obsolete monitoring rules

---

## 🧪 Testing Monitoring

### Synthetic Monitoring

Regular automated tests:
- API endpoint health checks
- Tool functionality verification
- Performance benchmarking
- Security vulnerability scanning

### Chaos Engineering

Periodic fault injection:
- Database connection failures
- External service outages
- High load simulations
- Network latency tests

### Alert Testing

Verify alert delivery:
- Test critical alert channels
- Validate alert content and formatting
- Confirm escalation workflows
- Review suppression rules

---

## 📋 Monitoring Checklist

### Pre-Launch
- [ ] Sentry configured and tested
- [ ] Performance monitoring enabled
- [ ] Error tracking working
- [ ] Rate limit monitoring active
- [ ] Security monitoring configured
- [ ] Alert channels verified
- [ ] Baseline metrics established

### Post-Launch
- [ ] Monitor error rates (target: < 1%)
- [ ] Track performance metrics
- [ ] Review user feedback
- [ ] Update monitoring rules as needed
- [ ] Optimize alert thresholds
- [ ] Document any incidents

### Ongoing
- [ ] Weekly monitoring review
- [ ] Monthly performance report
- [ ] Quarterly alert tuning
- [ ] Annual security assessment
- [ ] Regular incident response drills
- [ ] Continuous improvement updates

---

**Last Updated:** 2025-01-17  
**Status:** ✅ Ready for Monitoring and Alerting Setup