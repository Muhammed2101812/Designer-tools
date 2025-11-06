/**
 * Script loading optimization utilities
 * Implements async/defer loading strategies and critical path optimization
 */

/**
 * Script loading strategies
 */
export type ScriptStrategy = 'afterInteractive' | 'lazyOnload' | 'beforeInteractive'

/**
 * Critical scripts that should load immediately
 */
export const CRITICAL_SCRIPTS = [
  'supabase',
  'stripe',
] as const

/**
 * Non-critical scripts that can be deferred
 */
export const DEFERRED_SCRIPTS = [
  'analytics',
  'sentry',
  'performance-monitoring',
  'social-sharing',
  'feedback-widgets',
] as const

/**
 * Critical CSS for above-the-fold content
 */
export const CRITICAL_CSS = `
  /* Reset and base styles */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
  }
  
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    background-color: #ffffff;
  }
  
  /* Skip link for accessibility */
  .skip-to-main {
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px 12px;
    text-decoration: none;
    z-index: 1000;
    border-radius: 4px;
    font-size: 14px;
    transition: top 0.2s ease;
  }
  
  .skip-to-main:focus {
    top: 6px;
  }
  
  /* Critical layout styles */
  .flex {
    display: flex;
  }
  
  .flex-col {
    flex-direction: column;
  }
  
  .min-h-screen {
    min-height: 100vh;
  }
  
  .flex-1 {
    flex: 1 1 0%;
  }
  
  /* Critical loading states */
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Critical aspect ratios to prevent layout shift */
  .aspect-video {
    aspect-ratio: 16 / 9;
  }
  
  .aspect-square {
    aspect-ratio: 1 / 1;
  }
`

/**
 * Get critical CSS as a string
 */
export function getCriticalCSS(): string {
  return CRITICAL_CSS
}

/**
 * Tool navigation patterns for intelligent preloading
 */
export const TOOL_NAVIGATION_PATTERNS = {
  'color-picker': ['gradient-generator', 'image-cropper'],
  'image-cropper': ['image-resizer', 'format-converter'],
  'image-resizer': ['image-compressor', 'format-converter'],
  'format-converter': ['image-compressor'],
  'background-remover': ['mockup-generator', 'image-compressor'],
  'qr-generator': ['mockup-generator'],
  'mockup-generator': ['image-compressor'],
  'image-upscaler': ['image-compressor', 'format-converter'],
  'image-compressor': ['format-converter'],
  'gradient-generator': ['color-picker'],
} as const

/**
 * Get likely next routes based on current tool
 */
export function getLikelyNextRoutes(currentTool: string): string[] {
  const patterns = TOOL_NAVIGATION_PATTERNS[currentTool as keyof typeof TOOL_NAVIGATION_PATTERNS]
  return patterns ? [...patterns] : []
}

/**
 * Preload likely next routes based on user navigation patterns
 */
export function preloadLikelyRoutes(currentTool: string): void {
  const likelyRoutes = getLikelyNextRoutes(currentTool)
  
  likelyRoutes.forEach(route => {
    // Use requestIdleCallback for non-blocking preloading
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        // Preload the route component
        import(`@/app/(tools)/${route}/page`).catch(() => {
          // Silently fail - preloading is optional
        })
      })
    }
  })
}