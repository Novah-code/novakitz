-- Subscription and Usage Tracking Tables for Gumroad Integration

-- Enable extension for UUID functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Subscription Plans Table (static reference data)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_name TEXT NOT NULL UNIQUE,
    plan_slug TEXT NOT NULL UNIQUE,
    price_cents INTEGER, -- $4.99 = 499 cents, NULL for free plan
    ai_interpretations_per_month INTEGER NOT NULL,
    history_days INTEGER NOT NULL, -- 30 for free, unlimited (999999) for premium
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default plans
INSERT INTO public.subscription_plans (plan_name, plan_slug, price_cents, ai_interpretations_per_month, history_days, description)
VALUES
    ('Free', 'free', NULL, 7, 30, 'Unlimited dream recording, 7 AI interpretations per month, 30-day history'),
    ('Premium', 'premium', 499, 999999, 999999, '$4.99/month - Unlimited AI interpretations and full history')
ON CONFLICT (plan_slug) DO NOTHING;

-- 2. User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),

    -- Gumroad integration fields
    gumroad_license_key TEXT UNIQUE,
    gumroad_product_id TEXT,

    -- Subscription status
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),

    -- Dates
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    renewed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT unique_active_subscription PER USER USING GIST (user_id, status) WHERE status = 'active'
);

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER on_user_subscriptions_updated
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create indexes
CREATE INDEX user_subscriptions_user_id_idx ON public.user_subscriptions(user_id);
CREATE INDEX user_subscriptions_status_idx ON public.user_subscriptions(status);
CREATE INDEX user_subscriptions_gumroad_license_idx ON public.user_subscriptions(gumroad_license_key);

-- 3. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Tracking
    year_month DATE NOT NULL, -- YYYY-MM-01 format for easy grouping
    dream_id UUID REFERENCES public.dreams(id) ON DELETE SET NULL,

    -- Usage info
    interpretation_type TEXT CHECK (interpretation_type IN ('full_analysis', 'quick_summary')),
    tokens_used INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX ai_usage_user_id_idx ON public.ai_usage(user_id);
CREATE INDEX ai_usage_year_month_idx ON public.ai_usage(year_month);
CREATE INDEX ai_usage_user_month_idx ON public.ai_usage(user_id, year_month);

-- Enable RLS for subscription tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view plans" ON public.subscription_plans
    FOR SELECT USING (true);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.ai_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.subscription_plans TO authenticated;
GRANT ALL ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.ai_usage TO authenticated;

-- Helper function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = user_id_param
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(user_id_param UUID)
RETURNS TABLE(plan_slug TEXT, ai_interpretations_per_month INTEGER, history_days INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.plan_slug,
        sp.ai_interpretations_per_month,
        sp.history_days
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = user_id_param
    AND us.status = 'active'
    AND (us.expires_at IS NULL OR us.expires_at > NOW())
    LIMIT 1;

    -- Default to free plan if no active subscription
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 'free'::TEXT, 7::INTEGER, 30::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to count AI usage for current month
CREATE OR REPLACE FUNCTION public.get_month_ai_usage(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    current_month DATE;
    usage_count INTEGER;
BEGIN
    current_month := DATE_TRUNC('month', NOW())::DATE;

    SELECT COUNT(*)::INTEGER INTO usage_count
    FROM public.ai_usage
    WHERE user_id = user_id_param
    AND year_month = current_month;

    RETURN COALESCE(usage_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;
