-- Community Posts Table
-- Stores image posts shared by users
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes Table
-- Tracks which users liked which posts
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Enable Row Level Security
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts
-- Anyone can view posts
CREATE POLICY "Anyone can view community posts"
  ON community_posts FOR SELECT
  USING (true);

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for post_likes
-- Anyone can view likes
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create a view for posts with like counts
CREATE OR REPLACE VIEW community_posts_with_likes AS
SELECT
  cp.*,
  COUNT(pl.id) as like_count,
  ARRAY_AGG(pl.user_id) FILTER (WHERE pl.user_id IS NOT NULL) as liked_by_users
FROM community_posts cp
LEFT JOIN post_likes pl ON cp.id = pl.post_id
GROUP BY cp.id;

-- Storage bucket for community images
-- Run this in the Supabase Dashboard > Storage
-- 1. Create a new bucket called "community-images"
-- 2. Make it public
-- 3. Add the following policies:

-- Storage Policy: Anyone can view images
-- CREATE POLICY "Anyone can view community images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'community-images');

-- Storage Policy: Authenticated users can upload images
-- CREATE POLICY "Authenticated users can upload community images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'community-images'
--   AND auth.role() = 'authenticated'
-- );

-- Storage Policy: Users can delete their own images
-- CREATE POLICY "Users can delete own community images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'community-images'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
