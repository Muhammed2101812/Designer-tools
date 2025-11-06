/**
 * Security utilities for input validation and sanitization
 */

/**
 * Checks if a string contains potentially dangerous XSS patterns
 */
export function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Checks if a string contains SQL injection patterns
 */
export function containsSQLInjectionPatterns(input: string): boolean {
  const sqlPatterns = [
    /('|(\\')|(;)|(\\;))/i,
    /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
    /xp_cmdshell/i,
    /sp_executesql/i
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, maxLength)
}

/**
 * Validates and sanitizes query parameters
 */
export function validateQueryParams(params: Record<string, string>): {
  isValid: boolean
  sanitized: Record<string, string>
  errors: string[]
} {
  const errors: string[] = []
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== 'string') {
      continue
    }

    // Check for XSS patterns
    if (containsXSSPatterns(value)) {
      errors.push(`Parameter '${key}' contains potentially dangerous content`)
      continue
    }

    // Check for SQL injection patterns
    if (containsSQLInjectionPatterns(value)) {
      errors.push(`Parameter '${key}' contains potentially dangerous SQL patterns`)
      continue
    }

    // Sanitize the value
    sanitized[key] = sanitizeString(value)
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  }
}

/**
 * Validates file names to prevent path traversal
 */
export function validateFileName(filename: string): {
  isValid: boolean
  sanitized: string
  errors: string[]
} {
  const errors: string[] = []

  if (typeof filename !== 'string') {
    errors.push('Filename must be a string')
    return { isValid: false, sanitized: '', errors }
  }

  // Check for path traversal patterns
  const pathTraversalPatterns = [
    /\.\./,
    /\//,
    /\\/,
    /:/,
    /\*/,
    /\?/,
    /"/,
    /</,
    />/,
    /\|/
  ]

  if (pathTraversalPatterns.some(pattern => pattern.test(filename))) {
    errors.push('Filename contains invalid characters')
  }

  // Sanitize filename
  const sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.\./g, '_')
    .trim()
    .slice(0, 255)

  if (sanitized.length === 0) {
    errors.push('Filename cannot be empty after sanitization')
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors
  }
}

/**
 * Creates secure response headers
 */
export function getSecureHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
}

/**
 * Validates request body for common security issues
 */
export function validateRequestBody(body: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (typeof body !== 'object' || body === null) {
    errors.push('Request body must be a valid object')
    return { isValid: false, errors }
  }

  // Check for deeply nested objects (potential DoS)
  const maxDepth = 10
  function checkDepth(obj: any, depth: number = 0): boolean {
    if (depth > maxDepth) return false
    
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (!checkDepth(value, depth + 1)) {
          return false
        }
      }
    }
    return true
  }

  if (!checkDepth(body)) {
    errors.push('Request body is too deeply nested')
  }

  // Check for excessively large strings
  const maxStringLength = 10000
  function checkStringLengths(obj: any): boolean {
    if (typeof obj === 'string' && obj.length > maxStringLength) {
      return false
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (!checkStringLengths(value)) {
          return false
        }
      }
    }
    return true
  }

  if (!checkStringLengths(body)) {
    errors.push('Request body contains excessively large strings')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting identifier based on user or IP
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return `ip:${realIp}`
  }

  return 'ip:unknown'
}