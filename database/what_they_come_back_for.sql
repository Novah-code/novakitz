-- What are the people who came back actually doing?
--
-- Run in the Supabase SQL editor. Read-only.
--
-- The positioning question — mood check-in first, or dream journal first — is
-- answerable from behaviour rather than argument. This counts, among the users
-- who returned on three or more separate days, how many days they used each
-- part of the app. Tourists are excluded on purpose: someone who opened the app
-- once has an opinion about the landing page, not about the product.

WITH activity AS (
  SELECT user_id, check_date       AS day FROM public.checkins
  UNION
  SELECT user_id, created_at::date AS day FROM public.dreams
  UNION
  SELECT user_id, reflection_date  AS day FROM public.evening_reflections
  UNION
  SELECT user_id, date             AS day FROM public.daily_intentions
),
returners AS (
  SELECT user_id
  FROM activity
  GROUP BY user_id
  HAVING COUNT(DISTINCT day) >= 3
)
SELECT
  'mood check-in'      AS feature,
  COUNT(DISTINCT c.user_id)                      AS people,
  COUNT(DISTINCT (c.user_id, c.check_date))      AS person_days
FROM public.checkins c JOIN returners r USING (user_id)

UNION ALL SELECT
  'dream',
  COUNT(DISTINCT d.user_id),
  COUNT(DISTINCT (d.user_id, d.created_at::date))
FROM public.dreams d JOIN returners r USING (user_id)

UNION ALL SELECT
  'evening reflection',
  COUNT(DISTINCT e.user_id),
  COUNT(DISTINCT (e.user_id, e.reflection_date))
FROM public.evening_reflections e JOIN returners r USING (user_id)

UNION ALL SELECT
  'daily intentions',
  COUNT(DISTINCT i.user_id),
  COUNT(DISTINCT (i.user_id, i.date))
FROM public.daily_intentions i JOIN returners r USING (user_id)

ORDER BY person_days DESC;


-- The same split per returning user, so you can see whether the app is one
-- product used two ways or two products sharing a login. If the heaviest users
-- all sit in one column, that column is the app.

WITH activity AS (
  SELECT user_id, check_date       AS day FROM public.checkins
  UNION
  SELECT user_id, created_at::date AS day FROM public.dreams
  UNION
  SELECT user_id, reflection_date  AS day FROM public.evening_reflections
  UNION
  SELECT user_id, date             AS day FROM public.daily_intentions
),
returners AS (
  SELECT user_id, COUNT(DISTINCT day) AS active_days
  FROM activity
  GROUP BY user_id
  HAVING COUNT(DISTINCT day) >= 3
)
SELECT
  u.email,
  r.active_days,
  (SELECT COUNT(DISTINCT check_date)      FROM public.checkins            WHERE user_id = r.user_id) AS mood_days,
  (SELECT COUNT(DISTINCT created_at::date) FROM public.dreams             WHERE user_id = r.user_id) AS dream_days,
  (SELECT COUNT(DISTINCT reflection_date) FROM public.evening_reflections WHERE user_id = r.user_id) AS evening_days,
  (SELECT COUNT(DISTINCT date)            FROM public.daily_intentions    WHERE user_id = r.user_id) AS intention_days
FROM returners r
JOIN auth.users u ON u.id = r.user_id
ORDER BY r.active_days DESC;
