#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * Tests rate limiting implementation across API endpoints
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Rate limit test configurations
const RATE_LIMIT_TESTS = [
  {
    name: 'IP Rate Limiting (Public Endpoints)',
    endpoint: '/api/health',
    method: 'GET',
    expectedLimit: 10, // 10 requests per minute
    testRequests: 15,
    description: 'Tests IP-based rate limiting on public endpoints'
  },
  {
    name: 'User Rate Limiting (Auth Required)',
    endpoint: '/api/user/profile',
    method: 'GET',
    expectedLimit: 30, // 30 requests per minute
    testRequests: 35,
    requiresAuth: true,
    description: 'Tests user-based rate limiting on authenticated endpoints'
  },
  {
    name: 'API Tool Rate Limiting',
    endpoint: '/api/tools/background-remover',
    method: 'POST',
    expectedLimit: 5, // 5 requests per minute
    testRequests: 8,
    requiresAuth: true,
    description: 'Tests strict rate limiting on API-powered tools'
  }
];

class RateLimitTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.authToken = null;
  }

  async authenticate() {
    // Mock authentication - in real tests, this would use actual auth
    console.log('🔐 Setting up authentication...');
    // For testing purposes, we'll simulate having an auth token
    this.authToken = 'mock-auth-token';
    return true;
  }

  async makeRequest(endpoint, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'User-Agent': 'RateLimitTester/1.0',
          ...headers
        },
        timeout: 5000
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            rateLimitHeaders: {
              limit: res.headers['x-ratelimit-limit'],
              remaining: res.headers['x-ratelimit-remaining'],
              reset: res.headers['x-ratelimit-reset'],
              retryAfter: res.headers['retry-after']
            }
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      // Add request body for POST requests
      if (method === 'POST') {
        req.write(JSON.stringify({ test: 'data' }));
      }

      req.end();
    });
  }

  async testRateLimit(testConfig) {
    console.log(`\n🧪 Testing: ${testConfig.name}`);
    console.log(`Endpoint: ${testConfig.endpoint}`);
    console.log(`Expected limit: ${testConfig.expectedLimit} requests/minute`);
    console.log(`Test requests: ${testConfig.testRequests}`);

    const results = {
      testName: testConfig.name,
      endpoint: testConfig.endpoint,
      expectedLimit: testConfig.expectedLimit,
      testRequests: testConfig.testRequests,
      requests: [],
      rateLimitTriggered: false,
      rateLimitAt: null,
      passed: false,
      issues: []
    };

    const headers = {};
    if (testConfig.requiresAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (testConfig.method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }

    // Make rapid requests to trigger rate limiting
    for (let i = 1; i <= testConfig.testRequests; i++) {
      try {
        const startTime = Date.now();
        const response = await this.makeRequest(
          testConfig.endpoint,
          testConfig.method,
          headers
        );
        const endTime = Date.now();

        const requestResult = {
          requestNumber: i,
          statusCode: response.statusCode,
          responseTime: endTime - startTime,
          rateLimitHeaders: response.rateLimitHeaders,
          timestamp: new Date().toISOString()
        };

        results.requests.push(requestResult);

        // Check if rate limit was triggered
        if (response.statusCode === 429) {
          if (!results.rateLimitTriggered) {
            results.rateLimitTriggered = true;
            results.rateLimitAt = i;
            console.log(`⚡ Rate limit triggered at request ${i}`);
          }
        }

        // Log progress
        if (i % 5 === 0 || response.statusCode === 429) {
          console.log(`Request ${i}: ${response.statusCode} (${response.rateLimitHeaders.remaining || 'N/A'} remaining)`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Request ${i} failed:`, error.message);
        results.requests.push({
          requestNumber: i,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Analyze results
    this.analyzeRateLimitResults(results, testConfig);
    this.results.push(results);
    
    return results;
  }

  analyzeRateLimitResults(results, testConfig) {
    const { requests, expectedLimit } = results;
    
    // Check if rate limiting was properly implemented
    if (!results.rateLimitTriggered) {
      results.issues.push('Rate limiting was not triggered despite exceeding expected limit');
      results.passed = false;
    } else {
      // Check if rate limit triggered at appropriate point
      const tolerance = 2; // Allow some tolerance
      if (results.rateLimitAt > expectedLimit + tolerance) {
        results.issues.push(`Rate limit triggered too late (at request ${results.rateLimitAt}, expected around ${expectedLimit})`);
        results.passed = false;
      } else if (results.rateLimitAt < expectedLimit - tolerance) {
        results.issues.push(`Rate limit triggered too early (at request ${results.rateLimitAt}, expected around ${expectedLimit})`);
        results.passed = false;
      } else {
        results.passed = true;
      }
    }

    // Check for proper rate limit headers
    const requestsWithHeaders = requests.filter(r => r.rateLimitHeaders && r.rateLimitHeaders.limit);
    if (requestsWithHeaders.length === 0) {
      results.issues.push('No rate limit headers found in responses');
      results.passed = false;
    }

    // Check for 429 responses having Retry-After header
    const rateLimitResponses = requests.filter(r => r.statusCode === 429);
    const responsesWithRetryAfter = rateLimitResponses.filter(r => r.rateLimitHeaders && r.rateLimitHeaders.retryAfter);
    
    if (rateLimitResponses.length > 0 && responsesWithRetryAfter.length === 0) {
      results.issues.push('429 responses missing Retry-After header');
      results.passed = false;
    }

    // Log analysis
    if (results.passed) {
      console.log(`✅ Rate limiting working correctly`);
    } else {
      console.log(`❌ Rate limiting issues found:`);
      results.issues.forEach(issue => console.log(`   - ${issue}`));
    }
  }

  async runAllTests() {
    console.log('🚦 Starting rate limiting tests...\n');
    
    // Setup authentication if needed
    const hasAuthTests = RATE_LIMIT_TESTS.some(test => test.requiresAuth);
    if (hasAuthTests) {
      await this.authenticate();
    }

    // Run each test
    for (const testConfig of RATE_LIMIT_TESTS) {
      try {
        await this.testRateLimit(testConfig);
      } catch (error) {
        console.error(`❌ Test failed: ${testConfig.name}`, error);
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

    console.log('\n📊 Rate Limiting Test Summary:');
    console.log(`Total tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);

    // Detailed analysis
    console.log('\n📋 Test Details:');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}`);
      if (result.rateLimitTriggered) {
        console.log(`   Rate limit triggered at request ${result.rateLimitAt}/${result.testRequests}`);
      }
      if (result.issues.length > 0) {
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    });

    // Save report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'rate-limit-test-report.json');
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      testConfigurations: RATE_LIMIT_TESTS,
      summary,
      results: this.results
    }, null, 2));

    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    return summary.failed === 0;
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  (async () => {
    try {
      const tester = new RateLimitTester(baseUrl);
      await tester.runAllTests();
      const allPassed = tester.generateReport();
      
      process.exit(allPassed ? 0 : 1);
    } catch (error) {
      console.error('❌ Rate limiting test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = RateLimitTester;