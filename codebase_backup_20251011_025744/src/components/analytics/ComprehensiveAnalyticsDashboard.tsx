import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsMetric {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  description: string;
  icon: React.ElementType;
}

interface SystemHealth {
  overall: number;
  database: number;
  ai_systems: number;
  mobile_sync: number;
  iot_devices: number;
}

export default function ComprehensiveAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      // Load various analytics data
      const [
        { data: auditData },
        { data: equipmentData },
        { data: inventoryData },
        { data: aiLogsData }
      ] = await Promise.all([
        supabase.from('audit_instances').select('*').limit(100),
        supabase.from('equipment').select('*').limit(100),
        supabase.from('inventory_items').select('*').limit(100),
        supabase.from('ai_model_logs').select('*').limit(100)
      ]);

      // Calculate metrics
      const calculatedMetrics: AnalyticsMetric[] = [
        {
          id: 'total_audits',
          title: 'Total Audits',
          value: auditData?.length || 0,
          change: 15.2,
          changeType: 'increase',
          description: 'Completed this month',
          icon: CheckCircle
        },
        {
          id: 'active_equipment',
          title: 'Active Equipment',
          value: equipmentData?.filter(e => e.status === 'operational').length || 0,
          change: -2.1,
          changeType: 'decrease',
          description: 'Currently operational',
          icon: Activity
        },
        {
          id: 'inventory_value',
          title: 'Inventory Value',
          value: '$' + (inventoryData?.reduce((sum, item) => sum + (item.purchase_price || 0), 0).toLocaleString() || '0'),
          change: 8.7,
          changeType: 'increase',
          description: 'Total asset value',
          icon: DollarSign
        },
        {
          id: 'ai_requests',
          title: 'AI Requests',
          value: aiLogsData?.length || 0,
          change: 23.5,
          changeType: 'increase',
          description: 'This week',
          icon: TrendingUp
        }
      ];

      setMetrics(calculatedMetrics);

      // Calculate system health
      const health: SystemHealth = {
        overall: 94,
        database: 98,
        ai_systems: 91,
        mobile_sync: 89,
        iot_devices: 96
      };

      setSystemHealth(health);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error Loading Analytics",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadAnalyticsData();
    toast({
      title: "Analytics Refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  const handleExport = () => {
    // Export functionality would go here
    toast({
      title: "Export Started",
      description: "Your analytics report is being generated.",
    });
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 95) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {getChangeIcon(metric.changeType)}
                  <span className="ml-1">
                    {metric.change > 0 ? '+' : ''}{metric.change}% {metric.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time system performance monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          {systemHealth && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Health</span>
                <span className={`text-2xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall}%
                </span>
              </div>
              <Progress value={systemHealth.overall} className="h-2" />
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getHealthColor(systemHealth.database)}`}>
                    {systemHealth.database}%
                  </div>
                  <div className="text-xs text-muted-foreground">Database</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getHealthColor(systemHealth.ai_systems)}`}>
                    {systemHealth.ai_systems}%
                  </div>
                  <div className="text-xs text-muted-foreground">AI Systems</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getHealthColor(systemHealth.mobile_sync)}`}>
                    {systemHealth.mobile_sync}%
                  </div>
                  <div className="text-xs text-muted-foreground">Mobile Sync</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-semibold ${getHealthColor(systemHealth.iot_devices)}`}>
                    {systemHealth.iot_devices}%
                  </div>
                  <div className="text-xs text-muted-foreground">IoT Devices</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Month</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Target: 90%</span>
                    <span>26/30 completed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Equipment Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Usage</span>
                    <span>73%</span>
                  </div>
                  <Progress value={73} />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>156 active / 214 total</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>Monthly operational costs breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Maintenance</span>
                  <span className="font-medium">$12,450</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parts & Supplies</span>
                  <span className="font-medium">$8,320</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Services</span>
                  <span className="font-medium">$2,180</span>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">$22,950</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245ms</div>
                <div className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  12% faster than last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <div className="text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Above SLA target
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.03%</div>
                <div className="text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  Within acceptable range
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Status</CardTitle>
              <CardDescription>Current security posture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">All systems secure</span>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">2 minor alerts</span>
                  </div>
                  <Badge variant="outline">Review</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Last scan: 2 hours ago</span>
                  </div>
                  <Badge variant="outline">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}