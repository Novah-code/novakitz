-- Add timezone column to user_profiles table for personalized email scheduling
-- Default to Asia/Seoul for existing users

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';

-- Add comment
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone for scheduling emails at local time (IANA timezone format)';

-- Update existing users to Asia/Seoul (Korean timezone)
UPDATE public.user_profiles
SET timezone = 'Asia/Seoul'
WHERE timezone IS NULL;

-- Create index for timezone queries (important for performance)
CREATE INDEX IF NOT EXISTS idx_user_profiles_timezone ON public.user_profiles(timezone);

-- Verify the change
SELECT id, timezone, email_notifications
FROM public.user_profiles
LIMIT 5;
