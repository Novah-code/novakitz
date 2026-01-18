-- Add email_notifications column to user_profiles table
-- This allows users to opt-in/opt-out of automated emails

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.user_profiles.email_notifications IS 'Whether user has opted in to receive automated emails (affirmations, weekly reports, retention nudges)';

-- Update existing users to default to true (opt-in)
UPDATE public.user_profiles
SET email_notifications = true
WHERE email_notifications IS NULL;

-- Verify the change
SELECT id, email_notifications
FROM public.user_profiles
LIMIT 5;
