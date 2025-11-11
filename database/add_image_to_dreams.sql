-- Add image column to dreams table
-- This migration adds support for dream image attachments

ALTER TABLE public.dreams
ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS dreams_image_idx ON public.dreams(image);

-- Add comment for documentation
COMMENT ON COLUMN public.dreams.image IS 'Data URL or URL to the dream image attachment';
