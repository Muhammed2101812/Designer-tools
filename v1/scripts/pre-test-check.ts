/**
 * Pre-Testing Verification Script
 * 
 * Run this before starting manual testing to ensure the application
 * is properly configured and ready for testing.
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, passMsg: string, failMsg: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMsg : failMsg
  })
}

function warn(name: string, message: string) {
  results.push({
    name,
    status: 'warning',
    message
  })
}

console.log('🔍 Running Pre-Testing Verification...\n')

// Check 1: Environment Variables
console.log('Checking environment variables...')
const envPath = join(process.cwd(), '.env.local')
const envExists = existsSync(envPath)
check(
  'Environment File',
  envExists,
  '.env.local file exists',
  '.env.local file not found - copy from .env.example'
)

if (envExists) {
  const envContent = readFileSync(envPath, 'utf-8')
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName) && !envContent.includes(`${varName}=`)
    check(
      varName,
      hasVar,
      `${varName} is configured`,
      `${varName} is missing or empty`
    )
  })
}

// Check 2: Required Files
console.log('Checking required files...')
const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/(tools)/color-picker/page.tsx',
  'components/shared/ToolWrapper.tsx',
  'components/shared/FileUploader.tsx',
  'lib/utils/colorConversion.ts',
  'lib/utils/validation.ts',
  'store/authStore.ts',
  'store/toolStore.ts',
  'store/uiStore.ts'
]

requiredFiles.forEach(file => {
  const filePath = join(process.cwd(), file)
  check(
    `File: ${file}`,
    existsSync(filePath),
    'exists',
    'missing'
  )
})

// Check 3: Dependencies
console.log('Checking dependencies...')
const packageJsonPath = join(process.cwd(), 'package.json')
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
  const requiredDeps = [
    'next',
    'react',
    'typescript',
    '@supabase/supabase-js',
    'zustand',
    'tailwindcss',
    'framer-motion',
    'react-hot-toast',
    'lucide-react'
  ]
  
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies }
  
  requiredDeps.forEach(dep => {
    check(
      `Dependency: ${dep}`,
      dep in allDeps,
      `installed (${allDeps[dep]})`,
      'not installed'
    )
  })
} else {
  check('package.json', false, '', 'package.json not found')
}

// Check 4: Build Status
console.log('Checking build configuration...')
const nextConfigPath = join(process.cwd(), 'next.config.js')
check(
  'Next.js Config',
  existsSync(nextConfigPath),
  'next.config.js exists',
  'next.config.js not found'
)

const tsConfigPath = join(process.cwd(), 'tsconfig.json')
check(
  'TypeScript Config',
  existsSync(tsConfigPath),
  'tsconfig.json exists',
  'tsconfig.json not found'
)

const tailwindConfigPath = join(process.cwd(), 'tailwind.config.ts')
check(
  'Tailwind Config',
  existsSync(tailwindConfigPath),
  'tailwind.config.ts exists',
  'tailwind.config.ts not found'
)

// Check 5: Test Assets
console.log('Checking test assets...')
const publicPath = join(process.cwd(), 'public')
if (existsSync(publicPath)) {
  warn('Test Images', 'Ensure you have test images ready (small, medium, large sizes)')
} else {
  check('Public Directory', false, '', 'public directory not found')
}

// Print Results
console.log('\n' + '='.repeat(60))
console.log('📊 VERIFICATION RESULTS')
console.log('='.repeat(60) + '\n')

const passed = results.filter(r => r.status === 'pass').length
const failed = results.filter(r => r.status === 'fail').length
const warnings = results.filter(r => r.status === 'warning').length

results.forEach(result => {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${result.name}: ${result.message}`)
})

console.log('\n' + '='.repeat(60))
console.log(`Total: ${results.length} checks`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`⚠️  Warnings: ${warnings}`)
console.log('='.repeat(60) + '\n')

if (failed > 0) {
  console.log('❌ VERIFICATION FAILED')
  console.log('Please fix the issues above before starting manual testing.\n')
  process.exit(1)
} else if (warnings > 0) {
  console.log('⚠️  VERIFICATION PASSED WITH WARNINGS')
  console.log('Review warnings above before starting manual testing.\n')
  process.exit(0)
} else {
  console.log('✅ VERIFICATION PASSED')
  console.log('Application is ready for manual testing!\n')
  console.log('Next steps:')
  console.log('1. Start dev server: npm run dev')
  console.log('2. Open TESTING_GUIDE.md for testing instructions')
  console.log('3. Use MANUAL_TESTING_CHECKLIST.md to track progress')
  console.log('4. Fill out TEST_REPORT_TEMPLATE.md with results\n')
  process.exit(0)
}
