'use client';

import { Capacitor } from '@capacitor/core';
import type { PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { isNative } from './platform';

/**
 * RevenueCat access, guarded so the web build never touches the native SDK.
 *
 * Every function here no-ops off-native. The SDK is imported dynamically so its
 * bridge code stays out of the web bundle entirely — importing it at module
 * scope would pull Capacitor plugin registration into the Vercel deploy.
 */

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const PREMIUM_ENTITLEMENT = 'premium';

/**
 * Package identifiers to look for inside the current offering.
 *
 * `$rc_lifetime` was here too, and there is no lifetime product — the plan was
 * taken off the paywall and never existed in App Store Connect. Asking for a
 * package that cannot be returned is harmless but it kept the idea alive in
 * the types, which is how a removed plan ends up on a badge.
 */
export const PACKAGE_IDS = {
  premium: '$rc_monthly',
  yearly: '$rc_annual',
} as const;

export type PlanId = keyof typeof PACKAGE_IDS;

export { isNative };

function apiKey(): string | undefined {
  return Capacitor.getPlatform() === 'ios'
    ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
}

let configured = false;

async function sdk() {
  return import('@revenuecat/purchases-capacitor');
}

/**
 * Configure once per app launch. Safe to call repeatedly.
 * Returns false when RevenueCat is unavailable, so callers can fall back.
 */
export async function configureRevenueCat(): Promise<boolean> {
  if (!isNative()) return false;
  if (configured) return true;

  const key = apiKey();
  if (!key) {
    console.warn('[RevenueCat] No API key for this platform; purchases disabled.');
    return false;
  }

  // A Test Store key left in a release build breaks real purchases, and it is
  // an easy thing to forget after a development cycle. Refuse to configure
  // rather than shipping an app that takes payments into a sandbox.
  if (key.startsWith('test_') && process.env.NODE_ENV === 'production') {
    console.error('[RevenueCat] Test Store key in a production build; purchases disabled.');
    return false;
  }

  try {
    const { Purchases, LOG_LEVEL } = await sdk();
    await Purchases.setLogLevel({
      level: process.env.NODE_ENV === 'production' ? LOG_LEVEL.ERROR : LOG_LEVEL.DEBUG,
    });
    await Purchases.configure({ apiKey: key });
    configured = true;
    return true;
  } catch (error) {
    console.error('[RevenueCat] configure failed:', error);
    return false;
  }
}

/**
 * Identify the buyer by their Supabase user id.
 *
 * Using the Supabase id as the RevenueCat App User ID is what lets the webhook
 * map an entitlement back to a row in user_subscriptions without a lookup table.
 */
export async function identify(userId: string): Promise<void> {
  if (!(await configureRevenueCat())) return;
  try {
    const { Purchases } = await sdk();
    await Purchases.logIn({ appUserID: userId });
  } catch (error) {
    console.error('[RevenueCat] logIn failed:', error);
  }
}

export async function forgetUser(): Promise<void> {
  if (!isNative() || !configured) return;
  try {
    const { Purchases } = await sdk();
    await Purchases.logOut();
  } catch (error) {
    console.error('[RevenueCat] logOut failed:', error);
  }
}

async function packageFor(plan: PlanId): Promise<PurchasesPackage | null> {
  const { Purchases } = await sdk();
  const { current } = await Purchases.getOfferings();
  if (!current) return null;

  const wanted = PACKAGE_IDS[plan];
  return (
    current.availablePackages.find((p) => p.identifier === wanted) ??
    current.availablePackages[0] ??
    null
  );
}

export type PlanPricing = {
  /** The store's own formatted price, in the buyer's currency. */
  priceString: string;
  /**
   * The introductory offer, and only when this account can actually claim it.
   * Null covers three different situations that all want the same treatment:
   * no offer configured, an offer this Apple Account has already used, and an
   * eligibility check that came back unknown.
   */
  intro: { free: boolean; priceString: string; units: number; unit: string } | null;
};

/**
 * What the store says these plans cost, and whether a trial is on the table.
 *
 * The paywall had $5.99 and $49.99 written into it as strings. That is wrong
 * twice over: it shows dollars to someone whose store charges won, and it goes
 * quietly out of date the moment a price changes in App Store Connect.
 *
 * The eligibility check matters as much as the price. Apple grants an
 * introductory offer once per subscription group, so someone who took the trial
 * on one plan cannot take it on the other — promising them a free week and then
 * charging them at the sheet is exactly the kind of mismatch review looks for.
 * The SDK returns UNKNOWN in cases it cannot decide, and RevenueCat's own
 * guidance for that is to show the regular price, which is what null does here.
 *
 * Returns {} off-native, where there is no store to ask, so the caller keeps
 * whatever it was going to show anyway.
 */
export async function loadPricing(plans: PlanId[]): Promise<Partial<Record<PlanId, PlanPricing>>> {
  if (!(await configureRevenueCat())) return {};

  try {
    const { Purchases, INTRO_ELIGIBILITY_STATUS } = await sdk();
    const { current } = await Purchases.getOfferings();
    if (!current) return {};

    const found = plans
      .map((plan) => ({
        plan,
        pkg: current.availablePackages.find((p) => p.identifier === PACKAGE_IDS[plan]),
      }))
      .filter((entry): entry is { plan: PlanId; pkg: PurchasesPackage } => Boolean(entry.pkg));

    if (found.length === 0) return {};

    let eligibility: Record<string, { status: number }> = {};
    try {
      eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility({
        productIdentifiers: found.map((e) => e.pkg.product.identifier),
      });
    } catch (error) {
      // Not fatal — an unanswered eligibility check just means no trial is
      // advertised, which is the safe direction to be wrong in.
      console.warn('[RevenueCat] eligibility check failed:', error);
    }

    const result: Partial<Record<PlanId, PlanPricing>> = {};
    for (const { plan, pkg } of found) {
      const { product } = pkg;
      const eligible =
        eligibility[product.identifier]?.status ===
        INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE;

      result[plan] = {
        priceString: product.priceString,
        intro:
          eligible && product.introPrice
            ? {
                free: product.introPrice.price === 0,
                priceString: product.introPrice.priceString,
                units: product.introPrice.periodNumberOfUnits,
                unit: product.introPrice.periodUnit,
              }
            : null,
      };
    }
    return result;
  } catch (error) {
    console.error('[RevenueCat] loadPricing failed:', error);
    return {};
  }
}

export type PurchaseOutcome =
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

export async function purchase(plan: PlanId): Promise<PurchaseOutcome> {
  if (!(await configureRevenueCat())) return { status: 'unavailable' };

  try {
    const pkg = await packageFor(plan);
    if (!pkg) return { status: 'unavailable' };

    const { Purchases } = await sdk();
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
      ? { status: 'purchased' }
      : { status: 'error', message: 'Purchase completed but premium was not granted.' };
  } catch (error) {
    const err = error as { code?: string; userCancelled?: boolean; message?: string };
    if (err.userCancelled || err.code === 'PURCHASE_CANCELLED') {
      return { status: 'cancelled' };
    }
    console.error('[RevenueCat] purchase failed:', error);
    return { status: 'error', message: err.message ?? 'Purchase failed.' };
  }
}

export type RestoreOutcome =
  | { status: 'restored' }
  | { status: 'nothing-to-restore' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string };

/** Required by App Store review for any app selling subscriptions. */
export async function restore(): Promise<RestoreOutcome> {
  if (!(await configureRevenueCat())) return { status: 'unavailable' };

  try {
    const { Purchases } = await sdk();
    const { customerInfo } = await Purchases.restorePurchases();
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
      ? { status: 'restored' }
      : { status: 'nothing-to-restore' };
  } catch (error) {
    const err = error as { message?: string };
    console.error('[RevenueCat] restore failed:', error);
    return { status: 'error', message: err.message ?? 'Restore failed.' };
  }
}

/** Client-side entitlement read. The database, fed by the webhook, stays authoritative. */
export async function hasPremiumEntitlement(): Promise<boolean> {
  if (!(await configureRevenueCat())) return false;
  try {
    const { Purchases } = await sdk();
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]);
  } catch {
    return false;
  }
}
