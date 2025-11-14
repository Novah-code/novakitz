-- Add display_name column to evening_reflections table
-- This column stores the user's display name at the time of reflection for reference

ALTER TABLE public.evening_reflections
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_evening_reflections_user_date
ON public.evening_reflections(user_id, reflection_date DESC);
