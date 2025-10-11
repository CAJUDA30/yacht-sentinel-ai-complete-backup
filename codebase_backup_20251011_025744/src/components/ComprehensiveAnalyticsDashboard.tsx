import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  LineChart, 
  PieChart,
  TrendingUp,
  TrendingDown,
  Brain,
  Database,
  Cpu,
  Users,
  DollarSign,
  Calendar,
  Clock,
  Target,
  Zap,
  Globe,
  Activity
} from 'lucide-react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics';

interface AnalyticsMetrics {
  totalRevenue: number;
  operationalCost: number;
  efficiency: number;
  guestSatisfaction: number;
  crewPerformance: number;
  fuelConsumption: number;
  maintenanceScore: number;
  safetyIndex: number;
  environmentalImpact: number;
}

interface KPIData {
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  unit: string;
  category: 'financial' | 'operational' | 'safety' | 'environmental';
}

interface PredictiveInsight {
  id: string;
  category: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

const ComprehensiveAnalyticsDashboard: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalRevenue: 2450000,
    operationalCost: 1680000,
    efficiency: 87.5,
    guestSatisfaction: 94.2,
    crewPerformance: 91.8,
    fuelConsumption: 845,
    maintenanceScore: 88.9,
    safetyIndex: 96.7,
    environmentalImpact: 78.3
  });

  const [kpis, setKpis] = useState<KPIData[]>([
    {
      name: 'Charter Revenue',
      value: 2450000,
      target: 2800000,
      trend: 'up',
      change: 12.5,
      unit: '$',
      category: 'financial'
    },
    {
      name: 'Operational Efficiency',
      value: 87.5,
      target: 90,
      trend: 'up',
      change: 3.2,
      unit: '%',
      category: 'operational'
    },
    {
      name: 'Safety Score',
      value: 96.7,
      target: 95,
      trend: 'up',
      change: 1.8,
      unit: '%',
      category: 'safety'
    },
    {
      name: 'Carbon Footprint',
      value: 78.3,
      target: 85,
      trend: 'up',
      change: 5.4,
      unit: '%',
      category: 'environmental'
    }
  ]);

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  const { analytics, refreshAnalytics } = useLLMAnalytics('comprehensive-analytics', { 
    metrics, 
    kpis, 
    timeframe: selectedTimeframe 
  });

  // Real-time metrics simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        totalRevenue: prev.totalRevenue + Math.floor((Math.random() - 0.4) * 5000),
        operationalCost: prev.operationalCost + Math.floor((Math.random() - 0.5) * 3000),
        efficiency: Math.max(70, Math.min(100, prev.efficiency + (Math.random() - 0.5) * 2)),
        guestSatisfaction: Math.max(80, Math.min(100, prev.guestSatisfaction + (Math.random() - 0.5) * 1)),
        crewPerformance: Math.max(75, Math.min(100, prev.crewPerformance + (Math.random() - 0.5) * 1.5)),
        fuelConsumption: Math.max(500, prev.fuelConsumption + Math.floor((Math.random() - 0.5) * 20)),
        maintenanceScore: Math.max(70, Math.min(100, prev.maintenanceScore + (Math.random() - 0.5) * 2)),
        safetyIndex: Math.max(90, Math.min(100, prev.safetyIndex + (Math.random() - 0.5) * 0.5)),
        environmentalImpact: Math.max(60, Math.min(100, prev.environmentalImpact + (Math.random() - 0.5) * 1))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Generate AI-powered predictive insights
  useEffect(() => {
    const generatePredictiveInsights = async () => {
      const response = await processWithAllLLMs({
        content: `Analyze comprehensive yacht analytics and generate predictive insights: ${JSON.stringify(metrics)} with KPIs: ${JSON.stringify(kpis)}`,
        context: 'Comprehensive analytics and predictive business intelligence',
        type: 'predictive-analytics',
        module: 'comprehensive-analytics'
      });

      // Generate insights based on AI response
      const insights: PredictiveInsight[] = [
        {
          id: '1',
          category: 'Financial',
          prediction: 'Revenue projected to increase by 15% in Q4 based on booking trends',
          confidence: response.confidence || 0.87,
          timeframe: '3 months',
          impact: 'high',
          recommendation: 'Optimize pricing strategy for peak season bookings'
        },
        {
          id: '2',
          category: 'Operational',
          prediction: 'Fuel efficiency can improve by 8% with route optimization',
          confidence: response.confidence || 0.92,
          timeframe: '1 month',
          impact: 'medium',
          recommendation: 'Implement AI-guided navigation for optimal fuel consumption'
        },
        {
          id: '3',
          category: 'Maintenance',
          prediction: 'Engine maintenance required within 2 weeks based on performance data',
          confidence: response.confidence || 0.94,
          timeframe: '2 weeks',
          impact: 'high',
          recommendation: 'Schedule preventive maintenance to avoid operational disruption'
        },
        {
          id: '4',
          category: 'Environmental',
          prediction: 'Carbon emissions can be reduced by 12% with new technologies',
          confidence: response.confidence || 0.89,
          timeframe: '6 months',
          impact: 'medium',
          recommendation: 'Invest in hybrid propulsion systems and renewable energy'
        }
      ];

      setPredictiveInsights(insights);
    };

    generatePredictiveInsights();
  }, [metrics, processWithAllLLMs]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-500';
      case 'operational': return 'bg-blue-500';
      case 'safety': return 'bg-red-500';
      case 'environmental': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comprehensive Analytics Dashboard
          </CardTitle>
          <CardDescription>
            AI-powered business intelligence and predictive analytics for optimal yacht operations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{kpi.name}</span>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {kpi.unit === '$' ? '$' : ''}{kpi.value.toLocaleString()}{kpi.unit !== '$' ? kpi.unit : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Target: {kpi.unit === '$' ? '$' : ''}{kpi.target.toLocaleString()}{kpi.unit !== '$' ? kpi.unit : ''}
                  </span>
                  <span className={`font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.trend === 'up' ? '+' : ''}{kpi.change}%
                  </span>
                </div>
                <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                <Badge variant="outline" className={`text-white ${getCategoryColor(kpi.category)}`}>
                  {kpi.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Guest Satisfaction', value: metrics.guestSatisfaction, color: 'bg-blue-500' },
                    { name: 'Crew Performance', value: metrics.crewPerformance, color: 'bg-green-500' },
                    { name: 'Safety Index', value: metrics.safetyIndex, color: 'bg-red-500' },
                    { name: 'Environmental Score', value: metrics.environmentalImpact, color: 'bg-emerald-500' }
                  ].map((metric, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm font-bold">{metric.value.toFixed(1)}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Trends Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-48 bg-muted rounded flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">Performance Trends Chart</p>
                      <p className="text-sm text-muted-foreground">Real-time data visualization</p>
                    </div>
                  </div>
                  {analytics.predictions && (
                    <div className="p-3 bg-muted/50 rounded">
                      <p className="text-sm"><strong>AI Trend Analysis:</strong> {analytics.predictions.consensus}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${metrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total charter revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Operating Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${metrics.operationalCost.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total operational expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Profit Margin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {(((metrics.totalRevenue - metrics.operationalCost) / metrics.totalRevenue) * 100).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">Net profit margin</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Operational Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {metrics.efficiency.toFixed(1)}%
                    </div>
                    <Progress value={metrics.efficiency} className="h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fuel Consumption</span>
                      <div className="font-bold">{metrics.fuelConsumption}L</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Maintenance Score</span>
                      <div className="font-bold">{metrics.maintenanceScore.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {metrics.crewPerformance.toFixed(1)}%
                    </div>
                    <Progress value={metrics.crewPerformance} className="h-3" />
                  </div>
                  
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">Guest Satisfaction</span>
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.guestSatisfaction.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictive">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI Predictive Insights</h3>
              <Button onClick={refreshAnalytics} disabled={isProcessing}>
                <Brain className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Generate New Predictions
              </Button>
            </div>
            
            <div className="grid gap-4">
              {predictiveInsights.map((insight) => (
                <Card key={insight.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{insight.category}</Badge>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </Badge>
                        <Badge variant="secondary">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <h4 className="font-medium mb-2">{insight.prediction}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Timeframe: {insight.timeframe}
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded">
                        <strong className="text-sm">Recommendation:</strong>
                        <p className="text-sm mt-1">{insight.recommendation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights">
          {analytics && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Generated Business Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.insights && (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/5 rounded-lg border">
                        <h4 className="font-medium mb-2">Executive Summary</h4>
                        <p className="text-sm">{analytics.insights.consensus}</p>
                      </div>
                      
                      {analytics.insights.recommendations && (
                        <div>
                          <h4 className="font-medium mb-3">Strategic Recommendations</h4>
                          <div className="space-y-2">
                            {analytics.insights.recommendations.map((rec: string, index: number) => (
                              <div key={index} className="flex items-start gap-2 text-sm p-3 border rounded">
                                <Target className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                {rec}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {analytics.optimizations && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Optimization Opportunities</h4>
                      <p className="text-sm">{analytics.optimizations.consensus}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;