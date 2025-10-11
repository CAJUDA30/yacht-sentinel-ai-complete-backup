import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  action: 'create_customer' | 'create_subscription' | 'update_subscription' | 'cancel_subscription' | 
          'create_payment_method' | 'get_plans' | 'calculate_price' | 'process_webhook' | 'create_checkout';
  user_id?: string;
  plan_id?: string;
  currency?: string;
  payment_method_id?: string;
  customer_info?: any;
  billing_details?: any;
  data?: any;
}

interface PaymentResponse {
  success: boolean;
  customer_id?: string;
  subscription_id?: string;
  payment_intent_id?: string;
  client_secret?: string;
  price?: number;
  plans?: any[];
  checkout_url?: string;
  error?: string;
}

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: PaymentRequest = await req.json();
    console.log(`💳 Payment operation: ${request.action}`);

    let result: PaymentResponse;

    switch (request.action) {
      case 'create_customer':
        result = await createStripeCustomer(request);
        break;
      case 'create_subscription':
        result = await createSubscription(request);
        break;
      case 'update_subscription':
        result = await updateSubscription(request);
        break;
      case 'cancel_subscription':
        result = await cancelSubscription(request);
        break;
      case 'create_payment_method':
        result = await createPaymentMethod(request);
        break;
      case 'get_plans':
        result = await getSubscriptionPlans(request);
        break;
      case 'calculate_price':
        result = await calculatePrice(request);
        break;
      case 'create_checkout':
        result = await createCheckoutSession(request);
        break;
      case 'process_webhook':
        result = await processWebhook(request);
        break;
      default:
        throw new Error(`Unsupported payment action: ${request.action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💳 Payment operation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Payment operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createStripeCustomer(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id, customer_info } = request;

  if (!user_id) {
    throw new Error('User ID is required');
  }

  console.log(`🆕 Creating Stripe customer for user: ${user_id}`);

  // Get user details
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
  if (userError) throw userError;

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user.user?.email,
    name: customer_info?.name || user.user?.user_metadata?.full_name,
    metadata: {
      user_id: user_id,
      source: 'yachtexcel'
    },
    address: customer_info?.address,
    phone: customer_info?.phone,
    preferred_locales: [customer_info?.locale || 'en']
  });

  console.log(`✅ Created Stripe customer: ${customer.id}`);

  return {
    success: true,
    customer_id: customer.id
  };
}

async function createSubscription(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id, plan_id, currency = 'USD', payment_method_id } = request;

  if (!user_id || !plan_id) {
    throw new Error('User ID and plan ID are required');
  }

  console.log(`📝 Creating subscription for user ${user_id} with plan ${plan_id}`);

  // Get subscription plan
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single();

  if (planError) throw planError;

  // Get or create Stripe customer
  let { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user_id)
    .single();

  let customerId = existingSubscription?.stripe_customer_id;

  if (!customerId) {
    const customerResult = await createStripeCustomer({ user_id });
    customerId = customerResult.customer_id;
  }

  // Calculate price in requested currency
  const price = await calculatePriceInCurrency(plan, currency);

  // Create or get Stripe price
  const stripePrice = await getOrCreateStripePrice(plan, currency, price);

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: stripePrice.id }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    trial_period_days: plan.trial_period_days || undefined,
    metadata: {
      user_id: user_id,
      plan_id: plan_id,
      currency: currency
    }
  });

  // Store subscription in database
  await storeSubscriptionInDB(user_id, plan_id, subscription, currency, price);

  const paymentIntent = subscription.latest_invoice?.payment_intent;

  return {
    success: true,
    subscription_id: subscription.id,
    client_secret: paymentIntent?.client_secret,
    payment_intent_id: paymentIntent?.id
  };
}

async function updateSubscription(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id, plan_id } = request;

  if (!user_id || !plan_id) {
    throw new Error('User ID and plan ID are required');
  }

  console.log(`🔄 Updating subscription for user ${user_id} to plan ${plan_id}`);

  // Get current subscription
  const { data: currentSub, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', user_id)
    .eq('subscription_status', 'active')
    .single();

  if (subError) throw subError;

  // Get new plan
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single();

  if (planError) throw planError;

  // Update Stripe subscription
  const updatedSubscription = await stripe.subscriptions.update(
    currentSub.stripe_subscription_id,
    {
      items: [{
        id: currentSub.stripe_subscription_id,
        price: newPlan.stripe_price_id
      }],
      proration_behavior: 'create_prorations'
    }
  );

  // Update database
  await supabase
    .from('user_subscriptions')
    .update({
      plan_id: plan_id,
      billing_amount: newPlan.base_price_usd,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id);

  return {
    success: true,
    subscription_id: updatedSubscription.id
  };
}

async function cancelSubscription(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id } = request;

  if (!user_id) {
    throw new Error('User ID is required');
  }

  console.log(`❌ Canceling subscription for user ${user_id}`);

  // Get current subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', user_id)
    .eq('subscription_status', 'active')
    .single();

  if (error) throw error;

  // Cancel in Stripe
  await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

  // Update database
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user_id);

  return {
    success: true
  };
}

async function createPaymentMethod(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id, payment_method_id } = request;

  if (!user_id || !payment_method_id) {
    throw new Error('User ID and payment method ID are required');
  }

  // Get customer ID
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user_id)
    .single();

  if (!subscription?.stripe_customer_id) {
    throw new Error('Customer not found');
  }

  // Attach payment method to customer
  await stripe.paymentMethods.attach(payment_method_id, {
    customer: subscription.stripe_customer_id
  });

  return {
    success: true,
    payment_method_id
  };
}

async function getSubscriptionPlans(request: PaymentRequest): Promise<PaymentResponse> {
  const { currency = 'USD' } = request;

  console.log(`📋 Getting subscription plans for currency: ${currency}`);

  const { data: plans, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .eq('is_public', true)
    .order('base_price_usd', { ascending: true });

  if (error) throw error;

  // Calculate prices in requested currency
  const plansWithPrices = plans.map(plan => ({
    ...plan,
    price_in_currency: calculatePriceInCurrency(plan, currency),
    currency: currency
  }));

  return {
    success: true,
    plans: plansWithPrices
  };
}

async function calculatePrice(request: PaymentRequest): Promise<PaymentResponse> {
  const { plan_id, currency = 'USD' } = request;

  if (!plan_id) {
    throw new Error('Plan ID is required');
  }

  const { data: plan, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single();

  if (error) throw error;

  const price = calculatePriceInCurrency(plan, currency);

  return {
    success: true,
    price,
    currency
  };
}

async function createCheckoutSession(request: PaymentRequest): Promise<PaymentResponse> {
  const { user_id, plan_id, currency = 'USD' } = request;

  if (!user_id || !plan_id) {
    throw new Error('User ID and plan ID are required');
  }

  console.log(`🛒 Creating checkout session for user ${user_id}`);

  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .single();

  if (planError) throw planError;

  // Get user details
  const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
  if (userError) throw userError;

  // Calculate price and get Stripe price object
  const price = calculatePriceInCurrency(plan, currency);
  const stripePrice = await getOrCreateStripePrice(plan, currency, price);

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.user?.email,
    line_items: [{
      price: stripePrice.id,
      quantity: 1
    }],
    success_url: `${Deno.env.get('FRONTEND_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('FRONTEND_URL')}/subscription/plans`,
    metadata: {
      user_id: user_id,
      plan_id: plan_id,
      currency: currency
    },
    subscription_data: {
      trial_period_days: plan.trial_period_days || undefined,
      metadata: {
        user_id: user_id,
        plan_id: plan_id
      }
    }
  });

  return {
    success: true,
    checkout_url: session.url!
  };
}

async function processWebhook(request: PaymentRequest): Promise<PaymentResponse> {
  const { data } = request;
  const event = data;

  console.log(`🔔 Processing webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
}

// Helper functions

function calculatePriceInCurrency(plan: any, currency: string): number {
  if (currency === 'USD') {
    return plan.base_price_usd;
  }

  const multiplier = plan.currency_multipliers?.[currency] || 1;
  return Math.round(plan.base_price_usd * multiplier * 100) / 100;
}

async function getOrCreateStripePrice(plan: any, currency: string, amount: number) {
  // Check if price already exists
  const prices = await stripe.prices.list({
    product: plan.stripe_product_id,
    currency: currency.toLowerCase(),
    active: true,
    limit: 1
  });

  if (prices.data.length > 0) {
    return prices.data[0];
  }

  // Create new price
  return await stripe.prices.create({
    product: plan.stripe_product_id,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    recurring: {
      interval: plan.billing_interval
    },
    metadata: {
      plan_id: plan.id,
      currency: currency
    }
  });
}

async function storeSubscriptionInDB(userId: string, planId: string, subscription: any, currency: string, amount: number) {
  const subscriptionData = {
    user_id: userId,
    plan_id: planId,
    subscription_status: subscription.trial_end ? 'trial' : 'active',
    billing_currency: currency,
    billing_amount: amount,
    billing_interval: subscription.items.data[0].price.recurring.interval,
    subscription_start: new Date(subscription.start_date * 1000).toISOString().split('T')[0],
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    next_billing_date: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString().split('T')[0] : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString().split('T')[0] : null
  };

  await supabase
    .from('user_subscriptions')
    .upsert(subscriptionData, { onConflict: 'user_id' });
}

async function handleSubscriptionUpdate(subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString().split('T')[0],
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionCancellation(subscription: any) {
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSuccess(invoice: any) {
  const subscriptionId = invoice.subscription;
  const amount = invoice.amount_paid / 100; // Convert from cents

  // Create billing transaction record
  await supabase
    .from('billing_transactions')
    .insert({
      subscription_id: subscriptionId,
      transaction_type: 'subscription_charge',
      transaction_status: 'succeeded',
      amount: amount,
      currency: invoice.currency.toUpperCase(),
      processor_transaction_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      billing_period_start: new Date(invoice.period_start * 1000).toISOString().split('T')[0],
      billing_period_end: new Date(invoice.period_end * 1000).toISOString().split('T')[0],
      processed_at: new Date().toISOString()
    });
}

async function handlePaymentFailure(invoice: any) {
  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', invoice.subscription);

  // Create failed transaction record
  await supabase
    .from('billing_transactions')
    .insert({
      subscription_id: invoice.subscription,
      transaction_type: 'subscription_charge',
      transaction_status: 'failed',
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      stripe_invoice_id: invoice.id,
      processed_at: new Date().toISOString()
    });
}