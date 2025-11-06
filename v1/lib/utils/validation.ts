/**
 * Input validation schemas using Zod
 * Ensures all user inputs are validated before processing
 */

import { z } from 'zod'

/**
 * File upload validation schema
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'File size must be less than 10MB'
    )
    .refine(
      (file) => ['image/png', 'image/jpeg', 'image/webp'].includes(file.type),
      'File must be PNG, JPG, or WEBP format'
    ),
})

/**
 * Color value validation schema
 */
export const colorSchema = z.object({
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid HEX color format'),
  rgb: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255),
    b: z.number().int().min(0).max(255),
  }),
  hsl: z.object({
    h: z.number().int().min(0).max(360),
    s: z.number().int().min(0).max(100),
    l: z.number().int().min(0).max(100),
  }),
  timestamp: z.number().positive(),
})

/**
 * Canvas coordinates validation schema
 */
export const canvasCoordinatesSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
})

/**
 * Zoom level validation schema
 */
export const zoomLevelSchema = z.number().min(0.5).max(3)

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email address')

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')

/**
 * Validates file upload input
 */
export function validateFileUpload(file: File) {
  return fileUploadSchema.parse({ file })
}

/**
 * Validates color data
 */
export function validateColor(color: unknown) {
  return colorSchema.parse(color)
}

/**
 * Validates canvas coordinates
 */
export function validateCanvasCoordinates(x: number, y: number) {
  return canvasCoordinatesSchema.parse({ x, y })
}

/**
 * Validates zoom level
 */
export function validateZoomLevel(zoom: number) {
  return zoomLevelSchema.parse(zoom)
}

/**
 * Validates profile update data
 */
export function validateProfileUpdate(data: unknown) {
  return profileUpdateSchema.parse(data)
}

/**
 * Validates email
 */
export function validateEmail(email: string) {
  return emailSchema.parse(email)
}

/**
 * Validates password
 */
export function validatePassword(password: string) {
  return passwordSchema.parse(password)
}
