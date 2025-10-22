-- Add badges column to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Add index for badges
CREATE INDEX IF NOT EXISTS user_profiles_badges_idx ON public.user_profiles USING GIN(badges);
