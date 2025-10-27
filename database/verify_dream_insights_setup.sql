-- ================================================================
-- DREAM INSIGHTS TABLE VERIFICATION SCRIPT
-- ================================================================
-- Run this in Supabase SQL Editor to diagnose issues
-- ================================================================

\echo '==================================================================='
\echo 'DREAM INSIGHTS TABLE - DIAGNOSTIC REPORT'
\echo '==================================================================='

-- ================================================================
-- 1. CHECK IF TABLE EXISTS
-- ================================================================
\echo ''
\echo '1. Checking if dream_insights table exists...'
\echo '-------------------------------------------------------------------'

SELECT
  CASE
    WHEN EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'dream_insights'
    ) THEN '✓ dream_insights table EXISTS'
    ELSE '✗ dream_insights table DOES NOT EXIST - Run dream_insights_schema.sql first!'
  END AS status;

-- ================================================================
-- 2. CHECK TABLE STRUCTURE
-- ================================================================
\echo ''
\echo '2. Table structure...'
\echo '-------------------------------------------------------------------'

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dream_insights'
ORDER BY ordinal_position;

-- ================================================================
-- 3. CHECK RLS STATUS
-- ================================================================
\echo ''
\echo '3. Row Level Security (RLS) status...'
\echo '-------------------------------------------------------------------'

SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✓ RLS is ENABLED (this is why Table Editor shows error)'
    ELSE '✗ RLS is DISABLED (security risk!)'
  END AS rls_status
FROM pg_tables
WHERE tablename = 'dream_insights';

-- ================================================================
-- 4. LIST ALL POLICIES
-- ================================================================
\echo ''
\echo '4. RLS Policies configured...'
\echo '-------------------------------------------------------------------'

SELECT
  policyname AS "Policy Name",
  cmd AS "Command",
  CASE
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd::text
  END AS "Operation",
  permissive AS "Permissive",
  roles AS "Roles"
FROM pg_policies
WHERE tablename = 'dream_insights'
ORDER BY cmd;

-- ================================================================
-- 5. CHECK GRANTS/PERMISSIONS
-- ================================================================
\echo ''
\echo '5. Table permissions (GRANT statements)...'
\echo '-------------------------------------------------------------------'

SELECT
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'dream_insights'
GROUP BY grantee
ORDER BY grantee;

-- ================================================================
-- 6. CHECK FOR FOREIGN KEY CONSTRAINTS
-- ================================================================
\echo ''
\echo '6. Foreign key constraints...'
\echo '-------------------------------------------------------------------'

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'dream_insights';

-- ================================================================
-- 7. CHECK INDEXES
-- ================================================================
\echo ''
\echo '7. Indexes on dream_insights table...'
\echo '-------------------------------------------------------------------'

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'dream_insights'
ORDER BY indexname;

-- ================================================================
-- 8. COUNT ROWS (This might fail if RLS blocks access)
-- ================================================================
\echo ''
\echo '8. Attempting to count rows (may fail due to RLS)...'
\echo '-------------------------------------------------------------------'

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM dream_insights;
  RAISE NOTICE '✓ Successfully counted rows: %', row_count;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '✗ Cannot count rows - RLS is blocking access (this is expected)';
  WHEN OTHERS THEN
    RAISE NOTICE '✗ Error: %', SQLERRM;
END $$;

-- ================================================================
-- 9. COMPARE WITH DREAMS TABLE (for reference)
-- ================================================================
\echo ''
\echo '9. Comparing with dreams table configuration...'
\echo '-------------------------------------------------------------------'

SELECT
  'dream_insights' AS table_name,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'dream_insights') AS policy_count
FROM pg_tables
WHERE tablename = 'dream_insights'
UNION ALL
SELECT
  'dreams' AS table_name,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'dreams') AS policy_count
FROM pg_tables
WHERE tablename = 'dreams';

-- ================================================================
-- 10. CHECK OTHER RELATED TABLES
-- ================================================================
\echo ''
\echo '10. Checking other related tables from dream_insights_schema.sql...'
\echo '-------------------------------------------------------------------'

SELECT
  table_name,
  CASE
    WHEN EXISTS (
      SELECT FROM pg_tables
      WHERE schemaname = 'public' AND tablename = table_check.table_name
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END AS status
FROM (
  VALUES
    ('dream_insights'),
    ('dream_keywords'),
    ('dream_statistics')
) AS table_check(table_name);

-- ================================================================
-- SUMMARY AND RECOMMENDATIONS
-- ================================================================
\echo ''
\echo '==================================================================='
\echo 'DIAGNOSTIC SUMMARY'
\echo '==================================================================='
\echo ''
\echo 'If you see "query: Required" error in Table Editor:'
\echo ''
\echo 'ROOT CAUSE:'
\echo '  - RLS is enabled (good for security)'
\echo '  - Policies require auth.uid() = user_id'
\echo '  - Table Editor has no user authentication context'
\echo '  - Therefore, all queries are blocked by RLS'
\echo ''
\echo 'SOLUTIONS:'
\echo ''
\echo '  1. USE SQL EDITOR instead of Table Editor:'
\echo '     SELECT * FROM dream_insights WHERE user_id = YOUR-USER-ID;'
\echo ''
\echo '  2. TEMPORARILY disable RLS (dev only):'
\echo '     ALTER TABLE dream_insights DISABLE ROW LEVEL SECURITY;'
\echo ''
\echo '  3. USE SERVICE ROLE KEY in your application'
\echo ''
\echo '  4. RUN fix_dream_insights_rls.sql for more options'
\echo ''
\echo '==================================================================='

-- ================================================================
-- OPTIONAL: Test query with specific user
-- ================================================================
\echo ''
\echo '11. (Optional) Test query for specific user...'
\echo 'To test, replace USER_ID_HERE with an actual user ID:'
\echo '-------------------------------------------------------------------'

-- Uncomment and replace USER_ID_HERE with actual UUID to test:
-- SELECT * FROM dream_insights WHERE user_id = 'USER_ID_HERE';

\echo ''
\echo 'Diagnostic complete!'
\echo '==================================================================='
