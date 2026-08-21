import { createClient } from '@supabase/supabase-js';

/**
 * Server-side view of a user's interpretation quota.
 *
 * The limit was only ever enforced in the browser, in
 * `canAnalyzeDream` (src/lib/subscription.ts), which means anything calling the
 * API route directly skipped it entirely. That helper cannot be reused here:
 * it talks to Supabase through the anon client, which on the server has no user
 * session and is blocked by row-level security. This reads with the service
 * role instead.
 */

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** First instant of the current month, UTC. */
function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export interface Quota {
  allowed: boolean;
  used: number;
  limit: number;
}

export async function checkQuota(userId: string): Promise<Quota> {
  const supabase = admin();
  // No credentials configured is a deployment problem, not a reason to refuse
  // someone their morning reading. Fail open and let the logs say why.
  if (!supabase) {
    console.error('[quota] Supabase service credentials missing; allowing through.');
    return { allowed: true, used: 0, limit: Number.MAX_SAFE_INTEGER };
  }

  try {
    const now = new Date().toISOString();
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('subscription_plans:plan_id(ai_interpretations_per_month)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle();

    const plan = subscription?.subscription_plans as { ai_interpretations_per_month?: number } | null;
    // 7 a month is the free allowance; see database/update_free_plan_to_7.sql.
    const limit = plan?.ai_interpretations_per_month ?? 7;

    // Counted from created_at rather than the ai_usage.year_month column. That
    // column is filled in from the browser's local calendar, so for anyone east
    // of UTC it can land on the last day of the previous month — fine for the
    // client, which reads back what it wrote, but not something to key on here.
    const { count, error } = await supabase
      .from('ai_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart());

    if (error) throw error;

    const used = count ?? 0;
    return { allowed: used < limit, used, limit };
  } catch (error) {
    // Same reasoning as above: an outage should not read as "you are out of
    // interpretations". The cost of letting a few extra through is cents.
    console.error('[quota] Lookup failed; allowing through.', error);
    return { allowed: true, used: 0, limit: Number.MAX_SAFE_INTEGER };
  }
}
