#!/usr/bin/env tsx

/**
 * Dependency Audit Script
 * 
 * This script analyzes package.json dependencies and identifies:
 * - Unused dependencies that can be removed
 * - Duplicate dependencies that can be consolidated
 * - Large dependencies that should be code-split
 * - Opportunities for tree shaking optimization
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

interface DependencyAnalysis {
  timestamp: string
  totalDependencies: number
  unusedDependencies: string[]
  duplicateDependencies: DuplicateDep[]
  largeDependencies: LargeDep[]
  recommendations: string[]
  potentialSavings: number
}

interface DuplicateDep {
  name: string
  versions: string[]
  locations: string[]
}

interface LargeDep {
  name: string
  size: number
  usage: string[]
  canCodeSplit: boolean
}

class DependencyAuditor {
  private packageJson: any
  private lockFile: any
  private sourceFiles: string[] = []

  constructor() {
    this.packageJson = JSON.parse(readFileSync('package.json', 'utf-8'))
    
    // Try to read lock file
    if (existsSync('package-lock.json')) {
      this.lockFile = JSON.parse(readFileSync('package-lock.json', 'utf-8'))
    }
  }

  async auditDependencies(): Promise<DependencyAnalysis> {
    console.log('🔍 Starting dependency audit...')
    
    // Scan source files
    await this.scanSourceFiles()
    
    // Analyze dependencies
    const unusedDeps = await this.findUnusedDependencies()
    const duplicateDeps = await this.findDuplicateDependencies()
    const largeDeps = await this.analyzeLargeDependencies()
    
    const analysis: DependencyAnalysis = {
      timestamp: new Date().toISOString(),
      totalDependencies: Object.keys(this.packageJson.dependencies || {}).length,
      unusedDependencies: unusedDeps,
      duplicateDependencies: duplicateDeps,
      largeDependencies: largeDeps,
      recommendations: this.generateRecommendations(unusedDeps, duplicateDeps, largeDeps),
      potentialSavings: this.calculatePotentialSavings(unusedDeps, largeDeps)
    }
    
    this.generateReport(analysis)
    return analysis
  }

  private async scanSourceFiles(): Promise<void> {
    console.log('📁 Scanning source files...')
    
    const patterns = [
      'app/**/*.{ts,tsx,js,jsx}',
      'components/**/*.{ts,tsx,js,jsx}',
      'lib/**/*.{ts,tsx,js,jsx}',
      'store/**/*.{ts,tsx,js,jsx}',
      'types/**/*.{ts,tsx}',
      'config/**/*.{ts,js}',
      'scripts/**/*.{ts,js}',
      '*.{ts,tsx,js,jsx}' // Root level files
    ]
    
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { ignore: ['node_modules/**', '.next/**'] })
        this.sourceFiles.push(...files)
      } catch (error) {
        console.warn(`Warning: Could not scan pattern ${pattern}:`, error)
      }
    }
    
    console.log(`📄 Found ${this.sourceFiles.length} source files`)
  }

  private async findUnusedDependencies(): Promise<string[]> {
    console.log('🔍 Analyzing dependency usage...')
    
    const dependencies = Object.keys(this.packageJson.dependencies || {})
    const devDependencies = Object.keys(this.packageJson.devDependencies || {})
    const allDeps = [...dependencies, ...devDependencies]
    
    const unusedDeps: string[] = []
    
    for (const dep of allDeps) {
      // Skip certain dependencies that are used indirectly
      if (this.isIndirectDependency(dep)) {
        continue
      }
      
      const isUsed = await this.isDependencyUsed(dep)
      if (!isUsed) {
        unusedDeps.push(dep)
      }
    }
    
    return unusedDeps
  }

  private isIndirectDependency(dep: string): boolean {
    // Dependencies that are used indirectly or by build tools
    const indirectDeps = [
      'typescript',
      'eslint',
      'prettier',
      'tailwindcss',
      'postcss',
      'autoprefixer',
      '@types/',
      'vitest',
      'playwright',
      'tsx'
    ]
    
    return indirectDeps.some(indirect => dep.includes(indirect))
  }

  private async isDependencyUsed(dep: string): Promise<boolean> {
    // Check if dependency is imported in any source file
    const importPatterns = [
      `from '${dep}'`,
      `from "${dep}"`,
      `import('${dep}')`,
      `import("${dep}")`,
      `require('${dep}')`,
      `require("${dep}")`,
      // Handle scoped packages
      dep.startsWith('@') ? `from '${dep.split('/')[0]}` : null,
      // Handle sub-imports
      `from '${dep}/`,
      `from "${dep}/`
    ].filter(Boolean)
    
    for (const file of this.sourceFiles) {
      try {
        const content = readFileSync(file, 'utf-8')
        
        for (const pattern of importPatterns) {
          if (content.includes(pattern!)) {
            return true
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue
      }
    }
    
    return false
  }

  private async findDuplicateDependencies(): Promise<DuplicateDep[]> {
    console.log('🔍 Checking for duplicate dependencies...')
    
    if (!this.lockFile?.packages) {
      return []
    }
    
    const packageVersions: Record<string, Set<string>> = {}
    
    // Analyze lock file for version conflicts
    for (const [path, pkg] of Object.entries(this.lockFile.packages)) {
      if (!path.includes('node_modules/')) continue
      
      const match = path.match(/node_modules\/([^/]+)/)
      if (!match) continue
      
      const packageName = match[1]
      const version = (pkg as any).version
      
      if (!packageVersions[packageName]) {
        packageVersions[packageName] = new Set()
      }
      packageVersions[packageName].add(version)
    }
    
    // Find packages with multiple versions
    const duplicates: DuplicateDep[] = []
    for (const [name, versions] of Object.entries(packageVersions)) {
      if (versions.size > 1) {
        duplicates.push({
          name,
          versions: Array.from(versions),
          locations: [`node_modules/${name}`]
        })
      }
    }
    
    return duplicates
  }

  private async analyzeLargeDependencies(): Promise<LargeDep[]> {
    console.log('📊 Analyzing large dependencies...')
    
    // Known large dependencies with estimated sizes (in bytes)
    const knownSizes: Record<string, { size: number; canCodeSplit: boolean }> = {
      '@sentry/nextjs': { size: 2500000, canCodeSplit: true },
      'framer-motion': { size: 1200000, canCodeSplit: true },
      '@radix-ui/react-dialog': { size: 200000, canCodeSplit: true },
      '@radix-ui/react-dropdown-menu': { size: 180000, canCodeSplit: true },
      '@radix-ui/react-select': { size: 220000, canCodeSplit: true },
      '@radix-ui/react-tabs': { size: 150000, canCodeSplit: true },
      '@radix-ui/react-toast': { size: 160000, canCodeSplit: true },
      'lucide-react': { size: 600000, canCodeSplit: true },
      '@supabase/supabase-js': { size: 500000, canCodeSplit: false },
      'stripe': { size: 400000, canCodeSplit: true },
      'browser-image-compression': { size: 300000, canCodeSplit: true },
      'recharts': { size: 250000, canCodeSplit: true },
      'qrcode': { size: 150000, canCodeSplit: true },
      'date-fns': { size: 100000, canCodeSplit: true },
      'react-hot-toast': { size: 80000, canCodeSplit: true },
      'zod': { size: 120000, canCodeSplit: false },
      'zustand': { size: 50000, canCodeSplit: false }
    }
    
    const largeDeps: LargeDep[] = []
    const dependencies = Object.keys(this.packageJson.dependencies || {})
    
    for (const dep of dependencies) {
      const info = knownSizes[dep]
      if (info && info.size > 100000) { // 100KB threshold
        const usage = await this.findDependencyUsage(dep)
        largeDeps.push({
          name: dep,
          size: info.size,
          usage,
          canCodeSplit: info.canCodeSplit
        })
      }
    }
    
    return largeDeps.sort((a, b) => b.size - a.size)
  }

  private async findDependencyUsage(dep: string): Promise<string[]> {
    const usage: string[] = []
    
    for (const file of this.sourceFiles) {
      try {
        const content = readFileSync(file, 'utf-8')
        if (content.includes(dep)) {
          // Extract relative path from project root
          const relativePath = file.replace(process.cwd() + '/', '')
          usage.push(relativePath)
        }
      } catch (error) {
        continue
      }
    }
    
    return usage.slice(0, 5) // Limit to first 5 usages
  }

  private generateRecommendations(
    unusedDeps: string[],
    duplicateDeps: DuplicateDep[],
    largeDeps: LargeDep[]
  ): string[] {
    const recommendations: string[] = []
    
    // Unused dependencies
    if (unusedDeps.length > 0) {
      recommendations.push(`🗑️  Remove ${unusedDeps.length} unused dependencies: ${unusedDeps.slice(0, 3).join(', ')}${unusedDeps.length > 3 ? '...' : ''}`)
    }
    
    // Duplicate dependencies
    if (duplicateDeps.length > 0) {
      recommendations.push(`⚠️  Resolve ${duplicateDeps.length} duplicate dependencies to reduce bundle size`)
    }
    
    // Large dependencies that can be code-split
    const codeSplittable = largeDeps.filter(dep => dep.canCodeSplit && dep.size > 200000)
    if (codeSplittable.length > 0) {
      recommendations.push(`📦 Code-split ${codeSplittable.length} large dependencies: ${codeSplittable.slice(0, 2).map(d => d.name).join(', ')}`)
    }
    
    // Tree shaking opportunities
    const treeShakeable = ['lucide-react', 'date-fns', '@radix-ui/*']
    const hasTreeShakeable = largeDeps.some(dep => 
      treeShakeable.some(pattern => dep.name.includes(pattern.replace('*', '')))
    )
    if (hasTreeShakeable) {
      recommendations.push('🌳 Implement tree shaking for icon libraries and utility functions')
    }
    
    // Bundle splitting recommendations
    recommendations.push('✂️  Split vendor bundle into framework, UI, and utility chunks')
    recommendations.push('🔄 Implement dynamic imports for tool-specific components')
    
    return recommendations
  }

  private calculatePotentialSavings(unusedDeps: string[], largeDeps: LargeDep[]): number {
    let savings = 0
    
    // Estimate savings from removing unused deps (assume average 50KB each)
    savings += unusedDeps.length * 50000
    
    // Estimate savings from code splitting large deps (assume 30% reduction)
    const codeSplittable = largeDeps.filter(dep => dep.canCodeSplit)
    savings += codeSplittable.reduce((sum, dep) => sum + (dep.size * 0.3), 0)
    
    return Math.round(savings)
  }

  private generateReport(analysis: DependencyAnalysis): void {
    // Write JSON report
    writeFileSync('dependency-audit-report.json', JSON.stringify(analysis, null, 2))
    
    // Write human-readable report
    const reportLines = [
      '# Dependency Audit Report',
      `Generated: ${analysis.timestamp}`,
      '',
      '## Summary',
      `Total Dependencies: ${analysis.totalDependencies}`,
      `Unused Dependencies: ${analysis.unusedDependencies.length}`,
      `Duplicate Dependencies: ${analysis.duplicateDependencies.length}`,
      `Large Dependencies: ${analysis.largeDependencies.length}`,
      `Potential Savings: ${Math.round(analysis.potentialSavings / 1000)}KB`,
      '',
      '## Unused Dependencies',
      ...analysis.unusedDependencies.map(dep => `- ${dep}`),
      '',
      '## Large Dependencies (>100KB)',
      ...analysis.largeDependencies.map(dep => 
        `- ${dep.name}: ${Math.round(dep.size / 1000)}KB ${dep.canCodeSplit ? '(can code-split)' : '(keep bundled)'}`
      ),
      '',
      '## Duplicate Dependencies',
      ...analysis.duplicateDependencies.map(dep => 
        `- ${dep.name}: ${dep.versions.join(', ')}`
      ),
      '',
      '## Recommendations',
      ...analysis.recommendations,
      '',
      '## Action Items',
      '1. Remove unused dependencies with: npm uninstall <package>',
      '2. Update duplicate dependencies to use consistent versions',
      '3. Implement dynamic imports for large, code-splittable dependencies',
      '4. Configure tree shaking for icon and utility libraries',
      '5. Split vendor bundle using webpack configuration'
    ]
    
    writeFileSync('dependency-audit-report.md', reportLines.join('\n'))
    
    console.log('📊 Dependency audit complete!')
    console.log(`📄 Report saved to: dependency-audit-report.json`)
    console.log('📄 Human-readable report: dependency-audit-report.md')
    console.log(`💾 Potential savings: ${Math.round(analysis.potentialSavings / 1000)}KB`)
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new DependencyAuditor()
  auditor.auditDependencies().catch(console.error)
}

export { DependencyAuditor }