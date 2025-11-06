/**
 * Font optimization utilities for better loading performance
 * Implements font-display: swap and preloading strategies
 */

/**
 * Font configuration for optimization
 */
interface FontConfig {
  family: string
  weights: number[]
  styles: string[]
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'
  preload?: boolean
}

/**
 * Default font configurations
 */
export const FONT_CONFIGS: FontConfig[] = [
  {
    family: 'Inter',
    weights: [400, 500, 600, 700],
    styles: ['normal'],
    display: 'swap',
    preload: true,
  },
]

/**
 * Apply font-display: swap to all fonts
 */
export function optimizeFontDisplay(): void {
  if (typeof document === 'undefined') return

  // Add CSS to ensure all fonts use swap
  const style = document.createElement('style')
  style.textContent = `
    /* Optimize font loading with font-display: swap */
    @font-face {
      font-display: swap;
    }
    
    /* Ensure system font fallbacks */
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    }
    
    /* Prevent layout shift during font loading */
    .font-loading {
      visibility: hidden;
    }
    
    .font-loaded {
      visibility: visible;
    }
  `
  document.head.appendChild(style)
}

/**
 * Preload critical fonts
 */
export function preloadCriticalFonts(configs: FontConfig[] = FONT_CONFIGS): void {
  if (typeof document === 'undefined') return

  configs.forEach(config => {
    if (!config.preload) return

    config.weights.forEach(weight => {
      config.styles.forEach(style => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
        
        // Construct font URL (adjust based on your font hosting)
        link.href = `/fonts/${config.family.toLowerCase()}-${weight}${style === 'italic' ? '-italic' : ''}.woff2`
        
        document.head.appendChild(link)
      })
    })
  })
}

/**
 * Load fonts with fallback and loading states
 */
export async function loadFontsWithFallback(configs: FontConfig[] = FONT_CONFIGS): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return
  }

  try {
    // Add loading class to body
    document.body.classList.add('font-loading')

    const fontPromises = configs.map(async config => {
      const fontPromises = config.weights.flatMap(weight =>
        config.styles.map(async style => {
          const fontFace = new FontFace(
            config.family,
            `url(/fonts/${config.family.toLowerCase()}-${weight}${style === 'italic' ? '-italic' : ''}.woff2) format('woff2')`,
            {
              weight: weight.toString(),
              style,
              display: config.display,
            }
          )

          try {
            const loadedFont = await fontFace.load()
            document.fonts.add(loadedFont)
            return loadedFont
          } catch (error) {
            console.warn(`Failed to load font: ${config.family} ${weight} ${style}`, error)
            return null
          }
        })
      )

      return Promise.allSettled(fontPromises)
    })

    await Promise.allSettled(fontPromises)

    // Remove loading class and add loaded class
    document.body.classList.remove('font-loading')
    document.body.classList.add('font-loaded')

    console.log('Fonts loaded successfully')
  } catch (error) {
    console.error('Font loading failed:', error)
    
    // Ensure we remove loading class even on error
    document.body.classList.remove('font-loading')
    document.body.classList.add('font-loaded')
  }
}

/**
 * Check if fonts are loaded
 */
export function areFontsLoaded(): boolean {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return true // Assume loaded if not supported
  }

  return document.fonts.status === 'loaded'
}

/**
 * Wait for fonts to load with timeout
 */
export async function waitForFonts(timeout: number = 3000): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return true
  }

  try {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, timeout))
    ])
    
    return document.fonts.status === 'loaded'
  } catch {
    return false
  }
}

/**
 * Generate font CSS with optimizations
 */
export function generateOptimizedFontCSS(configs: FontConfig[] = FONT_CONFIGS): string {
  return configs.map(config => {
    const fontFaces = config.weights.flatMap(weight =>
      config.styles.map(style => `
        @font-face {
          font-family: '${config.family}';
          font-style: ${style};
          font-weight: ${weight};
          font-display: ${config.display};
          src: url('/fonts/${config.family.toLowerCase()}-${weight}${style === 'italic' ? '-italic' : ''}.woff2') format('woff2');
        }
      `)
    ).join('\n')

    return fontFaces
  }).join('\n')
}

/**
 * Initialize font optimization
 */
export function initializeFontOptimization(): void {
  if (typeof document === 'undefined') return

  // Apply font display optimizations
  optimizeFontDisplay()
  
  // Preload critical fonts
  preloadCriticalFonts()
  
  // Load fonts with fallback
  loadFontsWithFallback().catch(error => {
    console.error('Font initialization failed:', error)
  })
}

/**
 * Font loading hook for React components
 */
export function useFontLoading() {
  const [isLoaded, setIsLoaded] = React.useState(() => {
    if (typeof window === 'undefined') return true
    return areFontsLoaded()
  })
  
  const [isLoading, setIsLoading] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return !areFontsLoaded()
  })

  React.useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return

    setIsLoading(true)

    waitForFonts().then(loaded => {
      setIsLoaded(loaded)
      setIsLoading(false)
    })
  }, [isLoaded])

  if (typeof window === 'undefined') {
    return { isLoaded: true, isLoading: false }
  }

  return { isLoaded, isLoading }
}

/**
 * Critical font subset for faster loading
 */
export const CRITICAL_FONT_SUBSET = `
  /* Critical font subset for immediate rendering */
  @font-face {
    font-family: 'Inter-Critical';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('data:font/woff2;base64,') format('woff2');
    unicode-range: U+0020-007F; /* Basic Latin */
  }
`

/**
 * Add critical font subset to document head
 */
export function addCriticalFontSubset(): void {
  if (typeof document === 'undefined') return

  const style = document.createElement('style')
  style.textContent = CRITICAL_FONT_SUBSET
  document.head.appendChild(style)
}