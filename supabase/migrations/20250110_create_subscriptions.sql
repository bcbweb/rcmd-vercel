-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'free', 'pro', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER, -- Price in cents
  price_yearly INTEGER, -- Price in cents
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
  max_profiles INTEGER DEFAULT 1,
  max_rcmds INTEGER DEFAULT 10,
  max_collections INTEGER DEFAULT 5,
  max_custom_pages INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing', etc.
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auth_user_id) -- One active subscription per user
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_auth_user_id ON public.user_subscriptions(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Insert default plans
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, max_profiles, max_rcmds, max_collections, max_custom_pages, features) VALUES
  (
    'free',
    'Free',
    'Perfect for getting started',
    0,
    0,
    1,
    10,
    3,
    1,
    '["Basic profile", "10 RCMDs", "3 Collections", "1 Custom Page", "Social media links"]'::jsonb
  ),
  (
    'pro',
    'Pro',
    'For creators and businesses',
    999, -- $9.99/month
    9999, -- $99.99/year
    5,
    100,
    20,
    10,
    '["Unlimited profiles", "100 RCMDs", "20 Collections", "10 Custom Pages", "Priority support", "Advanced analytics", "Custom domains"]'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Function to get user's current plan
CREATE OR REPLACE FUNCTION public.get_user_plan(p_auth_user_id UUID)
RETURNS TABLE (
  plan_name TEXT,
  plan_id UUID,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  max_profiles INTEGER,
  max_rcmds INTEGER,
  max_collections INTEGER,
  max_custom_pages INTEGER,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.name,
    sp.id,
    COALESCE(us.status, 'active') as status,
    us.current_period_end,
    sp.max_profiles,
    sp.max_rcmds,
    sp.max_collections,
    sp.max_custom_pages,
    sp.features
  FROM subscription_plans sp
  LEFT JOIN user_subscriptions us ON us.plan_id = sp.id AND us.auth_user_id = p_auth_user_id AND us.status IN ('active', 'trialing')
  WHERE sp.name = 'free'
  ORDER BY 
    CASE WHEN us.status IN ('active', 'trialing') THEN 0 ELSE 1 END,
    sp.name
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_plan TO authenticated;
COMMENT ON FUNCTION public.get_user_plan IS 'Gets the current active plan for a user, defaulting to free if no paid subscription exists';
