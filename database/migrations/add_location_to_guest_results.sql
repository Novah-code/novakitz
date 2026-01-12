-- Add location fields to guest_archetype_results table
ALTER TABLE guest_archetype_results
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS country_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for country queries
CREATE INDEX IF NOT EXISTS idx_guest_archetype_results_country ON guest_archetype_results(country_code);
