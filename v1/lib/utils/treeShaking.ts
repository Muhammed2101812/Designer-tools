/**
 * Tree Shaking Configuration
 * 
 * This module provides utilities and configurations for optimizing bundle size
 * through tree shaking and selective imports.
 */

// Optimized icon imports - only import what we need
// Instead of: import { Icon1, Icon2 } from 'lucide-react'
// Use: import Icon1 from 'lucide-react/dist/esm/icons/icon1'

// Common icons used across the application
export { Palette } from 'lucide-react/dist/esm/icons/palette'
export { Crop } from 'lucide-react/dist/esm/icons/crop'
export { Image } from 'lucide-react/dist/esm/icons/image'
export { Download } from 'lucide-react/dist/esm/icons/download'
export { Upload } from 'lucide-react/dist/esm/icons/upload'
export { Settings } from 'lucide-react/dist/esm/icons/settings'
export { Info } from 'lucide-react/dist/esm/icons/info'
export { X } from 'lucide-react/dist/esm/icons/x'
export { Check } from 'lucide-react/dist/esm/icons/check'
export { ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down'
export { ChevronUp } from 'lucide-react/dist/esm/icons/chevron-up'
export { ChevronLeft } from 'lucide-react/dist/esm/icons/chevron-left'
export { ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right'
export { Plus } from 'lucide-react/dist/esm/icons/plus'
export { Minus } from 'lucide-react/dist/esm/icons/minus'
export { RotateCw } from 'lucide-react/dist/esm/icons/rotate-cw'
export { RotateCcw } from 'lucide-react/dist/esm/icons/rotate-ccw'
export { ZoomIn } from 'lucide-react/dist/esm/icons/zoom-in'
export { ZoomOut } from 'lucide-react/dist/esm/icons/zoom-out'
export { Copy } from 'lucide-react/dist/esm/icons/copy'
export { Trash2 } from 'lucide-react/dist/esm/icons/trash-2'
export { RefreshCw } from 'lucide-react/dist/esm/icons/refresh-cw'
export { Loader2 } from 'lucide-react/dist/esm/icons/loader-2'
export { AlertCircle } from 'lucide-react/dist/esm/icons/alert-circle'
export { CheckCircle } from 'lucide-react/dist/esm/icons/check-circle'
export { XCircle } from 'lucide-react/dist/esm/icons/x-circle'
export { Eye } from 'lucide-react/dist/esm/icons/eye'
export { EyeOff } from 'lucide-react/dist/esm/icons/eye-off'
export { Menu } from 'lucide-react/dist/esm/icons/menu'
export { MoreVertical } from 'lucide-react/dist/esm/icons/more-vertical'
export { ExternalLink } from 'lucide-react/dist/esm/icons/external-link'
export { FileImage } from 'lucide-react/dist/esm/icons/file-image'
export { Maximize2 } from 'lucide-react/dist/esm/icons/maximize-2'
export { Minimize2 } from 'lucide-react/dist/esm/icons/minimize-2'

// Tool-specific icons
export { Scissors } from 'lucide-react/dist/esm/icons/scissors'
export { Resize } from 'lucide-react/dist/esm/icons/resize'
export { Compress } from 'lucide-react/dist/esm/icons/compress'
export { Expand } from 'lucide-react/dist/esm/icons/expand'
export { QrCode } from 'lucide-react/dist/esm/icons/qr-code'
export { Gradient } from 'lucide-react/dist/esm/icons/gradient'
export { Eraser } from 'lucide-react/dist/esm/icons/eraser'
export { Wand2 } from 'lucide-react/dist/esm/icons/wand-2'
export { Layers } from 'lucide-react/dist/esm/icons/layers'

/**
 * Date-fns optimized imports
 * Only import specific functions instead of the entire library
 */
export { format } from 'date-fns/format'
export { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
export { isValid } from 'date-fns/isValid'
export { parseISO } from 'date-fns/parseISO'

/**
 * Framer Motion optimized imports
 * Import only the components and utilities we need
 */
export { motion } from 'framer-motion'
export { AnimatePresence } from 'framer-motion'
export { useAnimation } from 'framer-motion'
export { useInView } from 'framer-motion'

/**
 * Recharts optimized imports
 * Only import chart components that are actually used
 */
export { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

/**
 * Tree shaking configuration for webpack
 */
export const treeShakingConfig = {
  // Mark these packages as side-effect free for better tree shaking
  sideEffects: false,
  
  // Packages that support tree shaking
  treeShakablePackages: [
    'lucide-react',
    'date-fns',
    'framer-motion',
    'recharts',
    '@radix-ui/react-*'
  ],
  
  // Optimization hints for bundler
  optimization: {
    usedExports: true,
    sideEffects: false,
    providedExports: true
  }
}

/**
 * Bundle analysis configuration
 */
export const bundleAnalysisConfig = {
  // Size thresholds for warnings
  thresholds: {
    chunk: 200000, // 200KB per chunk
    asset: 500000, // 500KB per asset
    total: 2000000 // 2MB total
  },
  
  // Packages to monitor for size
  watchPackages: [
    '@sentry/nextjs',
    'framer-motion',
    'lucide-react',
    '@supabase/supabase-js',
    'stripe',
    'browser-image-compression',
    'recharts'
  ]
}