# Testing Helper Scripts and Commands

## Browser Testing Commands

### Open in Different Browsers (Windows)

```powershell
# Chrome
start chrome http://localhost:3000

# Firefox
start firefox http://localhost:3000

# Edge
start msedge http://localhost:3000
```

### Open in Different Browsers (macOS)

```bash
# Chrome
open -a "Google Chrome" http://localhost:3000

# Firefox
open -a "Firefox" http://localhost:3000

# Safari
open -a "Safari" http://localhost:3000

# Edge
open -a "Microsoft Edge" http://localhost:3000
```

## Mobile Testing Setup

### iOS Simulator (macOS with Xcode)

```bash
# List available simulators
xcrun simctl list devices

# Boot iPhone 14
xcrun simctl boot "iPhone 14"

# Open Simulator
open -a Simulator

# Open URL in Safari
xcrun simctl openurl booted http://localhost:3000
```

### Android Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd Pixel_5_API_33

# Forward port
adb forward tcp:3000 tcp:3000

# Open URL in Chrome
adb shell am start -a android.intent.action.VIEW -d http://10.0.2.2:3000
```

### Test on Local Network (Mobile Devices)

```bash
# Find your local IP
# Windows
ipconfig

# macOS/Linux
ifconfig

# Then access from mobile device:
# http://YOUR_LOCAL_IP:3000
# Example: http://192.168.1.100:3000
```

## Performance Testing

### Lighthouse CLI

```bash
# Install Lighthouse
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 --view

# Run with specific categories
lighthouse http://localhost:3000 --only-categories=performance,accessibility --view

# Generate JSON report
lighthouse http://localhost:3000 --output json --output-path ./lighthouse-report.json
```

### Chrome DevTools Performance

```javascript
// Run in browser console

// Measure page load time
performance.timing.loadEventEnd - performance.timing.navigationStart

// Measure First Contentful Paint
performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')

// Measure Largest Contentful Paint
new PerformanceObserver((list) => {
  const entries = list.getEntries()
  const lastEntry = entries[entries.length - 1]
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime)
}).observe({entryTypes: ['largest-contentful-paint']})

// Check memory usage
console.log('Memory:', performance.memory)
```

## Accessibility Testing

### axe DevTools (Browser Console)

```javascript
// Install axe-core
// npm install --save-dev @axe-core/cli

// Run from command line
npx @axe-core/cli http://localhost:3000

// Or use browser extension:
// Chrome: https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd
```

### WAVE Testing

```bash
# Use WAVE browser extension
# Chrome: https://chrome.google.com/webstore/detail/wave-evaluation-tool/jbbplnpkjmmeebjpijfedlgcdilocofh
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/wave-accessibility-tool/
```

### Color Contrast Checker

```javascript
// Run in browser console
// Check contrast ratio between two colors

function getContrastRatio(color1, color2) {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number)
    const [r, g, b] = rgb.map(val => {
      val = val / 255
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  const lum1 = getLuminance(color1)
  const lum2 = getLuminance(color2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

// Example usage
const ratio = getContrastRatio('rgb(59, 130, 246)', 'rgb(255, 255, 255)')
console.log('Contrast ratio:', ratio.toFixed(2))
console.log('WCAG AA:', ratio >= 4.5 ? 'PASS' : 'FAIL')
console.log('WCAG AAA:', ratio >= 7 ? 'PASS' : 'FAIL')
```

## Network Testing

### Simulate Slow Network (Chrome DevTools)

```javascript
// Open DevTools > Network tab
// Click "No throttling" dropdown
// Select:
// - Fast 3G
// - Slow 3G
// - Offline

// Or use custom throttling
```

### Test Offline Mode

```javascript
// In browser console
window.addEventListener('offline', () => {
  console.log('App is offline')
})

window.addEventListener('online', () => {
  console.log('App is online')
})

// Check current status
console.log('Online:', navigator.onLine)
```

## Screenshot Automation

### Playwright (for automated screenshots)

```bash
# Install Playwright
npm install -D @playwright/test

# Create screenshot script
```

```javascript
// screenshot-test.js
const { chromium } = require('playwright')

async function captureScreenshots() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Desktop
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:3000')
  await page.screenshot({ path: 'screenshots/desktop.png', fullPage: true })
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.screenshot({ path: 'screenshots/tablet.png', fullPage: true })
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 })
  await page.screenshot({ path: 'screenshots/mobile.png', fullPage: true })
  
  await browser.close()
}

captureScreenshots()
```

## Browser Console Helpers

### Check for Console Errors

```javascript
// Run this in console before testing
const originalError = console.error
const errors = []

console.error = function(...args) {
  errors.push(args)
  originalError.apply(console, args)
}

// After testing, check errors
console.log('Total errors:', errors.length)
console.table(errors)
```

### Monitor Network Requests

```javascript
// Track all network requests
const requests = []

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'resource') {
      requests.push({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize
      })
    }
  })
})

observer.observe({ entryTypes: ['resource'] })

// View requests after testing
console.table(requests)
```

### Check for Memory Leaks

```javascript
// Take heap snapshot before
const before = performance.memory.usedJSHeapSize

// Perform actions (upload image, pick colors, etc.)

// Take heap snapshot after
const after = performance.memory.usedJSHeapSize

// Check difference
const diff = after - before
console.log('Memory difference:', (diff / 1024 / 1024).toFixed(2), 'MB')

// If difference is large (>10MB), investigate memory leak
```

## Keyboard Navigation Testing

### Tab Order Checker

```javascript
// Run in console to highlight tab order
let tabIndex = 0
const focusableElements = document.querySelectorAll(
  'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
)

focusableElements.forEach((el, index) => {
  el.addEventListener('focus', () => {
    console.log(`Tab ${index + 1}:`, el.tagName, el.textContent?.trim() || el.value)
  })
})

console.log('Total focusable elements:', focusableElements.length)
```

### Focus Indicator Checker

```javascript
// Check if focus indicators are visible
const style = document.createElement('style')
style.textContent = `
  *:focus {
    outline: 3px solid red !important;
    outline-offset: 2px !important;
  }
`
document.head.appendChild(style)

console.log('Focus indicators now highlighted in red')
```

## Form Testing

### Auto-fill Test Data

```javascript
// Fill signup form
document.querySelector('input[type="email"]').value = 'test@example.com'
document.querySelector('input[type="password"]').value = 'TestPassword123!'

// Fill profile form
document.querySelector('input[name="fullName"]').value = 'John Doe'
```

### Validation Testing

```javascript
// Test email validation
const emailInput = document.querySelector('input[type="email"]')
const testEmails = [
  'valid@example.com',
  'invalid',
  'missing@domain',
  '@example.com',
  'test@.com'
]

testEmails.forEach(email => {
  emailInput.value = email
  console.log(email, ':', emailInput.checkValidity() ? 'VALID' : 'INVALID')
})
```

## Canvas Testing

### Check Canvas Support

```javascript
// Check if canvas is supported
const canvas = document.createElement('canvas')
const supported = !!(canvas.getContext && canvas.getContext('2d'))
console.log('Canvas supported:', supported)

// Check canvas context options
const ctx = canvas.getContext('2d', { willReadFrequently: true })
console.log('Context settings:', ctx.getContextAttributes())
```

### Test Color Extraction

```javascript
// Test color extraction accuracy
const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// Get pixel at specific coordinate
const x = 100
const y = 100
const imageData = ctx.getImageData(x, y, 1, 1)
const [r, g, b, a] = imageData.data

console.log('Color at (100, 100):')
console.log('RGB:', `rgb(${r}, ${g}, ${b})`)
console.log('HEX:', `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`)
```

## Local Storage / Session Storage Testing

### Check Storage Usage

```javascript
// Check what's stored
console.log('LocalStorage:', localStorage)
console.log('SessionStorage:', sessionStorage)

// Check storage size
const localStorageSize = new Blob(Object.values(localStorage)).size
const sessionStorageSize = new Blob(Object.values(sessionStorage)).size

console.log('LocalStorage size:', (localStorageSize / 1024).toFixed(2), 'KB')
console.log('SessionStorage size:', (sessionStorageSize / 1024).toFixed(2), 'KB')

// Clear storage
// localStorage.clear()
// sessionStorage.clear()
```

## Quick Test Scenarios

### Color Picker Full Test

```javascript
// Automated test sequence (run in console)
async function testColorPicker() {
  console.log('1. Checking file upload area...')
  const uploader = document.querySelector('[data-testid="file-uploader"]')
  console.log('Uploader found:', !!uploader)
  
  console.log('2. Checking canvas...')
  const canvas = document.querySelector('canvas')
  console.log('Canvas found:', !!canvas)
  
  console.log('3. Checking color display...')
  const colorDisplay = document.querySelector('[data-testid="color-display"]')
  console.log('Color display found:', !!colorDisplay)
  
  console.log('4. Checking zoom controls...')
  const zoomIn = document.querySelector('[aria-label*="Zoom in"]')
  const zoomOut = document.querySelector('[aria-label*="Zoom out"]')
  console.log('Zoom controls found:', !!(zoomIn && zoomOut))
  
  console.log('5. Checking color history...')
  const history = document.querySelector('[data-testid="color-history"]')
  console.log('History found:', !!history)
  
  console.log('✅ Color Picker structure check complete')
}

testColorPicker()
```

## Useful Browser Extensions

### Chrome Extensions
- Lighthouse - Performance and accessibility audits
- axe DevTools - Accessibility testing
- WAVE - Accessibility evaluation
- ColorZilla - Color picker and analyzer
- Responsive Viewer - Test multiple screen sizes
- React Developer Tools - React component inspection

### Firefox Extensions
- WAVE - Accessibility evaluation
- Accessibility Inspector - Built-in accessibility tools
- Responsive Design Mode - Built-in responsive testing

## Tips and Tricks

### Quick Browser Cache Clear

```javascript
// Clear cache and reload
location.reload(true) // Hard reload

// Or use keyboard shortcuts:
// Chrome/Firefox: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
// Safari: Cmd + Option + R
```

### Test Multiple Viewports Quickly

```javascript
// Cycle through common viewports
const viewports = [
  { width: 375, height: 667, name: 'iPhone' },
  { width: 768, height: 1024, name: 'iPad' },
  { width: 1920, height: 1080, name: 'Desktop' }
]

// Use Chrome DevTools Device Mode to switch between these
```

### Monitor Page Performance

```javascript
// Log all performance metrics
const perfData = performance.getEntriesByType('navigation')[0]
console.table({
  'DNS Lookup': perfData.domainLookupEnd - perfData.domainLookupStart,
  'TCP Connection': perfData.connectEnd - perfData.connectStart,
  'Request Time': perfData.responseStart - perfData.requestStart,
  'Response Time': perfData.responseEnd - perfData.responseStart,
  'DOM Processing': perfData.domComplete - perfData.domLoading,
  'Load Complete': perfData.loadEventEnd - perfData.loadEventStart
})
```

---

**Use these helpers to speed up your manual testing process!** 🚀
