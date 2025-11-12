-- Daily Intentions Table
-- Stores generated affirmations and daily intentions based on dream analysis

CREATE TABLE IF NOT EXISTS public.daily_intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE,

  -- Intentions/affirmations (flexible to support 1, 2, or 3 affirmations)
  intention_1 TEXT,  -- Allow NULL for flexibility (free users get 1, premium get 3)
  intention_2 TEXT,  -- Allow NULL
  intention_3 TEXT,  -- Allow NULL

  -- Full text from API for reference
  full_intention_text TEXT,

  -- Date for tracking daily intentions
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraint to ensure at least one intention is provided
  CONSTRAINT at_least_one_intention CHECK (intention_1 IS NOT NULL OR intention_2 IS NOT NULL OR intention_3 IS NOT NULL)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user_id ON public.daily_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_dream_id ON public.daily_intentions(dream_id);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_date ON public.daily_intentions(date);
CREATE INDEX IF NOT EXISTS idx_daily_intentions_user_date ON public.daily_intentions(user_id, date);

-- Enable RLS
ALTER TABLE public.daily_intentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily intentions"
  ON public.daily_intentions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily intentions"
  ON public.daily_intentions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily intentions"
  ON public.daily_intentions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily intentions"
  ON public.daily_intentions FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.daily_intentions TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER on_daily_intentions_updated
    BEFORE UPDATE ON public.daily_intentions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
