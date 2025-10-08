import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Network, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  threshold: number;
  status: 'healthy' | 'warning' | 'critical';
  unit: string;
  icon: React.ElementType;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastCheck: Date;
  responseTime: number;
}

export default function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate system metrics (in real app, this would come from monitoring APIs)
      const systemMetrics: SystemMetric[] = [
        {
          id: 'cpu',
          name: 'CPU Usage',
          value: 45,
          threshold: 80,
          status: 'healthy',
          unit: '%',
          icon: Cpu
        },
        {
          id: 'memory',
          name: 'Memory Usage',
          value: 62,
          threshold: 85,
          status: 'healthy',
          unit: '%',
          icon: HardDrive
        },
        {
          id: 'disk',
          name: 'Disk Usage',
          value: 73,
          threshold: 90,
          status: 'healthy',
          unit: '%',
          icon: HardDrive
        },
        {
          id: 'network',
          name: 'Network I/O',
          value: 125,
          threshold: 1000,
          status: 'healthy',
          unit: 'MB/s',
          icon: Network
        }
      ];

      const serviceStatuses: ServiceStatus[] = [
        {
          id: 'database',
          name: 'Supabase Database',
          status: 'online',
          uptime: 99.9,
          lastCheck: new Date(),
          responseTime: 45
        },
        {
          id: 'ai_services',
          name: 'AI Processing Services',
          status: 'online',
          uptime: 98.7,
          lastCheck: new Date(),
          responseTime: 235
        },
        {
          id: 'mobile_sync',
          name: 'Mobile Sync Service',
          status: 'degraded',
          uptime: 95.2,
          lastCheck: new Date(),
          responseTime: 890
        },
        {
          id: 'file_storage',
          name: 'File Storage',
          status: 'online',
          uptime: 99.5,
          lastCheck: new Date(),
          responseTime: 120
        }
      ];

      // Load recent system alerts
      const { data: recentAlerts } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('severity', 'error')
        .order('created_at', { ascending: false })
        .limit(10);

      setMetrics(systemMetrics);
      setServices(serviceStatuses);
      setAlerts(recentAlerts || []);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading system data:', error);
      toast({
        title: "Error Loading System Data",
        description: "Failed to load monitoring data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemData, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadSystemData();
    toast({
      title: "System Data Refreshed",
      description: "Monitoring data has been updated.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-500';
      case 'warning':
      case 'degraded':
        return 'text-yellow-500';
      case 'critical':
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'default';
      case 'warning':
      case 'degraded':
        return 'secondary';
      case 'critical':
      case 'offline':
        return 'destructive';
      default:
        return 'outline';
    }
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
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value}{metric.unit}
                </div>
                <div className="mt-2">
                  <Progress 
                    value={(metric.value / metric.threshold) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="flex items-center mt-2 text-xs">
                  {getStatusIcon(metric.status)}
                  <span className={`ml-1 ${getStatusColor(metric.status)}`}>
                    {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Alerts */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Alerts</AlertTitle>
          <AlertDescription>
            {alerts.length} recent system alerts require attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Current status of all system services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Uptime: {service.uptime}% | Response: {service.responseTime}ms
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(service.status)}>
                        {service.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {service.lastCheck.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average response times over the last hour</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Queries</span>
                    <span className="font-medium">45ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Endpoints</span>
                    <span className="font-medium">120ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Processing</span>
                    <span className="font-medium">890ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">File Operations</span>
                    <span className="font-medium">235ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage Trends</CardTitle>
                <CardDescription>System resource consumption patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Peak CPU Usage (24h)</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Peak Memory Usage (24h)</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network Utilization</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Logs</CardTitle>
              <CardDescription>Latest system events and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 10).map((alert, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 border-l-2 border-muted">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm">{alert.event_message}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.module || 'System'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current system alerts and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <div className="text-lg font-medium">All Systems Operational</div>
                  <div className="text-muted-foreground">No active alerts at this time</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{alert.event_type}</AlertTitle>
                      <AlertDescription>
                        {alert.event_message}
                        <div className="text-xs mt-1 text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}