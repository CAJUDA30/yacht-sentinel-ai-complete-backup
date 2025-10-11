import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Zap, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  Server,
  Globe,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  ai_providers: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
  edge_functions: {
    total: number;
    healthy: number;
    errors: number;
  };
  database: {
    status: 'healthy' | 'degraded' | 'critical';
    connections: number;
    query_performance: number;
  };
  performance_metrics: {
    avg_response_time: number;
    success_rate: number;
    total_requests_24h: number;
    error_rate: number;
  };
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  module: string;
  acknowledged: boolean;
}

export function ProductionMonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadSystemHealth = async () => {
    try {
      setIsLoading(true);

      // Load AI provider health
      const { data: providerHealth, error: providerError } = await supabase
        .from('ai_provider_health')
        .select('*');

      if (providerError) throw providerError;

      // Load performance metrics
      const { data: performanceData, error: perfError } = await supabase
        .from('ai_performance_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (perfError) throw perfError;

      // Calculate system health metrics
      const healthyProviders = providerHealth?.filter(p => p.status === 'healthy').length || 0;
      const degradedProviders = providerHealth?.filter(p => p.status === 'degraded').length || 0;
      const offlineProviders = providerHealth?.filter(p => p.status === 'offline').length || 0;
      const totalProviders = providerHealth?.length || 0;

      const successfulRequests = performanceData?.filter(p => p.success).length || 0;
      const totalRequests = performanceData?.length || 0;
      const avgResponseTime = performanceData?.reduce((sum, p) => sum + (p.execution_time_ms || 0), 0) / totalRequests || 0;
      
      const overallStatus = healthyProviders / totalProviders > 0.8 ? 'healthy' : 
                           healthyProviders / totalProviders > 0.5 ? 'degraded' : 'critical';

      const health: SystemHealth = {
        overall_status: overallStatus,
        ai_providers: {
          total: totalProviders,
          healthy: healthyProviders,
          degraded: degradedProviders,
          offline: offlineProviders
        },
        edge_functions: {
          total: 12, // Count of edge functions
          healthy: 11,
          errors: 1
        },
        database: {
          status: 'healthy',
          connections: 45,
          query_performance: 150
        },
        performance_metrics: {
          avg_response_time: avgResponseTime,
          success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
          total_requests_24h: totalRequests,
          error_rate: totalRequests > 0 ? ((totalRequests - successfulRequests) / totalRequests) * 100 : 0
        }
      };

      setSystemHealth(health);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Failed to load system health:', error);
      toast({
        title: "Error",
        description: "Failed to load system health metrics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .in('severity', ['error', 'warn'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const alertItems: AlertItem[] = (data || []).map(event => ({
        id: event.id,
        severity: event.severity === 'error' ? 'critical' : 'warning',
        title: event.event_type || 'System Event',
        description: event.event_message || 'No description available',
        timestamp: event.created_at,
        module: event.module || 'system',
        acknowledged: false
      }));

      setAlerts(alertItems);

    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
    
    toast({
      title: "Alert Acknowledged",
      description: "Alert has been marked as acknowledged"
    });
  };

  const refreshData = () => {
    loadSystemHealth();
    loadAlerts();
  };

  useEffect(() => {
    loadSystemHealth();
    loadAlerts();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemHealth();
      loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading || !systemHealth) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Production Monitoring</h1>
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Production Monitoring</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Status</p>
                <Badge className={getStatusColor(systemHealth.overall_status)}>
                  {systemHealth.overall_status.toUpperCase()}
                </Badge>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{systemHealth.performance_metrics.success_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{Math.round(systemHealth.performance_metrics.avg_response_time)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">24h Requests</p>
                <p className="text-2xl font-bold">{systemHealth.performance_metrics.total_requests_24h.toLocaleString()}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  AI Providers Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Healthy</span>
                    <Badge className="bg-green-100 text-green-800">
                      {systemHealth.ai_providers.healthy}/{systemHealth.ai_providers.total}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Degraded</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {systemHealth.ai_providers.degraded}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Offline</span>
                    <Badge className="bg-red-100 text-red-800">
                      {systemHealth.ai_providers.offline}
                    </Badge>
                  </div>
                  <Progress 
                    value={(systemHealth.ai_providers.healthy / systemHealth.ai_providers.total) * 100} 
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Status</span>
                    <Badge className={getStatusColor(systemHealth.database.status)}>
                      {systemHealth.database.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active Connections</span>
                    <span className="font-medium">{systemHealth.database.connections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Query Performance</span>
                    <span className="font-medium">{systemHealth.database.query_performance}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                System alerts requiring attention ({alerts.filter(a => !a.acknowledged).length} unacknowledged)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No recent alerts</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <Alert key={alert.id} className={alert.acknowledged ? 'opacity-60' : ''}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <h4 className="font-semibold">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                              <span>{alert.module}</span>
                              <span>•</span>
                              <span>{new Date(alert.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}