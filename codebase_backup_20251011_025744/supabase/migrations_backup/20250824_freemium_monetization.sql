-- =============================================
-- YachtExcel Freemium Monetization System
-- =============================================
-- Core subscription management with Stripe multi-currency support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SUBSCRIPTION PLANS & TIERS
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT UNIQUE NOT NULL,
    plan_code TEXT UNIQUE NOT NULL,
    plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'basic', 'professional', 'enterprise', 'fleet')),
    
    -- Pricing information
    base_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    billing_interval TEXT CHECK (billing_interval IN ('monthly', 'yearly')),
    trial_period_days INTEGER DEFAULT 0,
    
    -- Multi-currency support
    supported_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    currency_multipliers JSONB DEFAULT '{"EUR": 0.85, "GBP": 0.75, "CAD": 1.25, "AUD": 1.40}'::jsonb,
    
    -- Feature limits
    max_yachts INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 1,
    max_storage_gb INTEGER DEFAULT 5,
    max_api_calls_monthly INTEGER DEFAULT 1000,
    max_ai_interactions_monthly INTEGER DEFAULT 100,
    
    -- Feature flags
    features_included JSONB NOT NULL DEFAULT '{
        "yachtie_ai": true,
        "basic_maintenance": true,
        "expense_tracking": true,
        "inventory_management": false,
        "safety_monitoring": false,
        "weather_routing": false,
        "nmea_integration": false,
        "multi_llm_consensus": false,
        "predictive_maintenance": false,
        "ar_troubleshooting": false,
        "advanced_analytics": false,
        "api_access": false,
        "priority_support": false
    }'::jsonb,
    
    -- Plan status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    plan_description TEXT,
    marketing_highlights TEXT[],
    
    -- Stripe integration
    stripe_product_id TEXT,
    stripe_price_id TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER SUBSCRIPTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    
    -- Subscription status
    subscription_status TEXT NOT NULL CHECK (subscription_status IN (
        'trial', 'active', 'past_due', 'canceled', 'unpaid', 'expired'
    )),
    
    -- Billing information
    billing_currency TEXT NOT NULL DEFAULT 'USD',
    billing_amount DECIMAL(10,2) NOT NULL,
    billing_interval TEXT NOT NULL,
    
    -- Subscription lifecycle
    trial_start DATE,
    trial_end DATE,
    subscription_start DATE NOT NULL,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    
    -- Usage tracking
    current_usage JSONB DEFAULT '{
        "yachts_count": 0,
        "users_count": 1,
        "storage_used_gb": 0,
        "api_calls_this_month": 0,
        "ai_interactions_this_month": 0
    }'::jsonb,
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,
    
    -- Referral tracking
    referral_code TEXT,
    referred_by_user_id UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================
-- BILLING TRANSACTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.billing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    -- Transaction details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'subscription_charge', 'upgrade_charge', 'refund', 'trial_conversion'
    )),
    transaction_status TEXT NOT NULL CHECK (transaction_status IN (
        'pending', 'succeeded', 'failed', 'refunded'
    )),
    
    -- Financial details
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    tax_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Payment processing
    payment_method TEXT CHECK (payment_method IN ('card', 'bank_transfer', 'paypal')),
    processor_transaction_id TEXT,
    
    -- Invoice details
    invoice_number TEXT,
    invoice_url TEXT,
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Stripe integration
    stripe_payment_intent_id TEXT,
    stripe_invoice_id TEXT,
    
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REFERRAL SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS public.referral_program (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES auth.users(id),
    referred_user_id UUID REFERENCES auth.users(id),
    
    referral_code TEXT UNIQUE NOT NULL,
    referral_status TEXT NOT NULL CHECK (referral_status IN (
        'pending', 'registered', 'converted', 'expired'
    )),
    
    -- Rewards
    referrer_reward_type TEXT CHECK (referrer_reward_type IN ('account_credit', 'free_months')),
    referrer_reward_amount DECIMAL(10,2),
    referred_reward_type TEXT CHECK (referred_reward_type IN ('account_credit', 'free_months')),
    referred_reward_amount DECIMAL(10,2),
    
    -- Reward fulfillment
    referrer_reward_applied BOOLEAN DEFAULT false,
    referred_reward_applied BOOLEAN DEFAULT false,
    
    -- Conversion tracking
    referred_user_converted_at TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION user_has_feature_access(p_user_id UUID, p_feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
BEGIN
    SELECT COALESCE((sp.features_included->p_feature_name)::boolean, false)
    INTO has_access
    FROM public.user_subscriptions us
    JOIN public.subscription_plans sp ON us.plan_id = sp.id
    WHERE us.user_id = p_user_id
        AND us.subscription_status IN ('trial', 'active');

    RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate subscription price in different currencies
CREATE OR REPLACE FUNCTION calculate_price_in_currency(
    p_plan_id UUID, 
    p_currency TEXT DEFAULT 'USD'
)
RETURNS DECIMAL AS $$
DECLARE
    base_price DECIMAL;
    multiplier DECIMAL;
    final_price DECIMAL;
BEGIN
    SELECT 
        base_price_usd,
        COALESCE((currency_multipliers->p_currency)::decimal, 1.0)
    INTO base_price, multiplier
    FROM public.subscription_plans
    WHERE id = p_plan_id;

    final_price := base_price * multiplier;
    
    RETURN ROUND(final_price, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_program ENABLE ROW LEVEL SECURITY;

-- Public can view active plans
CREATE POLICY "Anyone can view active public plans"
    ON public.subscription_plans FOR SELECT
    USING (is_active = true AND is_public = true);

-- Users can view their own subscription data
CREATE POLICY "Users can view their own subscription"
    ON public.user_subscriptions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own transactions"
    ON public.billing_transactions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own referrals"
    ON public.referral_program FOR SELECT
    USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

-- =============================================
-- SAMPLE DATA
-- =============================================

INSERT INTO public.subscription_plans (
    plan_name, plan_code, plan_tier, base_price_usd, billing_interval,
    max_yachts, max_users, max_storage_gb, max_api_calls_monthly, max_ai_interactions_monthly,
    features_included, plan_description, marketing_highlights
) VALUES 
(
    'YachtExcel Free', 'free', 'free', 0, 'monthly',
    1, 1, 5, 100, 50,
    '{"yachtie_ai": true, "basic_maintenance": true, "expense_tracking": true}'::jsonb,
    'Perfect for individual yacht owners to get started',
    ARRAY['1 yacht', 'Basic AI assistant', 'Expense tracking', '5GB storage']
),
(
    'YachtExcel Basic', 'basic_monthly', 'basic', 29.99, 'monthly',
    3, 3, 25, 1000, 500,
    '{"yachtie_ai": true, "basic_maintenance": true, "expense_tracking": true, "inventory_management": true, "safety_monitoring": true}'::jsonb,
    'Enhanced features for serious yacht owners',
    ARRAY['3 yachts', 'Safety monitoring', 'Inventory management', '25GB storage']
),
(
    'YachtExcel Professional', 'pro_monthly', 'professional', 99.99, 'monthly',
    10, 10, 100, 5000, 2000,
    '{"yachtie_ai": true, "basic_maintenance": true, "expense_tracking": true, "inventory_management": true, "safety_monitoring": true, "weather_routing": true, "nmea_integration": true, "multi_llm_consensus": true, "predictive_maintenance": true}'::jsonb,
    'Complete yacht management for professionals',
    ARRAY['10 yachts', 'Weather routing', 'NMEA integration', 'Predictive maintenance']
),
(
    'YachtExcel Enterprise', 'enterprise_monthly', 'enterprise', 299.99, 'monthly',
    -1, -1, 500, 25000, 10000,
    '{"yachtie_ai": true, "basic_maintenance": true, "expense_tracking": true, "inventory_management": true, "safety_monitoring": true, "weather_routing": true, "nmea_integration": true, "multi_llm_consensus": true, "predictive_maintenance": true, "ar_troubleshooting": true, "advanced_analytics": true, "api_access": true, "priority_support": true}'::jsonb,
    'Enterprise-grade yacht fleet management',
    ARRAY['Unlimited yachts', 'AR troubleshooting', 'Advanced analytics', 'API access', 'Priority support']
);

-- Create indexes
CREATE INDEX idx_subscription_plans_tier ON public.subscription_plans (plan_tier);
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions (user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions (subscription_status);
CREATE INDEX idx_billing_transactions_user ON public.billing_transactions (user_id);
CREATE INDEX idx_referral_program_code ON public.referral_program (referral_code);

COMMENT ON TABLE public.subscription_plans IS 'Subscription plans with multi-currency pricing and feature flags';
COMMENT ON TABLE public.user_subscriptions IS 'User subscription status and billing information';
COMMENT ON TABLE public.billing_transactions IS 'Transaction history and payment tracking';
COMMENT ON TABLE public.referral_program IS 'Referral system for user acquisition';