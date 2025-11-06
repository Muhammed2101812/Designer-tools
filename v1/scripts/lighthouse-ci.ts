#!/usr/bin/env tsx

/**
 * Lighthouse CI automation script
 * Runs performance tests and generates reports with budget validation
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

interface LighthouseResult {
  url: string
  score: number
  metrics: {
    fcp: number
    lcp: number
    cls: number
    tbt: number
    si: number
  }
  budgetViolations: string[]
  timestamp: number
}

interface PerformanceBudget {
  fcp: number
  lcp: number
  cls: number
  tbt: number
  si: number
  performanceScore: number
}

const DEFAULT_BUDGET: PerformanceBudget = {
  fcp: 1500,
  lcp: 2500,
  cls: 0.1,
  tbt: 200,
  si: 3000,
  performanceScore: 80
}

class LighthouseCIRunner {
  private resultsDir: string = './lighthouse-results'
  private budget: PerformanceBudget

  constructor(budget?: Partial<PerformanceBudget>) {
    this.budget = { ...DEFAULT_BUDGET, ...budget }
    this.ensureResultsDir()
  }

  private ensureResultsDir(): void {
    if (!existsSync(this.resultsDir)) {
      mkdirSync(this.resultsDir, { recursive: true })
    }
  }

  public async runTests(): Promise<LighthouseResult[]> {
    console.log('🚀 Starting Lighthouse CI performance tests...')
    
    try {
      // Run Lighthouse CI
      console.log('📊 Running Lighthouse audits...')
      execSync('npx lhci autorun', { 
        stdio: 'inherit',
        cwd: process.cwd()
      })

      // Parse results
      const results = this.parseResults()
      
      // Generate report
      this.generateReport(results)
      
      // Check budget violations
      const violations = this.checkBudgetViolations(results)
      
      if (violations.length > 0) {
        console.error('❌ Performance budget violations detected:')
        violations.forEach(violation => console.error(`  • ${violation}`))
        process.exit(1)
      } else {
        console.log('✅ All performance budgets passed!')
      }

      return results
    } catch (error) {
      console.error('❌ Lighthouse CI failed:', error)
      throw error
    }
  }

  private parseResults(): LighthouseResult[] {
    const results: LighthouseResult[] = []
    
    try {
      // Find the latest manifest file
      const manifestPath = join(this.resultsDir, 'manifest.json')
      if (!existsSync(manifestPath)) {
        throw new Error('Lighthouse results manifest not found')
      }

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      
      for (const result of manifest) {
        const reportPath = join(this.resultsDir, result.jsonPath)
        if (existsSync(reportPath)) {
          const report = JSON.parse(readFileSync(reportPath, 'utf8'))
          
          const lighthouseResult: LighthouseResult = {
            url: report.finalUrl,
            score: Math.round(report.categories.performance.score * 100),
            metrics: {
              fcp: report.audits['first-contentful-paint'].numericValue,
              lcp: report.audits['largest-contentful-paint'].numericValue,
              cls: report.audits['cumulative-layout-shift'].numericValue,
              tbt: report.audits['total-blocking-time'].numericValue,
              si: report.audits['speed-index'].numericValue
            },
            budgetViolations: [],
            timestamp: Date.now()
          }

          // Check for budget violations
          lighthouseResult.budgetViolations = this.checkMetricViolations(lighthouseResult)
          
          results.push(lighthouseResult)
        }
      }
    } catch (error) {
      console.error('Error parsing Lighthouse results:', error)
    }

    return results
  }

  private checkMetricViolations(result: LighthouseResult): string[] {
    const violations: string[] = []

    if (result.score < this.budget.performanceScore) {
      violations.push(`Performance score ${result.score} < ${this.budget.performanceScore}`)
    }

    if (result.metrics.fcp > this.budget.fcp) {
      violations.push(`FCP ${result.metrics.fcp.toFixed(0)}ms > ${this.budget.fcp}ms`)
    }

    if (result.metrics.lcp > this.budget.lcp) {
      violations.push(`LCP ${result.metrics.lcp.toFixed(0)}ms > ${this.budget.lcp}ms`)
    }

    if (result.metrics.cls > this.budget.cls) {
      violations.push(`CLS ${result.metrics.cls.toFixed(3)} > ${this.budget.cls}`)
    }

    if (result.metrics.tbt > this.budget.tbt) {
      violations.push(`TBT ${result.metrics.tbt.toFixed(0)}ms > ${this.budget.tbt}ms`)
    }

    if (result.metrics.si > this.budget.si) {
      violations.push(`Speed Index ${result.metrics.si.toFixed(0)}ms > ${this.budget.si}ms`)
    }

    return violations
  }

  private checkBudgetViolations(results: LighthouseResult[]): string[] {
    const allViolations: string[] = []

    results.forEach(result => {
      if (result.budgetViolations.length > 0) {
        allViolations.push(`${result.url}:`)
        result.budgetViolations.forEach(violation => {
          allViolations.push(`  ${violation}`)
        })
      }
    })

    return allViolations
  }

  private generateReport(results: LighthouseResult[]): void {
    const timestamp = new Date().toISOString()
    const reportPath = join(this.resultsDir, `performance-report-${Date.now()}.json`)
    
    const report = {
      timestamp,
      budget: this.budget,
      results,
      summary: this.generateSummary(results)
    }

    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    // Generate markdown report
    this.generateMarkdownReport(report, reportPath.replace('.json', '.md'))
    
    console.log(`📋 Performance report generated: ${reportPath}`)
  }

  private generateSummary(results: LighthouseResult[]) {
    if (results.length === 0) {
      return { averageScore: 0, totalViolations: 0, worstPage: null }
    }

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
    const totalViolations = results.reduce((sum, r) => sum + r.budgetViolations.length, 0)
    const worstPage = results.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    )

    return {
      averageScore: Math.round(averageScore),
      totalViolations,
      worstPage: {
        url: worstPage.url,
        score: worstPage.score,
        violations: worstPage.budgetViolations.length
      }
    }
  }

  private generateMarkdownReport(report: any, filePath: string): void {
    const md = `# Performance Test Report

**Generated:** ${report.timestamp}

## Summary

- **Average Performance Score:** ${report.summary.averageScore}/100
- **Total Budget Violations:** ${report.summary.totalViolations}
- **Pages Tested:** ${report.results.length}

${report.summary.worstPage ? `
### Worst Performing Page
- **URL:** ${report.summary.worstPage.url}
- **Score:** ${report.summary.worstPage.score}/100
- **Violations:** ${report.summary.worstPage.violations}
` : ''}

## Performance Budget

| Metric | Budget | Status |
|--------|--------|--------|
| Performance Score | ≥${report.budget.performanceScore} | ${report.summary.averageScore >= report.budget.performanceScore ? '✅' : '❌'} |
| First Contentful Paint | ≤${report.budget.fcp}ms | - |
| Largest Contentful Paint | ≤${report.budget.lcp}ms | - |
| Cumulative Layout Shift | ≤${report.budget.cls} | - |
| Total Blocking Time | ≤${report.budget.tbt}ms | - |
| Speed Index | ≤${report.budget.si}ms | - |

## Detailed Results

${report.results.map((result: LighthouseResult) => `
### ${result.url}

**Performance Score:** ${result.score}/100

| Metric | Value | Budget | Status |
|--------|-------|--------|--------|
| FCP | ${result.metrics.fcp.toFixed(0)}ms | ${report.budget.fcp}ms | ${result.metrics.fcp <= report.budget.fcp ? '✅' : '❌'} |
| LCP | ${result.metrics.lcp.toFixed(0)}ms | ${report.budget.lcp}ms | ${result.metrics.lcp <= report.budget.lcp ? '✅' : '❌'} |
| CLS | ${result.metrics.cls.toFixed(3)} | ${report.budget.cls} | ${result.metrics.cls <= report.budget.cls ? '✅' : '❌'} |
| TBT | ${result.metrics.tbt.toFixed(0)}ms | ${report.budget.tbt}ms | ${result.metrics.tbt <= report.budget.tbt ? '✅' : '❌'} |
| SI | ${result.metrics.si.toFixed(0)}ms | ${report.budget.si}ms | ${result.metrics.si <= report.budget.si ? '✅' : '❌'} |

${result.budgetViolations.length > 0 ? `
**Budget Violations:**
${result.budgetViolations.map(v => `- ${v}`).join('\n')}
` : '**✅ All budgets passed**'}
`).join('\n')}

## Recommendations

${report.summary.totalViolations > 0 ? `
### Performance Issues Found

To improve performance:

1. **Optimize JavaScript bundles** - Reduce bundle size and implement code splitting
2. **Optimize images** - Use Next.js Image component and modern formats
3. **Minimize render-blocking resources** - Inline critical CSS and defer non-critical scripts
4. **Implement caching strategies** - Use service workers and proper cache headers
5. **Optimize Core Web Vitals** - Focus on FCP, LCP, and CLS improvements

### Next Steps

1. Review the detailed Lighthouse reports in the \`lighthouse-results\` directory
2. Address the highest impact issues first
3. Re-run tests after optimizations
4. Set up automated performance monitoring in CI/CD
` : `
### Excellent Performance! 🎉

All performance budgets are passing. Consider:

1. **Monitoring** - Set up continuous performance monitoring
2. **Progressive Enhancement** - Add advanced optimizations
3. **User Experience** - Focus on perceived performance improvements
4. **Accessibility** - Ensure all users have a great experience
`}
`

    writeFileSync(filePath, md)
  }

  public setBudget(budget: Partial<PerformanceBudget>): void {
    this.budget = { ...this.budget, ...budget }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const isCI = process.env.CI === 'true'
  
  // Parse custom budget from args
  const customBudget: Partial<PerformanceBudget> = {}
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '')
    const value = args[i + 1]
    
    if (key && value && key in DEFAULT_BUDGET) {
      customBudget[key as keyof PerformanceBudget] = parseFloat(value)
    }
  }

  const runner = new LighthouseCIRunner(customBudget)
  
  try {
    await runner.runTests()
    
    if (isCI) {
      console.log('✅ Performance tests passed in CI environment')
    } else {
      console.log('✅ Performance tests completed successfully')
    }
  } catch (error) {
    console.error('❌ Performance tests failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { LighthouseCIRunner, type LighthouseResult, type PerformanceBudget }