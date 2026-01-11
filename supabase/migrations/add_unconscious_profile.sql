-- 무의식 프로파일 테이블
CREATE TABLE IF NOT EXISTS unconscious_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 아키타입 데이터 (융 12 아키타입)
  primary_archetype TEXT NOT NULL, -- 주 아키타입
  secondary_archetype TEXT, -- 부 아키타입
  archetype_scores JSONB NOT NULL, -- 모든 아키타입 점수 {"innocent": 0.25, "sage": 0.15, ...}

  -- 반복 상징 데이터
  recurring_symbols JSONB NOT NULL, -- TOP 5 상징 [{"symbol": "물", "count": 15, "emotions": ["불안", "평화"]}, ...]

  -- 감정 패턴 데이터
  emotion_distribution JSONB NOT NULL, -- 감정 분포 {"불안": 0.30, "기쁨": 0.20, ...}
  dominant_emotion TEXT, -- 가장 많이 나타나는 감정

  -- 꿈 스타일 메타데이터
  dream_style JSONB, -- {"vividness": 0.8, "abstractness": 0.6, "avg_length": 250}

  -- 통계
  total_dreams_analyzed INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 꿈 분석 메타데이터 테이블 (각 꿈의 추출된 패턴 저장)
CREATE TABLE IF NOT EXISTS dream_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dream_id UUID NOT NULL REFERENCES dreams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Gemini가 추출한 데이터
  symbols JSONB, -- 상징 리스트 ["물", "문", "아이"]
  emotions JSONB, -- 감정 리스트 ["불안", "두려움"]
  archetype_hints JSONB, -- 아키타입 힌트 {"explorer": 0.7, "caregiver": 0.3}

  -- 꿈 특성
  vividness_score FLOAT, -- 생생함 점수 0-1
  abstractness_score FLOAT, -- 추상성 점수 0-1
  word_count INTEGER, -- 단어 수

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(dream_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unconscious_profiles_user_id ON unconscious_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_patterns_user_id ON dream_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_patterns_dream_id ON dream_patterns(dream_id);

-- RLS 정책
ALTER TABLE unconscious_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_patterns ENABLE ROW LEVEL SECURITY;

-- 프로파일 조회 정책
CREATE POLICY "Users can view their own profile"
  ON unconscious_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- 프로파일 생성/수정 정책
CREATE POLICY "Users can insert their own profile"
  ON unconscious_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON unconscious_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 꿈 패턴 조회 정책
CREATE POLICY "Users can view their own dream patterns"
  ON dream_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dream patterns"
  ON dream_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 함수: 프로파일 공유 URL용 공개 조회
CREATE OR REPLACE FUNCTION get_public_profile(profile_user_id UUID)
RETURNS TABLE (
  primary_archetype TEXT,
  secondary_archetype TEXT,
  archetype_scores JSONB,
  recurring_symbols JSONB,
  emotion_distribution JSONB,
  dominant_emotion TEXT,
  total_dreams_analyzed INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.primary_archetype,
    p.secondary_archetype,
    p.archetype_scores,
    p.recurring_symbols,
    p.emotion_distribution,
    p.dominant_emotion,
    p.total_dreams_analyzed,
    p.last_updated
  FROM unconscious_profiles p
  WHERE p.user_id = profile_user_id;
END;
$$ LANGUAGE plpgsql;

-- 코멘트
COMMENT ON TABLE unconscious_profiles IS '사용자의 무의식 프로파일 (아키타입, 상징, 감정 패턴)';
COMMENT ON TABLE dream_patterns IS '각 꿈에서 추출된 패턴 메타데이터';
COMMENT ON COLUMN unconscious_profiles.archetype_scores IS '12개 아키타입 점수 분포';
COMMENT ON COLUMN unconscious_profiles.recurring_symbols IS '반복 출현 상징 TOP 5 이상';
COMMENT ON COLUMN unconscious_profiles.emotion_distribution IS '감정 분포 비율';
