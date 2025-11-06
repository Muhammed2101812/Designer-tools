#!/usr/bin/env node

/**
 * Quick fix script for development performance issues
 * Addresses the most common causes of slow loading times
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔧 Fixing development performance issues...\n')

// 1. Clear Next.js cache
function clearNextCache() {
  const nextDir = path.join(process.cwd(), '.next')
  
  if (fs.existsSync(nextDir)) {
    try {
      if (process.platform === 'win32') {
        execSync('rmdir /s /q .next', { stdio: 'inherit' })
      } else {
        execSync('rm -rf .next', { stdio: 'inherit' })
      }
      console.log('✅ Cleared Next.js cache (.next directory)')
    } catch (error) {
      console.log('⚠️  Could not clear .next directory (may not exist)')
    }
  } else {
    console.log('ℹ️  No .next directory found')
  }
}

// 2. Optimize environment variables for development
function optimizeEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found')
    return
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8')
  let modified = false
  
  // Disable Sentry debug mode if enabled
  if (envContent.includes('SENTRY_DEBUG=true')) {
    envContent = envContent.replace('SENTRY_DEBUG=true', 'SENTRY_DEBUG=false')
    modified = true
    console.log('✅ Disabled Sentry debug mode')
  }
  
  // Add Next.js telemetry disable if not present
  if (!envContent.includes('NEXT_TELEMETRY_DISABLED')) {
    envContent += '\n# Disable Next.js telemetry for faster builds\nNEXT_TELEMETRY_DISABLED=1\n'
    modified = true
    console.log('✅ Disabled Next.js telemetry')
  }
  
  // Add TypeScript incremental compilation if not present
  if (!envContent.includes('TSC_COMPILE_ON_ERROR')) {
    envContent += '\n# Continue compilation on TypeScript errors\nTSC_COMPILE_ON_ERROR=true\n'
    modified = true
    console.log('✅ Enabled TypeScript error tolerance')
  }
  
  if (modified) {
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Updated .env.local with performance optimizations')
  } else {
    console.log('ℹ️  Environment variables already optimized')
  }
}

// 3. Create or update package.json scripts for better performance
function optimizePackageScripts() {
  const packagePath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found')
    return
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  
  // Add turbo dev script if not present
  if (!packageJson.scripts['dev:turbo']) {
    packageJson.scripts['dev:turbo'] = 'next dev --turbo'
    console.log('✅ Added turbo dev script')
  }
  
  // Add performance check script
  if (!packageJson.scripts['perf:check']) {
    packageJson.scripts['perf:check'] = 'node scripts/dev-performance-check.js'
    console.log('✅ Added performance check script')
  }
  
  // Add cache clear script
  if (!packageJson.scripts['cache:clear']) {
    if (process.platform === 'win32') {
      packageJson.scripts['cache:clear'] = 'rmdir /s /q .next 2>nul || echo "Cache cleared"'
    } else {
      packageJson.scripts['cache:clear'] = 'rm -rf .next && echo "Cache cleared"'
    }
    console.log('✅ Added cache clear script')
  }
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2))
}

// 4. Check and fix TypeScript configuration
function optimizeTypeScriptConfig() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  
  if (!fs.existsSync(tsconfigPath)) {
    console.log('❌ tsconfig.json not found')
    return
  }
  
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
  let modified = false
  
  // Ensure performance optimizations are enabled
  if (!tsconfig.compilerOptions) {
    tsconfig.compilerOptions = {}
  }
  
  const optimizations = {
    incremental: true,
    skipLibCheck: true,
    skipDefaultLibCheck: true,
  }
  
  Object.entries(optimizations).forEach(([key, value]) => {
    if (tsconfig.compilerOptions[key] !== value) {
      tsconfig.compilerOptions[key] = value
      modified = true
    }
  })
  
  if (modified) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2))
    console.log('✅ Optimized TypeScript configuration')
  } else {
    console.log('ℹ️  TypeScript configuration already optimized')
  }
}

// 5. Provide recommendations
function showRecommendations() {
  console.log('\n🚀 Performance recommendations:')
  console.log('')
  console.log('Immediate fixes:')
  console.log('  1. Restart your development server: npm run dev')
  console.log('  2. Try turbo mode: npm run dev:turbo')
  console.log('  3. Clear browser cache and disable extensions')
  console.log('  4. Use incognito mode to test without extensions')
  console.log('')
  console.log('If still slow (>10 seconds to load):')
  console.log('  1. Check network connectivity')
  console.log('  2. Disable antivirus real-time scanning for project folder')
  console.log('  3. Move project to SSD if on HDD')
  console.log('  4. Consider using WSL2 on Windows')
  console.log('')
  console.log('Browser extension issues:')
  console.log('  - Ad blockers may block Sentry requests (causing console errors)')
  console.log('  - Privacy extensions may interfere with development tools')
  console.log('  - Try disabling extensions or use incognito mode')
  console.log('')
  console.log('Available scripts:')
  console.log('  npm run perf:check     - Check for performance issues')
  console.log('  npm run cache:clear    - Clear Next.js cache')
  console.log('  npm run dev:turbo      - Start dev server with turbo mode')
}

// Run all optimizations
async function runOptimizations() {
  try {
    clearNextCache()
    optimizeEnvVars()
    optimizePackageScripts()
    optimizeTypeScriptConfig()
    showRecommendations()
    
    console.log('\n✨ Performance optimizations complete!')
    console.log('\n🔄 Please restart your development server to apply changes.')
  } catch (error) {
    console.error('❌ Error during optimization:', error.message)
    process.exit(1)
  }
}

runOptimizations()