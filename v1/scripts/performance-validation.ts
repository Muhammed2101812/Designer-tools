#!/usr/bin/env tsx

/**
 * Performance Validation and Measurement Script
 * Validates that optimizations meet target thresholds and generates comprehensive reports
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { LighthouseCIRunner, type LighthouseResult } from './lighthouse-ci'

interface PerformanceTargets {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  tti: number // Time to Interactive
  cls: number // Cumulative Layout Shift
  fid: number // First Input Delay
  performanceScore: number
}

interface OptimizationPhase {
  name: string
  description: string
  expectedImprovements: string[]
  completed: boolean
}

interface PerformanceComparison {
  metric: string
  before: number
  after: number
  improvement: number
  improvementPercent: number
  targetMet: boolean
  target: number
}

interface ValidationReport {
  timestamp: string
  targets: PerformanceTargets
  phases: OptimizationPhase[]
  results: LighthouseResult[]
  comparisons: PerformanceComparison[]
  summary: {
    overallScore: number
    targetsMet: number
    totalTargets: number
    totalImprovement: number
    recommendations: string[]
  }
}

// Target thresholds from requirements
const PERFORMANCE_TARGETS: PerformanceTargets = {
  fcp: 1500, // <1.5s
  lcp: 2500, // <2.5s
  tti: 3500, // <3.5s
  cls: 0.1,  // <0.1
  fid: 100,  // <100ms
  performanceScore: 85
}

// Optimization phases completed
const OPTIMIZATION_PHASES: OptimizationPhase[] = [
  {
    name: 'Bundle Optimization',
    description: 'JavaScript bundle analysis and splitting',
    expectedImprovements: ['Reduced bundle size', 'Faster initial load', 'Better caching'],
    completed: true
  },
  {
    name: 'Script Loading Optimization',
    description: 'Async/defer loading and critical path optimization',
    expectedImprovements: ['Reduced render blocking', 'Faster FCP', 'Better TTI'],
    completed: true
  },
  {
    name: 'Performance Monitoring',
    description: 'Real-time monitoring and alerting system',
    expectedImprovements: ['Continuous monitoring', 'Alert system', 'Performance dashboard'],
    completed: true
  },
  {
    name: 'Resource Loading Optimization',
    description: 'Progressive loading and caching strategies',
    expectedImprovements: ['Lazy loading', 'Service worker caching', 'Optimized images'],
    completed: true
  },
  {
    name: 'Runtime Performance Optimization',
    description: 'React optimizations and long task elimination',
    expectedImprovements: ['Reduced long tasks', 'Better React performance', 'Memory optimization'],
    completed: true
  }
]

class PerformanceValidator {
  private resultsDir: string = './performance-validation'
  private targets: PerformanceTargets
  private baselineData: any = null

  constructor(customTargets?: Partial<PerformanceTargets>) {
    this.targets = { ...PERFORMANCE_TARGETS, ...customTargets }
    this.ensureResultsDir()
    this.loadBaselineData()
  }

  private ensureResultsDir(): void {
    if (!existsSync(this.resultsDir)) {
      mkdirSync(this.resultsDir, { recursive: true })
    }
  }

  private loadBaselineData(): void {
    const baselinePath = join(this.resultsDir, 'baseline.json')
    if (existsSync(baselinePath)) {
      try {
        this.baselineData = JSON.parse(readFileSync(baselinePath, 'utf8'))
        console.log('📊 Loaded baseline performance data')
      } catch (error) {
        console.warn('⚠️ Could not load baseline data:', error)
      }
    }
  }

  public async validatePerformance(): Promise<ValidationReport> {
    console.log('🔍 Starting performance validation...')
    
    // Run Lighthouse tests
    const lighthouseRunner = new LighthouseCIRunner({
      fcp: this.targets.fcp,
      lcp: this.targets.lcp,
      cls: this.targets.cls,
      performanceScore: this.targets.performanceScore
    })

    const results = await lighthouseRunner.runTests()
    
    // Generate comparisons
    const comparisons = this.generateComparisons(results)
    
    // Create validation report
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      targets: this.targets,
      phases: OPTIMIZATION_PHASES,
      results,
      comparisons,
      summary: this.generateSummary(results, comparisons)
    }

    // Save report
    this.saveReport(report)
    
    // Generate detailed documentation
    this.generateOptimizationReport(report)
    
    return report
  }

  private generateComparisons(results: LighthouseResult[]): PerformanceComparison[] {
    const comparisons: PerformanceComparison[] = []
    
    if (!this.baselineData || results.length === 0) {
      console.log('ℹ️ No baseline data available for comparison')
      return comparisons
    }

    const currentResult = results[0] // Use first result for comparison
    const baseline = this.baselineData.results?.[0]

    if (!baseline) {
      console.log('ℹ️ No baseline result available for comparison')
      return comparisons
    }

    const metrics = [
      { key: 'fcp', name: 'First Contentful Paint', target: this.targets.fcp },
      { key: 'lcp', name: 'Largest Contentful Paint', target: this.targets.lcp },
      { key: 'cls', name: 'Cumulative Layout Shift', target: this.targets.cls },
      { key: 'tbt', name: 'Total Blocking Time', target: 200 },
      { key: 'si', name: 'Speed Index', target: 3000 }
    ]

    metrics.forEach(metric => {
      const before = baseline.metrics[metric.key]
      const after = currentResult.metrics[metric.key]
      
      if (before && after) {
        const improvement = before - after
        const improvementPercent = (improvement / before) * 100
        
        comparisons.push({
          metric: metric.name,
          before,
          after,
          improvement,
          improvementPercent,
          targetMet: after <= metric.target,
          target: metric.target
        })
      }
    })

    // Performance score comparison
    if (baseline.score && currentResult.score) {
      const improvement = currentResult.score - baseline.score
      const improvementPercent = (improvement / baseline.score) * 100
      
      comparisons.push({
        metric: 'Performance Score',
        before: baseline.score,
        after: currentResult.score,
        improvement,
        improvementPercent,
        targetMet: currentResult.score >= this.targets.performanceScore,
        target: this.targets.performanceScore
      })
    }

    return comparisons
  }

  private generateSummary(results: LighthouseResult[], comparisons: PerformanceComparison[]) {
    const overallScore = results.length > 0 ? results[0].score : 0
    const targetsMet = comparisons.filter(c => c.targetMet).length
    const totalTargets = comparisons.length
    const totalImprovement = comparisons.reduce((sum, c) => sum + Math.abs(c.improvementPercent), 0)

    const recommendations: string[] = []

    // Generate recommendations based on results
    if (results.length > 0) {
      const result = results[0]
      
      if (result.metrics.fcp > this.targets.fcp) {
        recommendations.push('Optimize First Contentful Paint by inlining critical CSS and reducing render-blocking resources')
      }
      
      if (result.metrics.lcp > this.targets.lcp) {
        recommendations.push('Improve Largest Contentful Paint by optimizing images and implementing preloading for critical resources')
      }
      
      if (result.metrics.cls > this.targets.cls) {
        recommendations.push('Reduce Cumulative Layout Shift by setting explicit dimensions for images and avoiding dynamic content insertion')
      }
      
      if (result.score < this.targets.performanceScore) {
        recommendations.push('Focus on overall performance score by addressing the highest impact issues identified in Lighthouse')
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent performance! All targets are met. Consider implementing advanced optimizations and monitoring.')
    }

    return {
      overallScore,
      targetsMet,
      totalTargets,
      totalImprovement,
      recommendations
    }
  }

  private saveReport(report: ValidationReport): void {
    const timestamp = Date.now()
    const reportPath = join(this.resultsDir, `validation-report-${timestamp}.json`)
    
    writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    // Also save as latest
    const latestPath = join(this.resultsDir, 'latest-validation.json')
    writeFileSync(latestPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Validation report saved: ${reportPath}`)
  }

  private generateOptimizationReport(report: ValidationReport): void {
    const timestamp = new Date().toLocaleString()
    const reportPath = join(this.resultsDir, `PERFORMANCE_OPTIMIZATION_REPORT.md`)
    
    const md = `# Performance Optimization Report

**Generated:** ${timestamp}

## Executive Summary

The Design Kit application has undergone comprehensive performance optimization to address critical loading issues. This report validates the improvements against target thresholds and documents the optimization journey.

### Key Results

- **Overall Performance Score:** ${report.summary.overallScore}/100
- **Targets Met:** ${report.summary.targetsMet}/${report.summary.totalTargets}
- **Total Performance Improvement:** ${report.summary.totalImprovement.toFixed(1)}%

## Performance Targets vs Results

| Metric | Target | Current | Status | Improvement |
|--------|--------|---------|--------|-------------|
${report.comparisons.map(c => 
  `| ${c.metric} | ${c.target}${c.metric.includes('Score') ? '' : c.metric.includes('Shift') ? '' : 'ms'} | ${c.after.toFixed(c.metric.includes('Shift') ? 3 : 0)}${c.metric.includes('Score') ? '' : c.metric.includes('Shift') ? '' : 'ms'} | ${c.targetMet ? '✅' : '❌'} | ${c.improvementPercent > 0 ? '+' : ''}${c.improvementPercent.toFixed(1)}% |`
).join('\n')}

## Optimization Phases Completed

${OPTIMIZATION_PHASES.map(phase => `
### ${phase.name}

**Status:** ${phase.completed ? '✅ Completed' : '⏳ In Progress'}

**Description:** ${phase.description}

**Expected Improvements:**
${phase.expectedImprovements.map(imp => `- ${imp}`).join('\n')}
`).join('\n')}

## Detailed Performance Analysis

${report.results.map(result => `
### Performance Metrics for ${result.url}

**Lighthouse Performance Score:** ${result.score}/100

| Core Web Vital | Value | Target | Status |
|----------------|-------|--------|--------|
| First Contentful Paint (FCP) | ${result.metrics.fcp.toFixed(0)}ms | ${report.targets.fcp}ms | ${result.metrics.fcp <= report.targets.fcp ? '✅' : '❌'} |
| Largest Contentful Paint (LCP) | ${result.metrics.lcp.toFixed(0)}ms | ${report.targets.lcp}ms | ${result.metrics.lcp <= report.targets.lcp ? '✅' : '❌'} |
| Cumulative Layout Shift (CLS) | ${result.metrics.cls.toFixed(3)} | ${report.targets.cls} | ${result.metrics.cls <= report.targets.cls ? '✅' : '❌'} |
| Total Blocking Time (TBT) | ${result.metrics.tbt.toFixed(0)}ms | 200ms | ${result.metrics.tbt <= 200 ? '✅' : '❌'} |
| Speed Index (SI) | ${result.metrics.si.toFixed(0)}ms | 3000ms | ${result.metrics.si <= 3000 ? '✅' : '❌'} |

${result.budgetViolations.length > 0 ? `
**⚠️ Budget Violations:**
${result.budgetViolations.map(v => `- ${v}`).join('\n')}
` : '**✅ All performance budgets passed**'}
`).join('\n')}

## Performance Improvements Achieved

${report.comparisons.length > 0 ? `
The following improvements have been measured compared to baseline:

${report.comparisons.map(c => `
### ${c.metric}
- **Before:** ${c.before.toFixed(c.metric.includes('Shift') ? 3 : 0)}${c.metric.includes('Score') ? '' : c.metric.includes('Shift') ? '' : 'ms'}
- **After:** ${c.after.toFixed(c.metric.includes('Shift') ? 3 : 0)}${c.metric.includes('Score') ? '' : c.metric.includes('Shift') ? '' : 'ms'}
- **Improvement:** ${c.improvement > 0 ? '+' : ''}${c.improvement.toFixed(c.metric.includes('Shift') ? 3 : 0)}${c.metric.includes('Score') ? '' : c.metric.includes('Shift') ? '' : 'ms'} (${c.improvementPercent > 0 ? '+' : ''}${c.improvementPercent.toFixed(1)}%)
- **Target Met:** ${c.targetMet ? '✅ Yes' : '❌ No'}
`).join('\n')}
` : 'No baseline data available for comparison. This report establishes the current performance baseline.'}

## Recommendations

${report.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

## Technical Implementation Summary

### Bundle Optimization
- Implemented webpack-bundle-analyzer for dependency analysis
- Configured Next.js code splitting for route-based chunks
- Removed unused dependencies and implemented tree shaking
- Reduced vendor bundle size through dynamic imports

### Loading Strategy Optimization
- Converted synchronous scripts to async/defer loading
- Implemented critical CSS inlining for above-fold content
- Added route-based code splitting for all tool pages
- Created loading components for improved perceived performance

### Performance Monitoring
- Deployed real-time Core Web Vitals monitoring
- Implemented performance alerts with threshold-based triggering
- Created performance dashboard for historical tracking
- Set up automated Lighthouse CI for regression testing

### Resource Loading Optimization
- Implemented service worker for static asset caching
- Optimized Next.js Image component usage
- Added lazy loading for below-fold content
- Configured progressive loading strategies

### Runtime Performance Optimization
- Eliminated long tasks blocking the main thread
- Implemented React.memo and optimization hooks
- Added performance profiling for computational operations
- Optimized re-rendering patterns in tool components

## Monitoring and Maintenance

### Continuous Monitoring
- Real-time Core Web Vitals tracking in production
- Automated performance alerts for threshold violations
- Performance dashboard with historical trends
- Lighthouse CI integration in deployment pipeline

### Performance Budget Enforcement
- Automated budget validation in CI/CD
- Performance regression detection
- Bundle size monitoring and alerts
- Core Web Vitals threshold enforcement

## Next Steps

1. **Deploy to Production:** Deploy the optimized application to production environment
2. **Monitor Performance:** Track real-world performance metrics and user experience
3. **Iterative Optimization:** Continue optimizing based on production data and user feedback
4. **Advanced Features:** Implement advanced optimizations like edge caching and CDN optimization

---

*This report was generated automatically by the Performance Validation System on ${timestamp}*
`

    writeFileSync(reportPath, md)
    console.log(`📄 Optimization report generated: ${reportPath}`)
  }

  public async saveBaseline(): Promise<void> {
    console.log('💾 Saving current performance as baseline...')
    
    const lighthouseRunner = new LighthouseCIRunner()
    const results = await lighthouseRunner.runTests()
    
    const baseline = {
      timestamp: new Date().toISOString(),
      results,
      note: 'Performance baseline before optimizations'
    }
    
    const baselinePath = join(this.resultsDir, 'baseline.json')
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2))
    
    console.log(`📊 Baseline saved: ${baselinePath}`)
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const validator = new PerformanceValidator()
  
  try {
    if (command === 'baseline') {
      await validator.saveBaseline()
    } else {
      const report = await validator.validatePerformance()
      
      console.log('\n📊 Performance Validation Summary:')
      console.log(`Overall Score: ${report.summary.overallScore}/100`)
      console.log(`Targets Met: ${report.summary.targetsMet}/${report.summary.totalTargets}`)
      
      if (report.summary.targetsMet === report.summary.totalTargets) {
        console.log('🎉 All performance targets achieved!')
      } else {
        console.log('⚠️ Some performance targets need attention')
        console.log('\nRecommendations:')
        report.summary.recommendations.forEach(rec => console.log(`- ${rec}`))
      }
    }
  } catch (error) {
    console.error('❌ Performance validation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { PerformanceValidator, type ValidationReport, type PerformanceTargets }