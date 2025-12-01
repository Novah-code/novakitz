-- Monthly Reports Table
-- Stores generated monthly dream reports for users

CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Report metadata
  month TEXT NOT NULL, -- Format: "December 2025"
  year_month DATE NOT NULL, -- First day of the month for easy filtering

  -- Report statistics
  total_dreams INTEGER NOT NULL DEFAULT 0,
  average_mood TEXT,
  top_keywords JSONB, -- Array of {word: string, count: number}
  mood_distribution JSONB, -- {mood: count}
  patterns JSONB, -- Array of pattern strings

  -- Report status
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure one report per user per month
  UNIQUE(user_id, year_month)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_id ON public.monthly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_user_month ON public.monthly_reports(user_id, year_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_published_at ON public.monthly_reports(published_at DESC);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reports"
  ON public.monthly_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports"
  ON public.monthly_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
  ON public.monthly_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.monthly_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.monthly_reports TO authenticated;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER on_monthly_reports_updated
    BEFORE UPDATE ON public.monthly_reports
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
