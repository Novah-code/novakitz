import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Database types
export interface Dream {
  id?: string
  user_id?: string
  title: string
  content: string
  mood: string
  tags: string[]
  date: string
  time: string
  created_at?: string
  updated_at?: string
}

export interface DreamInsert extends Omit<Dream, 'id' | 'created_at' | 'updated_at'> {}
export interface DreamUpdate extends Partial<DreamInsert> {}

// User Profile types
export interface UserProfile {
  id?: string
  user_id: string
  full_name?: string
  display_name?: string
  birth_date?: string
  age?: number

  // Location & Language
  country_code?: string
  country_name?: string
  city?: string
  timezone?: string
  preferred_language?: string

  // Professional & Personal
  occupation?: string
  interests?: string[]
  bio?: string

  // Dream Preferences
  dream_goals?: string
  sleep_schedule?: {
    bedtime?: string
    wake_time?: string
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent'
  }

  // Technical Data
  signup_ip?: string
  last_login_ip?: string
  last_login_at?: string

  profile_completed?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserProfileInsert extends Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> {}
export interface UserProfileUpdate extends Partial<UserProfileInsert> {}

// Daily Checkin types
export interface Checkin {
  id?: string
  user_id: string
  check_date: string
  time_of_day: 'morning' | 'afternoon' | 'evening'
  mood: number
  energy_level: number
  progress_note?: string
  created_at?: string
  updated_at?: string
}

export interface CheckinInsert extends Omit<Checkin, 'id' | 'created_at' | 'updated_at'> {}
export interface CheckinUpdate extends Partial<CheckinInsert> {}

// Evening Reflection types
export interface EveningReflection {
  id?: string
  user_id: string
  reflection_date: string
  highlights?: string
  challenges?: string
  learnings?: string
  gratitude?: string
  tomorrow_focus?: string
  mood?: number
  created_at?: string
  updated_at?: string
}

export interface EveningReflectionInsert extends Omit<EveningReflection, 'id' | 'created_at' | 'updated_at'> {}
export interface EveningReflectionUpdate extends Partial<EveningReflectionInsert> {}