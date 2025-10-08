import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CreditCard,
  Crown,
  Star,
  Users,
  Database,
  Zap,
  Brain,
  Gift,
  Link,
  Check,
  X,
  ArrowUp,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useSubscription,
  useSubscriptionPlans,
  useBillingHistory,
  useFeatureAccess,
  useReferralSystem,
  useSubscriptionFormatting,
  SubscriptionPlan
} from '@/hooks/useSubscription';

interface SubscriptionDashboardProps {
  showPlansOnly?: boolean;
}

const SubscriptionDashboard: React.FC<SubscriptionDashboardProps> = ({ showPlansOnly = false }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const { toast } = useToast();

  // Subscription hooks
  const subscription = useSubscription();
  const subscriptionPlans = useSubscriptionPlans(selectedCurrency);
  const billingHistory = useBillingHistory();
  const featureAccess = useFeatureAccess();
  const referralSystem = useReferralSystem();
  const formatting = useSubscriptionFormatting();

  const handleUpgrade = async (planId: string) => {
    try {
      if (subscription.subscription?.plan?.plan_tier === 'free') {
        // For free users, use checkout
        const checkoutUrl = await subscription.createCheckoutSession(planId, selectedCurrency);
        window.open(checkoutUrl, '_blank');
      } else {
        // For existing subscribers, update subscription
        await subscription.updateSubscription(planId);
      }
      setUpgradeDialogOpen(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  if (showPlansOnly) {
    return <PricingSection 
      plans={subscriptionPlans.plans}
      currentPlan={subscription.subscription?.plan}
      onSelectPlan={handleUpgrade}
      currency={selectedCurrency}
      onCurrencyChange={setSelectedCurrency}
      formatPrice={formatting.formatPrice}
    />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subscription Center</h2>
          <p className="text-muted-foreground">
            Manage your YachtExcel subscription and billing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
          </select>
          
          <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUp className="h-4 w-4 mr-2" />
                {subscription.subscription?.plan?.plan_tier === 'free' ? 'Upgrade Plan' : 'Change Plan'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Choose Your Plan</DialogTitle>
              </DialogHeader>
              <PricingSection 
                plans={subscriptionPlans.plans}
                currentPlan={subscription.subscription?.plan}
                onSelectPlan={handleUpgrade}
                currency={selectedCurrency}
                formatPrice={formatting.formatPrice}
                compact={true}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {subscription.subscription && (
        <SubscriptionStatusAlert subscription={subscription.subscription} />
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CurrentPlanCard 
              subscription={subscription.subscription}
              featureAccess={featureAccess}
              formatPrice={formatting.formatPrice}
            />
            <QuickStatsCard subscription={subscription.subscription} />
          </div>
          
          <FeatureComparisonCard 
            plans={subscriptionPlans.plans}
            currentPlan={subscription.subscription?.plan}
          />
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <UsageOverviewCard 
            usageInfo={featureAccess.getUsageInfo()}
            formatUsage={formatting.formatUsage}
            getUsageColor={formatting.getUsageColor}
          />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <BillingOverviewCard 
            subscription={subscription.subscription}
            transactions={billingHistory.transactions}
            formatPrice={formatting.formatPrice}
          />
          <BillingHistoryTable 
            transactions={billingHistory.transactions}
            formatPrice={formatting.formatPrice}
          />
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <ReferralDashboard 
            referralSystem={referralSystem}
            formatPrice={formatting.formatPrice}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Subscription Status Alert Component
const SubscriptionStatusAlert: React.FC<{ subscription: any }> = ({ subscription }) => {
  const getAlertProps = () => {
    switch (subscription.subscription_status) {
      case 'trial':
        return {
          variant: 'default',
          title: 'Trial Period Active',
          description: `Your trial ends on ${new Date(subscription.trial_end).toLocaleDateString()}`,
          icon: Calendar
        };
      case 'past_due':
        return {
          variant: 'destructive',
          title: 'Payment Past Due',
          description: 'Please update your payment method to continue service',
          icon: CreditCard
        };
      case 'canceled':
        return {
          variant: 'destructive',
          title: 'Subscription Canceled',
          description: 'Your subscription has been canceled and will end soon',
          icon: X
        };
      default:
        return null;
    }
  };

  const alertProps = getAlertProps();
  if (!alertProps) return null;

  const { variant, title, description, icon: Icon } = alertProps;

  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
};

// Current Plan Card Component
const CurrentPlanCard: React.FC<{
  subscription: any;
  featureAccess: any;
  formatPrice: (amount: number, currency: string) => string;
}> = ({ subscription, featureAccess, formatPrice }) => {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            No Active Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You're currently using the free tier. Upgrade to unlock premium features.
          </p>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription.plan;
  const tierColors = {
    free: 'text-gray-500',
    basic: 'text-blue-500',
    professional: 'text-purple-500',
    enterprise: 'text-gold-500',
    fleet: 'text-red-500'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${tierColors[plan?.plan_tier] || 'text-gray-500'}`} />
          {plan?.plan_name}
        </CardTitle>
        <CardDescription>
          {formatPrice(subscription.billing_amount, subscription.billing_currency)} / {subscription.billing_interval}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status</span>
            <Badge variant={subscription.subscription_status === 'active' ? 'default' : 'secondary'}>
              {subscription.subscription_status}
            </Badge>
          </div>
          
          {subscription.next_billing_date && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Next Billing</span>
              <span className="text-sm font-medium">
                {new Date(subscription.next_billing_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Plan Tier</span>
            <span className={`text-sm font-medium capitalize ${tierColors[plan?.plan_tier] || 'text-gray-500'}`}>
              {plan?.plan_tier}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Stats Card Component
const QuickStatsCard: React.FC<{ subscription: any }> = ({ subscription }) => {
  const usage = subscription?.current_usage;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{usage?.yachts_count || 0}</div>
            <div className="text-sm text-muted-foreground">Yachts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{usage?.users_count || 1}</div>
            <div className="text-sm text-muted-foreground">Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{usage?.storage_used_gb?.toFixed(1) || '0.0'}GB</div>
            <div className="text-sm text-muted-foreground">Storage</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{usage?.api_calls_this_month || 0}</div>
            <div className="text-sm text-muted-foreground">API Calls</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Usage Overview Card Component
const UsageOverviewCard: React.FC<{
  usageInfo: any;
  formatUsage: (used: number, limit: number | string) => string;
  getUsageColor: (percentage: number) => string;
}> = ({ usageInfo, formatUsage, getUsageColor }) => {
  if (!usageInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No usage data available</p>
        </CardContent>
      </Card>
    );
  }

  const usageItems = [
    { key: 'yachts', label: 'Yachts', icon: Crown, ...usageInfo.yachts },
    { key: 'users', label: 'Users', icon: Users, ...usageInfo.users },
    { key: 'storage', label: 'Storage', icon: Database, ...usageInfo.storage },
    { key: 'apiCalls', label: 'API Calls', icon: Zap, ...usageInfo.apiCalls },
    { key: 'aiInteractions', label: 'AI Interactions', icon: Brain, ...usageInfo.aiInteractions }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>Current month usage against plan limits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usageItems.map((item) => (
            <div key={item.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className={`text-sm font-medium ${getUsageColor(item.percentage)}`}>
                  {formatUsage(item.used, item.limit)}
                </span>
              </div>
              {typeof item.percentage === 'number' && (
                <Progress value={Math.min(item.percentage, 100)} className="h-2" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Simplified components for space (full implementations would continue...)
const PricingSection: React.FC<any> = ({ plans, currentPlan, onSelectPlan, currency, formatPrice, compact = false }) => (
  <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'md:grid-cols-4'}`}>
    {plans.map((plan: SubscriptionPlan) => (
      <Card key={plan.id} className={currentPlan?.id === plan.id ? 'border-primary' : ''}>
        <CardHeader>
          <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
          <CardDescription>
            {formatPrice(plan.price_in_currency || plan.base_price_usd, currency)}
            <span className="text-sm">/{plan.billing_interval}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {plan.marketing_highlights.slice(0, 4).map((highlight, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                {highlight}
              </li>
            ))}
          </ul>
          <Button 
            className="w-full mt-4" 
            onClick={() => onSelectPlan(plan.id)}
            disabled={currentPlan?.id === plan.id}
          >
            {currentPlan?.id === plan.id ? 'Current Plan' : 'Select Plan'}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
);

const FeatureComparisonCard: React.FC<any> = ({ plans, currentPlan }) => (
  <Card>
    <CardHeader>
      <CardTitle>Feature Comparison</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Feature comparison table would go here</p>
    </CardContent>
  </Card>
);

const BillingOverviewCard: React.FC<any> = ({ subscription, transactions, formatPrice }) => (
  <Card>
    <CardHeader>
      <CardTitle>Billing Overview</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Billing overview details would go here</p>
    </CardContent>
  </Card>
);

const BillingHistoryTable: React.FC<any> = ({ transactions, formatPrice }) => (
  <Card>
    <CardHeader>
      <CardTitle>Billing History</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Billing history table would go here</p>
    </CardContent>
  </Card>
);

const ReferralDashboard: React.FC<any> = ({ referralSystem, formatPrice }) => (
  <Card>
    <CardHeader>
      <CardTitle>Referral Program</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Referral program interface would go here</p>
    </CardContent>
  </Card>
);

export default SubscriptionDashboard;