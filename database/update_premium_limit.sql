-- Update Premium plan to have 200 AI interpretations per month (instead of unlimited)
-- This prevents abuse while still being generous (6-7 per day on average)

UPDATE public.subscription_plans
SET
    ai_interpretations_per_month = 200,
    description = '$4.99/month - 200 AI interpretations per month and full history',
    updated_at = NOW()
WHERE plan_slug = 'premium';

-- Verify the update
SELECT
    plan_name,
    plan_slug,
    ai_interpretations_per_month,
    description
FROM public.subscription_plans
ORDER BY plan_slug;
