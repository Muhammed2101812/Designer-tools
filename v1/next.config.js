const { withSentryConfig } = require('@sentry/nextjs')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true' && process.env.NODE_ENV !== 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC for faster minification
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'], // Modern image formats
    minimumCacheTTL: 60,
  },

  // Compress responses
  compress: true,

  // Optimize production output
  productionBrowserSourceMaps: false,

  // Optimize page loading
  poweredByHeader: false,
  
  // Security headers
  async headers() {
    // In development, use relaxed CSP for easier debugging
    const isDev = process.env.NODE_ENV === 'development'

    const baseSecurityHeaders = [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          ...(isDev ? [] : [{
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.remove.bg https://api.replicate.com https://upstash.io https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }])
        ],
      }
    ]

    // In production, allow long-lived caching for static assets.
    // In development, prevent caching of Next.js dev chunks to avoid stale chunk errors.
    if (process.env.NODE_ENV === 'production') {
      return [
        ...baseSecurityHeaders,
        {
          source: '/_next/static/css/:path*',
          headers: [
            { key: 'Content-Type', value: 'text/css; charset=utf-8' },
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
        {
          source: '/_next/static/chunks/:path*',
          headers: [
            { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
      ]
    }

    return [
      ...baseSecurityHeaders,
      {
        source: '/_next/static/:path*',
        headers: [
          // Be explicit in dev to avoid stale chunk caching
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ]
  },
  
  // Performance optimizations
  experimental: {
    // Enable optimized package imports for tree shaking
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
      'date-fns'
    ],

    // Enable optimized script loading
    optimizeCss: true,

    // Enable server components optimization
    serverComponentsExternalPackages: ['canvas', 'sharp'],

    // Enable optimized font loading
    optimizeServerReact: true,

    // Faster page loads
    scrollRestoration: true,
  },
  
  // Webpack configuration for performance
  webpack: (config, { isServer, dev }) => {
    // Optimize script loading
    if (!isServer) {
      // Enable async chunk loading
      config.output.chunkLoadingGlobal = 'webpackChunkdesign_kit'
      config.output.chunkLoading = 'jsonp'

      // Optimize module concatenation
      config.optimization.concatenateModules = true

      // Better module IDs for caching
      config.optimization.moduleIds = 'deterministic'

      // Enable async loading for dynamic imports
      config.optimization.splitChunks = config.optimization.splitChunks || {}
      config.optimization.splitChunks.chunks = 'all'

      // Reduce main bundle size in development
      if (dev) {
        config.optimization.removeAvailableModules = false
        config.optimization.removeEmptyChunks = false
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        }
      }
    }
    
    // Optimize bundle splitting for production
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 150000, // Reduced from 200KB to 150KB
          cacheGroups: {
            // Critical framework chunks
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              priority: 40,
              enforce: true,
            },
            // Radix UI chunks (split separately)
            radixUI: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 35,
              enforce: true,
            },
            // Icons (separate from other UI)
            icons: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'icons',
              priority: 32,
              enforce: true,
              maxSize: 100000, // Force split if > 100KB
            },
            // Framer Motion (heavy animation library)
            motion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 31,
              enforce: true,
            },
            // Supabase and auth
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase|@stripe)[\\/]/,
              name: 'supabase-stripe',
              priority: 25,
              enforce: true,
            },
            // Image processing libraries
            imageProcessing: {
              test: /[\\/]node_modules[\\/](browser-image-compression|qrcode)[\\/]/,
              name: 'image-processing',
              priority: 20,
              enforce: true,
            },
            // Other vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              minChunks: 1,
              maxSize: 150000, // Smaller vendor chunks
            },
            // Tool-specific code
            tools: {
              test: /[\\/]app[\\/]\(tools\)[\\/]/,
              name: 'tools',
              priority: 15,
              minChunks: 1,
            },
            // Shared components
            shared: {
              test: /[\\/]components[\\/](shared|ui)[\\/]/,
              name: 'shared-components',
              priority: 12,
              minChunks: 2,
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    return config
  },
  
  // Compiler optimizations (Turbopack compatible)
  compiler: {
    // Enable SWC minification for better tree shaking
    styledComponents: false,
  },
  
  // Enable tree shaking optimizations
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
      skipDefaultConversion: true,
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
      preventFullImport: true,
      skipDefaultConversion: true,
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}.js',
      preventFullImport: true,
      skipDefaultConversion: true,
    },
  },

  // Ignore build errors for now to test
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project from Sentry
  org: "muhammed-6y",
  project: "javascript-nextjs",
  
  // Auth token for uploading source maps (optional in development)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  
  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,
  
  // Hide source maps from public
  hideSourceMaps: true,
  
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Disable source map upload if auth token is not set (development)
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  
  // Enable automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
}

// Wrap Next.js config with Sentry and Bundle Analyzer
module.exports = withBundleAnalyzer(withSentryConfig(nextConfig, sentryWebpackPluginOptions))
