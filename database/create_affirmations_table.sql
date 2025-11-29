-- Affirmations Table
-- Stores generated affirmations for daily check-ins (morning/afternoon/evening)

CREATE TABLE IF NOT EXISTS public.affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES public.dreams(id) ON DELETE CASCADE,

  -- Affirmation content
  affirmation_text TEXT NOT NULL,

  -- Order counter for multiple affirmations (1, 2, 3)
  daily_count INTEGER NOT NULL DEFAULT 1,

  -- Time slot this affirmation is for
  check_in_time TEXT NOT NULL CHECK (check_in_time IN ('morning', 'afternoon', 'evening')),

  -- Language of the affirmation
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ko')),

  -- Date for tracking
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_affirmations_user_id ON public.affirmations(user_id);
CREATE INDEX IF NOT EXISTS idx_affirmations_user_date ON public.affirmations(user_id, date);
CREATE INDEX IF NOT EXISTS idx_affirmations_check_in_time ON public.affirmations(user_id, date, check_in_time);
CREATE INDEX IF NOT EXISTS idx_affirmations_dream_id ON public.affirmations(dream_id);

-- Enable RLS
ALTER TABLE public.affirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own affirmations"
  ON public.affirmations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own affirmations"
  ON public.affirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own affirmations"
  ON public.affirmations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own affirmations"
  ON public.affirmations FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.affirmations TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER on_affirmations_updated
    BEFORE UPDATE ON public.affirmations
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
