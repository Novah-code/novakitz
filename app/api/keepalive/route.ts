import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Keeps the Supabase project from being auto-paused.
 *
 * The free tier pauses a project after roughly a week of no database activity,
 * and everything here runs on it — auth, dreams, subscriptions. A pause during
 * App Store review means the reviewer opens a completely broken app, and the
 * rejection is the first anyone hears about it.
 *
 * A single cheap read per day is enough to count as activity. Scheduled from
 * vercel.json; Vercel sends the request with a bearer token in CRON_SECRET.
 */

// Never serve this from the build or a cache — the point is that a request
// actually reaches Supabase.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Vercel Cron signs its requests. Skip the check when unset so the endpoint
  // still works on a preview deploy that has no secret configured.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  try {
    // subscription_plans is small, static reference data, so this stays cheap
    // no matter how large the user tables grow.
    const { error } = await createClient(url, key)
      .from('subscription_plans')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[keepalive] Supabase query failed:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (error) {
    console.error('[keepalive] Unexpected failure:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
