-- pending_purchases: Gumroad 결제 후 Novakitz 계정이 없는 경우 임시 저장
CREATE TABLE IF NOT EXISTS pending_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  license_key TEXT NOT NULL,
  product_permalink TEXT,
  subscription_days INT, -- NULL = lifetime
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'activated'))
);

-- 이메일로 빠른 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_pending_purchases_email ON pending_purchases(email);
CREATE INDEX IF NOT EXISTS idx_pending_purchases_status ON pending_purchases(status);

-- RLS: service role만 접근 (웹훅/서버에서만 사용)
ALTER TABLE pending_purchases ENABLE ROW LEVEL SECURITY;
