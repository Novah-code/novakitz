-- Nicknames Table
-- Stores user nicknames for duplicate checking during profile setup

CREATE TABLE IF NOT EXISTS public.nicknames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nickname TEXT NOT NULL UNIQUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_nicknames_user_id ON public.nicknames(user_id);
CREATE INDEX IF NOT EXISTS idx_nicknames_nickname ON public.nicknames(nickname);

-- Enable RLS
ALTER TABLE public.nicknames ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own nickname"
  ON public.nicknames FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nickname"
  ON public.nicknames FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nickname"
  ON public.nicknames FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nickname"
  ON public.nicknames FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone can check if a nickname exists (for duplicate checking without auth)
-- This is needed for the profile form to check availability
CREATE POLICY "Anyone can check nickname availability"
  ON public.nicknames FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON public.nicknames TO authenticated;
GRANT SELECT ON public.nicknames TO anon;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER on_nicknames_updated
    BEFORE UPDATE ON public.nicknames
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
