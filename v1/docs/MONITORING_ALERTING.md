# Monitoring and Alerting Guide

This guide covers the comprehensive monitoring and alerting setup for Design Kit, including error tracking, performance monitoring, uptime monitoring, and business metrics.

## Overview

Design Kit uses a multi-layered monitoring approach:

- **Error Tracking**: Sentry for error monitoring and alerting
- **Performance Monitoring**: Response time, throughput, and resource usage
- **Uptime Monitoring**: External service monitoring for availability
- **Business Metrics**: User activity, conversion rates, and revenue tracking
- **Database Monitoring**: Connection health, query performance, and storage
- **Security Monitoring**: Failed authentication attempts and suspicious activity

## Quick Start

### 1. Setup Monitoring

```bash
# Run the monitoring setup script
npm run setup-monitoring

# View monitoring dashboard
npm run monitoring-dashboard

# Start watching mode (refreshes every 30 seconds)
npm run monitoring-watch
```

### 2. Configure Environment Variables

Add these to your `.env.local`:

```bash
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=design-kit

# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

### 3. Health Check Endpoint

The application provides a health check endpoint at `/api/health`:

```bash
curl https://your-domain.com/api/health
```

Response format:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "status": "ok",
  "version": "0.1.0",
  "environment": "production",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "external_apis": "ok",
    "memory": "ok"
  }
}
```

## Error Tracking with Sentry

### Configuration

Sentry is configured in three files:
- `sentry.client.config.ts` - Browser-side error tracking
- `sentry.server.config.ts` - Server-side error tracking  
- `sentry.edge.config.ts` - Edge runtime error tracking

### Alert Rules

The following alert rules are automatically configured:

#### High Error Rate - Critical
- **Trigger**: >5% error rate in 5 minutes
- **Action**: Immediate notification to all channels
- **Frequency**: Every 5 minutes while condition persists

#### API Endpoint Errors
- **Trigger**: >10 errors in 5 minutes for `/api/*` endpoints
- **Action**: Notify development team
- **Frequency**: Every 30 minutes

#### Payment Processing Errors
- **Trigger**: Any error in Stripe-related operations
- **Action**: Immediate notification
- **Frequency**: Every 1 minute (critical for revenue)

#### Database Connection Errors
- **Trigger**: >5 database errors in 1 minute
- **Action**: Notify infrastructure team
- **Frequency**: Every 10 minutes

#### Performance Degradation
- **Trigger**: >20% of transactions exceed 2 second response time
- **Action**: Notify performance team
- **Frequency**: Every 15 minutes

### Custom Error Reporting

Use the enhanced error reporting functions:

```typescript
import { reportError, reportPerformanceIssue } from '@/lib/utils/error-logger'

// Report application errors
try {
  await processImage()
} catch (error) {
  await reportError(error, {
    component: 'image-processor',
    toolName: 'background-remover',
    userId: user.id,
  })
}

// Report performance issues
const start = Date.now()
await slowOperation()
const duration = Date.now() - start
reportPerformanceIssue('slow_operation', duration, {
  component: 'api',
  endpoint: '/api/tools/process',
})
```

## Performance Monitoring

### Thresholds

| Metric | Warning | Critical | Target |
|--------|---------|----------|---------|
| Response Time | 2000ms | 5000ms | 1000ms |
| Error Rate | 2% | 5% | <1% |
| Apdex Score | 0.85 | 0.7 | 0.95 |
| Memory Usage | 75% | 90% | <50% |

### Key Metrics Tracked

- **Response Time**: P50, P95, P99 percentiles
- **Throughput**: Requests per minute
- **Error Rate**: Percentage of failed requests
- **Apdex Score**: Application Performance Index
- **Database Performance**: Query time, connection pool usage
- **External API Performance**: Third-party service response times

## Uptime Monitoring

### Monitored Endpoints

| Endpoint | Method | Expected Status | Timeout | Critical |
|----------|--------|----------------|---------|----------|
| `/api/health` | GET | 200 | 30s | Yes |
| `/dashboard` | GET | 200/302 | 30s | No |
| `/api/stripe/webhook` | POST | 400 | 30s | Yes |
| `/api/tools/background-remover` | POST | 401 | 30s | No |

### Recommended Services

- **UptimeRobot** (Free tier available)
- **Pingdom** (Comprehensive monitoring)
- **StatusCake** (Global monitoring locations)
- **Better Uptime** (Modern interface)

### Configuration Example (UptimeRobot)

```bash
# Monitor main health endpoint
URL: https://your-domain.com/api/health
Type: HTTP(s)
Monitoring Interval: 1 minute
Timeout: 30 seconds
Expected Status Code: 200
Expected Content: "ok"

# Alert Contacts
Email: alerts@your-domain.com
Slack: #alerts channel webhook
SMS: +1234567890 (for critical alerts)
```

## Database Monitoring

### Automated Backups

```bash
# Create full backup
npm run backup-db

# Create compressed backup
npm run backup-db -- --compress

# Create incremental backup
npm run backup-db -- --type=incremental

# List available backups
npm run backup-db -- --list
```

### Backup Strategy

- **Daily Backups**: Full database dump at 2 AM UTC
- **Retention**: 7 daily, 4 weekly, 12 monthly backups
- **Verification**: Automated integrity checks
- **Storage**: Local + cloud storage (S3/GCS)

### Database Health Checks

The system monitors:
- Connection pool usage (alert at 80%)
- Query performance (alert for queries >1s)
- Disk space usage (alert at 85%)
- Replication lag (if applicable)

## Business Metrics Monitoring

### Key Performance Indicators (KPIs)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Daily Active Users | 100 | <50 | <25 |
| Conversion Rate | 5% | <2% | <1% |
| Daily Revenue | $1000 | <$500 | <$250 |
| Churn Rate | <5% | >5% | >10% |
| Tool Error Rate | <2% | >2% | >5% |

### Tracking Implementation

```typescript
import { reportBusinessMetricAnomaly } from '@/lib/utils/error-logger'

// Track conversion rate
const conversionRate = conversions / visitors
const expectedRate = 0.05 // 5%

reportBusinessMetricAnomaly('conversion_rate', conversionRate, expectedRate, {
  period: 'daily',
  visitors,
  conversions,
})
```

## Alert Channels and Escalation

### Notification Channels

#### Critical Alerts
- **PagerDuty**: Immediate escalation
- **SMS**: Direct to on-call engineer
- **Slack**: #critical-alerts channel

#### Warning Alerts
- **Slack**: #alerts channel
- **Email**: Development team

#### Info Alerts
- **Email**: Weekly digest

### Escalation Policy

1. **Initial Alert**: Slack notification
2. **5 minutes**: PagerDuty escalation
3. **15 minutes**: SMS to on-call engineer
4. **30 minutes**: Phone call to engineering manager

### Alert Suppression

- **Duplicate Window**: 30 minutes
- **Maintenance Mode**: Disable non-critical alerts
- **Quiet Hours**: None (24/7 monitoring for critical systems)

## Security Monitoring

### Failed Authentication Monitoring

- **Threshold**: 10 failed attempts per IP per hour
- **Action**: Temporary IP block (24 hours)
- **Alert**: Security team notification

### Suspicious Activity Detection

- **Rapid Requests**: >100 requests/minute from single IP
- **Unusual Geo Patterns**: Logins from new countries
- **Bot Detection**: Automated traffic patterns

### SSL Certificate Monitoring

- **Warning**: 30 days before expiry
- **Critical**: 7 days before expiry
- **Auto-renewal**: Let's Encrypt with Cloudflare

## Monitoring Dashboard

### Command Line Dashboard

```bash
# View current system status
npm run monitoring-dashboard

# Start watching mode (auto-refresh)
npm run monitoring-watch
```

### Dashboard Sections

1. **System Status**: Overall health indicator
2. **Services**: Database, Redis, External APIs
3. **Metrics**: Error rate, response time, usage
4. **Business Metrics**: DAU, WAU, subscriptions
5. **Tool Usage**: Most popular tools
6. **Active Alerts**: Current issues
7. **Thresholds**: Warning and critical levels

## Troubleshooting

### Common Issues

#### High Error Rate
1. Check Sentry for error details
2. Review recent deployments
3. Check external service status
4. Verify database connectivity

#### Slow Response Times
1. Check database query performance
2. Review external API response times
3. Monitor memory usage
4. Check for resource contention

#### Database Connection Issues
1. Verify Supabase service status
2. Check connection pool usage
3. Review recent schema changes
4. Monitor disk space

### Emergency Procedures

#### System Down
1. Check health endpoint: `curl https://your-domain.com/api/health`
2. Review Sentry for critical errors
3. Check uptime monitoring alerts
4. Verify DNS and CDN status
5. Contact hosting provider if needed

#### Data Loss Prevention
1. Immediate database backup: `npm run backup-db`
2. Stop write operations if corruption suspected
3. Contact Supabase support for PITR
4. Document incident timeline

## Maintenance

### Regular Tasks

#### Daily
- Review monitoring dashboard
- Check backup completion
- Monitor error trends

#### Weekly
- Review performance trends
- Update alert thresholds if needed
- Test backup restoration
- Security audit review

#### Monthly
- Review and update monitoring configuration
- Analyze business metric trends
- Update documentation
- Disaster recovery testing

### Monitoring the Monitors

- **Sentry Quota**: Monitor usage to avoid hitting limits
- **Uptime Service**: Verify monitoring service is working
- **Backup Verification**: Test restore procedures
- **Alert Testing**: Verify notification channels work

## Integration with CI/CD

### Deployment Monitoring

```yaml
# .github/workflows/deploy.yml
- name: Wait for deployment health check
  run: |
    for i in {1..30}; do
      if curl -f https://your-domain.com/api/health; then
        echo "Deployment healthy"
        exit 0
      fi
      sleep 10
    done
    echo "Deployment health check failed"
    exit 1
```

### Performance Regression Detection

```yaml
- name: Performance test
  run: |
    npm run test:performance
    npm run perf:audit
```

## Cost Optimization

### Service Tiers

#### Sentry
- **Free**: 5,000 errors/month
- **Team**: $26/month for 50,000 errors
- **Organization**: $80/month for 200,000 errors

#### Uptime Monitoring
- **UptimeRobot Free**: 50 monitors, 5-minute intervals
- **UptimeRobot Pro**: $7/month, 1-minute intervals
- **Pingdom**: $15/month for advanced features

#### Backup Storage
- **Local**: Free but limited
- **S3 Standard-IA**: $0.0125/GB/month
- **S3 Glacier**: $0.004/GB/month for long-term

### Optimization Tips

1. **Adjust Sample Rates**: Lower Sentry sample rates in production
2. **Alert Tuning**: Reduce noise by tuning thresholds
3. **Backup Compression**: Use gzip to reduce storage costs
4. **Log Retention**: Implement log rotation and cleanup

## Support and Resources

### Documentation
- [Sentry Documentation](https://docs.sentry.io/)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/monitoring)

### Community
- [Sentry Community](https://forum.sentry.io/)
- [Supabase Discord](https://discord.supabase.com/)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

### Emergency Contacts
- **Sentry Support**: support@sentry.io
- **Supabase Support**: support@supabase.com
- **Cloudflare Support**: Via dashboard

---

For questions or issues with monitoring setup, please refer to the troubleshooting section or contact the development team.