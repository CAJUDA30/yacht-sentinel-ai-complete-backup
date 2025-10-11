import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionPlan {
  id: string;
  plan_name: string;
  plan_code: string;
  plan_tier: 'free' | 'basic' | 'professional' | 'enterprise' | 'fleet';
  base_price_usd: number;
  billing_interval: 'monthly' | 'yearly';
  trial_period_days: number;
  max_yachts: number;
  max_users: number;
  max_storage_gb: number;
  max_api_calls_monthly: number;
  max_ai_interactions_monthly: number;
  features_included: Record<string, boolean>;
  plan_description: string;
  marketing_highlights: string[];
  price_in_currency?: number;
  currency?: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  subscription_status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'expired';
  billing_currency: string;
  billing_amount: number;
  billing_interval: string;
  trial_start?: string;
  trial_end?: string;
  subscription_start: string;
  current_period_start: string;
  current_period_end: string;
  next_billing_date?: string;
  current_usage: {
    yachts_count: number;
    users_count: number;
    storage_used_gb: number;
    api_calls_this_month: number;
    ai_interactions_this_month: number;
  };
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan?: SubscriptionPlan;
}

export interface BillingTransaction {
  id: string;
  transaction_type: string;
  transaction_status: string;
  amount: number;
  currency: string;
  billing_period_start?: string;
  billing_period_end?: string;
  processed_at?: string;
  created_at: string;
}

// Main subscription management hook
export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callPaymentAPI = useCallback(async (action: string, data?: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action,
          ...data
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Payment ${action} error:`, error);
      toast({
        title: "Payment Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const loadUserSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userSub, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      setSubscription(userSub);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubscription = useCallback(async (
    planId: string, 
    currency = 'USD', 
    paymentMethodId?: string
  ) => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const result = await callPaymentAPI('create_subscription', {
        user_id: user.data.user.id,
        plan_id: planId,
        currency,
        payment_method_id: paymentMethodId
      });

      if (result.client_secret) {
        // Return client secret for frontend payment confirmation
        return {
          client_secret: result.client_secret,
          subscription_id: result.subscription_id
        };
      }

      // Reload subscription data
      await loadUserSubscription();

      toast({
        title: "Subscription Created",
        description: "Your subscription has been set up successfully",
      });

      return result;
    } finally {
      setLoading(false);
    }
  }, [callPaymentAPI, loadUserSubscription, toast]);

  const updateSubscription = useCallback(async (newPlanId: string) => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      await callPaymentAPI('update_subscription', {
        user_id: user.data.user.id,
        plan_id: newPlanId
      });

      await loadUserSubscription();

      toast({
        title: "Subscription Updated",
        description: "Your subscription plan has been changed",
      });
    } finally {
      setLoading(false);
    }
  }, [callPaymentAPI, loadUserSubscription, toast]);

  const cancelSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      await callPaymentAPI('cancel_subscription', {
        user_id: user.data.user.id
      });

      await loadUserSubscription();

      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled",
      });
    } finally {
      setLoading(false);
    }
  }, [callPaymentAPI, loadUserSubscription, toast]);

  const createCheckoutSession = useCallback(async (planId: string, currency = 'USD') => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const result = await callPaymentAPI('create_checkout', {
        user_id: user.data.user.id,
        plan_id: planId,
        currency
      });

      return result.checkout_url;
    } finally {
      setLoading(false);
    }
  }, [callPaymentAPI]);

  useEffect(() => {
    loadUserSubscription();
  }, [loadUserSubscription]);

  return {
    subscription,
    loading,
    loadUserSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    createCheckoutSession
  };
}

// Subscription plans hook
export function useSubscriptionPlans(currency = 'USD') {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'get_plans',
          currency
        }
      });

      if (error) throw error;
      setPlans(result.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currency, toast]);

  const calculatePrice = useCallback(async (planId: string, targetCurrency: string) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('stripe-payment', {
        body: {
          action: 'calculate_price',
          plan_id: planId,
          currency: targetCurrency
        }
      });

      if (error) throw error;
      return result.price;
    } catch (error) {
      console.error('Failed to calculate price:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    plans,
    loading,
    loadPlans,
    calculatePrice
  };
}

// Billing history hook
export function useBillingHistory() {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = useCallback(async (limit = 20) => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('billing_transactions')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to load billing history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    loadTransactions
  };
}

// Feature access hook
export function useFeatureAccess() {
  const { subscription } = useSubscription();

  const hasFeature = useCallback((featureName: string): boolean => {
    if (!subscription?.plan) return false;
    return subscription.plan.features_included[featureName] === true;
  }, [subscription]);

  const getUsageInfo = useCallback(() => {
    if (!subscription) return null;

    const plan = subscription.plan;
    const usage = subscription.current_usage;

    return {
      yachts: {
        used: usage.yachts_count,
        limit: plan?.max_yachts === -1 ? 'Unlimited' : plan?.max_yachts,
        percentage: plan?.max_yachts === -1 ? 0 : (usage.yachts_count / (plan?.max_yachts || 1)) * 100
      },
      users: {
        used: usage.users_count,
        limit: plan?.max_users === -1 ? 'Unlimited' : plan?.max_users,
        percentage: plan?.max_users === -1 ? 0 : (usage.users_count / (plan?.max_users || 1)) * 100
      },
      storage: {
        used: usage.storage_used_gb,
        limit: plan?.max_storage_gb === -1 ? 'Unlimited' : `${plan?.max_storage_gb}GB`,
        percentage: plan?.max_storage_gb === -1 ? 0 : (usage.storage_used_gb / (plan?.max_storage_gb || 1)) * 100
      },
      apiCalls: {
        used: usage.api_calls_this_month,
        limit: plan?.max_api_calls_monthly === -1 ? 'Unlimited' : plan?.max_api_calls_monthly,
        percentage: plan?.max_api_calls_monthly === -1 ? 0 : (usage.api_calls_this_month / (plan?.max_api_calls_monthly || 1)) * 100
      },
      aiInteractions: {
        used: usage.ai_interactions_this_month,
        limit: plan?.max_ai_interactions_monthly === -1 ? 'Unlimited' : plan?.max_ai_interactions_monthly,
        percentage: plan?.max_ai_interactions_monthly === -1 ? 0 : (usage.ai_interactions_this_month / (plan?.max_ai_interactions_monthly || 1)) * 100
      }
    };
  }, [subscription]);

  const isUsageLimitReached = useCallback((feature: string): boolean => {
    const usageInfo = getUsageInfo();
    if (!usageInfo) return false;

    const featureUsage = usageInfo[feature as keyof typeof usageInfo];
    return featureUsage && typeof featureUsage.percentage === 'number' && featureUsage.percentage >= 100;
  }, [getUsageInfo]);

  return {
    hasFeature,
    getUsageInfo,
    isUsageLimitReached,
    subscription,
    isActive: subscription?.subscription_status === 'active',
    isTrial: subscription?.subscription_status === 'trial',
    isPastDue: subscription?.subscription_status === 'past_due'
  };
}

// Referral system hook
export function useReferralSystem() {
  const [referralCode, setReferralCode] = useState<string>('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReferralCode = useCallback(async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      // Generate unique referral code
      const code = `REF_${user.data.user.id.slice(0, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase
        .from('referral_program')
        .insert({
          referrer_user_id: user.data.user.id,
          referral_code: code,
          referral_status: 'pending',
          referrer_reward_type: 'free_months',
          referrer_reward_amount: 1,
          referred_reward_type: 'free_months',
          referred_reward_amount: 1
        });

      if (error) throw error;

      setReferralCode(code);

      toast({
        title: "Referral Code Generated",
        description: "Your referral code has been created",
      });
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      toast({
        title: "Error",
        description: "Failed to generate referral code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadReferralData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('referral_program')
        .select('*')
        .eq('referrer_user_id', user.data.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);
      
      // Set the most recent active referral code
      const activeReferral = data?.find(r => r.referral_status === 'pending');
      if (activeReferral) {
        setReferralCode(activeReferral.referral_code);
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getReferralStats = useCallback(() => {
    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter(r => r.referral_status === 'converted').length;
    const pendingRewards = referrals.filter(r => !r.referrer_reward_applied).length;

    return {
      totalReferrals,
      convertedReferrals,
      pendingRewards,
      conversionRate: totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0
    };
  }, [referrals]);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  return {
    referralCode,
    referrals,
    loading,
    generateReferralCode,
    loadReferralData,
    getReferralStats
  };
}

// Currency formatting utility
export function useSubscriptionFormatting() {
  const formatPrice = useCallback((amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatUsage = useCallback((used: number, limit: number | string) => {
    if (limit === 'Unlimited' || limit === -1) {
      return `${used} / Unlimited`;
    }
    return `${used} / ${limit}`;
  }, []);

  const getUsageColor = useCallback((percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  }, []);

  return {
    formatPrice,
    formatUsage,
    getUsageColor
  };
}