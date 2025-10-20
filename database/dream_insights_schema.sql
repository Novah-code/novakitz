-- Dream Keywords Table
-- Stores extracted keywords and emotions from each dream
CREATE TABLE IF NOT EXISTS dream_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT, -- theme, emotion, symbol, person, place, object
  sentiment TEXT, -- positive, negative, neutral, mixed
  confidence FLOAT, -- 0.0 to 1.0
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dream Insights Table
-- Stores AI-generated insights and pattern analysis
CREATE TABLE IF NOT EXISTS dream_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- pattern, trend, prediction, milestone
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- Store additional data like related_dreams, timeframe, etc.
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- Dream Statistics Table (Aggregated data for quick access)
CREATE TABLE IF NOT EXISTS dream_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_dreams INTEGER DEFAULT 0,
  total_keywords INTEGER DEFAULT 0,
  most_common_emotion TEXT,
  most_common_theme TEXT,
  average_dreams_per_week FLOAT,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats_data JSONB, -- Store complex stats like emotion_distribution, theme_counts, etc.
  UNIQUE(user_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dream_keywords_user_id ON dream_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_keywords_dream_id ON dream_keywords(dream_id);
CREATE INDEX IF NOT EXISTS idx_dream_keywords_keyword ON dream_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_dream_keywords_category ON dream_keywords(category);
CREATE INDEX IF NOT EXISTS idx_dream_insights_user_id ON dream_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_insights_type ON dream_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_dream_statistics_user_id ON dream_statistics(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE dream_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_statistics ENABLE ROW LEVEL SECURITY;

-- Policies for dream_keywords
CREATE POLICY "Users can view their own keywords"
  ON dream_keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
  ON dream_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON dream_keywords FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for dream_insights
CREATE POLICY "Users can view their own insights"
  ON dream_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON dream_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON dream_insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON dream_insights FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for dream_statistics
CREATE POLICY "Users can view their own statistics"
  ON dream_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistics"
  ON dream_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics"
  ON dream_statistics FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update dream statistics (called after new dream analysis)
CREATE OR REPLACE FUNCTION update_dream_statistics(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_dreams INTEGER;
  v_total_keywords INTEGER;
  v_emotion_data JSONB;
  v_theme_data JSONB;
BEGIN
  -- Count total dreams (from dreams table - we'll need to create this reference)
  SELECT COUNT(*) INTO v_total_dreams
  FROM dream_keywords
  WHERE user_id = p_user_id
  GROUP BY dream_id;

  -- Count total keywords
  SELECT COUNT(*) INTO v_total_keywords
  FROM dream_keywords
  WHERE user_id = p_user_id;

  -- Get emotion distribution
  SELECT jsonb_object_agg(sentiment, count) INTO v_emotion_data
  FROM (
    SELECT sentiment, COUNT(*) as count
    FROM dream_keywords
    WHERE user_id = p_user_id AND category = 'emotion'
    GROUP BY sentiment
  ) emotion_counts;

  -- Get theme distribution
  SELECT jsonb_object_agg(keyword, count) INTO v_theme_data
  FROM (
    SELECT keyword, COUNT(*) as count
    FROM dream_keywords
    WHERE user_id = p_user_id AND category = 'theme'
    GROUP BY keyword
    ORDER BY count DESC
    LIMIT 10
  ) theme_counts;

  -- Upsert statistics
  INSERT INTO dream_statistics (
    user_id,
    total_dreams,
    total_keywords,
    stats_data,
    last_calculated_at
  ) VALUES (
    p_user_id,
    COALESCE(v_total_dreams, 0),
    COALESCE(v_total_keywords, 0),
    jsonb_build_object(
      'emotions', COALESCE(v_emotion_data, '{}'::jsonb),
      'themes', COALESCE(v_theme_data, '{}'::jsonb)
    ),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_dreams = COALESCE(v_total_dreams, 0),
    total_keywords = COALESCE(v_total_keywords, 0),
    stats_data = jsonb_build_object(
      'emotions', COALESCE(v_emotion_data, '{}'::jsonb),
      'themes', COALESCE(v_theme_data, '{}'::jsonb)
    ),
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
