# Quick Fix for "query: Required" Error

## The Problem
You can't view the `dream_insights` table in Supabase Table Editor because Row Level Security (RLS) is blocking access.

## Fastest Solution (30 seconds)

### Option A: Use SQL Editor Instead

1. Open **Supabase Dashboard**
2. Go to **SQL Editor** (not Table Editor)
3. Run this query:

```sql
SELECT * FROM dream_insights ORDER BY generated_at DESC LIMIT 50;
```

That's it! You can now view your data.

---

### Option B: View Data for Specific User

If you need to see data for a specific user:

```sql
-- First, get list of users
SELECT id, email FROM auth.users LIMIT 10;

-- Then view insights for that user
SELECT * FROM dream_insights WHERE user_id = 'paste-user-id-here';
```

---

### Option C: Temporarily Disable RLS (Development Only)

**⚠️ WARNING: Only use in development, NEVER in production!**

```sql
-- Disable RLS
ALTER TABLE dream_insights DISABLE ROW LEVEL SECURITY;

-- Now you can use Table Editor

-- When done, re-enable RLS:
ALTER TABLE dream_insights ENABLE ROW LEVEL SECURITY;
```

---

## Why This Happens

```
Table Editor → No user authentication → RLS policies block access → "query: Required" error
```

The table has these security policies:

```sql
CREATE POLICY "Users can view their own insights"
  ON dream_insights FOR SELECT
  USING (auth.uid() = user_id);  ← This requires authentication!
```

When you use the Table Editor, there's no authenticated user, so the policy blocks the query.

## Other Useful Queries

```sql
-- Count total insights
SELECT COUNT(*) FROM dream_insights;

-- Count by user
SELECT user_id, COUNT(*) as count
FROM dream_insights
GROUP BY user_id;

-- View recent insights
SELECT
  id,
  insight_type,
  title,
  generated_at,
  is_read
FROM dream_insights
ORDER BY generated_at DESC
LIMIT 20;

-- View with user email
SELECT
  di.id,
  di.insight_type,
  di.title,
  di.generated_at,
  au.email
FROM dream_insights di
JOIN auth.users au ON di.user_id = au.id
ORDER BY di.generated_at DESC
LIMIT 20;
```

## Need More Help?

See `README_RLS_ISSUE.md` for detailed explanations and advanced solutions.
