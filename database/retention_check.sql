-- How many of the people who signed up actually came back?
--
-- Read-only — it only counts rows.
--
-- RUN ONE QUERY AT A TIME. Do not paste the whole file in and press Run.
-- The Supabase SQL editor shows the result of the LAST statement only, so
-- running all of them returns the last table and silently throws away the
-- other four. Select one query (from its first SELECT/WITH down to its
-- semicolon), run it, read it, then move to the next.
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


-- ─────────────────────────────────────────────────────────────────────────
-- D1 / D7 / D30
--
-- The two queries above count days. These count cohorts: of the people who
-- signed up, how many came back.
--
-- THE PART THAT IS EASY TO GET WRONG: someone who signed up three days ago
-- cannot have a D30 number. Counting them as "did not return" is how a real
-- 40% becomes a fake 8%. So each row below counts only the people who have
-- been signed up long enough to have had the chance — that is what `eligible`
-- is, and it is why the three rows have different denominators.
--
-- Day 0 (signup day itself) never counts as a return.
--
-- TWO DEFINITIONS, because they answer different questions and people quote
-- them interchangeably:
--
--   "within N days"  — came back at least once in the first N days.
--                      The honest one at this sample size.
--   "on/after day N" — was still showing up N days in or later.
--                      Stricter, and closer to what an investor means by
--                      "D30 retention".
--
-- Quote whichever you like, but say which one. At fifty-odd users a single
-- person moves these numbers by two points, so round to whole percents and do
-- not present them as a trend.
-- ─────────────────────────────────────────────────────────────────────────

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
    u.id,
    CURRENT_DATE - u.created_at::date AS age_days,
    COALESCE(bool_or(a.day - u.created_at::date = 1), false)               AS back_d1,
    COALESCE(bool_or(a.day - u.created_at::date BETWEEN 1 AND 7), false)   AS back_within_7,
    COALESCE(bool_or(a.day - u.created_at::date BETWEEN 1 AND 30), false)  AS back_within_30,
    COALESCE(bool_or(a.day - u.created_at::date >= 7), false)              AS alive_at_7,
    COALESCE(bool_or(a.day - u.created_at::date >= 30), false)             AS alive_at_30
  FROM auth.users u
  LEFT JOIN activity a ON a.user_id = u.id
  GROUP BY u.id, u.created_at
),
rate AS (
  SELECT label, ord, eligible, returned,
         ROUND(100.0 * returned / NULLIF(eligible, 0)) AS pct
  FROM (
    SELECT 'D1  / came back the next day'          AS label, 1 AS ord,
           COUNT(*) FILTER (WHERE age_days >= 1)                         AS eligible,
           COUNT(*) FILTER (WHERE age_days >= 1  AND back_d1)            AS returned
    FROM per_user
    UNION ALL
    SELECT 'D7  / came back within 7 days', 2,
           COUNT(*) FILTER (WHERE age_days >= 7),
           COUNT(*) FILTER (WHERE age_days >= 7  AND back_within_7)
    FROM per_user
    UNION ALL
    SELECT 'D30 / came back within 30 days', 3,
           COUNT(*) FILTER (WHERE age_days >= 30),
           COUNT(*) FILTER (WHERE age_days >= 30 AND back_within_30)
    FROM per_user
    UNION ALL
    SELECT 'D7  / still active on or after day 7', 4,
           COUNT(*) FILTER (WHERE age_days >= 7),
           COUNT(*) FILTER (WHERE age_days >= 7  AND alive_at_7)
    FROM per_user
    UNION ALL
    SELECT 'D30 / still active on or after day 30', 5,
           COUNT(*) FILTER (WHERE age_days >= 30),
           COUNT(*) FILTER (WHERE age_days >= 30 AND alive_at_30)
    FROM per_user
  ) x
)
SELECT label, eligible, returned, pct AS percent
FROM rate ORDER BY ord;


-- ─────────────────────────────────────────────────────────────────────────
-- 기록 횟수 — how much was actually written, not how many days were touched
--
-- A day where someone pressed one pebble and a day where they pressed a
-- pebble and wrote a dream are both one active day above. This separates
-- them, because "51 people wrote 300 things" is a different sentence from
-- "51 people opened it once".
-- ─────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT COUNT(*) FROM public.checkins)            AS checkins,
  (SELECT COUNT(*) FROM public.dreams)              AS dreams,
  (SELECT COUNT(*) FROM public.evening_reflections) AS reflections,
  (SELECT COUNT(*) FROM public.daily_intentions)    AS intentions,
  (SELECT COUNT(*) FROM public.checkins)
    + (SELECT COUNT(*) FROM public.dreams)
    + (SELECT COUNT(*) FROM public.evening_reflections)
    + (SELECT COUNT(*) FROM public.daily_intentions) AS total_records,
  (SELECT COUNT(DISTINCT user_id) FROM public.dreams) AS people_who_wrote_a_dream;


-- ─────────────────────────────────────────────────────────────────────────
-- 마지막 사용 시점 — how stale the user base is, in one glance
--
-- `last_seen` per person is in the second query above. This is the shape of
-- it: how many people were last seen this week, this month, or are gone.
-- ─────────────────────────────────────────────────────────────────────────

WITH activity AS (
  SELECT user_id, check_date       AS day FROM public.checkins
  UNION
  SELECT user_id, created_at::date AS day FROM public.dreams
  UNION
  SELECT user_id, reflection_date  AS day FROM public.evening_reflections
  UNION
  SELECT user_id, date             AS day FROM public.daily_intentions
),
last_seen AS (
  SELECT u.id, MAX(a.day) AS day
  FROM auth.users u LEFT JOIN activity a ON a.user_id = u.id
  GROUP BY u.id
)
SELECT
  COUNT(*) FILTER (WHERE day >= CURRENT_DATE - 7)                       AS last_7_days,
  COUNT(*) FILTER (WHERE day >= CURRENT_DATE - 30
                     AND day <  CURRENT_DATE - 7)                       AS days_8_to_30,
  COUNT(*) FILTER (WHERE day <  CURRENT_DATE - 30)                      AS over_30_days_ago,
  COUNT(*) FILTER (WHERE day IS NULL)                                   AS never_did_anything
FROM last_seen;
