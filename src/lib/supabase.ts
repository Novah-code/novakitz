import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  birth_date?: string
  age?: number
  occupation?: string
  interests?: string[]
  bio?: string
  dream_goals?: string
  sleep_schedule?: {
    bedtime?: string
    wake_time?: string
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent'
  }
  profile_completed?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserProfileInsert extends Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> {}
export interface UserProfileUpdate extends Partial<UserProfileInsert> {}