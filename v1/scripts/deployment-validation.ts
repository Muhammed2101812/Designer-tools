#!/usr/bin/env tsx

/**
 * Deployment Validation Script
 * Tests optimized application across different network conditions and environments
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

interface NetworkCondition {
  name: string
  downloadThroughput: number // bytes/s
  uploadThroughput: number   // bytes/s
  latency: number           // ms
  description: string
}

interface DeploymentEnvironment {
  name: string
  url: string
  description: string
}

interface ValidationResult {
  environment: string
  networkCondition: string
  metrics: {
    fcp: number
    lcp: number
    cls: number
    tbt: number
    si: number
    performanceScore: number
  }
  loadTime: number
  success: boolean
  errors: string[]
}

interface DeploymentReport {
  timestamp: string
  environments: DeploymentEnvironment[]
  networkConditions: NetworkCondition[]
  results: ValidationResult[]
  summary: {
    totalTests: number
    successfulTests: number
    averagePerformanceScore: number
    worstPerformingCondition: string
    bestPerformingCondition: string
    recommendations: string[]
  }
}

// Network conditions to test
const NETWORK_CONDITIONS: NetworkCondition[] = [
  {
    name: 'Fast 3G',
    downloadThroughput: 1600 * 1024, // 1.6 Mbps
    uploadThroughput: 750 * 1024,    // 750 Kbps
    latency: 150,
    description: 'Typical mobile connection'
  },
  {
    name: 'Slow 3G',
    downloadThroughput: 500 * 1024,  // 500 Kbps
    uploadThroughput: 500 * 1024,    // 500 Kbps
    latency: 300,
    description: 'Poor mobile connection'
  },
  {
    name: 'Regular 4G',
    downloadThroughput: 4000 * 1024, // 4 Mbps
    uploadThroughput: 3000 * 1024,   // 3 Mbps
    latency: 20,
    description: 'Good mobile connection'
  },
  {
    name: 'WiFi',
    downloadThroughput: 30000 * 1024, // 30 Mbps
    uploadThroughput: 15000 * 1024,   // 15 Mbps
    latency: 2,
    description: 'Typical WiFi connection'
  }
]

// Deployment environments
const DEPLOYMENT_ENVIRONMENTS: DeploymentEnvironment[] = [
  {
    name: 'Local Development',
    url: 'http://localhost:3000',
    description: 'Local development server'
  },
  {
    name: 'Staging',
    url: process.env.STAGING_URL || 'https://staging.designkit.app',
    description: 'Staging environment'
  },
  {
    name: 'Production',
    url: process.env.PRODUCTION_URL || 'https://designkit.app',
    description: 'Production environment'
  }
]

class DeploymentValidator {
  private resultsDir: string = './deployment-validation'

  constructor() {
    this.ensureResultsDir()
  }

  private ensureResultsDir(): void {
    if (!existsSync(this.resultsDir)) {
      mkdirSync(this.resultsDir, { recursive: true })
    }
  }

  public async validateDeployment(): Promise<DeploymentReport> {
    console.log('🚀 Starting deployment validation across network conditions...')
    
    const results: ValidationResult[] = []
    
    for (const environment of DEPLOYMENT_ENVIRONMENTS) {
      // Skip environments that aren't available
      if (!await this.isEnvironmentAvailable(environment)) {
        console.log(`⏭️ Skipping ${environment.name} - not available`)
        continue
      }
      
      console.log(`\n🌐 Testing ${environment.name} (${environment.url})`)
      
      for (const networkCondition of NETWORK_CONDITIONS) {
        console.log(`  📶 Testing with ${networkCondition.name}...`)
        
        try {
          const result = await this.testEnvironmentWithNetwork(environment, networkCondition)
          results.push(result)
          
          const status = result.success ? '✅' : '❌'
          console.log(`    ${status} Score: ${result.metrics.performanceScore}/100, FCP: ${result.metrics.fcp.toFixed(0)}ms, LCP: ${result.metrics.lcp.toFixed(0)}ms`)
        } catch (error) {
          console.error(`    ❌ Test failed:`, error)
          results.push({
            environment: environment.name,
            networkCondition: networkCondition.name,
            metrics: {
              fcp: 0,
              lcp: 0,
              cls: 0,
              tbt: 0,
              si: 0,
              performanceScore: 0
            },
            loadTime: 0,
            success: false,
            errors: [error instanceof Error ? error.message : String(error)]
          })
        }
      }
    }
    
    const report = this.generateReport(results)
    this.saveReport(report)
    
    return report
  }

  private async isEnvironmentAvailable(environment: DeploymentEnvironment): Promise<boolean> {
    try {
      // For local development, check if server is running
      if (environment.url.includes('localhost')) {
        try {
          execSync(`curl -s -o /dev/null -w "%{http_code}" ${environment.url}`, { 
            timeout: 5000,
            stdio: 'pipe'
          })
          return true
        } catch {
          return false
        }
      }
      
      // For remote environments, always try (they should be available)
      return true
    } catch {
      return false
    }
  }

  private async testEnvironmentWithNetwork(
    environment: DeploymentEnvironment,
    networkCondition: NetworkCondition
  ): Promise<ValidationResult> {
    const startTime = Date.now()
    
    try {
      // Create Lighthouse config for this network condition
      const lighthouseConfig = this.createLighthouseConfig(environment.url, networkCondition)
      
      // Run Lighthouse with network throttling
      const lighthouseResult = await this.runLighthouseWithThrottling(lighthouseConfig)
      
      const loadTime = Date.now() - startTime
      
      return {
        environment: environment.name,
        networkCondition: networkCondition.name,
        metrics: lighthouseResult.metrics,
        loadTime,
        success: lighthouseResult.success,
        errors: lighthouseResult.errors
      }
    } catch (error) {
      return {
        environment: environment.name,
        networkCondition: networkCondition.name,
        metrics: {
          fcp: 0,
          lcp: 0,
          cls: 0,
          tbt: 0,
          si: 0,
          performanceScore: 0
        },
        loadTime: Date.now() - startTime,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  private createLighthouseConfig(url: string, networkCondition: NetworkCondition) {
    return {
      url,
      throttling: {
        rttMs: networkCondition.latency,
        throughputKbps: networkCondition.downloadThroughput / 1024,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: networkCondition.latency * 0.5,
        downloadThroughputKbps: networkCondition.downloadThroughput / 1024,
        uploadThroughputKbps: networkCondition.uploadThroughput / 1024
      }
    }
  }

  private async runLighthouseWithThrottling(config: any): Promise<{
    metrics: ValidationResult['metrics']
    success: boolean
    errors: string[]
  }> {
    try {
      // Create temporary Lighthouse config file
      const configPath = join(this.resultsDir, 'lighthouse-config.json')
      const lighthouseConfig = {
        extends: 'lighthouse:default',
        settings: {
          throttling: config.throttling,
          onlyCategories: ['performance'],
          formFactor: 'mobile',
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2
          }
        }
      }
      
      writeFileSync(configPath, JSON.stringify(lighthouseConfig, null, 2))
      
      // Run Lighthouse
      const outputPath = join(this.resultsDir, `lighthouse-${Date.now()}.json`)
      const command = `npx lighthouse ${config.url} --config-path=${configPath} --output=json --output-path=${outputPath} --chrome-flags="--headless --no-sandbox"`
      
      execSync(command, { stdio: 'pipe', timeout: 60000 })
      
      // Parse results
      const result = JSON.parse(require('fs').readFileSync(outputPath, 'utf8'))
      
      return {
        metrics: {
          fcp: result.audits['first-contentful-paint']?.numericValue || 0,
          lcp: result.audits['largest-contentful-paint']?.numericValue || 0,
          cls: result.audits['cumulative-layout-shift']?.numericValue || 0,
          tbt: result.audits['total-blocking-time']?.numericValue || 0,
          si: result.audits['speed-index']?.numericValue || 0,
          performanceScore: Math.round((result.categories.performance?.score || 0) * 100)
        },
        success: true,
        errors: []
      }
    } catch (error) {
      return {
        metrics: {
          fcp: 0,
          lcp: 0,
          cls: 0,
          tbt: 0,
          si: 0,
          performanceScore: 0
        },
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      }
    }
  }

  private generateReport(results: ValidationResult[]): DeploymentReport {
    const successfulResults = results.filter(r => r.success)
    const totalTests = results.length
    const successfulTests = successfulResults.length
    
    const averagePerformanceScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / successfulResults.length
      : 0
    
    // Find best and worst performing conditions
    const sortedResults = successfulResults.sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore)
    const bestPerformingCondition = sortedResults[0]?.networkCondition || 'None'
    const worstPerformingCondition = sortedResults[sortedResults.length - 1]?.networkCondition || 'None'
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (successfulTests < totalTests) {
      recommendations.push('Some tests failed - investigate deployment issues and network connectivity')
    }
    
    if (averagePerformanceScore < 80) {
      recommendations.push('Overall performance score is below target - continue optimization efforts')
    }
    
    const slowNetworkResults = successfulResults.filter(r => 
      r.networkCondition.includes('Slow') && r.metrics.performanceScore < 70
    )
    
    if (slowNetworkResults.length > 0) {
      recommendations.push('Performance on slow networks needs improvement - focus on bundle size and critical path optimization')
    }
    
    const highLCPResults = successfulResults.filter(r => r.metrics.lcp > 2500)
    if (highLCPResults.length > 0) {
      recommendations.push('LCP is above target on some conditions - optimize largest content elements and preloading')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Excellent performance across all tested conditions!')
    }
    
    return {
      timestamp: new Date().toISOString(),
      environments: DEPLOYMENT_ENVIRONMENTS,
      networkConditions: NETWORK_CONDITIONS,
      results,
      summary: {
        totalTests,
        successfulTests,
        averagePerformanceScore,
        worstPerformingCondition,
        bestPerformingCondition,
        recommendations
      }
    }
  }

  private saveReport(report: DeploymentReport): void {
    const timestamp = Date.now()
    const reportPath = join(this.resultsDir, `deployment-report-${timestamp}.json`)
    
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    // Generate markdown report
    this.generateMarkdownReport(report, reportPath.replace('.json', '.md'))
    
    console.log(`\n📋 Deployment validation report saved: ${reportPath}`)
  }

  private generateMarkdownReport(report: DeploymentReport, filePath: string): void {
    const md = `# Deployment Validation Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## Summary

- **Total Tests:** ${report.summary.totalTests}
- **Successful Tests:** ${report.summary.successfulTests}
- **Success Rate:** ${((report.summary.successfulTests / report.summary.totalTests) * 100).toFixed(1)}%
- **Average Performance Score:** ${report.summary.averagePerformanceScore.toFixed(1)}/100
- **Best Performing Condition:** ${report.summary.bestPerformingCondition}
- **Worst Performing Condition:** ${report.summary.worstPerformingCondition}

## Performance by Network Condition

| Environment | Network | Performance Score | FCP (ms) | LCP (ms) | CLS | Status |
|-------------|---------|-------------------|----------|----------|-----|--------|
${report.results.map(r => 
  `| ${r.environment} | ${r.networkCondition} | ${r.metrics.performanceScore}/100 | ${r.metrics.fcp.toFixed(0)} | ${r.metrics.lcp.toFixed(0)} | ${r.metrics.cls.toFixed(3)} | ${r.success ? '✅' : '❌'} |`
).join('\n')}

## Network Conditions Tested

${report.networkConditions.map(nc => `
### ${nc.name}
- **Download:** ${(nc.downloadThroughput / 1024).toFixed(0)} Kbps
- **Upload:** ${(nc.uploadThroughput / 1024).toFixed(0)} Kbps
- **Latency:** ${nc.latency}ms
- **Description:** ${nc.description}
`).join('\n')}

## Environments Tested

${report.environments.map(env => `
### ${env.name}
- **URL:** ${env.url}
- **Description:** ${env.description}
`).join('\n')}

## Detailed Results

${report.results.filter(r => r.success).map(result => `
### ${result.environment} - ${result.networkCondition}

**Performance Score:** ${result.metrics.performanceScore}/100

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| First Contentful Paint | ${result.metrics.fcp.toFixed(0)}ms | 1500ms | ${result.metrics.fcp <= 1500 ? '✅' : '❌'} |
| Largest Contentful Paint | ${result.metrics.lcp.toFixed(0)}ms | 2500ms | ${result.metrics.lcp <= 2500 ? '✅' : '❌'} |
| Cumulative Layout Shift | ${result.metrics.cls.toFixed(3)} | 0.1 | ${result.metrics.cls <= 0.1 ? '✅' : '❌'} |
| Total Blocking Time | ${result.metrics.tbt.toFixed(0)}ms | 200ms | ${result.metrics.tbt <= 200 ? '✅' : '❌'} |
| Speed Index | ${result.metrics.si.toFixed(0)}ms | 3000ms | ${result.metrics.si <= 3000 ? '✅' : '❌'} |

**Load Time:** ${result.loadTime}ms
`).join('\n')}

${report.results.filter(r => !r.success).length > 0 ? `
## Failed Tests

${report.results.filter(r => !r.success).map(result => `
### ${result.environment} - ${result.networkCondition}

**Errors:**
${result.errors.map(error => `- ${error}`).join('\n')}
`).join('\n')}
` : ''}

## Recommendations

${report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Performance Analysis

### Network Impact
The performance testing across different network conditions reveals:

${report.networkConditions.map(nc => {
  const results = report.results.filter(r => r.networkCondition === nc.name && r.success)
  if (results.length === 0) return `- **${nc.name}:** No successful tests`
  
  const avgScore = results.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / results.length
  const avgFCP = results.reduce((sum, r) => sum + r.metrics.fcp, 0) / results.length
  const avgLCP = results.reduce((sum, r) => sum + r.metrics.lcp, 0) / results.length
  
  return `- **${nc.name}:** Avg Score ${avgScore.toFixed(1)}/100, FCP ${avgFCP.toFixed(0)}ms, LCP ${avgLCP.toFixed(0)}ms`
}).join('\n')}

### Environment Comparison
${report.environments.map(env => {
  const results = report.results.filter(r => r.environment === env.name && r.success)
  if (results.length === 0) return `- **${env.name}:** No successful tests`
  
  const avgScore = results.reduce((sum, r) => sum + r.metrics.performanceScore, 0) / results.length
  return `- **${env.name}:** Average Performance Score ${avgScore.toFixed(1)}/100`
}).join('\n')}

---

*This report validates the performance of the optimized Design Kit application across different network conditions and deployment environments.*
`

    writeFileSync(filePath, md)
  }
}

// CLI interface
async function main() {
  const validator = new DeploymentValidator()
  
  try {
    console.log('🔍 Starting deployment validation...')
    const report = await validator.validateDeployment()
    
    console.log('\n📊 Deployment Validation Summary:')
    console.log(`Success Rate: ${((report.summary.successfulTests / report.summary.totalTests) * 100).toFixed(1)}%`)
    console.log(`Average Performance Score: ${report.summary.averagePerformanceScore.toFixed(1)}/100`)
    
    if (report.summary.successfulTests === report.summary.totalTests) {
      console.log('🎉 All deployment tests passed!')
    } else {
      console.log('⚠️ Some deployment tests failed')
    }
    
    console.log('\nRecommendations:')
    report.summary.recommendations.forEach(rec => console.log(`- ${rec}`))
    
  } catch (error) {
    console.error('❌ Deployment validation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { DeploymentValidator, type DeploymentReport }