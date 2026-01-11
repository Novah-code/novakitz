-- Add Toss payment fields to user_subscriptions table
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS toss_payment_key TEXT,
ADD COLUMN IF NOT EXISTS toss_order_id TEXT,
ADD COLUMN IF NOT EXISTS toss_payment_data JSONB,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'gumroad';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_toss_order_id ON user_subscriptions(toss_order_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_method ON user_subscriptions(payment_method);

-- Add comment
COMMENT ON COLUMN user_subscriptions.toss_payment_key IS 'Toss Payments payment key';
COMMENT ON COLUMN user_subscriptions.toss_order_id IS 'Toss Payments order ID';
COMMENT ON COLUMN user_subscriptions.toss_payment_data IS 'Full Toss payment response data';
COMMENT ON COLUMN user_subscriptions.payment_method IS 'Payment method: gumroad or toss';
