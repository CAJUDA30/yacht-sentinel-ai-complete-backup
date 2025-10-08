import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Heart, 
  Server, 
  Database, 
  Shield, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useProductionReadiness } from '@/hooks/useProductionReadiness';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: { warning: number; critical: number };
}

interface SystemComponent {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export const SystemHealthMonitor: React.FC = () => {
  const { metrics, checkSystemHealth, isCheckingHealth } = useProductionReadiness();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d'>('24h');

  const healthMetrics: HealthMetric[] = [
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      threshold: { warning: 70, critical: 90 }
    },
    {
      name: 'Memory Usage',
      value: 62,
      unit: '%',
      status: 'warning',
      trend: 'up',
      threshold: { warning: 80, critical: 95 }
    },
    {
      name: 'Disk Usage',
      value: 34,
      unit: '%',
      status: 'healthy',
      trend: 'down',
      threshold: { warning: 80, critical: 95 }
    },
    {
      name: 'Network I/O',
      value: 1.2,
      unit: 'GB/s',
      status: 'healthy',
      trend: 'stable',
      threshold: { warning: 5, critical: 10 }
    }
  ];

  const systemComponents: SystemComponent[] = [
    {
      name: 'API Gateway',
      status: 'healthy',
      uptime: 99.9,
      responseTime: 145,
      errorRate: 0.1,
      lastCheck: new Date()
    },
    {
      name: 'AI Orchestration',
      status: 'healthy',
      uptime: 99.8,
      responseTime: 320,
      errorRate: 0.3,
      lastCheck: new Date()
    },
    {
      name: 'Database Cluster',
      status: 'degraded',
      uptime: 99.2,
      responseTime: 89,
      errorRate: 1.2,
      lastCheck: new Date()
    },
    {
      name: 'Authentication',
      status: 'healthy',
      uptime: 99.99,
      responseTime: 67,
      errorRate: 0.01,
      lastCheck: new Date()
    },
    {
      name: 'File Storage',
      status: 'healthy',
      uptime: 99.7,
      responseTime: 234,
      errorRate: 0.5,
      lastCheck: new Date()
    },
    {
      name: 'Cache Layer',
      status: 'healthy',
      uptime: 99.95,
      responseTime: 12,
      errorRate: 0.02,
      lastCheck: new Date()
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': case 'degraded': return 'secondary';
      case 'critical': case 'down': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const overallHealthScore = systemComponents.reduce((acc, comp) => {
    const score = comp.status === 'healthy' ? 100 : comp.status === 'degraded' ? 70 : 30;
    return acc + score;
  }, 0) / systemComponents.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">System Health Monitor</h3>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border">
            {['1h', '24h', '7d'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className="rounded-none first:rounded-l-md last:rounded-r-md"
              >
                {timeframe}
              </Button>
            ))}
          </div>
          <Button
            onClick={() => checkSystemHealth()}
            disabled={isCheckingHealth}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingHealth ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Overall System Health</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl font-bold">{overallHealthScore.toFixed(1)}%</span>
                <Badge variant={overallHealthScore > 90 ? 'default' : overallHealthScore > 70 ? 'secondary' : 'destructive'}>
                  {overallHealthScore > 90 ? 'Excellent' : overallHealthScore > 70 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Active Issues</div>
              <div className="text-2xl font-bold">
                {systemComponents.filter(c => c.status !== 'healthy').length}
              </div>
            </div>
          </div>
          <Progress value={overallHealthScore} className="mt-4" />
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {systemComponents.some(c => c.status !== 'healthy') && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {systemComponents.filter(c => c.status !== 'healthy').length} system components require attention. 
            Check the component status below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{metric.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{metric.value}{metric.unit}</span>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
                <Badge variant={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
              <Progress 
                value={(metric.value / metric.threshold.critical) * 100} 
                className="mt-3" 
              />
              <div className="text-xs text-muted-foreground mt-1">
                Warning: {metric.threshold.warning}{metric.unit} • Critical: {metric.threshold.critical}{metric.unit}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Component Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Components
          </CardTitle>
          <CardDescription>
            Detailed status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {systemComponents.map((component) => (
              <div key={component.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(component.status)}
                  <div>
                    <h5 className="font-medium">{component.name}</h5>
                    <div className="text-sm text-muted-foreground">
                      Last checked: {component.lastCheck.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-muted-foreground">Uptime</div>
                    <div className="font-medium">{component.uptime}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Response</div>
                    <div className="font-medium">{component.responseTime}ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Error Rate</div>
                    <div className="font-medium">{component.errorRate}%</div>
                  </div>
                  <Badge variant={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Average Response Time</div>
                  <div className="text-xl font-bold">{metrics.avg_response_time_ms}ms</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Requests (24h)</div>
                  <div className="text-xl font-bold">{metrics.total_requests_24h.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm text-muted-foreground">Error Rate</div>
                  <div className="text-xl font-bold">{metrics.error_rate_percentage.toFixed(2)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};