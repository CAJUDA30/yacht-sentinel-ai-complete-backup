import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3,
  Shield,
  Palette,
  CreditCard,
  Plus,
  Edit,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { enterpriseScalabilityService } from '@/services/EnterpriseScalabilityService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantInfo {
  id: string;
  name: string;
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  users: number;
  maxUsers: number;
  yachts: number;
  maxYachts: number;
  usage: {
    storage: number;
    api_calls: number;
    ai_tokens: number;
  };
  customBranding?: {
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    domain?: string;
  };
  billing: {
    plan: string;
    monthlyRevenue: number;
    nextBilling: string;
    status: 'current' | 'overdue';
  };
  created_at: string;
}

export default function EnterpriseMultiTenantManager() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scalabilityMetrics, setScalabilityMetrics] = useState<any>(null);

  useEffect(() => {
    loadTenantData();
    loadScalabilityMetrics();
  }, []);

  const loadTenantData = async () => {
    setIsLoading(true);
    try {
      // Fetch real tenant data from user subscriptions and plans
      const { data: subscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*),
          profiles!user_subscriptions_user_id_fkey(
            full_name,
            organization
          )
        `)
        .in('subscription_status', ['active', 'trial']);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
        toast({
          title: "Error Loading Data",
          description: "Failed to load tenant subscription data.",
          variant: "destructive"
        });
        setTenants([]);
        return;
      }

      // Get yacht counts per user
      const { data: yachtCounts, error: yachtError } = await supabase
        .from('yacht_access_control')
        .select('user_id')
        .eq('is_active', true)
        .in('access_level', ['owner', 'manager']);

      if (yachtError) {
        console.warn('Error fetching yacht counts:', yachtError);
      }

      // Count yachts per user
      const yachtsByUser = yachtCounts?.reduce((acc, item) => {
        acc[item.user_id] = (acc[item.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get API usage analytics for current month
      const { data: apiUsage, error: apiError } = await supabase
        .from('api_usage_analytics')
        .select('yacht_id, total_calls, total_cost')
        .gte('usage_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

      if (apiError) {
        console.warn('Error fetching API usage:', apiError);
      }

      // Transform subscription data to tenant format
      const tenantData: TenantInfo[] = subscriptions?.map((sub) => {
        const plan = sub.subscription_plans;
        const usage = sub.current_usage || {};
        const userYachtCount = yachtsByUser[sub.user_id] || 0;
        
        return {
          id: sub.id,
          name: sub.profiles?.organization || sub.profiles?.full_name || `Tenant ${sub.id.slice(0, 8)}`,
          plan: plan?.plan_tier || 'basic',
          status: sub.subscription_status === 'active' ? 'active' : 
                  sub.subscription_status === 'trial' ? 'trial' : 'suspended',
          users: usage.users_count || 1,
          maxUsers: plan?.max_users || 1,
          yachts: userYachtCount,
          maxYachts: plan?.max_yachts || 1,
          usage: {
            storage: Math.min(100, Math.round(((usage.storage_used_gb || 0) / (plan?.max_storage_gb || 5)) * 100)),
            api_calls: usage.api_calls_this_month || 0,
            ai_tokens: usage.ai_interactions_this_month || 0
          },
          customBranding: {
            logo: '/yacht-logo.png',
            primaryColor: '#0066cc',
            secondaryColor: '#004d99',
            domain: sub.profiles?.organization ? 
              `${sub.profiles.organization.toLowerCase().replace(/\s+/g, '-')}.yachtexcel.com` : 
              undefined
          },
          billing: {
            plan: plan?.plan_name || 'Unknown',
            monthlyRevenue: Number(sub.billing_amount) || 0,
            nextBilling: sub.next_billing_date || 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: sub.subscription_status === 'active' ? 'current' : 'overdue'
          },
          created_at: sub.created_at.split('T')[0]
        };
      }) || [];

      setTenants(tenantData);
      if (tenantData.length > 0) {
        setSelectedTenant(tenantData[0]);
      }
      
      console.log(`Loaded ${tenantData.length} tenants from database`);
    } catch (error) {
      console.error('Failed to load tenant data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load tenant information.",
        variant: "destructive"
      });
      setTenants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadScalabilityMetrics = async () => {
    try {
      const metrics = await enterpriseScalabilityService.getScalabilityMetrics();
      setScalabilityMetrics(metrics);
    } catch (error) {
      console.error('Failed to load scalability metrics:', error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'premium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading tenant data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Multi-Tenant Management</h2>
          <p className="text-muted-foreground">Enterprise tenant administration and resource management</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Tenant
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{tenants.reduce((sum, t) => sum + t.users, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${tenants.reduce((sum, t) => sum + t.billing.monthlyRevenue, 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">System Load</p>
                <p className="text-2xl font-bold">{scalabilityMetrics?.currentLoad?.toFixed(1) || '0'}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="scalability">Scalability</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <Card key={tenant.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedTenant(tenant)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{tenant.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getPlanColor(tenant.plan)}>
                        {tenant.plan}
                      </Badge>
                      <Badge className={getStatusColor(tenant.status)}>
                        {tenant.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {tenant.users} users • {tenant.yachts} yachts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Capacity</span>
                      <span>{tenant.users}/{tenant.maxUsers}</span>
                    </div>
                    <Progress value={(tenant.users / tenant.maxUsers) * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Yacht Capacity</span>
                      <span>{tenant.yachts}/{tenant.maxYachts}</span>
                    </div>
                    <Progress value={(tenant.yachts / tenant.maxYachts) * 100} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      ${tenant.billing.monthlyRevenue}/month
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          {selectedTenant && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage - {selectedTenant.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Storage Usage</Label>
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{selectedTenant.usage.storage}%</span>
                    </div>
                    <Progress value={selectedTenant.usage.storage} className="h-3" />
                  </div>
                  <div className="space-y-2">
                    <Label>API Calls (Monthly)</Label>
                    <div className="text-2xl font-bold">{selectedTenant.usage.api_calls.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">calls this month</div>
                  </div>
                  <div className="space-y-2">
                    <Label>AI Tokens (Monthly)</Label>
                    <div className="text-2xl font-bold">{selectedTenant.usage.ai_tokens.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">tokens consumed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h3 className="font-semibold">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">{tenant.billing.plan} Plan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">${tenant.billing.monthlyRevenue}/month</p>
                        <p className="text-sm text-muted-foreground">Next: {tenant.billing.nextBilling}</p>
                      </div>
                      <Badge className={tenant.billing.status === 'current' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {tenant.billing.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scalability" className="space-y-4">
          {scalabilityMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Current Load</span>
                      <span>{scalabilityMetrics.currentLoad.toFixed(1)}%</span>
                    </div>
                    <Progress value={scalabilityMetrics.currentLoad} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Response Time</span>
                      <span>{scalabilityMetrics.responseTime.toFixed(0)}ms</span>
                    </div>
                    <Progress value={Math.min(scalabilityMetrics.responseTime / 10, 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Throughput</span>
                      <span>{scalabilityMetrics.throughput.toFixed(0)} req/s</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Error Rate</span>
                      <span>{scalabilityMetrics.errorRate.toFixed(2)}%</span>
                    </div>
                    <Progress value={scalabilityMetrics.errorRate * 10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Scalability Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scalabilityMetrics.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}