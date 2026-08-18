-- How many of the people who signed up actually came back?
--
-- Run in the Supabase SQL editor. Read-only — it only counts rows.
--
-- One signup number tells you nothing on its own. What matters for a daily
-- ritual app is how many separate DAYS a person showed up, so that is what
-- this counts: any of a check-in, a dream, an evening reflection or a set of
-- intentions marks a day as active.

WITH activity AS (
  SELECT user_id, check_date       AS day FROM public.checkins
  UNION
  SELECT user_id, created_at::date AS day FROM public.dreams
  UNION
  SELECT user_id, reflection_date  AS day FROM public.evening_reflections
  UNION
  SELECT user_id, date             AS day FROM public.daily_intentions
),
per_user AS (
  SELECT
    user_id,
    COUNT(DISTINCT day) AS active_days,
    MIN(day)            AS first_day,
    MAX(day)            AS last_day
  FROM activity
  GROUP BY user_id
)
SELECT
  (SELECT COUNT(*) FROM auth.users)                                   AS signed_up,
  COUNT(*)                                                            AS did_anything,
  COUNT(*) FILTER (WHERE active_days >= 2)                            AS came_back,
  COUNT(*) FILTER (WHERE active_days >= 3)                            AS three_plus_days,
  COUNT(*) FILTER (WHERE active_days >= 7)                            AS seven_plus_days,
  COUNT(*) FILTER (WHERE last_day >= CURRENT_DATE - INTERVAL '14 day') AS active_last_2_weeks,
  ROUND(AVG(active_days), 1)                                          AS avg_active_days,
  MAX(active_days)                                                    AS best_user_days
FROM per_user;


-- The same thing per person, most engaged first. Look at the top of this list
-- rather than the average — the average is dragged down by everyone who opened
-- the app once and left, and those people were never going to tell you
-- anything. The people with 3+ days are the ones worth talking to.

WITH activity AS (
  SELECT user_id, check_date       AS day FROM public.checkins
  UNION
  SELECT user_id, created_at::date AS day FROM public.dreams
  UNION
  SELECT user_id, reflection_date  AS day FROM public.evening_reflections
  UNION
  SELECT user_id, date             AS day FROM public.daily_intentions
)
SELECT
  u.email,
  u.created_at::date                       AS signed_up,
  COUNT(DISTINCT a.day)                    AS active_days,
  MAX(a.day)                               AS last_seen,
  CURRENT_DATE - MAX(a.day)                AS days_since_last_seen
FROM auth.users u
LEFT JOIN activity a ON a.user_id = u.id
GROUP BY u.id, u.email, u.created_at
ORDER BY active_days DESC, last_seen DESC NULLS LAST;
