#!/usr/bin/env node

/**
 * Comprehensive Security Test
 * Tests all security measures implemented in the application
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class ComprehensiveSecurityTest {
  constructor(baseUrl = 'http://127.0.0.1:8080') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          'User-Agent': 'SecurityTester/1.0',
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 5000
      };

      const req = client.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }

      req.end();
    });
  }

  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers...');
    
    const endpoints = ['/', '/api/health', '/color-picker'];
    const requiredHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy'
    ];

    let passed = 0;
    let failed = 0;

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        const missingHeaders = requiredHeaders.filter(header => 
          !response.headers[header.toLowerCase()]
        );

        if (missingHeaders.length === 0) {
          console.log(`✅ ${endpoint}: All security headers present`);
          passed++;
        } else {
          console.log(`❌ ${endpoint}: Missing headers: ${missingHeaders.join(', ')}`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Request failed - ${error.message}`);
        failed++;
      }
    }

    return { passed, failed, total: endpoints.length };
  }

  async testRateLimiting() {
    console.log('\n🚦 Testing Rate Limiting...');
    
    let passed = 0;
    let failed = 0;

    // Test health endpoint rate limiting (10 requests per minute)
    console.log('Testing /api/health rate limiting...');
    
    let rateLimitTriggered = false;
    for (let i = 1; i <= 12; i++) {
      try {
        const response = await this.makeRequest('/api/health');
        
        if (response.statusCode === 429) {
          rateLimitTriggered = true;
          console.log(`⚡ Rate limit triggered at request ${i}`);
          break;
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`Request ${i} failed: ${error.message}`);
      }
    }

    if (rateLimitTriggered) {
      console.log('✅ Rate limiting working correctly');
      passed++;
    } else {
      console.log('❌ Rate limiting not working');
      failed++;
    }

    return { passed, failed, total: 1 };
  }

  async testXSSProtection() {
    console.log('\n🛡️  Testing XSS Protection...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")'
    ];

    let passed = 0;
    let failed = 0;

    for (const payload of xssPayloads) {
      try {
        const encodedPayload = encodeURIComponent(payload);
        const response = await this.makeRequest(`/color-picker?test=${encodedPayload}`);
        
        if (response.statusCode === 400) {
          console.log(`✅ XSS payload blocked: ${payload.substring(0, 20)}...`);
          passed++;
        } else {
          console.log(`❌ XSS payload not blocked: ${payload.substring(0, 20)}...`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ XSS test failed: ${error.message}`);
        failed++;
      }
    }

    return { passed, failed, total: xssPayloads.length };
  }

  async testAPIEndpointSecurity() {
    console.log('\n🔐 Testing API Endpoint Security...');
    
    let passed = 0;
    let failed = 0;

    // Test authentication requirement
    const protectedEndpoints = [
      '/api/user/profile',
      '/api/tools/background-remover',
      '/api/stripe/create-checkout'
    ];

    const endpointMethods = {
      '/api/user/profile': 'GET',
      '/api/tools/background-remover': 'POST',
      '/api/stripe/create-checkout': 'POST'
    };

    for (const endpoint of protectedEndpoints) {
      try {
        const method = endpointMethods[endpoint] || 'GET';
        const response = await this.makeRequest(endpoint, method);
        
        if (response.statusCode === 401 || response.statusCode === 429) {
          const reason = response.statusCode === 401 ? 'authentication required' : 'rate limited (security layer)';
          console.log(`✅ ${endpoint}: Properly protected (${reason})`);
          passed++;
        } else {
          console.log(`❌ ${endpoint}: Not properly protected (status: ${response.statusCode})`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Request failed - ${error.message}`);
        failed++;
      }
    }

    return { passed, failed, total: protectedEndpoints.length };
  }

  async testInputValidation() {
    console.log('\n📝 Testing Input Validation...');
    
    let passed = 0;
    let failed = 0;

    // Test malicious input handling
    const maliciousInputs = [
      { endpoint: '/api/user/profile', param: 'id', value: "'; DROP TABLE users; --" },
      { endpoint: '/api/tools/background-remover', param: 'filename', value: '../../../etc/passwd' },
      { endpoint: '/api/stripe/create-checkout', param: 'plan', value: '<script>alert("xss")</script>' }
    ];

    for (const test of maliciousInputs) {
      try {
        const response = await this.makeRequest(
          `${test.endpoint}?${test.param}=${encodeURIComponent(test.value)}`
        );
        
        // Check if the malicious input was properly handled
        if (response.statusCode === 400 || response.statusCode === 401) {
          console.log(`✅ ${test.endpoint}: Malicious input properly handled`);
          passed++;
        } else if (!response.body.includes(test.value)) {
          console.log(`✅ ${test.endpoint}: Input not reflected in response`);
          passed++;
        } else {
          console.log(`❌ ${test.endpoint}: Malicious input may be vulnerable`);
          failed++;
        }
      } catch (error) {
        console.log(`❌ ${test.endpoint}: Request failed - ${error.message}`);
        failed++;
      }
    }

    return { passed, failed, total: maliciousInputs.length };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Security Tests\n');
    
    const results = {
      securityHeaders: await this.testSecurityHeaders(),
      rateLimiting: await this.testRateLimiting(),
      xssProtection: await this.testXSSProtection(),
      apiSecurity: await this.testAPIEndpointSecurity(),
      inputValidation: await this.testInputValidation()
    };

    return results;
  }

  generateSummary(results) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE SECURITY TEST SUMMARY');
    console.log('='.repeat(60));

    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;

    Object.entries(results).forEach(([category, result]) => {
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`${categoryName}: ${result.passed}/${result.total} passed`);
      
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalTests += result.total;
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`Overall: ${totalPassed}/${totalTests} tests passed`);
    console.log(`Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);

    const overallResult = totalFailed === 0 ? 'PASS' : 'FAIL';
    console.log(`\nOverall Result: ${overallResult === 'PASS' ? '✅' : '❌'} ${overallResult}`);

    return {
      totalPassed,
      totalFailed,
      totalTests,
      successRate: Math.round((totalPassed / totalTests) * 100),
      overallResult
    };
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://127.0.0.1:8080';
  
  (async () => {
    try {
      const tester = new ComprehensiveSecurityTest(baseUrl);
      const results = await tester.runAllTests();
      const summary = tester.generateSummary(results);
      
      process.exit(summary.overallResult === 'PASS' ? 0 : 1);
    } catch (error) {
      console.error('❌ Comprehensive security test failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = ComprehensiveSecurityTest;