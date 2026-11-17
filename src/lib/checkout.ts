'use client';

import { supabase } from './supabase';
import { isNative, purchase, restore } from './revenuecat';

export type PlanId = 'premium' | 'yearly';

type Lang = 'en' | 'ko';

const copy = {
  en: {
    webOnly: 'Subscriptions are purchased in the Novakitz app. Download it to upgrade.',
    unavailable: 'The store is not reachable right now. Please try again shortly.',
    purchased: 'Welcome to Pro.',
    purchasedSignedOut:
      'Welcome to Pro. Sign in whenever you like and your subscription will follow you to your other devices.',
    restored: 'Your purchase has been restored.',
    nothingToRestore: 'No previous purchase was found on this device.',
  },
  ko: {
    webOnly: '구독은 Novakitz 앱에서 진행됩니다. 앱을 설치한 뒤 업그레이드해 주세요.',
    unavailable: '지금은 스토어에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    purchased: 'Pro가 활성화되었습니다.',
    purchasedSignedOut:
      'Pro가 활성화되었습니다. 로그인하시면 다른 기기에서도 구독이 이어집니다.',
    restored: '구매 내역을 복원했습니다.',
    nothingToRestore: '이 기기에서 이전 구매 내역을 찾지 못했습니다.',
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
 * Signing in is NOT required to buy. It used to be: an anonymous purchase
 * attaches to RevenueCat's anonymous app user id, and the webhook then has no
 * Supabase user to write the entitlement to, so the sale appeared to vanish.
 * App Review rejected that under guideline 5.1.1(v) on 2026-10-03 — an app
 * cannot make registration a precondition of an in-app purchase.
 *
 * Nothing vanishes now. The entitlement still exists on the anonymous id, and
 * two things find it:
 *
 *   while signed out  `isPremiumNow` (lib/premium.ts) asks the store directly,
 *                     so Pro is on the moment the sheet closes.
 *   on sign-in        `identify()` calls Purchases.logIn, which aliases the
 *                     anonymous id onto the account. The purchase moves with
 *                     it and the webhook writes the row.
 *
 * So the account is what makes a subscription portable between devices, which
 * is a reason to offer it, not a reason to demand it. That is what the message
 * after a signed-out purchase says.
 *
 * On web there is no checkout yet — RevenueCat Web Billing is the intended
 * replacement, and until then the user is pointed at the app.
 */
export async function startCheckout(plan: PlanId, language: Lang = 'en'): Promise<CheckoutResult> {
  const t = copy[language];

  if (!isNative()) {
    return { changed: false, message: t.webOnly };
  }

  const signedIn = await isSignedIn();

  const outcome = await purchase(plan);
  switch (outcome.status) {
    case 'purchased':
      return { changed: true, message: signedIn ? t.purchased : t.purchasedSignedOut };
    case 'cancelled':
      return { changed: false, message: null };
    case 'unavailable':
      return { changed: false, message: t.unavailable };
    case 'error':
      return { changed: false, message: outcome.message };
  }
}

/**
 * Restore a previous purchase.
 *
 * App Store review requires this to be reachable, and it must work without an
 * account: restore asks the store what this Apple Account has already bought,
 * which is a question Supabase has no part in. The sign-in check that used to
 * stand here made the control useless to the one person most likely to press
 * it — someone reinstalling who cannot get back into their account.
 */
export async function restorePurchases(language: Lang = 'en'): Promise<CheckoutResult> {
  const t = copy[language];

  if (!isNative()) {
    return { changed: false, message: t.webOnly };
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
