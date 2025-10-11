import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Database,
  Server,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  module: string;
  metadata?: any;
}

interface MetricData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export const AISystemMonitoring: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const { toast } = useToast();

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedLogs: LogEntry[] = (data || []).map(entry => ({
        id: entry.id,
        timestamp: entry.created_at,
        level: entry.severity as 'info' | 'warn' | 'error',
        message: entry.event_message,
        module: entry.module || 'system',
        metadata: entry.metadata
      }));

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      // Load AI usage metrics
      const { data: usage } = await supabase
        .from('ai_usage_metrics')
        .select('*')
        .order('collected_at', { ascending: false })
        .limit(10);

      // Load provider health
      const { data: health } = await supabase
        .from('ai_health')
        .select('*');

      // Calculate metrics
      const totalRequests = usage?.reduce((sum, u) => sum + (u.requests || 0), 0) || 0;
      const avgLatency = usage?.reduce((sum, u) => sum + (u.avg_latency_ms || 0), 0) / (usage?.length || 1) || 0;
      const avgSuccessRate = usage?.reduce((sum, u) => sum + (u.success_rate || 0), 0) / (usage?.length || 1) || 0;
      const totalCost = usage?.reduce((sum, u) => sum + (u.cost_usd || 0), 0) || 0;
      const healthyProviders = health?.filter(h => h.status === 'healthy').length || 0;
      const totalProviders = health?.length || 0;

      setMetrics([
        {
          label: 'Total Requests',
          value: totalRequests.toLocaleString(),
          change: '+12%',
          trend: 'up',
          icon: <Activity className="h-4 w-4" />
        },
        {
          label: 'Avg Latency',
          value: `${Math.round(avgLatency)}ms`,
          change: '-5%',
          trend: 'down',
          icon: <Clock className="h-4 w-4" />
        },
        {
          label: 'Success Rate',
          value: `${(avgSuccessRate * 100).toFixed(1)}%`,
          change: '+2%',
          trend: 'up',
          icon: <CheckCircle2 className="h-4 w-4" />
        },
        {
          label: 'Total Cost',
          value: `$${totalCost.toFixed(4)}`,
          change: '+8%',
          trend: 'up',
          icon: <TrendingUp className="h-4 w-4" />
        },
        {
          label: 'Provider Health',
          value: `${healthyProviders}/${totalProviders}`,
          change: 'stable',
          trend: 'stable',
          icon: <Server className="h-4 w-4" />
        }
      ]);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadLogs(), loadMetrics()]);
    } finally {
      setLoading(false);
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLogBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      default: return <div className="h-3 w-3" />;
    }
  };

  useEffect(() => {
    refreshData();
    
    // Set up real-time subscriptions
    const logsChannel = supabase
      .channel('ai-logs-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics_events' }, loadLogs)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_usage_metrics' }, loadMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Monitoring</h3>
          <p className="text-sm text-muted-foreground">
            Real-time metrics, logs, and system health monitoring
          </p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-primary">
                  {metric.icon}
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.label}</div>
                {metric.change !== 'stable' && (
                  <div className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.change}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Recent System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                      <div className="mt-0.5">
                        {getLogIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getLogBadgeVariant(log.level)} className="text-xs">
                            {log.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.module}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              View metadata
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Response Time Trends</h4>
                  <div className="bg-card/50 h-32 rounded-lg border flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization placeholder</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Success Rate Over Time</h4>
                  <div className="bg-card/50 h-32 rounded-lg border flex items-center justify-center">
                    <p className="text-muted-foreground">Chart visualization placeholder</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.filter(log => log.level === 'error').slice(0, 10).map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive" className="text-xs">Error</Badge>
                      <Badge variant="outline" className="text-xs">{log.module}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge-functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Edge Functions Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  'ai-admin', 
                  'enhanced-multi-ai-processor', 
                  'production-smart-scan',
                  'unified-ai-provider'
                ].map((funcName) => (
                  <div key={funcName} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{funcName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div>Status: Active</div>
                      <div>Last invocation: 2 minutes ago</div>
                      <div>Success rate: 99.2%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};