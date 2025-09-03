import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Public client (for frontend)
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client (for API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database types
export type Database = {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string
          email: string
          status: 'pending' | 'active' | 'bounced' | 'unsubscribed' | 'complained'
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          status?: 'pending' | 'active' | 'bounced' | 'unsubscribed' | 'complained'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          status?: 'pending' | 'active' | 'bounced' | 'unsubscribed' | 'complained'
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      races: {
        Row: {
          id: string
          name: string
          url: string
          open_keywords: string[]
          closed_keywords: string[]
          current_status: 'unknown' | 'open' | 'closed' | 'full'
          last_scraped_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          url: string
          open_keywords?: string[]
          closed_keywords?: string[]
          current_status?: 'unknown' | 'open' | 'closed' | 'full'
          last_scraped_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          url?: string
          open_keywords?: string[]
          closed_keywords?: string[]
          current_status?: 'unknown' | 'open' | 'closed' | 'full'
          last_scraped_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          race_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          subscriber_id: string
          race_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          subscriber_id?: string
          race_id?: string
          is_active?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          race_id: string
          recipient_email: string
          subject: string
          body: string
          sent_at: string
        }
        Insert: {
          id?: string
          race_id: string
          recipient_email: string
          subject: string
          body: string
          sent_at?: string
        }
        Update: {
          id?: string
          race_id?: string
          recipient_email?: string
          subject?: string
          body?: string
          sent_at?: string
        }
      }
    }
  }
}