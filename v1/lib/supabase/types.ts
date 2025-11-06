/**
 * Database type definitions generated from Supabase schema
 * These types provide full type safety for database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          plan: 'free' | 'premium' | 'pro'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'premium' | 'pro'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: 'free' | 'premium' | 'pro'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          plan: 'premium' | 'pro'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          plan: 'premium' | 'pro'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
          plan?: 'premium' | 'pro'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      tool_usage: {
        Row: {
          id: string
          user_id: string | null
          tool_name: string
          is_api_tool: boolean
          file_size_mb: number | null
          processing_time_ms: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          tool_name: string
          is_api_tool?: boolean
          file_size_mb?: number | null
          processing_time_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          tool_name?: string
          is_api_tool?: boolean
          file_size_mb?: number | null
          processing_time_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tool_usage_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      daily_limits: {
        Row: {
          id: string
          user_id: string
          date: string
          api_tools_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          api_tools_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          api_tools_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_limits_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      email_preferences: {
        Row: {
          id: string
          user_id: string
          marketing_emails: boolean
          quota_warnings: boolean
          subscription_updates: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          marketing_emails?: boolean
          quota_warnings?: boolean
          subscription_updates?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          marketing_emails?: boolean
          quota_warnings?: boolean
          subscription_updates?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'email_preferences_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_use_api_tool: {
        Args: {
          p_user_id: string
        }
        Returns: boolean
      }
      get_or_create_daily_limit: {
        Args: {
          p_user_id: string
        }
        Returns: Database['public']['Tables']['daily_limits']['Row']
      }
      increment_api_usage: {
        Args: {
          p_user_id: string
        }
        Returns: Database['public']['Tables']['daily_limits']['Row']
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export type ToolUsage = Database['public']['Tables']['tool_usage']['Row']
export type ToolUsageInsert = Database['public']['Tables']['tool_usage']['Insert']
export type ToolUsageUpdate = Database['public']['Tables']['tool_usage']['Update']

export type DailyLimit = Database['public']['Tables']['daily_limits']['Row']
export type DailyLimitInsert = Database['public']['Tables']['daily_limits']['Insert']
export type DailyLimitUpdate = Database['public']['Tables']['daily_limits']['Update']

export type EmailPreferences = Database['public']['Tables']['email_preferences']['Row']
export type EmailPreferencesInsert = Database['public']['Tables']['email_preferences']['Insert']
export type EmailPreferencesUpdate = Database['public']['Tables']['email_preferences']['Update']

// Plan types
export type Plan = 'free' | 'premium' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid'
