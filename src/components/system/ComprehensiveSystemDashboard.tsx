import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Database,
  Zap,
  Wifi,
  Shield,
  Bell,
  Settings,
  BarChart3,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Eye,
  RefreshCw,
  Filter,
  ChevronRight,
  Calendar,
  Globe
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  threshold: {
    warning: number;
    critical: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ModuleStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  uptime: number;
  lastHealthCheck: Date;
  version: string;
  dependencies: string[];
  metrics: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

const ComprehensiveSystemDashboard = () => {
  const { toast } = useToast();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date(),
      threshold: { warning: 70, critical: 90 }
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 68,
      unit: '%',
      status: 'warning',
      trend: 'up',
      lastUpdated: new Date(),
      threshold: { warning: 80, critical: 95 }
    },
    {
      id: 'disk',
      name: 'Disk Usage',
      value: 32,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date(),
      threshold: { warning: 80, critical: 95 }
    },
    {
      id: 'network',
      name: 'Network Throughput',
      value: 125,
      unit: 'Mbps',
      status: 'healthy',
      trend: 'up',
      lastUpdated: new Date(),
      threshold: { warning: 500, critical: 800 }
    },
    {
      id: 'response',
      name: 'Avg Response Time',
      value: 285,
      unit: 'ms',
      status: 'healthy',
      trend: 'down',
      lastUpdated: new Date(),
      threshold: { warning: 500, critical: 1000 }
    },
    {
      id: 'errors',
      name: 'Error Rate',
      value: 0.2,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date(),
      threshold: { warning: 1, critical: 5 }
    }
  ]);

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'High Memory Usage',
      message: 'Memory usage has exceeded 65% for the past 10 minutes',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      acknowledged: false,
      component: 'System',
      severity: 'medium'
    },
    {
      id: '2',
      type: 'info',
      title: 'Database Backup Completed',
      message: 'Automated daily backup completed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      acknowledged: true,
      component: 'Database',
      severity: 'low'
    },
    {
      id: '3',
      type: 'error',
      title: 'API Rate Limit Approaching',
      message: 'OpenAI API usage at 85% of daily quota',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      acknowledged: false,
      component: 'AI Services',
      severity: 'high'
    }
  ]);

  const [moduleStatuses, setModuleStatuses] = useState<ModuleStatus[]>([
    {
      id: 'auth',
      name: 'Authentication',
      status: 'active',
      uptime: 99.9,
      lastHealthCheck: new Date(),
      version: '2.1.0',
      dependencies: ['Supabase Auth'],
      metrics: { requests: 1250, errors: 2, avgResponseTime: 120 }
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      status: 'active',
      uptime: 99.7,
      lastHealthCheck: new Date(),
      version: '1.8.2',
      dependencies: ['Database', 'File Storage'],
      metrics: { requests: 850, errors: 0, avgResponseTime: 95 }
    },
    {
      id: 'ai',
      name: 'AI Services',
      status: 'active',
      uptime: 98.5,
      lastHealthCheck: new Date(),
      version: '3.2.1',
      dependencies: ['OpenAI', 'Gemini', 'DeepSeek'],
      metrics: { requests: 2100, errors: 15, avgResponseTime: 850 }
    },
    {
      id: 'navigation',
      name: 'Navigation System',
      status: 'active',
      uptime: 99.8,
      lastHealthCheck: new Date(),
      version: '2.0.5',
      dependencies: ['GPS Service', 'Weather API'],
      metrics: { requests: 450, errors: 1, avgResponseTime: 180 }
    },
    {
      id: 'maintenance',
      name: 'Maintenance Scheduler',
      status: 'maintenance',
      uptime: 95.2,
      lastHealthCheck: new Date(Date.now() - 15 * 60 * 1000),
      version: '1.5.8',
      dependencies: ['Calendar Service', 'Notification System'],
      metrics: { requests: 320, errors: 8, avgResponseTime: 220 }
    }
  ]);

  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'issues'>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active': return 'hsl(var(--success))';
      case 'warning': return 'hsl(var(--warning))';
      case 'critical':
      case 'error': return 'hsl(var(--destructive))';
      case 'maintenance': return 'hsl(var(--muted))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'critical':
      case 'error': return AlertTriangle;
      case 'maintenance': return Settings;
      default: return Clock;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Activity;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate data refresh
    setTimeout(() => {
      setSystemMetrics(prev => 
        prev.map(metric => ({
          ...metric,
          value: metric.value + (Math.random() - 0.5) * 10,
          lastUpdated: new Date()
        }))
      );
      setRefreshing(false);
      toast({ title: 'System data refreshed', description: 'All metrics updated successfully' });
    }, 2000);
  };

  const acknowledgeAlert = (alertId: string) => {
    setSystemAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const filteredModules = moduleStatuses.filter(module => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return module.status === 'active';
    if (filterStatus === 'issues') return ['error', 'maintenance', 'inactive'].includes(module.status);
    return true;
  });

  const systemHealthScore = Math.round(
    systemMetrics.reduce((acc, metric) => {
      const score = metric.status === 'healthy' ? 100 : metric.status === 'warning' ? 70 : 30;
      return acc + score;
    }, 0) / systemMetrics.length
  );

  const activeAlerts = systemAlerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold">System Overview</h2>
            <p className="text-muted-foreground">
              System Health: {systemHealthScore}% • {activeAlerts.length} active alerts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant={systemHealthScore > 90 ? 'default' : systemHealthScore > 70 ? 'secondary' : 'destructive'}>
            {systemHealthScore > 90 ? 'Excellent' : systemHealthScore > 70 ? 'Good' : 'Needs Attention'}
          </Badge>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <h4 className="font-medium text-destructive">Critical System Alerts</h4>
                <p className="text-sm text-muted-foreground">
                  {criticalAlerts.length} critical issue{criticalAlerts.length > 1 ? 's' : ''} require immediate attention
                </p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{systemHealthScore}%</p>
                    <p className="text-sm text-muted-foreground">System Health</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {moduleStatuses.filter(m => m.status === 'active').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Modules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{activeAlerts.length}</p>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {systemMetrics.map((metric) => {
              const StatusIcon = getStatusIcon(metric.status);
              const TrendIcon = getTrendIcon(metric.trend);
              
              return (
                <Card key={metric.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <StatusIcon 
                        className="h-4 w-4" 
                        style={{ color: getStatusColor(metric.status) }}
                      />
                      <TrendIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">
                        {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{metric.name}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.component}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemMetrics.map((metric) => {
              const StatusIcon = getStatusIcon(metric.status);
              const percentage = Math.min((metric.value / metric.threshold.critical) * 100, 100);
              
              return (
                <Card key={metric.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" style={{ color: getStatusColor(metric.status) }} />
                        {metric.name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {metric.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                      </span>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Warning: {metric.threshold.warning}{metric.unit}</div>
                        <div>Critical: {metric.threshold.critical}{metric.unit}</div>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Last updated: {metric.lastUpdated.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                All ({moduleStatuses.length})
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('active')}
              >
                Active ({moduleStatuses.filter(m => m.status === 'active').length})
              </Button>
              <Button
                variant={filterStatus === 'issues' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('issues')}
              >
                Issues ({moduleStatuses.filter(m => ['error', 'maintenance', 'inactive'].includes(m.status)).length})
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredModules.map((module) => {
              const StatusIcon = getStatusIcon(module.status);
              
              return (
                <Card key={module.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="h-5 w-5" style={{ color: getStatusColor(module.status) }} />
                        <div>
                          <h3 className="font-medium">{module.name}</h3>
                          <p className="text-sm text-muted-foreground">v{module.version}</p>
                        </div>
                      </div>
                      <Badge variant="outline" style={{ color: getStatusColor(module.status) }}>
                        {module.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">{module.uptime}%</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">{module.metrics.requests}</div>
                          <div className="text-muted-foreground">Requests</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">{module.metrics.errors}</div>
                          <div className="text-muted-foreground">Errors</div>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <div className="font-medium">{module.metrics.avgResponseTime}ms</div>
                          <div className="text-muted-foreground">Avg Time</div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Dependencies:</p>
                        <div className="flex flex-wrap gap-1">
                          {module.dependencies.map((dep) => (
                            <Badge key={dep} variant="secondary" className="text-xs">
                              {dep}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {systemAlerts.map((alert) => (
                <Card key={alert.id} className={`${!alert.acknowledged ? 'border-l-4' : ''}`}
                      style={{ borderLeftColor: !alert.acknowledged ? 
                        (alert.type === 'error' ? 'hsl(var(--destructive))' :
                         alert.type === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--primary))') 
                        : undefined }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          alert.type === 'error' ? 'bg-red-100 dark:bg-red-900/20' :
                          alert.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                          'bg-blue-100 dark:bg-blue-900/20'
                        }`}>
                          <AlertTriangle className={`h-4 w-4 ${
                            alert.type === 'error' ? 'text-red-600' :
                            alert.type === 'warning' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{alert.component}</span>
                            <span>•</span>
                            <span>{alert.timestamp.toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        )}
                        {alert.acknowledged && (
                          <Badge variant="secondary" className="text-xs">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveSystemDashboard;