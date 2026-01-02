-- =====================================================
-- Supabase Storage Setup for Dream Images
-- =====================================================
-- This script creates a Storage bucket for dream images
-- and sets up the necessary RLS policies
-- =====================================================

-- Create the dream-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dream-images', 'dream-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload their own dream images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own dream images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own dream images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dream-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all images (since bucket is public)
CREATE POLICY "Public can read dream images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dream-images');
