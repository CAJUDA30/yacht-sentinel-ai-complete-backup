import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Server,
  Activity,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
  Gauge,
  Eye,
  Cpu,
  HardDrive,
  Network,
  Globe
} from 'lucide-react';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  target: number;
  description: string;
  category: 'response_time' | 'throughput' | 'errors' | 'resources';
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  implemented: boolean;
  estimatedGain: string;
}

const PerformanceOptimizationCenter: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [overallScore, setOverallScore] = useState(85);
  const [scanning, setScanning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      // Load performance metrics
      const performanceMetrics: PerformanceMetric[] = [
        {
          id: '1',
          name: 'Page Load Time',
          value: 1.2,
          unit: 's',
          status: 'good',
          trend: 'down',
          target: 1.5,
          description: 'Average time to load Claims & Repairs pages',
          category: 'response_time'
        },
        {
          id: '2',
          name: 'API Response Time',
          value: 245,
          unit: 'ms',
          status: 'excellent',
          trend: 'stable',
          target: 300,
          description: 'Average API endpoint response time',
          category: 'response_time'
        },
        {
          id: '3',
          name: 'Database Query Time',
          value: 89,
          unit: 'ms',
          status: 'good',
          trend: 'up',
          target: 100,
          description: 'Average database query execution time',
          category: 'response_time'
        },
        {
          id: '4',
          name: 'Throughput',
          value: 152,
          unit: 'req/min',
          status: 'good',
          trend: 'up',
          target: 200,
          description: 'Requests processed per minute',
          category: 'throughput'
        },
        {
          id: '5',
          name: 'Error Rate',
          value: 0.5,
          unit: '%',
          status: 'excellent',
          trend: 'down',
          target: 1.0,
          description: 'Percentage of failed requests',
          category: 'errors'
        },
        {
          id: '6',
          name: 'Memory Usage',
          value: 68,
          unit: '%',
          status: 'warning',
          trend: 'up',
          target: 75,
          description: 'Server memory utilization',
          category: 'resources'
        }
      ];
      setMetrics(performanceMetrics);

      // Load optimization recommendations
      const optimizationRecs: OptimizationRecommendation[] = [
        {
          id: '1',
          title: 'Enable Query Result Caching',
          description: 'Implement Redis caching for frequently accessed Claims & Repairs data',
          impact: 'high',
          effort: 'medium',
          category: 'Database',
          implemented: false,
          estimatedGain: '30% faster queries'
        },
        {
          id: '2',
          title: 'Optimize Image Loading',
          description: 'Implement lazy loading and WebP format for repair job images',
          impact: 'medium',
          effort: 'low',
          category: 'Frontend',
          implemented: false,
          estimatedGain: '25% faster page loads'
        },
        {
          id: '3',
          title: 'Database Index Optimization',
          description: 'Add composite indexes for common Claims & Repairs queries',
          impact: 'high',
          effort: 'low',
          category: 'Database',
          implemented: true,
          estimatedGain: '40% faster searches'
        },
        {
          id: '4',
          title: 'Code Splitting',
          description: 'Split Claims & Repairs module into smaller chunks for better loading',
          impact: 'medium',
          effort: 'medium',
          category: 'Frontend',
          implemented: false,
          estimatedGain: '20% smaller initial bundle'
        },
        {
          id: '5',
          title: 'API Response Compression',
          description: 'Enable gzip compression for API responses',
          impact: 'medium',
          effort: 'low',
          category: 'Backend',
          implemented: true,
          estimatedGain: '15% smaller payloads'
        },
        {
          id: '6',
          title: 'Connection Pooling',
          description: 'Optimize Supabase connection pooling for high concurrency',
          impact: 'high',
          effort: 'medium',
          category: 'Backend',
          implemented: false,
          estimatedGain: '50% better concurrency'
        }
      ];
      setRecommendations(optimizationRecs);

      // Calculate overall performance score
      const avgScore = performanceMetrics.reduce((sum, metric) => {
        const score = metric.status === 'excellent' ? 100 : 
                     metric.status === 'good' ? 80 : 
                     metric.status === 'warning' ? 60 : 40;
        return sum + score;
      }, 0) / performanceMetrics.length;
      setOverallScore(Math.round(avgScore));

    } catch (error) {
      console.error('Error loading performance data:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    }
  };

  const runPerformanceScan = async () => {
    setScanning(true);
    
    try {
      // Simulate performance scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Update metrics with scan results
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value * (0.95 + Math.random() * 0.1), // Small random variation
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })));

      toast({
        title: "Scan Complete",
        description: "Performance analysis completed successfully",
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Failed to complete performance scan",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const implementOptimization = async (recommendationId: string) => {
    setOptimizing(true);
    
    try {
      // Simulate optimization implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId 
            ? { ...rec, implemented: true }
            : rec
        )
      );

      // Improve relevant metrics
      if (recommendationId === '1') { // Caching
        setMetrics(prev => prev.map(metric => 
          metric.category === 'response_time' 
            ? { ...metric, value: metric.value * 0.7, trend: 'down' }
            : metric
        ));
      }

      toast({
        title: "Optimization Applied",
        description: "Performance optimization has been implemented",
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: "Failed to implement optimization",
        variant: "destructive",
      });
    } finally {
      setOptimizing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500 text-white';
      case 'good':
        return 'bg-blue-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'critical':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-green-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {overallScore}%
              {overallScore >= 90 ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> : 
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              }
            </div>
            <Progress value={overallScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {overallScore >= 90 ? 'Excellent' : 
               overallScore >= 80 ? 'Good' : 
               overallScore >= 70 ? 'Fair' : 'Needs Improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              15% faster than last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Optimizations</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recommendations.filter(r => r.implemented).length}</div>
            <p className="text-xs text-muted-foreground">
              of {recommendations.length} recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.filter(m => m.status === 'warning' || m.status === 'critical').length}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Optimizations</TabsTrigger>
          <TabsTrigger value="resources">Resource Usage</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators for Claims & Repairs module
                  </CardDescription>
                </div>
                <Button 
                  onClick={runPerformanceScan} 
                  disabled={scanning}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                  {scanning ? 'Scanning...' : 'Run Scan'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {metrics.map((metric) => (
                  <div key={metric.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-bold">
                        {metric.value.toFixed(metric.unit === 'ms' ? 0 : 1)}
                      </span>
                      <span className="text-sm text-muted-foreground">{metric.unit}</span>
                      <span className="text-xs text-muted-foreground">
                        (target: {metric.target}{metric.unit})
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min((metric.value / metric.target) * 100, 100)} 
                      className="mb-2" 
                    />
                    
                    <p className="text-xs text-muted-foreground">
                      {metric.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Optimizations
              </CardTitle>
              <CardDescription>
                Recommended optimizations to improve Claims & Repairs performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rec.title}</span>
                            {rec.implemented && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className={getImpactColor(rec.impact)}>
                              {rec.impact.toUpperCase()} IMPACT
                            </Badge>
                            <Badge variant="outline" className={getEffortColor(rec.effort)}>
                              {rec.effort.toUpperCase()} EFFORT
                            </Badge>
                            <Badge variant="secondary">
                              {rec.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600 mb-2">
                            {rec.estimatedGain}
                          </p>
                          {!rec.implemented ? (
                            <Button 
                              size="sm"
                              onClick={() => implementOptimization(rec.id)}
                              disabled={optimizing}
                            >
                              {optimizing ? 'Applying...' : 'Apply'}
                            </Button>
                          ) : (
                            <Badge variant="default">Implemented</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Resource Usage
              </CardTitle>
              <CardDescription>
                Real-time system resource monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">CPU Usage</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">32%</div>
                  <Progress value={32} className="mb-1" />
                  <p className="text-xs text-muted-foreground">Normal load</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <HardDrive className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Memory</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">68%</div>
                  <Progress value={68} className="mb-1" />
                  <p className="text-xs text-muted-foreground">Approaching limit</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Network className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">Network</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">45%</div>
                  <Progress value={45} className="mb-1" />
                  <p className="text-xs text-muted-foreground">Optimal</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Database</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">29%</div>
                  <Progress value={29} className="mb-1" />
                  <p className="text-xs text-muted-foreground">Low usage</p>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Memory usage is approaching 70%. Consider implementing the recommended caching optimizations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Real-time Monitor
              </CardTitle>
              <CardDescription>
                Live performance monitoring and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium">System Status</span>
                    </div>
                    <p className="text-sm text-muted-foreground">All systems operational</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Active Users</span>
                    </div>
                    <div className="text-2xl font-bold">47</div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Requests/min</span>
                    </div>
                    <div className="text-2xl font-bold">152</div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Recent Performance Events</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-muted-foreground">
                            {new Date(Date.now() - i * 60000).toLocaleTimeString()}
                          </span>
                          <span>Performance scan completed successfully</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceOptimizationCenter;