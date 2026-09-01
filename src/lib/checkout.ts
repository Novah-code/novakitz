'use client';

import { supabase } from './supabase';
import { isNative, purchase, restore } from './revenuecat';

export type PlanId = 'premium' | 'yearly';

type Lang = 'en' | 'ko';

const copy = {
  en: {
    webOnly: 'Subscriptions are purchased in the Novakitz app. Download it to upgrade.',
    signInFirst: 'Please sign in first so your subscription is attached to your account.',
    unavailable: 'The store is not reachable right now. Please try again shortly.',
    purchased: 'Welcome to Pro.',
    restored: 'Your purchase has been restored.',
    nothingToRestore: 'No previous purchase was found for this account.',
  },
  ko: {
    webOnly: '구독은 Novakitz 앱에서 진행됩니다. 앱을 설치한 뒤 업그레이드해 주세요.',
    signInFirst: '구독이 계정에 연결되도록 먼저 로그인해 주세요.',
    unavailable: '지금은 스토어에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    purchased: 'Pro가 활성화되었습니다.',
    restored: '구매 내역을 복원했습니다.',
    nothingToRestore: '이 계정에서 이전 구매 내역을 찾지 못했습니다.',
  },
} satisfies Record<Lang, Record<string, string>>;


async function isSignedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session?.user);
}

export interface CheckoutResult {
  /** True when entitlements changed and the caller should refresh subscription state. */
  changed: boolean;
  message: string | null;
}

/**
 * Single entry point for starting a purchase.
 *
 * On native this runs the RevenueCat purchase flow. The entitlement is written
 * to user_subscriptions by the RevenueCat webhook, so callers should reload
 * subscription state when `changed` is true rather than trusting local state.
 *
 * On web there is no checkout yet — RevenueCat Web Billing is the intended
 * replacement, and until then the user is pointed at the app.
 */
export async function startCheckout(plan: PlanId, language: Lang = 'en'): Promise<CheckoutResult> {
  const t = copy[language];

  if (!isNative()) {
    return { changed: false, message: t.webOnly };
  }

  // Without a signed-in user the purchase attaches to RevenueCat's anonymous
  // id, and the webhook then has no Supabase user to grant the entitlement to.
  // The pricing page is public, so this is reachable.
  if (!(await isSignedIn())) {
    return { changed: false, message: t.signInFirst };
  }

  const outcome = await purchase(plan);
  switch (outcome.status) {
    case 'purchased':
      return { changed: true, message: t.purchased };
    case 'cancelled':
      return { changed: false, message: null };
    case 'unavailable':
      return { changed: false, message: t.unavailable };
    case 'error':
      return { changed: false, message: outcome.message };
  }
}

/** Restore a previous purchase. App Store review requires this to be reachable. */
export async function restorePurchases(language: Lang = 'en'): Promise<CheckoutResult> {
  const t = copy[language];

  if (!isNative()) {
    return { changed: false, message: t.webOnly };
  }

  if (!(await isSignedIn())) {
    return { changed: false, message: t.signInFirst };
  }

  const outcome = await restore();
  switch (outcome.status) {
    case 'restored':
      return { changed: true, message: t.restored };
    case 'nothing-to-restore':
      return { changed: false, message: t.nothingToRestore };
    case 'unavailable':
      return { changed: false, message: t.unavailable };
    case 'error':
      return { changed: false, message: outcome.message };
  }
}
