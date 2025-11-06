#!/usr/bin/env node

/**
 * Development performance check script
 * Helps identify common issues that cause slow development server startup
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking development performance issues...\n')

// Check node_modules size
function checkNodeModulesSize() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found. Run npm install first.')
    return
  }

  try {
    const { execSync } = require('child_process')
    const size = execSync(`du -sh ${nodeModulesPath} 2>/dev/null || echo "Unknown"`, { encoding: 'utf8' }).trim()
    console.log(`📦 node_modules size: ${size}`)
    
    // Check for common heavy packages
    const heavyPackages = [
      '@next/swc-win32-x64-msvc',
      '@swc/core',
      'webpack',
      'typescript',
      'eslint',
      '@sentry/nextjs'
    ]
    
    const installedHeavy = heavyPackages.filter(pkg => 
      fs.existsSync(path.join(nodeModulesPath, pkg))
    )
    
    if (installedHeavy.length > 0) {
      console.log(`📚 Heavy packages detected: ${installedHeavy.join(', ')}`)
    }
  } catch (error) {
    console.log('📦 Could not determine node_modules size')
  }
}

// Check for large files in the project
function checkLargeFiles() {
  const checkPaths = ['app', 'components', 'lib', 'public']
  const largeFiles = []
  
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return
    
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath)
      } else if (stat.isFile() && stat.size > 100 * 1024) { // > 100KB
        largeFiles.push({
          path: fullPath,
          size: Math.round(stat.size / 1024) + 'KB'
        })
      }
    }
  }
  
  checkPaths.forEach(scanDirectory)
  
  if (largeFiles.length > 0) {
    console.log('\n📄 Large files found (>100KB):')
    largeFiles
      .sort((a, b) => parseInt(b.size) - parseInt(a.size))
      .slice(0, 10)
      .forEach(file => {
        console.log(`   ${file.path} (${file.size})`)
      })
  } else {
    console.log('✅ No large files found')
  }
}

// Check TypeScript configuration
function checkTypeScriptConfig() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
  
  if (!fs.existsSync(tsconfigPath)) {
    console.log('❌ tsconfig.json not found')
    return
  }
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
    
    console.log('\n⚙️  TypeScript configuration:')
    
    if (tsconfig.compilerOptions?.strict) {
      console.log('   ✅ Strict mode enabled')
    } else {
      console.log('   ⚠️  Strict mode disabled (may slow down compilation)')
    }
    
    if (tsconfig.compilerOptions?.incremental) {
      console.log('   ✅ Incremental compilation enabled')
    } else {
      console.log('   ⚠️  Incremental compilation disabled (slower rebuilds)')
    }
    
    if (tsconfig.compilerOptions?.skipLibCheck) {
      console.log('   ✅ skipLibCheck enabled (faster compilation)')
    } else {
      console.log('   ⚠️  skipLibCheck disabled (slower compilation)')
    }
  } catch (error) {
    console.log('❌ Could not parse tsconfig.json')
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (!fs.existsSync(envPath)) {
    console.log('\n❌ .env.local not found')
    return
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  console.log('\n🔐 Environment variables:')
  
  // Check for Sentry configuration
  if (envContent.includes('NEXT_PUBLIC_SENTRY_DSN=https://')) {
    console.log('   ✅ Sentry DSN configured')
  } else {
    console.log('   ⚠️  Sentry DSN not configured (may cause errors)')
  }
  
  if (envContent.includes('SENTRY_DEBUG=true')) {
    console.log('   ⚠️  Sentry debug mode enabled (may slow down development)')
  } else {
    console.log('   ✅ Sentry debug mode disabled')
  }
  
  if (envContent.includes('NODE_ENV=development')) {
    console.log('   ✅ Development environment set')
  }
}

// Check for common performance issues
function checkCommonIssues() {
  console.log('\n🚀 Performance recommendations:')
  
  // Check if running on Windows (slower file system)
  if (process.platform === 'win32') {
    console.log('   💡 Running on Windows - consider using WSL2 for better performance')
  }
  
  // Check Node.js version
  const nodeVersion = process.version
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
  
  if (majorVersion < 18) {
    console.log(`   ⚠️  Node.js ${nodeVersion} detected - consider upgrading to Node.js 18+ for better performance`)
  } else {
    console.log(`   ✅ Node.js ${nodeVersion} - good version`)
  }
  
  // Check for .next cache
  const nextCachePath = path.join(process.cwd(), '.next')
  if (fs.existsSync(nextCachePath)) {
    console.log('   ✅ Next.js cache exists')
  } else {
    console.log('   💡 No Next.js cache - first build will be slower')
  }
  
  console.log('\n💡 Quick fixes for slow development:')
  console.log('   1. Clear Next.js cache: rm -rf .next')
  console.log('   2. Clear node_modules: rm -rf node_modules && npm install')
  console.log('   3. Disable Sentry in development: set SENTRY_DEBUG=false')
  console.log('   4. Check for browser extensions blocking requests')
  console.log('   5. Use npm run dev -- --turbo for faster builds (experimental)')
}

// Run all checks
async function runChecks() {
  checkNodeModulesSize()
  checkLargeFiles()
  checkTypeScriptConfig()
  checkEnvironmentVariables()
  checkCommonIssues()
  
  console.log('\n✨ Performance check complete!')
  console.log('\nIf you\'re still experiencing slow loading (>10s), try:')
  console.log('   - Restart your development server')
  console.log('   - Clear browser cache and disable extensions')
  console.log('   - Check network connectivity')
  console.log('   - Run: npm run build to check for build issues')
}

runChecks().catch(console.error)