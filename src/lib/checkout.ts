'use client';

import { isNative, purchase, restore } from './revenuecat';

export type PlanId = 'premium' | 'yearly' | 'lifetime';

type Lang = 'en' | 'ko';

const copy = {
  en: {
    webOnly: 'Subscriptions are purchased in the Novakitz app. Download it to upgrade.',
    unavailable: 'The store is not reachable right now. Please try again shortly.',
    purchased: 'Welcome to Premium.',
    restored: 'Your purchase has been restored.',
    nothingToRestore: 'No previous purchase was found for this account.',
  },
  ko: {
    webOnly: '구독은 Novakitz 앱에서 진행됩니다. 앱을 설치한 뒤 업그레이드해 주세요.',
    unavailable: '지금은 스토어에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    purchased: '프리미엄이 활성화되었습니다.',
    restored: '구매 내역을 복원했습니다.',
    nothingToRestore: '이 계정에서 이전 구매 내역을 찾지 못했습니다.',
  },
} satisfies Record<Lang, Record<string, string>>;

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
