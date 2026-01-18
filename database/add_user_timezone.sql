-- Add timezone column to users table for personalized email scheduling
-- Default to Asia/Seoul for existing users

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Seoul';

-- Add comment
COMMENT ON COLUMN public.users.timezone IS 'User timezone for scheduling emails at local time (IANA timezone format)';

-- Update existing users to Asia/Seoul (Korean timezone)
UPDATE public.users
SET timezone = 'Asia/Seoul'
WHERE timezone IS NULL;

-- Create index for timezone queries (important for performance)
CREATE INDEX IF NOT EXISTS idx_users_timezone ON public.users(timezone);

-- Verify the change
SELECT id, name, email, timezone, email_notifications
FROM public.users
LIMIT 5;
