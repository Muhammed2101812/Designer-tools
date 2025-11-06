#!/usr/bin/env node

/**
 * Comprehensive Performance and Security Test Suite
 * Orchestrates all performance and security tests
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configurations
const TEST_SUITE = {
  lighthouse: {
    name: 'Lighthouse Performance Audit',
    script: './scripts/lighthouse-audit.js',
    timeout: 300000, // 5 minutes
    required: true
  },
  securityHeaders: {
    name: 'Security Headers Validation',
    script: './scripts/security-headers-test.js',
    timeout: 60000, // 1 minute
    required: true
  },
  rateLimit: {
    name: 'Rate Limiting Tests',
    script: './scripts/rate-limit-test.js',
    timeout: 120000, // 2 minutes
    required: true
  },
  securityVulnerabilities: {
    name: 'Security Vulnerability Tests',
    script: './scripts/security-vulnerability-test.js',
    timeout: 180000, // 3 minutes
    required: true
  }
};

class PerformanceSecurityTestSuite {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {};
    this.startTime = Date.now();
  }

  async runTest(testKey, testConfig) {
    console.log(`\n🧪 Running ${testConfig.name}...`);
    console.log(`Script: ${testConfig.script}`);
    console.log(`Timeout: ${testConfig.timeout / 1000}s`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const child = spawn('node', [testConfig.script, this.baseUrl], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: testConfig.timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Stream output in real-time
        process.stdout.write(output);
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);
      });

      child.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          testName: testConfig.name,
          script: testConfig.script,
          exitCode: code,
          duration,
          passed: code === 0,
          stdout,
          stderr,
          timestamp: new Date().toISOString()
        };

        if (result.passed) {
          console.log(`✅ ${testConfig.name} completed successfully (${duration}ms)`);
        } else {
          console.log(`❌ ${testConfig.name} failed with exit code ${code} (${duration}ms)`);
        }

        resolve(result);
      });

      child.on('error', (error) => {
        console.error(`❌ Failed to start ${testConfig.name}:`, error.message);
        resolve({
          testName: testConfig.name,
          script: testConfig.script,
          exitCode: -1,
          duration: Date.now() - startTime,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Performance and Security Test Suite');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Start time: ${new Date().toISOString()}\n`);

    // Check if server is running
    await this.checkServerHealth();

    // Run each test
    for (const [testKey, testConfig] of Object.entries(TEST_SUITE)) {
      try {
        this.results[testKey] = await this.runTest(testKey, testConfig);
      } catch (error) {
        console.error(`❌ Unexpected error in ${testConfig.name}:`, error);
        this.results[testKey] = {
          testName: testConfig.name,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  async checkServerHealth() {
    console.log('🏥 Checking server health...');
    
    const http = require('http');
    const { URL } = require('url');
    
    return new Promise((resolve, reject) => {
      const url = new URL('/api/health', this.baseUrl);
      const req = http.get({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        timeout: 5000
      }, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server is healthy and responding');
          resolve(true);
        } else {
          console.log(`⚠️  Server responded with status ${res.statusCode}`);
          resolve(true); // Continue anyway
        }
      });

      req.on('error', (error) => {
        console.error('❌ Server health check failed:', error.message);
        console.log('⚠️  Continuing with tests anyway...');
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log('⚠️  Server health check timed out');
        resolve(false);
      });
    });
  }

  generateSummaryReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    const summary = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalDuration,
      testResults: this.results,
      summary: {
        total: Object.keys(this.results).length,
        passed: Object.values(this.results).filter(r => r.passed).length,
        failed: Object.values(this.results).filter(r => !r.passed).length,
        required: Object.entries(TEST_SUITE).filter(([_, config]) => config.required).length
      }
    };

    // Calculate overall pass/fail
    const requiredTests = Object.entries(TEST_SUITE)
      .filter(([_, config]) => config.required)
      .map(([key, _]) => key);
    
    const requiredTestsPassed = requiredTests.every(testKey => 
      this.results[testKey] && this.results[testKey].passed
    );

    summary.overallResult = requiredTestsPassed ? 'PASS' : 'FAIL';

    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE AND SECURITY TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`Overall Result: ${summary.overallResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Tests Run: ${summary.summary.total}`);
    console.log(`Passed: ${summary.summary.passed}`);
    console.log(`Failed: ${summary.summary.failed}`);
    console.log('');

    // Detailed results
    console.log('📋 Test Details:');
    Object.entries(this.results).forEach(([testKey, result]) => {
      const status = result.passed ? '✅' : '❌';
      const duration = result.duration ? `(${Math.round(result.duration / 1000)}s)` : '';
      console.log(`${status} ${result.testName} ${duration}`);
      
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Performance targets check
    this.checkPerformanceTargets();

    // Security compliance check
    this.checkSecurityCompliance();

    // Save comprehensive report
    const reportPath = path.join(process.cwd(), 'performance-security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);

    return summary;
  }

  checkPerformanceTargets() {
    console.log('\n🎯 Performance Targets Check:');
    
    // Try to read lighthouse report
    const lighthouseReportPath = path.join(process.cwd(), 'lighthouse-report.json');
    if (fs.existsSync(lighthouseReportPath)) {
      try {
        const lighthouseReport = JSON.parse(fs.readFileSync(lighthouseReportPath, 'utf8'));
        const targets = lighthouseReport.targets;
        
        let allTargetsMet = true;
        lighthouseReport.results.forEach(result => {
          Object.entries(result.scores).forEach(([category, score]) => {
            const target = targets[category] || targets.performance;
            if (score < target) {
              console.log(`❌ ${result.page} ${category}: ${score} (target: ${target})`);
              allTargetsMet = false;
            }
          });
        });

        if (allTargetsMet) {
          console.log('✅ All performance targets met');
        }
      } catch (error) {
        console.log('⚠️  Could not parse lighthouse report');
      }
    } else {
      console.log('⚠️  Lighthouse report not found');
    }
  }

  checkSecurityCompliance() {
    console.log('\n🔒 Security Compliance Check:');
    
    const securityChecks = [
      { name: 'Security Headers', reportFile: 'security-headers-report.json' },
      { name: 'Rate Limiting', reportFile: 'rate-limit-test-report.json' },
      { name: 'Vulnerability Scan', reportFile: 'security-vulnerability-report.json' }
    ];

    let overallSecurityScore = 0;
    let totalChecks = 0;

    securityChecks.forEach(check => {
      const reportPath = path.join(process.cwd(), check.reportFile);
      if (fs.existsSync(reportPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          if (check.name === 'Security Headers') {
            const passed = report.summary.failed === 0;
            console.log(`${passed ? '✅' : '❌'} ${check.name}: ${report.summary.passed}/${report.summary.total} endpoints`);
            if (passed) overallSecurityScore++;
          } else if (check.name === 'Rate Limiting') {
            const passed = report.summary.failed === 0;
            console.log(`${passed ? '✅' : '❌'} ${check.name}: ${report.summary.passed}/${report.summary.total} tests`);
            if (passed) overallSecurityScore++;
          } else if (check.name === 'Vulnerability Scan') {
            const passed = report.summary.vulnerabilitiesFound === 0;
            console.log(`${passed ? '✅' : '❌'} ${check.name}: ${report.summary.vulnerabilitiesFound} vulnerabilities found`);
            if (passed) overallSecurityScore++;
          }
          
          totalChecks++;
        } catch (error) {
          console.log(`⚠️  Could not parse ${check.name} report`);
        }
      } else {
        console.log(`⚠️  ${check.name} report not found`);
      }
    });

    const securityPercentage = totalChecks > 0 ? Math.round((overallSecurityScore / totalChecks) * 100) : 0;
    console.log(`\n🛡️  Overall Security Score: ${securityPercentage}% (${overallSecurityScore}/${totalChecks})`);
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  (async () => {
    try {
      const testSuite = new PerformanceSecurityTestSuite(baseUrl);
      await testSuite.runAllTests();
      const summary = testSuite.generateSummaryReport();
      
      process.exit(summary.overallResult === 'PASS' ? 0 : 1);
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = PerformanceSecurityTestSuite;