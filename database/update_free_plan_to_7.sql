-- Update free plan: 7 AI interpretations per month + unlimited history
-- Run this migration to update existing database

UPDATE public.subscription_plans
SET
    ai_interpretations_per_month = 7,
    history_days = 999999,
    description = 'Unlimited dream recording, 7 AI interpretations per month, unlimited history'
WHERE plan_slug = 'free';

-- Verify the update
SELECT plan_name, plan_slug, ai_interpretations_per_month, history_days, description
FROM public.subscription_plans
WHERE plan_slug = 'free';
