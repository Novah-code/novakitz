'use client';

import { supabase } from './supabase';
import { hasPremiumEntitlement } from './revenuecat';

/**
 * Is this person on Pro right now?
 *
 * There are two places an entitlement can live, and the app has to believe
 * either of them.
 *
 *   the database   `user_subscriptions`, written by the RevenueCat webhook and
 *                  keyed on the Supabase user id. Authoritative for a signed-in
 *                  account, and the only source that survives a reinstall
 *                  before the store has been asked.
 *
 *   the store      RevenueCat's own record of what this device has bought.
 *                  Reachable without an account, because a purchase made while
 *                  signed out attaches to an anonymous app user id.
 *
 * Before this existed, every screen asked the database alone and passed it a
 * `user.id`. That is why buying had to be blocked until someone signed in:
 * without an account there was nowhere for the answer to come from, so a
 * purchase would have taken the money and granted nothing. App Review called
 * that gate out under guideline 5.1.1(v) on 2026-10-03 — registration cannot
 * be a precondition of buying.
 *
 * Asking the store as well removes the reason for the gate. It also fixes a
 * quieter failure that was always possible: if the webhook never arrives, a
 * paying signed-in customer used to sit on the free tier with no way back.
 * Now the store answers for them.
 *
 * The order matters. The database is cheap and local to a request; the store
 * is a bridge call. So the database answers first whenever it can, and the
 * store is consulted only when the answer would otherwise be "no".
 *
 * Off-native the store call no-ops and returns false, so the web build behaves
 * exactly as it did.
 */
export async function isPremiumNow(userId: string | null | undefined): Promise<boolean> {
  if (userId && (await hasPremiumRow(userId))) return true;
  return hasPremiumEntitlement();
}

/**
 * The database half, on its own.
 *
 * Kept separate because a comped account — the demo account for review, or
 * anything granted from the admin screen — is a row with no expiry and no
 * store purchase behind it. Those have to keep working.
 */
async function hasPremiumRow(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('expires_at, subscription_plans:plan_id(plan_slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .maybeSingle();

    if (error) {
      console.error('[premium] subscription lookup failed:', error);
      return false;
    }

    // The join comes back as an object or, depending on how the relationship is
    // resolved, a one-element array. Treating only the object shape as valid is
    // how a paying customer silently drops to free.
    const plans = (data as { subscription_plans?: unknown } | null)?.subscription_plans;
    const slug = Array.isArray(plans)
      ? (plans[0] as { plan_slug?: string } | undefined)?.plan_slug
      : (plans as { plan_slug?: string } | undefined)?.plan_slug;

    return slug === 'premium';
  } catch (error) {
    console.error('[premium] subscription lookup threw:', error);
    return false;
  }
}
