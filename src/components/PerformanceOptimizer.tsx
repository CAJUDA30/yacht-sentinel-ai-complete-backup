import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  Settings, 
  Brain,
  Gauge,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Target,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface OptimizationMetric {
  id: string;
  category: string;
  name: string;
  currentValue: number;
  targetValue: number;
  improvement: number;
  status: 'optimized' | 'needs-attention' | 'critical';
  aiRecommendation: string;
  confidence: number;
  estimatedGain: string;
}

interface PerformanceArea {
  id: string;
  name: string;
  score: number;
  metrics: OptimizationMetric[];
  aiInsights: string[];
  optimizations: string[];
}

export const PerformanceOptimizer: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const { toast } = useToast();
  const [performanceAreas, setPerformanceAreas] = useState<PerformanceArea[]>([]);
  const [selectedArea, setSelectedArea] = useState('overall');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimized, setLastOptimized] = useState<Date | null>(null);

  // Initialize performance data
  useEffect(() => {
    const sampleData: PerformanceArea[] = [
      {
        id: 'overall',
        name: 'Overall Performance',
        score: 87,
        metrics: [
          {
            id: '1',
            category: 'System',
            name: 'Response Time',
            currentValue: 850,
            targetValue: 500,
            improvement: -41,
            status: 'needs-attention',
            aiRecommendation: 'Implement database indexing and query optimization',
            confidence: 0.89,
            estimatedGain: '41% faster response'
          },
          {
            id: '2',
            category: 'Operations',
            name: 'Task Completion Rate',
            currentValue: 94.5,
            targetValue: 98,
            improvement: 3.7,
            status: 'optimized',
            aiRecommendation: 'Maintain current workflow optimization patterns',
            confidence: 0.76,
            estimatedGain: '3.7% efficiency gain'
          },
          {
            id: '3',
            category: 'Resource',
            name: 'Memory Usage',
            currentValue: 78,
            targetValue: 65,
            improvement: -17,
            status: 'critical',
            aiRecommendation: 'Enable smart garbage collection and optimize data structures',
            confidence: 0.92,
            estimatedGain: '17% memory reduction'
          }
        ],
        aiInsights: [
          'Database queries could be optimized using predictive caching',
          'Crew scheduling patterns show 23% efficiency gain potential',
          'Memory usage spikes correlate with inventory updates'
        ],
        optimizations: [
          'Implement smart caching layer',
          'Optimize crew rotation algorithms',
          'Enable background data processing'
        ]
      },
      {
        id: 'maintenance',
        name: 'Maintenance Operations',
        score: 91,
        metrics: [
          {
            id: '4',
            category: 'Scheduling',
            name: 'Predictive Accuracy',
            currentValue: 88,
            targetValue: 95,
            improvement: 8,
            status: 'needs-attention',
            aiRecommendation: 'Integrate IoT sensor data for better predictions',
            confidence: 0.84,
            estimatedGain: '8% better predictions'
          },
          {
            id: '5',
            category: 'Parts',
            name: 'Inventory Optimization',
            currentValue: 73,
            targetValue: 85,
            improvement: 16,
            status: 'needs-attention',
            aiRecommendation: 'Implement AI-driven demand forecasting',
            confidence: 0.91,
            estimatedGain: '16% cost reduction'
          }
        ],
        aiInsights: [
          'Maintenance patterns suggest optimal 6-month intervals for engine servicing',
          'Parts usage forecasting could improve by incorporating seasonal patterns'
        ],
        optimizations: [
          'Smart maintenance scheduling',
          'Predictive parts ordering',
          'IoT-driven monitoring'
        ]
      },
      {
        id: 'crew',
        name: 'Crew Management',
        score: 82,
        metrics: [
          {
            id: '6',
            category: 'Scheduling',
            name: 'Shift Efficiency',
            currentValue: 79,
            targetValue: 90,
            improvement: 14,
            status: 'needs-attention',
            aiRecommendation: 'Optimize shift rotations based on task complexity',
            confidence: 0.87,
            estimatedGain: '14% efficiency boost'
          }
        ],
        aiInsights: [
          'Crew performance peaks at 6-hour rotation intervals',
          'Task assignments could be optimized based on individual strengths'
        ],
        optimizations: [
          'Dynamic shift optimization',
          'Skill-based task allocation',
          'Performance-driven scheduling'
        ]
      }
    ];

    setPerformanceAreas(sampleData);
  }, []);

  const runOptimization = async (areaId?: string) => {
    setIsOptimizing(true);
    try {
      const targetArea = areaId || selectedArea;
      const area = performanceAreas.find(a => a.id === targetArea);
      
      if (!area) return;

      // Get current system state for optimization
      const systemState = {
        area: area.name,
        currentMetrics: area.metrics.map(m => ({
          name: m.name,
          value: m.currentValue,
          target: m.targetValue,
          status: m.status
        })),
        insights: area.aiInsights,
        timestamp: new Date().toISOString()
      };

      const response = await processWithAllLLMs({
        content: `Optimize performance for ${area.name}: ${JSON.stringify(systemState)}`,
        context: 'Advanced performance optimization analysis',
        type: 'optimization',
        module: targetArea,
        priority: 'high'
      });

      if (response.consensus) {
        // Simulate optimization improvements
        setPerformanceAreas(prev => prev.map(a => {
          if (a.id === targetArea) {
            const optimizedMetrics = a.metrics.map(m => {
              const improvement = Math.random() * 15 + 5; // 5-20% improvement
              const newValue = m.status === 'critical' ? 
                m.currentValue + (m.targetValue - m.currentValue) * 0.7 :
                Math.min(m.targetValue, m.currentValue + improvement);
              
              return {
                ...m,
                currentValue: Math.round(newValue * 100) / 100,
                improvement: Math.round(((newValue - m.currentValue) / m.currentValue) * 100),
                status: newValue >= m.targetValue * 0.95 ? 'optimized' as const :
                        newValue >= m.targetValue * 0.8 ? 'needs-attention' as const : 'critical' as const
              };
            });

            const newScore = Math.min(100, a.score + Math.random() * 10 + 3);

            return {
              ...a,
              score: Math.round(newScore),
              metrics: optimizedMetrics,
              aiInsights: [...a.aiInsights, response.consensus],
              optimizations: response.recommendations || a.optimizations
            };
          }
          return a;
        }));

        setLastOptimized(new Date());
        
        toast({
          title: "Optimization Complete",
          description: `Performance improvements applied to ${area.name}`,
        });
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Could not complete performance optimization.",
        variant: "destructive",
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimized': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimized': return 'default';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const currentArea = performanceAreas.find(a => a.id === selectedArea);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Performance Optimizer
          </h2>
          <p className="text-muted-foreground">AI-powered system optimization and performance tuning</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => runOptimization()} 
            disabled={isOptimizing}
            variant="default"
          >
            <Brain className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-pulse' : ''}`} />
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {lastOptimized && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Last optimized:</span>
              <span className="text-sm">{lastOptimized.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {performanceAreas.map((area) => (
          <Card 
            key={area.id}
            className={`cursor-pointer transition-all shadow-neumorphic ${
              selectedArea === area.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedArea(area.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{area.name}</h3>
                <Badge variant="outline">{area.metrics.length} metrics</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4" />
                <span className={`text-2xl font-bold ${getScoreColor(area.score)}`}>
                  {area.score}%
                </span>
              </div>
              <Progress value={area.score} className="h-2" />
              <div className="mt-2 flex items-center gap-1">
                {area.metrics.map((metric) => getStatusIcon(metric.status))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {currentArea && (
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <div className="grid gap-4">
              {currentArea.metrics.map((metric) => (
                <Card key={metric.id} className="shadow-neumorphic">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(metric.status)}
                        <div>
                          <h4 className="font-semibold">{metric.name}</h4>
                          <p className="text-sm text-muted-foreground">{metric.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(metric.status) as any}>
                          {metric.status}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {Math.round(metric.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="text-lg font-semibold">
                          {metric.currentValue}
                          {metric.name.includes('Rate') || metric.name.includes('Usage') ? '%' : 
                           metric.name.includes('Time') ? 'ms' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="text-lg font-semibold">
                          {metric.targetValue}
                          {metric.name.includes('Rate') || metric.name.includes('Usage') ? '%' : 
                           metric.name.includes('Time') ? 'ms' : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Potential Gain</p>
                        <p className={`text-lg font-semibold ${
                          metric.improvement > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {metric.improvement > 0 ? '+' : ''}{metric.improvement}%
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <Progress 
                        value={(metric.currentValue / metric.targetValue) * 100} 
                        className="h-2" 
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">AI Recommendation:</span>
                      </div>
                      <p className="text-sm text-muted-foreground pl-6">
                        {metric.aiRecommendation}
                      </p>
                      <div className="flex items-center gap-2 pl-6">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs font-medium">{metric.estimatedGain}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <Card className="shadow-neumorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentArea.aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimizations">
            <Card className="shadow-neumorphic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Available Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentArea.optimizations.map((optimization, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">{optimization}</span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => runOptimization(currentArea.id)}
                        disabled={isOptimizing}
                      >
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PerformanceOptimizer;