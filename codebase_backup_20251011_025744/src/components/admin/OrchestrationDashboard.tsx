import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  Settings, 
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity,
  Cpu,
  Database,
  Network
} from 'lucide-react';
import { useOrchestrationEngine } from '@/hooks/useOrchestrationEngine';
import { useToast } from '@/hooks/use-toast';
import { OrchestrationRuleModal } from './OrchestrationRuleModal';
import { LoadBalancingConfig } from './LoadBalancingConfig';
import { ConsensusConfig } from './ConsensusConfig';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const OrchestrationDashboard: React.FC = () => {
  const { toast } = useToast();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  
  const {
    orchestrationRules,
    analytics,
    modelPerformance,
    activeRules,
    totalCost,
    avgLatency,
    successRate,
    costSavings,
    isLoading,
    optimizePerformance
  } = useOrchestrationEngine();

  const handleOptimize = async () => {
    try {
      await optimizePerformance.mutateAsync();
      toast({
        title: 'Performance optimized',
        description: 'Orchestration rules have been automatically optimized'
      });
    } catch (error) {
      toast({
        title: 'Optimization failed',
        description: String(error),
        variant: 'destructive'
      });
    }
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend && (
                <Badge variant={trend > 0 ? 'default' : 'destructive'} className="text-xs">
                  {trend > 0 ? '+' : ''}{trend}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const modelUsageData = analytics.data?.model_usage_distribution 
    ? Object.entries(analytics.data.model_usage_distribution).map(([name, value]) => ({
        name: name.split('-')[0], // Shorten model names
        value,
        percentage: Math.round((value / Object.values(analytics.data.model_usage_distribution).reduce((a, b) => a + b, 0)) * 100)
      }))
    : [];

  const performanceTrendData = analytics.data?.performance_trends?.map(trend => ({
    metric: trend.metric,
    current: trend.current_value,
    previous: trend.previous_value,
    change: trend.change_percentage
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Orchestration Dashboard</h2>
          <p className="text-muted-foreground">
            Intelligent routing and optimization across {activeRules.length} active rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleOptimize}
            disabled={optimizePerformance.isPending}
          >
            <Zap className={`w-4 h-4 mr-2 ${optimizePerformance.isPending ? 'animate-spin' : ''}`} />
            Auto-Optimize
          </Button>
          <Button onClick={() => setShowRuleModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${Math.round(successRate * 100)}%`}
          subtitle="Last 24 hours"
          icon={CheckCircle}
          trend={5.2}
        />
        <MetricCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          subtitle="Cross-model average"
          icon={Clock}
          trend={-12.5}
        />
        <MetricCard
          title="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          subtitle="Current month"
          icon={DollarSign}
          trend={-8.1}
        />
        <MetricCard
          title="Cost Savings"
          value={`${Math.round(costSavings)}%`}
          subtitle="vs single model"
          icon={TrendingUp}
          trend={3.7}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="rules">Rules ({activeRules.length})</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {modelUsageData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="current" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="previous" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Suggestions */}
          {analytics.data?.optimization_suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Optimization Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.data.optimization_suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        {suggestion.priority === 'high' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                        {suggestion.priority === 'medium' && <Activity className="w-5 h-5 text-blue-500" />}
                        {suggestion.priority === 'low' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'outline'}>
                            {suggestion.priority} priority
                          </Badge>
                          <Badge variant="secondary">{suggestion.type}</Badge>
                        </div>
                        <h4 className="font-medium">{suggestion.suggestion}</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.impact}</p>
                        {suggestion.estimated_savings && (
                          <p className="text-sm text-green-600 font-medium">
                            Estimated savings: ${suggestion.estimated_savings}/month
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {modelPerformance.data?.map((model) => (
                    <div key={model.model_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{model.model_id}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">${model.cost_per_1k_tokens}/1k tokens</Badge>
                          <Badge variant={model.availability_score > 0.95 ? 'default' : 'secondary'}>
                            {Math.round(model.availability_score * 100)}% uptime
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Latency</p>
                          <p className="font-medium">{model.avg_latency_ms}ms</p>
                          <Progress value={Math.min(100, (1000 - model.avg_latency_ms) / 10)} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{Math.round(model.success_rate * 100)}%</p>
                          <Progress value={model.success_rate * 100} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quality Score</p>
                          <p className="font-medium">{model.quality_score?.toFixed(1) || 'N/A'}</p>
                          <Progress value={model.quality_score * 20} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orchestrationRules.data?.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Task: {rule.task_type} • Threshold: {Math.round(rule.performance_threshold * 100)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rule.conditions.length} conditions • {rule.fallback_models.length} fallbacks
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRule(rule);
                        setShowRuleModal(true);
                      }}
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelPerformance.data?.map((model) => (
              <Card key={model.model_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{model.model_id}</span>
                    <Badge variant="outline" className="text-xs">
                      {model.trend_7d === 'up' && '↗'}
                      {model.trend_7d === 'down' && '↘'}
                      {model.trend_7d === 'stable' && '→'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Throughput</span>
                    <span className="font-medium">{model.throughput_rpm} RPM</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span className="font-medium">{model.avg_latency_ms}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">{Math.round(model.success_rate * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium">${model.cost_per_1k_tokens}/1k</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LoadBalancingConfig />
            <ConsensusConfig />
          </div>
        </TabsContent>
      </Tabs>

      <OrchestrationRuleModal
        open={showRuleModal}
        rule={selectedRule}
        onClose={() => {
          setShowRuleModal(false);
          setSelectedRule(null);
        }}
        onSaved={() => {
          setShowRuleModal(false);
          setSelectedRule(null);
          orchestrationRules.refetch();
        }}
      />
    </div>
  );
};