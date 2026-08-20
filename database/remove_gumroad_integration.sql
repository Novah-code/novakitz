-- Remove the Gumroad payment integration.
--
-- Entitlements move to RevenueCat, which writes into user_subscriptions via
-- webhook. The plan/status/expiry columns that getUserPlan() reads are
-- unchanged, so the gating logic built on them keeps working as-is.
--
-- Safe to run: there were no paying subscribers on Gumroad, so no entitlement
-- data is lost. Lifetime access is now expressed as an active premium
-- subscription with expires_at IS NULL, which the app already treats as
-- lifetime.

BEGIN;

-- Rows created by the Gumroad license flow before it was removed.
DROP TABLE IF EXISTS public.pending_purchases;

DROP INDEX IF EXISTS public.user_subscriptions_gumroad_license_idx;

ALTER TABLE public.user_subscriptions
    DROP COLUMN IF EXISTS gumroad_license_key,
    DROP COLUMN IF EXISTS gumroad_product_id;

ALTER TABLE public.user_profiles
    DROP COLUMN IF EXISTS gumroad_license_key;

-- Added by the abandoned Toss Payments experiment; never used in production.
ALTER TABLE public.user_subscriptions
    DROP COLUMN IF EXISTS toss_payment_key,
    DROP COLUMN IF EXISTS toss_order_id,
    DROP COLUMN IF EXISTS payment_method;

COMMIT;
