import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  DollarSign, 
  Users, 
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Database,
  Globe
} from 'lucide-react';
import { useProductionReadiness } from '@/hooks/useProductionReadiness';
import { supabase } from '@/integrations/supabase/client';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

export const ProductionMetricsDashboard: React.FC = () => {
  const { metrics, selectedEnvironment } = useProductionReadiness();
  const [selectedPeriod, setSelectedPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [responseTimeData, setResponseTimeData] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [providerUsageData, setProviderUsageData] = useState<any[]>([]);
  const [costBredownData, setCostBredownData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real performance data from database
  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const hoursBack = selectedPeriod === '1h' ? 1 : selectedPeriod === '24h' ? 24 : selectedPeriod === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Fetch AI processing logs for response times
      const { data: aiLogs } = await supabase
        .from('ai_processing_logs')
        .select('processing_time_ms, created_at, model_name, success')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      // Fetch system logs for traffic analysis
      const { data: systemLogs } = await supabase
        .from('system_logs')
        .select('level, created_at, source')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: true });

      // Process response time data
      if (aiLogs && aiLogs.length > 0) {
        const hourlyResponseTimes = processHourlyData(aiLogs, 'processing_time_ms');
        setResponseTimeData(hourlyResponseTimes.map(item => ({
          time: item.hour,
          responseTime: item.avgValue,
          threshold: 500
        })));
      }

      // Process traffic data
      if (systemLogs && systemLogs.length > 0) {
        const hourlyTraffic = processHourlyTraffic(systemLogs);
        setTrafficData(hourlyTraffic);
      }

      // Process provider usage data
      if (aiLogs && aiLogs.length > 0) {
        const providerStats = processProviderUsage(aiLogs);
        setProviderUsageData(providerStats);
      }

      // Generate cost breakdown from real usage
      const totalRequests = aiLogs?.length || 0;
      const estimatedCost = totalRequests * 0.001; // $0.001 per request estimate
      setCostBredownData([
        { category: 'AI Processing', amount: Math.round(estimatedCost * 0.6), percentage: 60 },
        { category: 'Database', amount: Math.round(estimatedCost * 0.25), percentage: 25 },
        { category: 'Compute', amount: Math.round(estimatedCost * 0.10), percentage: 10 },
        { category: 'Storage', amount: Math.round(estimatedCost * 0.05), percentage: 5 }
      ]);

    } catch (error) {
      console.error('Error loading performance data:', error);
      // Fallback to minimal data structure
      setResponseTimeData([]);
      setTrafficData([]);
      setProviderUsageData([]);
      setCostBredownData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to process hourly data
  const processHourlyData = (data: any[], field: string) => {
    const hourlyMap = new Map();
    
    data.forEach(item => {
      const hour = new Date(item.created_at).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { values: [], hour: hourKey });
      }
      
      if (item[field]) {
        hourlyMap.get(hourKey).values.push(item[field]);
      }
    });

    return Array.from(hourlyMap.values()).map(item => ({
      hour: item.hour,
      avgValue: item.values.length > 0 ? 
        Math.round(item.values.reduce((sum: number, val: number) => sum + val, 0) / item.values.length) : 0
    }));
  };

  // Helper function to process traffic data
  const processHourlyTraffic = (logs: any[]) => {
    const hourlyMap = new Map();
    
    logs.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { requests: 0, errors: 0 });
      }
      
      const entry = hourlyMap.get(hourKey);
      entry.requests += 1;
      if (log.level === 'error') {
        entry.errors += 1;
      }
    });

    return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      requests: data.requests,
      errors: data.errors
    }));
  };

  // Helper function to process provider usage
  const processProviderUsage = (logs: any[]) => {
    const providerMap = new Map();
    
    logs.forEach(log => {
      const provider = log.model_name || 'Unknown';
      providerMap.set(provider, (providerMap.get(provider) || 0) + 1);
    });

    const total = logs.length;
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444'];
    let colorIndex = 0;

    return Array.from(providerMap.entries()).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      usage: Math.round((count / total) * 100),
      color: colors[colorIndex++ % colors.length]
    }));
  };

  useEffect(() => {
    loadPerformanceData();
  }, [selectedPeriod]);

  const metricCards: MetricCard[] = [
    {
      title: 'Total Requests',
      value: metrics?.total_requests_24h.toLocaleString() || '0',
      change: 12.5,
      icon: Activity,
      color: 'text-blue-500'
    },
    {
      title: 'Avg Response Time',
      value: `${metrics?.avg_response_time_ms || 0}ms`,
      change: -8.2,
      icon: Clock,
      color: 'text-green-500'
    },
    {
      title: 'Error Rate',
      value: `${metrics?.error_rate_percentage.toFixed(2) || 0}%`,
      change: -15.3,
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Daily Cost',
      value: `$${((metrics?.cost_per_hour || 0) * 24).toFixed(2)}`,
      change: 5.7,
      icon: DollarSign,
      color: 'text-purple-500'
    },
    {
      title: 'Active Users',
      value: '2,341',
      change: 18.2,
      icon: Users,
      color: 'text-indigo-500'
    },
    {
      title: 'System Uptime',
      value: `${metrics?.uptime_percentage.toFixed(2) || 99.9}%`,
      change: 0.1,
      icon: CheckCircle,
      color: 'text-emerald-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">Production Metrics Dashboard</h3>
          <Badge variant="outline">{selectedEnvironment}</Badge>
        </div>
        <div className="flex rounded-md border">
          {['1h', '24h', '7d', '30d'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPeriod(period as any)}
              className="rounded-none first:rounded-l-md last:rounded-r-md"
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`text-xs ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <metric.icon className={`h-8 w-8 ${metric.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="usage">Usage & Traffic</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>Average response time over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Response Time (ms)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="threshold" 
                      stroke="#EF4444" 
                      strokeDasharray="5 5"
                      name="SLA Threshold"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health Score</CardTitle>
                <CardDescription>Overall system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>API Performance</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Database Performance</span>
                      <span>88%</span>
                    </div>
                    <Progress value={88} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>AI Processing</span>
                      <span>95%</span>
                    </div>
                    <Progress value={95} className="mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic & Error Analysis</CardTitle>
              <CardDescription>Request volume and error rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="requests" orientation="left" />
                  <YAxis yAxisId="errors" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="requests" dataKey="requests" fill="#10B981" name="Requests" />
                  <Bar yAxisId="errors" dataKey="errors" fill="#EF4444" name="Errors" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>Daily operational costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBredownData.map((item, index) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: providerUsageData[index]?.color || '#8B5CF6' }}
                        />
                        <span className="text-sm">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.amount}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total Daily Cost</span>
                      <span>${costBredownData.reduce((sum, item) => sum + item.amount, 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
                <CardDescription>30-day cost analysis and projections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">-12%</div>
                      <div className="text-xs text-muted-foreground">vs last month</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">$24,615</div>
                      <div className="text-xs text-muted-foreground">monthly projection</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Optimization Savings</span>
                      <span className="text-green-600">$3,240</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Usage Growth</span>
                      <span>+18%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Efficiency Gains</span>
                      <span className="text-green-600">+25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Usage</CardTitle>
                <CardDescription>Distribution of AI processing across providers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={providerUsageData}
                      dataKey="usage"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, usage }) => `${name} ${usage}%`}
                    >
                      {providerUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Performance</CardTitle>
                <CardDescription>Response times and availability by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.provider_health?.slice(0, 4).map((provider) => (
                    <div key={provider.provider_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{provider.provider_name}</span>
                        <Badge variant={provider.status === 'healthy' ? 'default' : 'secondary'}>
                          {provider.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>Response: {provider.response_time_ms}ms</div>
                        <div>Success: {Math.round(provider.success_rate * 100)}%</div>
                        <div>Rate Limit: {provider.rate_limit_remaining}</div>
                      </div>
                      <Progress value={provider.success_rate * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};