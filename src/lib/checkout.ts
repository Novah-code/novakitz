export type PlanId = 'premium' | 'yearly' | 'lifetime';

/**
 * Single entry point for starting a purchase.
 *
 * Gumroad was removed ahead of the RevenueCat integration, so there is no
 * checkout to hand off to yet. Every upgrade CTA funnels through here so that
 * wiring RevenueCat means changing one function:
 *
 *   - native (Capacitor): Purchases.getOfferings() -> purchasePackage()
 *   - web: RevenueCat Web Billing
 *
 * Entitlements land in user_subscriptions via the RevenueCat webhook, so
 * getUserPlan() and the gating built on it stay untouched.
 */
export async function startCheckout(_plan: PlanId, language: 'en' | 'ko' = 'en'): Promise<void> {
  const message =
    language === 'ko'
      ? '결제가 곧 앱에서 열립니다. 조금만 기다려 주세요.'
      : 'Purchases are moving to the app — checkout will be back shortly.';

  if (typeof window !== 'undefined') {
    window.alert(message);
  }
}
