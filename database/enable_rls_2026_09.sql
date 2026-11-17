-- Row Level Security for the tables that never got it.
--
-- Supabase's security advisor flagged `rls_disabled_in_public` on 2026-09-13.
-- Without RLS, a table in the public schema is readable, writable and
-- deletable by anyone holding the anon key — and the anon key ships inside the
-- app bundle, because that is what it is for. The project URL is in there too.
-- So "anyone with your project URL" means anyone who downloaded the app.
--
-- Every table created by the SQL in this directory already enables RLS. The
-- list below is the tables the code queries that no script here protects: they
-- were created somewhere else, probably by hand in the dashboard. Some of them
-- turn out not to exist at all any more.
--
--
-- HOW TO RUN IT
--
-- Paste the whole file into the Supabase SQL editor and run it once. It skips
-- any table that is not there, so a name that has since been dropped is not an
-- error — the first version of this script stopped dead on `community_likes`,
-- which does not exist.
--
-- Then run the query at the bottom to see the result.
--
--
-- WHY EACH TABLE IS HANDLED THE WAY IT IS
--
--   dream_patterns        archetype hints from a person's dreams. Has user_id.
--   unconscious_profiles  read straight from the browser at
--                         app/profile/page.tsx:57, and holds an inference
--                         about someone drawn from everything they wrote.
--                         Has user_id. The one that matters most.
--   community_likes       has user_id, if it exists.
--   contact_requests      support messages with the sender's email address.
--                         Written only by the service role and never read by
--                         the app, so it gets RLS and *no policy at all* —
--                         the service role bypasses RLS, and nobody with the
--                         anon key should be reading the support inbox.
--   profiles              read only by /api/admin, which uses the service
--   subscriptions         role. Superseded by user_profiles and
--                         user_subscriptions. Same treatment: closed, no
--                         policy, nothing on the client reads them.
--   avatars               probably `supabase.storage.from('avatars')` rather
--                         than a table. If it is a bucket this script will not
--                         find it, which is correct — buckets have their own
--                         policies under Storage.
--
-- Turning RLS on without a policy does not raise an error; it makes the table
-- return zero rows to the app as well, quietly. That is why the tables people
-- read from the client get their owner policies in the same pass, and only the
-- service-role-only tables are left bare.


-- ─────────────────────────────────────────────────────────────────────────
-- Enable RLS wherever it is missing, and give owners access where the client
-- needs it. Skips tables that do not exist.
-- ─────────────────────────────────────────────────────────────────────────

do $$
declare
  -- Tables the app reads as the signed-in person: RLS plus owner policies.
  owned text[] := array['dream_patterns', 'unconscious_profiles', 'community_likes'];
  -- Tables only the service role touches: RLS, deliberately no policy.
  service_only text[] := array['contact_requests', 'profiles', 'subscriptions'];
  t text;
begin
  foreach t in array owned loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping %, table does not exist', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Ownership has to be a column on the table for these to mean anything.
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'user_id'
    ) then
      raise warning '% has no user_id column — RLS is on but it has no policy, so the app cannot read it either. Fix before using the app.', t;
      continue;
    end if;

    execute format('drop policy if exists "Owner can select" on public.%I', t);
    execute format(
      'create policy "Owner can select" on public.%I for select using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "Owner can insert" on public.%I', t);
    execute format(
      'create policy "Owner can insert" on public.%I for insert with check (auth.uid() = user_id)', t);

    execute format('drop policy if exists "Owner can update" on public.%I', t);
    execute format(
      'create policy "Owner can update" on public.%I for update using (auth.uid() = user_id)', t);

    execute format('drop policy if exists "Owner can delete" on public.%I', t);
    execute format(
      'create policy "Owner can delete" on public.%I for delete using (auth.uid() = user_id)', t);

    raise notice 'protected % with owner policies', t;
  end loop;

  foreach t in array service_only loop
    if to_regclass('public.' || t) is null then
      raise notice 'skipping %, table does not exist', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    raise notice 'closed % to the anon key (service role only)', t;
  end loop;
end $$;


-- ─────────────────────────────────────────────────────────────────────────
-- Check the result.
--
-- `rls_enabled = false` is still a problem.
-- `rls_enabled = true, policy_count = 0` is correct for contact_requests,
-- profiles and subscriptions, and wrong for anything the app reads.
-- ─────────────────────────────────────────────────────────────────────────

select
  c.relname        as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;


-- ─────────────────────────────────────────────────────────────────────────
-- Then open the app and look at the two screens that read these tables:
--
--   menu -> Monthly Review   (dream_patterns — the archetypes)
--   /profile                 (unconscious_profiles)
--
-- If either goes empty, the policy is wrong, not the data gone. Nothing here
-- deletes anything.
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- OUTCOME, 2026-09-15 — this is finished. Nothing here needs checking again.
--
-- The advisor's table was `balance_votes`: rls_enabled false, no policies, and
-- its name appears nowhere in the code or in any SQL in this directory. An
-- abandoned experiment. Closed with
--
--   alter table public.balance_votes enable row level security;
--
-- and nothing broke, because nothing reads it.
--
-- `credit_transactions` was already RLS-on with no policies — same story, a
-- table nothing uses, and no policies means the anon key can do nothing with
-- it. Left as it is.
--
-- Two pre-existing policies were checked rather than assumed:
--
--   contact_requests   "service only", ALL, qual = false. No row matches for
--                      anyone going through RLS, and the service role bypasses
--                      RLS, so the support route still writes and nobody with
--                      the anon key can read the inbox. Correct.
--   subscription_plans "Users can view plans", SELECT, qual = true. That is
--                      the price list; it is meant to be readable.
--
-- Every other table in public now reports rls_enabled true with at least one
-- policy.
-- ─────────────────────────────────────────────────────────────────────────
