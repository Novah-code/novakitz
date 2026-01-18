-- Add email_notifications column to users table
-- This allows users to opt-in/opt-out of automated emails

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN public.users.email_notifications IS 'Whether user has opted in to receive automated emails (affirmations, weekly reports, retention nudges)';

-- Update existing users to default to true (opt-in)
UPDATE public.users
SET email_notifications = true
WHERE email_notifications IS NULL;

-- Verify the change
SELECT id, name, email, email_notifications
FROM public.users
LIMIT 5;
