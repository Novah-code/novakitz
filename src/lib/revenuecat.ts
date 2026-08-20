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

/** Package identifiers to look for inside the current offering. */
export const PACKAGE_IDS = {
  premium: '$rc_monthly',
  yearly: '$rc_annual',
  lifetime: '$rc_lifetime',
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
