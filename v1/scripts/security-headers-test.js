#!/usr/bin/env node

/**
 * Security Headers Validation Script
 * Tests security headers implementation across the application
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Required security headers and their expected values/patterns
const REQUIRED_HEADERS = {
  'content-security-policy': {
    required: true,
    description: 'Content Security Policy',
    validate: (value) => {
      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src'
      ];
      return requiredDirectives.every(directive => 
        value.toLowerCase().includes(directive)
      );
    }
  },
  'x-frame-options': {
    required: true,
    description: 'X-Frame-Options',
    validate: (value) => ['DENY', 'SAMEORIGIN'].includes(value.toUpperCase())
  },
  'x-content-type-options': {
    required: true,
    description: 'X-Content-Type-Options',
    validate: (value) => value.toLowerCase() === 'nosniff'
  },
  'referrer-policy': {
    required: true,
    description: 'Referrer Policy',
    validate: (value) => [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'strict-origin',
      'strict-origin-when-cross-origin'
    ].includes(value.toLowerCase())
  },
  'permissions-policy': {
    required: false,
    description: 'Permissions Policy',
    validate: (value) => value.length > 0
  },
  'strict-transport-security': {
    required: true, // Only for HTTPS
    description: 'HTTP Strict Transport Security',
    validate: (value) => value.includes('max-age=') && parseInt(value.match(/max-age=(\d+)/)?.[1] || '0') >= 31536000
  }
};

// Test endpoints
const TEST_ENDPOINTS = [
  '/',
  '/pricing',
  '/color-picker',
  '/api/health',
  '/dashboard',
  '/login'
];

class SecurityHeadersTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000
      };

      const req = client.request(options, (res) => {
        const result = {
          endpoint,
          statusCode: res.statusCode,
          headers: res.headers,
          securityHeaders: {},
          passed: true,
          issues: []
        };

        // Check each required security header
        Object.entries(REQUIRED_HEADERS).forEach(([headerName, config]) => {
          const headerValue = res.headers[headerName.toLowerCase()];
          
          if (!headerValue) {
            if (config.required) {
              // Skip HSTS for HTTP
              if (headerName === 'strict-transport-security' && url.protocol === 'http:') {
                return;
              }
              result.passed = false;
              result.issues.push(`Missing required header: ${config.description}`);
            }
            return;
          }

          result.securityHeaders[headerName] = headerValue;

          if (config.validate && !config.validate(headerValue)) {
            result.passed = false;
            result.issues.push(`Invalid ${config.description}: ${headerValue}`);
          }
        });

        resolve(result);
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout for ${endpoint}`));
      });

      req.end();
    });
  }

  async runAllTests() {
    console.log('🔒 Starting security headers validation...\n');
    
    for (const endpoint of TEST_ENDPOINTS) {
      try {
        console.log(`Testing ${endpoint}...`);
        const result = await this.testEndpoint(endpoint);
        this.results.push(result);
        
        if (result.passed) {
          console.log(`✅ ${endpoint}: All security headers valid`);
        } else {
          console.log(`❌ ${endpoint}: Issues found`);
          result.issues.forEach(issue => console.log(`   - ${issue}`));
        }
      } catch (error) {
        console.error(`❌ Error testing ${endpoint}:`, error.message);
        this.results.push({
          endpoint,
          error: error.message,
          passed: false,
          issues: [`Request failed: ${error.message}`]
        });
      }
    }
  }

  generateReport() {
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      details: this.results
    };

    console.log('\n📊 Security Headers Summary:');
    console.log(`Total endpoints tested: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);

    // Save detailed report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'security-headers-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      requiredHeaders: REQUIRED_HEADERS,
      summary,
      results: this.results
    }, null, 2));

    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    return summary.failed === 0;
  }

  printHeadersAnalysis() {
    console.log('\n🔍 Security Headers Analysis:');
    
    // Analyze which headers are most commonly missing
    const headerStats = {};
    Object.keys(REQUIRED_HEADERS).forEach(header => {
      headerStats[header] = {
        present: 0,
        missing: 0,
        invalid: 0
      };
    });

    this.results.forEach(result => {
      if (result.error) return;
      
      Object.keys(REQUIRED_HEADERS).forEach(header => {
        if (result.securityHeaders[header]) {
          headerStats[header].present++;
        } else {
          headerStats[header].missing++;
        }
        
        if (result.issues.some(issue => issue.includes(REQUIRED_HEADERS[header].description))) {
          headerStats[header].invalid++;
        }
      });
    });

    Object.entries(headerStats).forEach(([header, stats]) => {
      const total = stats.present + stats.missing;
      const coverage = total > 0 ? Math.round((stats.present / total) * 100) : 0;
      console.log(`${REQUIRED_HEADERS[header].description}: ${coverage}% coverage (${stats.present}/${total})`);
      
      if (stats.invalid > 0) {
        console.log(`  ⚠️  ${stats.invalid} endpoints have invalid values`);
      }
    });
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  (async () => {
    try {
      const tester = new SecurityHeadersTester(baseUrl);
      await tester.runAllTests();
      tester.printHeadersAnalysis();
      const allPassed = tester.generateReport();
      
      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      console.error('❌ Security headers test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = SecurityHeadersTester;