-- Add subscription fields to user_profiles table
-- This migration adds references to the subscription system

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'cancelled')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gumroad_license_key TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS last_ai_reset_date DATE DEFAULT CURRENT_DATE;

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS user_profiles_subscription_status_idx ON public.user_profiles(subscription_status);

-- Add column to track AI usage reset
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS ai_usage_count_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_usage_month_tracking DATE DEFAULT CURRENT_DATE;
