#!/usr/bin/env node

/**
 * Lighthouse Performance Audit Script
 * Runs Lighthouse audits on key pages and validates performance targets
 */

const lighthouse = require('lighthouse').default || require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Performance targets (from requirements)
const PERFORMANCE_TARGETS = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  fcp: 1500, // First Contentful Paint (ms)
  lcp: 2500, // Largest Contentful Paint (ms)
  tti: 3500, // Time to Interactive (ms)
  cls: 0.1,  // Cumulative Layout Shift
  fid: 100   // First Input Delay (ms)
};

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Landing Page', url: '/' },
  { name: 'Pricing Page', url: '/pricing' },
  { name: 'Color Picker', url: '/color-picker' },
  { name: 'Image Cropper', url: '/image-cropper' },
  { name: 'QR Generator', url: '/qr-generator' }
];

class LighthouseAuditor {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async runAudit(page) {
    console.log(`🔍 Auditing ${page.name}...`);
    
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };

    try {
      const runnerResult = await lighthouse(`${this.baseUrl}${page.url}`, options);
      await chrome.kill();

      const { lhr } = runnerResult;
      const result = {
        page: page.name,
        url: page.url,
        scores: {
          performance: Math.round(lhr.categories.performance.score * 100),
          accessibility: Math.round(lhr.categories.accessibility.score * 100),
          bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
          seo: Math.round(lhr.categories.seo.score * 100)
        },
        metrics: {
          fcp: lhr.audits['first-contentful-paint']?.numericValue || 0,
          lcp: lhr.audits['largest-contentful-paint']?.numericValue || 0,
          tti: lhr.audits['interactive']?.numericValue || 0,
          cls: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
          fid: lhr.audits['max-potential-fid']?.numericValue || 0
        },
        timestamp: new Date().toISOString()
      };

      this.results.push(result);
      return result;
    } catch (error) {
      console.error(`❌ Error auditing ${page.name}:`, error.message);
      await chrome.kill();
      throw error;
    }
  }

  async runAllAudits() {
    console.log('🚀 Starting Lighthouse audits...\n');
    
    for (const page of PAGES_TO_AUDIT) {
      try {
        await this.runAudit(page);
        console.log(`✅ ${page.name} audit completed\n`);
      } catch (error) {
        console.error(`❌ ${page.name} audit failed:`, error.message);
      }
    }
  }

  validateResults() {
    console.log('📊 Performance Validation Results:\n');
    
    let allPassed = true;
    const summary = {
      passed: 0,
      failed: 0,
      details: []
    };

    this.results.forEach(result => {
      const pageResults = {
        page: result.page,
        passed: true,
        issues: []
      };

      // Check performance scores
      Object.entries(result.scores).forEach(([category, score]) => {
        const target = PERFORMANCE_TARGETS[category] || PERFORMANCE_TARGETS.performance;
        if (score < target) {
          pageResults.passed = false;
          pageResults.issues.push(`${category}: ${score} (target: ${target})`);
        }
      });

      // Check Core Web Vitals
      Object.entries(result.metrics).forEach(([metric, value]) => {
        const target = PERFORMANCE_TARGETS[metric];
        if (target && value > target) {
          pageResults.passed = false;
          pageResults.issues.push(`${metric}: ${Math.round(value)}ms (target: ${target}ms)`);
        }
      });

      if (pageResults.passed) {
        console.log(`✅ ${result.page}: All targets met`);
        summary.passed++;
      } else {
        console.log(`❌ ${result.page}: Issues found`);
        pageResults.issues.forEach(issue => console.log(`   - ${issue}`));
        summary.failed++;
        allPassed = false;
      }

      summary.details.push(pageResults);
    });

    console.log(`\n📈 Summary: ${summary.passed} passed, ${summary.failed} failed`);
    
    return { allPassed, summary };
  }

  generateReport() {
    const reportPath = path.join(process.cwd(), 'lighthouse-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      targets: PERFORMANCE_TARGETS,
      results: this.results,
      summary: this.validateResults().summary
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
    
    return reportPath;
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  (async () => {
    try {
      const auditor = new LighthouseAuditor(baseUrl);
      await auditor.runAllAudits();
      const { allPassed } = auditor.validateResults();
      auditor.generateReport();
      
      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      console.error('❌ Lighthouse audit failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = LighthouseAuditor;