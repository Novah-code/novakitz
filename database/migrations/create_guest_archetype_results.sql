-- Create guest_archetype_results table for storing temporary guest test results
-- This enables viral sharing of personalized archetype results

CREATE TABLE IF NOT EXISTS guest_archetype_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_archetype TEXT NOT NULL,
  secondary_archetype TEXT,
  archetype_scores JSONB NOT NULL,
  dream_content TEXT,
  quiz_answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  view_count INTEGER DEFAULT 0,
  language TEXT DEFAULT 'ko'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guest_archetype_results_created_at ON guest_archetype_results(created_at);
CREATE INDEX IF NOT EXISTS idx_guest_archetype_results_expires_at ON guest_archetype_results(expires_at);

-- Enable Row Level Security
ALTER TABLE guest_archetype_results ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read (for sharing)
CREATE POLICY "Anyone can read guest archetype results"
  ON guest_archetype_results
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert (for creating guest results)
CREATE POLICY "Anyone can insert guest archetype results"
  ON guest_archetype_results
  FOR INSERT
  WITH CHECK (true);

-- Policy: No updates or deletes (results are immutable)
-- Cleanup will be done via scheduled job based on expires_at

-- Optional: Create function to increment view count
CREATE OR REPLACE FUNCTION increment_guest_result_view_count(result_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE guest_archetype_results
  SET view_count = view_count + 1
  WHERE id = result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_guest_result_view_count(UUID) TO anon, authenticated;
