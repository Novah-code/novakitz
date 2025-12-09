-- Update free plan from 10 to 7 AI interpretations per month
-- Run this migration to update existing database

UPDATE public.subscription_plans
SET
    ai_interpretations_per_month = 7,
    description = 'Unlimited dream recording, 7 AI interpretations per month, 30-day history'
WHERE plan_slug = 'free';

-- Verify the update
SELECT plan_name, plan_slug, ai_interpretations_per_month, description
FROM public.subscription_plans
WHERE plan_slug = 'free';
