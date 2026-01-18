-- Add granular email preference columns to user_profiles table
-- This allows users to control each type of email separately

-- Add individual preference columns
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_daily_affirmations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_weekly_reports BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_retention_nudges BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN public.user_profiles.email_daily_affirmations IS 'Whether user wants to receive daily affirmation emails';
COMMENT ON COLUMN public.user_profiles.email_weekly_reports IS 'Whether user wants to receive weekly report emails';
COMMENT ON COLUMN public.user_profiles.email_retention_nudges IS 'Whether user wants to receive retention nudge emails';

-- Update existing users to match their current email_notifications setting
UPDATE public.user_profiles
SET
  email_daily_affirmations = email_notifications,
  email_weekly_reports = email_notifications,
  email_retention_nudges = email_notifications
WHERE email_daily_affirmations IS NULL
   OR email_weekly_reports IS NULL
   OR email_retention_nudges IS NULL;

-- Verify the change
SELECT id, email_notifications, email_daily_affirmations, email_weekly_reports, email_retention_nudges
FROM public.user_profiles
LIMIT 5;
