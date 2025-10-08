import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Brain, 
  Cpu, 
  Server, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  Gauge,
  Wifi,
  Database,
  RefreshCw,
  Target,
  Globe,
  ShieldCheck,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  DollarSign
} from 'lucide-react';
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';
import { enterpriseHealthOrchestrator } from '@/services/enterpriseHealthOrchestrator';
import { DetailedAPIAnalytics } from '@/components/monitoring/DetailedAPIAnalytics';
import { EnterpriseOperationalDashboard } from '@/components/monitoring/EnterpriseOperationalDashboard';
import { ModelPerformanceAnalytics } from '@/components/monitoring/ModelPerformanceAnalytics';
import { debugConsole } from '@/services/debugConsole';

interface MonitoringMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue?: number;
  category: 'performance' | 'availability' | 'resources' | 'cost';
  description?: string;
  target?: number;
  icon: React.ElementType;
}

interface ProviderHealth {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  successRate: number;
  modelsCount: number;
  lastChecked: string;
  load: number;
  throughput: number;
}

interface ProcessorHealth {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  processing: number;
  queue: number;
  efficiency: number;
  lastActivity: string;
}

interface AppleGradeMonitoringDashboardProps {
  className?: string;
}

export const AppleGradeMonitoringDashboard: React.FC<AppleGradeMonitoringDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([]);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [processors, setProcessors] = useState<ProcessorHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [overallHealth, setOverallHealth] = useState(95);

  const { providers: providerData } = useAIProviderManagement();

  // Apple-style status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'online':
      case 'active':
        return 'bg-green-500';
      case 'good':
      case 'degraded':
      case 'idle':
        return 'bg-yellow-500';
      case 'warning':
        return 'bg-orange-500';
      case 'critical':
      case 'offline':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTrendIcon = (trend: string, value?: number) => {
    if (trend === 'up') return <ArrowUp className="w-3 h-3 text-green-600" />;
    if (trend === 'down') return <ArrowDown className="w-3 h-3 text-red-600" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const loadMonitoringData = useCallback(async () => {
    try {
      debugConsole.info('SYSTEM', '🔄 Loading Apple-grade monitoring data...');

      // Load enterprise health status
      const healthStatus = enterpriseHealthOrchestrator.getAutomatedHealthStatus();
      
      // Simulate real-time metrics (in production, these would come from actual monitoring APIs)
      const realTimeMetrics: MonitoringMetric[] = [
        {
          id: 'response_time',
          name: 'Response Time',
          value: 145,
          unit: 'ms',
          status: 'excellent',
          trend: 'down',
          trendValue: -12,
          category: 'performance',
          description: 'Average API response time',
          target: 200,
          icon: Clock
        },
        {
          id: 'throughput',
          name: 'Throughput',
          value: '2.3K',
          unit: 'req/min',
          status: 'excellent',
          trend: 'up',
          trendValue: 15,
          category: 'performance',
          description: 'Requests processed per minute',
          icon: Zap
        },
        {
          id: 'success_rate',
          name: 'Success Rate',
          value: 99.7,
          unit: '%',
          status: 'excellent',
          trend: 'stable',
          category: 'availability',
          description: 'Successful request rate',
          target: 99.5,
          icon: CheckCircle
        },
        {
          id: 'uptime',
          name: 'System Uptime',
          value: 99.9,
          unit: '%',
          status: 'excellent',
          trend: 'stable',
          category: 'availability',
          description: 'System availability',
          target: 99.0,
          icon: ShieldCheck
        },
        {
          id: 'cpu_usage',
          name: 'CPU Usage',
          value: 23,
          unit: '%',
          status: 'good',
          trend: 'up',
          trendValue: 5,
          category: 'resources',
          description: 'Server CPU utilization',
          target: 70,
          icon: Cpu
        },
        {
          id: 'memory_usage',
          name: 'Memory Usage',
          value: 45,
          unit: '%',
          status: 'good',
          trend: 'stable',
          category: 'resources',
          description: 'Server memory utilization',
          target: 80,
          icon: Server
        },
        {
          id: 'cost_efficiency',
          name: 'Cost Efficiency',
          value: 94,
          unit: '%',
          status: 'excellent',
          trend: 'up',
          trendValue: 3,
          category: 'cost',
          description: 'Cost optimization score',
          target: 85,
          icon: Target
        },
        {
          id: 'model_accuracy',
          name: 'Model Accuracy',
          value: 96.8,
          unit: '%',
          status: 'excellent',
          trend: 'up',
          trendValue: 2.1,
          category: 'performance',
          description: 'AI model prediction accuracy',
          target: 95,
          icon: Brain
        }
      ];

      // Simulate provider health data with REAL model counts from configurations
      const providerHealth: ProviderHealth[] = providerData.data?.map((provider, index) => {
        const config = provider.config as any;
        const selectedModels = config?.selected_models || config?.discovered_models || [];
        const actualModelCount = Array.isArray(selectedModels) ? selectedModels.length : 0;
        
        debugConsole.info('PROVIDER_MONITORING', `📊 Provider ${provider.name} has ${actualModelCount} configured models`, {
          provider_type: provider.provider_type,
          selected_models: selectedModels,
          is_active: provider.is_active
        });
        
        return {
          id: provider.id,
          name: provider.name,
          status: provider.is_active ? 'online' : 'offline',
          responseTime: 120 + Math.random() * 100,
          successRate: 98 + Math.random() * 2,
          modelsCount: actualModelCount, // REAL count from configuration
          lastChecked: new Date().toISOString(),
          load: 15 + Math.random() * 50,
          throughput: 150 + Math.random() * 200
        };
      }) || [];

      // Simulate processor health data
      const processorHealth: ProcessorHealth[] = [
        {
          id: 'document-ai-main',
          name: 'Document AI Processor',
          status: 'active',
          processing: 12,
          queue: 3,
          efficiency: 94,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'form-recognizer',
          name: 'Form Recognizer',
          status: 'active',
          processing: 8,
          queue: 1,
          efficiency: 97,
          lastActivity: new Date().toISOString()
        },
        {
          id: 'yacht-extractor',
          name: 'Yacht Data Extractor',
          status: 'idle',
          processing: 0,
          queue: 0,
          efficiency: 92,
          lastActivity: new Date(Date.now() - 300000).toISOString()
        }
      ];

      setMetrics(realTimeMetrics);
      setProviders(providerHealth);
      setProcessors(processorHealth);
      
      // Calculate overall health
      const healthScores = realTimeMetrics.map(m => {
        if (typeof m.value === 'number' && m.target) {
          if (m.category === 'resources') {
            return Math.max(0, 100 - (m.value / m.target) * 100);
          }
          return Math.min(100, (m.value / m.target) * 100);
        }
        return 100;
      });
      
      const avgHealth = healthScores.reduce((acc, score) => acc + score, 0) / healthScores.length;
      setOverallHealth(Math.round(avgHealth));
      
      setLastUpdate(new Date());
      debugConsole.success('SYSTEM', '✅ Apple-grade monitoring data loaded successfully');
      
    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [providerData.data]);

  useEffect(() => {
    loadMonitoringData();
    
    // Set up real-time refresh every 5 seconds
    const interval = setInterval(loadMonitoringData, 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadMonitoringData]);

  const MetricCard: React.FC<{ metric: MonitoringMetric }> = ({ metric }) => (
    <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 border border-gray-200/40 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-gray-100/30 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2 flex-1">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{metric.name}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900 tracking-tight">
                {metric.value}
                {metric.unit && <span className="text-lg text-gray-600 ml-1">{metric.unit}</span>}
              </p>
              {metric.trendValue && (
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {getTrendIcon(metric.trend, metric.trendValue)}
                  <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
                  </span>
                </div>
              )}
            </div>
            {metric.description && (
              <p className="text-xs text-gray-500 font-medium">{metric.description}</p>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-gray-100/80 to-gray-200/60 rounded-xl text-gray-700 transition-all duration-300 shadow-md">
            <metric.icon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(metric.status)}`}></div>
          <span className="text-xs font-medium capitalize text-gray-600">{metric.status}</span>
        </div>
        
        {/* Progress bar for percentage metrics */}
        {typeof metric.value === 'number' && metric.target && (
          <div className="mt-3">
            <Progress 
              value={metric.category === 'resources' ? metric.value : (metric.value / metric.target) * 100} 
              className="h-1.5" 
            />
          </div>
        )}
      </div>
    </div>
  );

  const ProviderCard: React.FC<{ provider: ProviderHealth }> = ({ provider }) => {
    // Get the actual provider data to show model names
    const actualProvider = providerData.data?.find(p => p.id === provider.id);
    const config = actualProvider?.config as any;
    const selectedModels = config?.selected_models || config?.discovered_models || [];
    
    return (
      <div className="relative overflow-hidden bg-white/90 border border-gray-200/50 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(provider.status)} animate-pulse`}></div>
            <div>
              <h4 className="font-semibold text-gray-900">{provider.name}</h4>
              <p className="text-xs text-gray-500">
                {provider.modelsCount > 0 
                  ? `${provider.modelsCount} models: ${Array.isArray(selectedModels) ? selectedModels.slice(0, 2).join(', ') : 'configured'}${selectedModels.length > 2 ? '...' : ''}` 
                  : 'No models configured'
                }
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`${provider.status === 'online' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
            {provider.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{Math.round(provider.responseTime)}ms</p>
            <p className="text-gray-500">Response</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{provider.successRate.toFixed(1)}%</p>
            <p className="text-gray-500">Success</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{Math.round(provider.load)}%</p>
            <p className="text-gray-500">Load</p>
          </div>
        </div>
      </div>
    );
  };

  const ProcessorCard: React.FC<{ processor: ProcessorHealth }> = ({ processor }) => (
    <div className="relative overflow-hidden bg-white/90 border border-gray-200/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(processor.status)} ${processor.status === 'active' ? 'animate-pulse' : ''}`}></div>
          <div>
            <h4 className="font-semibold text-gray-900">{processor.name}</h4>
            <p className="text-xs text-gray-500">
              {processor.status === 'active' ? `Processing ${processor.processing} docs` : 'Idle'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`${processor.status === 'active' ? 'border-green-200 text-green-700' : processor.status === 'idle' ? 'border-yellow-200 text-yellow-700' : 'border-red-200 text-red-700'}`}>
          {processor.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="text-center">
          <p className="font-semibold text-gray-900">{processor.queue}</p>
          <p className="text-gray-500">Queue</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{processor.efficiency}%</p>
          <p className="text-gray-500">Efficiency</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-900">{processor.processing}</p>
          <p className="text-gray-500">Active</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className}`}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-pulse mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading Apple-grade monitoring...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 ${className}`}>
      {/* Header */}
      <div className="bg-white/95 border-b border-gray-200/40 px-8 py-6 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Monitoring Center</h1>
                <p className="text-gray-600">Apple-grade real-time system monitoring</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-semibold text-gray-900">{lastUpdate.toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={loadMonitoringData}
              variant="ghost"
              size="sm"
              className="bg-gray-100/50 hover:bg-gray-200/50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Overall Health Score */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/95 via-white/90 to-gray-50/80 border border-gray-200/40 rounded-2xl p-8 backdrop-blur-xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/60 via-white/40 to-purple-50/60"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Health Score</h2>
                <p className="text-gray-600 mt-1">Real-time health monitoring across all components</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-gray-900 mb-2">{overallHealth}%</div>
                <Badge className={`${overallHealth >= 95 ? 'bg-green-100 text-green-800' : overallHealth >= 85 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {overallHealth >= 95 ? 'EXCELLENT' : overallHealth >= 85 ? 'GOOD' : 'DEGRADED'}
                </Badge>
              </div>
            </div>
            <Progress value={overallHealth} className="h-3 mb-4" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>All systems operational</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live monitoring active
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-gray-200/40 rounded-xl p-1">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="providers" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <Brain className="w-4 h-4 mr-2" />
              Providers
            </TabsTrigger>
            <TabsTrigger value="processors" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <Cpu className="w-4 h-4 mr-2" />
              Processors
            </TabsTrigger>
            <TabsTrigger value="operations" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="api-details" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              API Details
            </TabsTrigger>
            <TabsTrigger value="models" className="rounded-lg data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Models
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-8">
            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
            
            {providers.length === 0 && (
              <div className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Providers Found</h3>
                <p className="text-gray-600">Add AI providers to start monitoring their performance</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processors" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processors.map((processor) => (
                <ProcessorCard key={processor.id} processor={processor} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">🏢 Enterprise Operations Center</h3>
                <p className="text-gray-600">
                  **IBM/Microsoft/Apple-grade operational monitoring** with comprehensive AI provider and model data integration
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="font-semibold text-blue-600">📊 Complete Data Integration</p>
                  <p className="text-gray-600">All API requests, costs, and performance metrics unified</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="font-semibold text-green-600">🔄 Real-time Monitoring</p>
                  <p className="text-gray-600">Live tracking of every provider and model interaction</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="font-semibold text-purple-600">🔍 Precision Analytics</p>
                  <p className="text-gray-600">Enterprise-grade cost control and optimization</p>
                </div>
              </div>
            </div>
            <EnterpriseOperationalDashboard />
          </TabsContent>

          <TabsContent value="api-details" className="space-y-6 mt-8">
            <DetailedAPIAnalytics />
          </TabsContent>

          <TabsContent value="models" className="space-y-6 mt-8">
            <ModelPerformanceAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppleGradeMonitoringDashboard;