-- Create affirmations table for storing user affirmations
-- This table tracks daily affirmations generated from dreams

CREATE TABLE IF NOT EXISTS affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL,
  affirmation_text TEXT NOT NULL,
  daily_count INT NOT NULL DEFAULT 1 COMMENT '1=morning, 2=afternoon, 3=evening',
  check_in_time VARCHAR(20) NOT NULL COMMENT 'morning, afternoon, or evening',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL COMMENT 'Local date in YYYY-MM-DD format',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_affirmations_user_id ON affirmations(user_id);
CREATE INDEX idx_affirmations_user_date ON affirmations(user_id, date);
CREATE INDEX idx_affirmations_dream_id ON affirmations(dream_id);

-- Create a view for today's affirmations
CREATE OR REPLACE VIEW affirmations_today AS
SELECT
  a.*,
  u.full_name,
  d.title as dream_title
FROM affirmations a
LEFT JOIN user_profiles u ON a.user_id = u.user_id
LEFT JOIN dreams d ON a.dream_id = d.id
WHERE a.date = CURRENT_DATE
ORDER BY a.created_at DESC;

-- Enable RLS (Row Level Security)
ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own affirmations
CREATE POLICY "Users can view own affirmations"
  ON affirmations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: users can insert their own affirmations
CREATE POLICY "Users can insert own affirmations"
  ON affirmations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: users can update their own affirmations
CREATE POLICY "Users can update own affirmations"
  ON affirmations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policy: users can delete their own affirmations
CREATE POLICY "Users can delete own affirmations"
  ON affirmations
  FOR DELETE
  USING (auth.uid() = user_id);
