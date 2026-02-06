-- Add email collection columns to guest_archetype_results table
-- For lead generation from archetype test

ALTER TABLE guest_archetype_results
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_submitted_at TIMESTAMPTZ;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_guest_results_email ON guest_archetype_results(email) WHERE email IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN guest_archetype_results.email IS 'User email for lead generation';
COMMENT ON COLUMN guest_archetype_results.is_subscribed IS 'Whether user opted into newsletter';
COMMENT ON COLUMN guest_archetype_results.email_submitted_at IS 'When the email was submitted';
