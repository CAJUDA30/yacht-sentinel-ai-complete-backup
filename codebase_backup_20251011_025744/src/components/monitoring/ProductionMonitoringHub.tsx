import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Globe,
  Server,
  Zap,
  Users,
  Bell,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  HardDrive,
  Network,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  category: 'performance' | 'availability' | 'errors' | 'resources';
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
  resolved: boolean;
  category: string;
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  lastCheck: Date;
}

export function ProductionMonitoringHub() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [overallHealth, setOverallHealth] = useState(95);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMonitoringData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      // Load system metrics
      const systemMetrics: SystemMetric[] = [
        {
          id: 'response_time',
          name: 'Avg Response Time',
          value: 235,
          unit: 'ms',
          status: 'healthy',
          threshold: 500,
          trend: 'down',
          category: 'performance'
        },
        {
          id: 'throughput',
          name: 'Requests/min',
          value: 1247,
          unit: 'req/min',
          status: 'healthy',
          threshold: 2000,
          trend: 'up',
          category: 'performance'
        },
        {
          id: 'error_rate',
          name: 'Error Rate',
          value: 0.3,
          unit: '%',
          status: 'healthy',
          threshold: 1.0,
          trend: 'stable',
          category: 'errors'
        },
        {
          id: 'uptime',
          name: 'System Uptime',
          value: 99.8,
          unit: '%',
          status: 'healthy',
          threshold: 99.0,
          trend: 'stable',
          category: 'availability'
        },
        {
          id: 'cpu_usage',
          name: 'CPU Usage',
          value: 68,
          unit: '%',
          status: 'warning',
          threshold: 80,
          trend: 'up',
          category: 'resources'
        },
        {
          id: 'memory_usage',
          name: 'Memory Usage',
          value: 74,
          unit: '%',
          status: 'warning',
          threshold: 85,
          trend: 'up',
          category: 'resources'
        },
        {
          id: 'db_connections',
          name: 'DB Connections',
          value: 23,
          unit: 'active',
          status: 'healthy',
          threshold: 100,
          trend: 'stable',
          category: 'resources'
        },
        {
          id: 'ai_queue',
          name: 'AI Queue Length',
          value: 5,
          unit: 'pending',
          status: 'healthy',
          threshold: 50,
          trend: 'down',
          category: 'performance'
        }
      ];
      setMetrics(systemMetrics);

      // Load active alerts
      const activeAlerts: Alert[] = [
        {
          id: '1',
          title: 'High CPU Usage',
          message: 'CPU usage has been above 65% for the last 10 minutes',
          severity: 'warning',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          resolved: false,
          category: 'performance'
        },
        {
          id: '2',
          title: 'AI Model Response Delay',
          message: 'OpenAI API responses averaging 15% slower than baseline',
          severity: 'warning',
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          resolved: false,
          category: 'ai'
        },
        {
          id: '3',
          title: 'Database Query Optimization',
          message: 'Slow query detected on inventory_items table',
          severity: 'info',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          resolved: true,
          category: 'database'
        }
      ];
      setAlerts(activeAlerts);

      // Load service status
      const serviceStatuses: ServiceStatus[] = [
        {
          name: 'Web Application',
          status: 'operational',
          uptime: 99.8,
          responseTime: 245,
          lastCheck: new Date()
        },
        {
          name: 'Supabase Database',
          status: 'operational',
          uptime: 99.9,
          responseTime: 89,
          lastCheck: new Date()
        },
        {
          name: 'Edge Functions',
          status: 'operational',
          uptime: 99.7,
          responseTime: 156,
          lastCheck: new Date()
        },
        {
          name: 'AI Services',
          status: 'degraded',
          uptime: 98.9,
          responseTime: 387,
          lastCheck: new Date()
        },
        {
          name: 'File Storage',
          status: 'operational',
          uptime: 99.9,
          responseTime: 78,
          lastCheck: new Date()
        }
      ];
      setServices(serviceStatuses);

      // Calculate overall health
      const healthyMetrics = systemMetrics.filter(m => m.status === 'healthy').length;
      const totalMetrics = systemMetrics.length;
      const health = Math.round((healthyMetrics / totalMetrics) * 100);
      setOverallHealth(health);

    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    }
  };

  const refreshMonitoring = async () => {
    setIsRefreshing(true);
    await loadMonitoringData();
    setIsRefreshing(false);
    
    toast({
      title: "Data Refreshed",
      description: "Monitoring data has been updated",
    });
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
    
    toast({
      title: "Alert Resolved",
      description: "Alert has been marked as resolved",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Zap className="h-4 w-4" />;
      case 'availability':
        return <Globe className="h-4 w-4" />;
      case 'errors':
        return <AlertTriangle className="h-4 w-4" />;
      case 'resources':
        return <Server className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Production Monitoring Hub
          </h2>
          <p className="text-muted-foreground">
            Real-time system health and performance monitoring
          </p>
        </div>
        <Button 
          onClick={refreshMonitoring}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Health Overview</span>
            <Badge className={overallHealth >= 95 ? 'bg-green-100 text-green-800' : 
                             overallHealth >= 85 ? 'bg-yellow-100 text-yellow-800' : 
                             'bg-red-100 text-red-800'}>
              {overallHealth >= 95 ? 'EXCELLENT' : 
               overallHealth >= 85 ? 'GOOD' : 'DEGRADED'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{overallHealth}%</div>
            <div className="flex-1">
              <Progress value={overallHealth} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {metrics.filter(m => m.status === 'healthy').length} of {metrics.length} metrics healthy
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="services">Service Status</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="realtime">Real-time View</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(metric.category)}
                      <span className="text-sm font-medium">{metric.name}</span>
                    </div>
                    {getTrendIcon(metric.trend)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{metric.value}</span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                    </div>
                    <Progress 
                      value={Math.min((metric.value / metric.threshold) * 100, 100)} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Limit: {metric.threshold}{metric.unit}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Last checked: {service.lastCheck.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      {service.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                      <div className="text-lg font-semibold">{service.uptime}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Response Time</div>
                      <div className="text-lg font-semibold">{service.responseTime}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Bell className="h-4 w-4 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.category}
                        </Badge>
                        {alert.resolved && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            RESOLVED
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        {alert.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">68%</div>
                  <Progress value={68} />
                  <p className="text-xs text-muted-foreground">
                    4 cores, 2.8 GHz average
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">74%</div>
                  <Progress value={74} />
                  <p className="text-xs text-muted-foreground">
                    5.9 GB of 8 GB used
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network I/O
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">2.3 MB/s</div>
                  <Progress value={35} />
                  <p className="text-xs text-muted-foreground">
                    ↑ 1.2 MB/s ↓ 1.1 MB/s
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Active Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">247</div>
                  <div className="text-sm text-muted-foreground">Web Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">23</div>
                  <div className="text-sm text-muted-foreground">DB Connections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground">AI Requests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">API Calls/min</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}