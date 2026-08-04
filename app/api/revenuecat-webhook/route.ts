import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * RevenueCat webhook — the authoritative path for entitlement changes.
 *
 * The client sees the purchase result immediately, but the database is what
 * getUserPlan() reads, so every grant and revoke lands here. Because the app
 * identifies users to RevenueCat with their Supabase id, `app_user_id` maps
 * straight onto user_subscriptions.user_id.
 *
 * Configure in RevenueCat: Project settings -> Integrations -> Webhooks, with
 * the Authorization header set to REVENUECAT_WEBHOOK_SECRET.
 */

const PREMIUM_ENTITLEMENT = 'premium';

// Access begins or continues.
const GRANTING_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
  'PRODUCT_CHANGE',
  'TRANSFER',
  'SUBSCRIPTION_EXTENDED',
]);

// Access ends now. CANCELLATION is deliberately absent: it means auto-renew was
// turned off, and the user keeps access until expiration_at_ms. BILLING_ISSUE
// is also absent so the grace period is not cut short.
const REVOKING_EVENTS = new Set(['EXPIRATION']);

interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  entitlement_ids?: string[] | null;
  expiration_at_ms?: number | null;
  purchased_at_ms?: number | null;
  store?: string;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!expected) {
    console.error('[RevenueCat] REVENUECAT_WEBHOOK_SECRET is not set; rejecting.');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = admin();
  if (!supabase) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  let event: RevenueCatEvent;
  try {
    ({ event } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  if (!event?.type) {
    return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
  }

  const userId = event.app_user_id ?? event.original_app_user_id;
  if (!userId) {
    return NextResponse.json({ error: 'Missing app_user_id' }, { status: 400 });
  }

  const grants = GRANTING_EVENTS.has(event.type);
  const revokes = REVOKING_EVENTS.has(event.type);

  // Events we do not act on (TEST, CANCELLATION, BILLING_ISSUE, ...) are still
  // acknowledged so RevenueCat does not retry them.
  if (!grants && !revokes) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  // A grant for some other entitlement should not unlock premium.
  if (grants && event.entitlement_ids && !event.entitlement_ids.includes(PREMIUM_ENTITLEMENT)) {
    return NextResponse.json({ received: true, ignored: 'other entitlement' });
  }

  try {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_slug', grants ? 'premium' : 'free')
      .single();

    if (!plan) {
      console.error('[RevenueCat] Missing plan row for', grants ? 'premium' : 'free');
      return NextResponse.json({ error: 'Plan not found' }, { status: 500 });
    }

    const now = new Date().toISOString();
    // A one-off purchase has no expiry, which the app already reads as lifetime.
    const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const row = {
      plan_id: plan.id,
      status: grants ? 'active' : 'expired',
      expires_at: grants ? expiresAt : now,
      updated_at: now,
      ...(grants ? { renewed_at: now } : { cancelled_at: now }),
    };

    const { error } = existing
      ? await supabase.from('user_subscriptions').update(row).eq('id', existing.id)
      : await supabase.from('user_subscriptions').insert({
          ...row,
          user_id: userId,
          started_at: event.purchased_at_ms ? new Date(event.purchased_at_ms).toISOString() : now,
          created_at: now,
        });

    if (error) {
      // Returning 500 makes RevenueCat retry, which is what we want on a
      // transient database failure.
      console.error('[RevenueCat] Failed to write subscription:', error);
      return NextResponse.json({ error: 'Write failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true, type: event.type, granted: grants });
  } catch (error) {
    console.error('[RevenueCat] Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
