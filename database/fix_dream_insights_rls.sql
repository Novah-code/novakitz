-- ================================================================
-- FIX FOR DREAM_INSIGHTS TABLE RLS POLICY ISSUE
-- ================================================================
-- Problem: Supabase Table Editor shows "Failed to retrieve rows from table - Error: query: Required"
-- Root Cause: RLS policies don't allow viewing data in the table editor (which has no auth context)
-- Solution: Add a policy that allows service role to bypass RLS or allows viewing in specific contexts
-- ================================================================

-- First, let's check the current state and recreate the table if needed
-- This ensures we have a clean slate with proper RLS configuration

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own insights" ON dream_insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON dream_insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON dream_insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON dream_insights;

-- Enable RLS (should already be enabled, but just to be sure)
ALTER TABLE dream_insights ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- OPTION 1: Standard RLS Policies (Recommended for Production)
-- ================================================================
-- These policies allow users to access only their own data
-- Table Editor won't work with these alone, but data is secure

-- Policy for SELECT: Users can view their own insights
CREATE POLICY "Users can view their own insights"
  ON dream_insights FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for INSERT: Users can insert their own insights
CREATE POLICY "Users can insert their own insights"
  ON dream_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can update their own insights
CREATE POLICY "Users can update their own insights"
  ON dream_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE: Users can delete their own insights
CREATE POLICY "Users can delete their own insights"
  ON dream_insights FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- OPTION 2: Allow Service Role to View All Data
-- ================================================================
-- This policy allows the Supabase table editor to view all rows
-- The service role bypasses RLS, but this adds an explicit policy for clarity
-- IMPORTANT: Only use if you're accessing via service role key

-- Uncomment the following line if you want to allow service role to view all data:
-- CREATE POLICY "Service role can view all insights"
--   ON dream_insights FOR SELECT
--   TO service_role
--   USING (true);

-- ================================================================
-- OPTION 3: Allow Authenticated Admin Users to View All Data
-- ================================================================
-- If you have an admin user with a specific role, you can create a policy
-- Uncomment and modify if you have a user_roles table or similar setup:

-- CREATE POLICY "Admins can view all insights"
--   ON dream_insights FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE user_id = auth.uid()
--       AND role = 'admin'
--     )
--   );

-- ================================================================
-- TROUBLESHOOTING: Verify the table structure
-- ================================================================

-- Check if table exists and has correct structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dream_insights') THEN
    RAISE NOTICE 'ERROR: dream_insights table does not exist!';
    RAISE NOTICE 'Please run the dream_insights_schema.sql file first.';
  ELSE
    RAISE NOTICE 'SUCCESS: dream_insights table exists.';
  END IF;
END $$;

-- ================================================================
-- HOW TO USE THE SUPABASE TABLE EDITOR WITH RLS
-- ================================================================
--
-- The "query: Required" error occurs because the Supabase Table Editor
-- tries to query the table without an authenticated user context.
--
-- SOLUTIONS:
--
-- 1. USE SQL EDITOR INSTEAD:
--    Instead of using the Table Editor, use the SQL Editor to query data:
--
--    SELECT * FROM dream_insights WHERE user_id = 'your-user-id';
--
-- 2. TEMPORARILY DISABLE RLS (NOT RECOMMENDED FOR PRODUCTION):
--    Only do this in development/testing:
--
--    ALTER TABLE dream_insights DISABLE ROW LEVEL SECURITY;
--
--    Remember to re-enable it:
--
--    ALTER TABLE dream_insights ENABLE ROW LEVEL SECURITY;
--
-- 3. USE SERVICE ROLE KEY:
--    Configure your Supabase client to use the service role key
--    (this bypasses RLS entirely):
--
--    const supabase = createClient(url, SERVICE_ROLE_KEY)
--
-- 4. ADD A POLICY FOR YOUR SPECIFIC ADMIN USER:
--    Get your user ID from auth.users and create a policy:
--
--    CREATE POLICY "Allow specific admin to view all"
--      ON dream_insights FOR SELECT
--      USING (auth.uid() = 'your-admin-user-id-here');
--
-- ================================================================

-- Verify policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'dream_insights'
ORDER BY policyname;

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================
-- Ensure proper grants are in place

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON dream_insights TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON dream_insights TO service_role;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
-- Run this to verify everything is set up correctly:

-- Check table exists
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'dream_insights'
) AS table_exists;

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'dream_insights';

-- Count policies
SELECT COUNT(*) AS policy_count
FROM pg_policies
WHERE tablename = 'dream_insights';

-- ================================================================
-- NOTES FOR DEBUGGING
-- ================================================================
--
-- If you're still getting "query: Required" error after running this:
--
-- 1. Make sure you've run the dream_insights_schema.sql file first
-- 2. Verify you're using the correct Supabase project
-- 3. Check that RLS is enabled on the table
-- 4. Try using the SQL Editor instead of Table Editor
-- 5. Make sure your user has the authenticated role
-- 6. Check browser console for more detailed error messages
--
-- ================================================================
