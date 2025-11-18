-- Add language tracking to affirmations table
-- This allows us to know which language each affirmation was generated in

ALTER TABLE affirmations ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Update existing affirmations to have language set (assume English for existing data)
UPDATE affirmations SET language = 'en' WHERE language IS NULL;

-- Add NOT NULL constraint
ALTER TABLE affirmations ALTER COLUMN language SET NOT NULL;

-- Create index for efficient language-based queries
CREATE INDEX IF NOT EXISTS idx_affirmations_language ON affirmations(language);
