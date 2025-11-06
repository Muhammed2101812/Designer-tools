// Global TypeScript types and interfaces

// Color Picker Types
export interface Color {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
  timestamp: number
}

// Email Preferences Types
export interface EmailPreferences {
  id?: string
  user_id: string
  marketing_emails: boolean
  quota_warnings: boolean
  subscription_updates: boolean
  created_at?: string
  updated_at?: string
}

export interface EmailPreferencesUpdate {
  marketing_emails: boolean
  quota_warnings: boolean
  subscription_updates: boolean
}

// Re-export error types
export * from './errors'
