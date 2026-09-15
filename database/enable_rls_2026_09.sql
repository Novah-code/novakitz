-- Row Level Security for the tables that never got it.
--
-- Supabase's security advisor flagged `rls_disabled_in_public` on 2026-09-13.
-- Without RLS, a table in the public schema is readable, writable and
-- deletable by anyone holding the anon key — and the anon key ships inside the
-- app bundle, because that is what it is for. The project URL is in there too.
-- So "anyone with your project URL" means anyone who downloaded the app.
--
-- Every table created by the SQL in this directory already enables RLS. The
-- ones below are the tables the code uses that no script here ever protected —
-- they were created somewhere else, probably by hand in the dashboard.
--
--   dream_patterns        archetype hints derived from a person's dreams
--   unconscious_profiles  read straight from the client (app/profile/page.tsx)
--   contact_requests      support messages, with the sender's email address
--   avatars               referenced by ProfileSettings
--   community_likes       deleted client-side when an account is removed
--   profiles              only /api/admin reads it — probably superseded by
--                         user_profiles
--   subscriptions         only /api/admin reads it — probably superseded by
--                         user_subscriptions
--
--
-- ⚠️  READ THIS BEFORE RUNNING ANY OF IT
--
-- Turning RLS on for a table with no policy does not raise an error. It makes
-- the table invisible: every query returns zero rows, quietly, and the app
-- looks like the data was deleted. So each block below turns RLS on *and*
-- grants the owner access in the same step. Do not run half of one.
--
-- The service role key bypasses RLS entirely, so anything written by
-- `supabaseAdmin` in an API route keeps working regardless.


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1 — find out which tables are actually unprotected
--
-- Run this on its own first. It reads nothing but the catalogue, changes
-- nothing, and tells you exactly which tables the advisor is complaining
-- about. Fix what it lists; skip the rest.
-- ─────────────────────────────────────────────────────────────────────────

select
  c.relname                                   as table_name,
  c.relrowsecurity                            as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;

-- `rls_enabled = false` is the problem.
-- `rls_enabled = true` with `policy_count = 0` is the other problem: protected
-- from strangers and from your own app equally.


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2 — the fixes, one table at a time
--
-- Run only the blocks for tables STEP 1 listed as unprotected.
-- ─────────────────────────────────────────────────────────────────────────


-- dream_patterns ──────────────────────────────────────────────────────────
-- Has user_id (see app/api/extract-patterns/route.ts). The monthly review
-- queries it by dream_id without filtering on the person; RLS supplies that
-- filter itself, so the existing query keeps working and stops being able to
-- read anyone else's rows.

alter table public.dream_patterns enable row level security;

drop policy if exists "Users read own dream patterns" on public.dream_patterns;
create policy "Users read own dream patterns"
  on public.dream_patterns for select
  using (auth.uid() = user_id);

drop policy if exists "Users write own dream patterns" on public.dream_patterns;
create policy "Users write own dream patterns"
  on public.dream_patterns for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own dream patterns" on public.dream_patterns;
create policy "Users update own dream patterns"
  on public.dream_patterns for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own dream patterns" on public.dream_patterns;
create policy "Users delete own dream patterns"
  on public.dream_patterns for delete
  using (auth.uid() = user_id);


-- unconscious_profiles ────────────────────────────────────────────────────
-- The one to care about most. It is read from the browser at
-- app/profile/page.tsx:57, so the anon key reaches it directly, and what it
-- holds is an inference about a person drawn from everything they wrote.

alter table public.unconscious_profiles enable row level security;

drop policy if exists "Users read own unconscious profile" on public.unconscious_profiles;
create policy "Users read own unconscious profile"
  on public.unconscious_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users write own unconscious profile" on public.unconscious_profiles;
create policy "Users write own unconscious profile"
  on public.unconscious_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own unconscious profile" on public.unconscious_profiles;
create policy "Users update own unconscious profile"
  on public.unconscious_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users delete own unconscious profile" on public.unconscious_profiles;
create policy "Users delete own unconscious profile"
  on public.unconscious_profiles for delete
  using (auth.uid() = user_id);


-- contact_requests ────────────────────────────────────────────────────────
-- Written only by the service role (app/api/contact-support/route.ts) and
-- never read by the app. So RLS with no policy at all is exactly right: the
-- service role still writes, and nobody holding the anon key can read the
-- support inbox — which contains other people's email addresses and whatever
-- they wrote in.

alter table public.contact_requests enable row level security;


-- community_likes ─────────────────────────────────────────────────────────
-- Only referenced by the account-deletion path, which deletes by user_id, so
-- it has that column.

alter table public.community_likes enable row level security;

drop policy if exists "Users read own likes" on public.community_likes;
create policy "Users read own likes"
  on public.community_likes for select
  using (auth.uid() = user_id);

drop policy if exists "Users write own likes" on public.community_likes;
create policy "Users write own likes"
  on public.community_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own likes" on public.community_likes;
create policy "Users delete own likes"
  on public.community_likes for delete
  using (auth.uid() = user_id);


-- profiles, subscriptions ─────────────────────────────────────────────────
-- Read only by /api/admin/weekly-metrics, which runs with the service role.
-- The live tables are user_profiles and user_subscriptions, and these two look
-- like what came before them.
--
-- ⚠️ Check STEP 1 first. If they are not in that list they no longer exist and
-- there is nothing to do. If they do exist and hold real rows, closing them to
-- the anon key costs nothing, because nothing on the client reads them.

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;


-- avatars ─────────────────────────────────────────────────────────────────
-- ⚠️ Check STEP 1 before running this one.
--
-- ProfileSettings.tsx:138 calls `.from('avatars')`, but that may be
-- `supabase.storage.from('avatars')` — a storage bucket, not a table. Buckets
-- do not appear in STEP 1 and are governed by their own policies under
-- Storage. Only run this if STEP 1 actually lists a table called avatars.

-- alter table public.avatars enable row level security;


-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3 — check the app afterwards
--
-- Re-run STEP 1: everything should read true with a policy count above zero,
-- except contact_requests, which is meant to have none.
--
-- Then open the app and look at the two screens that read these tables:
--
--   menu -> Monthly Review   (dream_patterns — the archetypes)
--   /profile                 (unconscious_profiles)
--
-- If either goes empty, the policy is wrong rather than the data being gone.
-- The fastest check is whether the table's ownership column is really named
-- user_id. Nothing here deletes anything.
-- ─────────────────────────────────────────────────────────────────────────
