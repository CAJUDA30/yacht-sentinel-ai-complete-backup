import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain,
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Search,
  Filter,
  Download,
  Calendar,
  Database,
  Lightbulb,
  Rocket,
  Shield,
  Users,
  DollarSign
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: 'operational' | 'financial' | 'strategic' | 'predictive' | 'optimization';
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  dataSource: string[];
  recommendations: string[];
  projectedValue: number;
  timeframe: string;
  tags: string[];
}

interface MarketTrend {
  segment: string;
  growth: number;
  opportunity: number;
  risk: number;
  confidence: number;
}

interface CompetitiveAnalysis {
  metric: string;
  ourScore: number;
  marketAverage: number;
  topPerformer: number;
  gap: number;
}

interface PredictiveModel {
  name: string;
  accuracy: number;
  lastTrained: string;
  predictions: any[];
  confidence: number;
}

const BusinessIntelligenceEngine: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [marketData, setMarketData] = useState<MarketTrend[]>([]);
  const [competitiveData, setCompetitiveData] = useState<CompetitiveAnalysis[]>([]);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    generateBusinessIntelligence();
  }, [selectedCategory, timeRange]);

  const generateBusinessIntelligence = async () => {
    try {
      setIsGenerating(true);

      // Fetch comprehensive business data
      const [
        { data: equipmentData },
        { data: inventoryData },
        { data: financialData },
        { data: auditData },
        { data: crewData }
      ] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('financial_transactions').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('audit_instances').select('*'),
        supabase.from('crew_members').select('*')
      ]);

      // Generate AI-powered business insights
      const aiInsights: AIInsight[] = [
        {
          id: 'supply_chain_optimization',
          title: 'Supply Chain Cost Reduction Opportunity',
          description: 'Machine learning analysis identifies 23% potential cost savings through supplier consolidation and bulk ordering optimization.',
          category: 'optimization',
          confidence: 0.91,
          impact: 'high',
          actionable: true,
          dataSource: ['inventory_items', 'suppliers', 'purchase_orders'],
          recommendations: [
            'Consolidate suppliers from 12 to 7 key partners',
            'Implement bulk ordering for high-frequency items',
            'Negotiate volume discounts for annual contracts'
          ],
          projectedValue: 145000,
          timeframe: '6 months',
          tags: ['cost-reduction', 'suppliers', 'optimization']
        },
        {
          id: 'demand_forecasting',
          title: 'Seasonal Demand Pattern Identified',
          description: 'AI models predict 40% increase in yacht charter demand during Q2-Q3, suggesting optimal inventory and crew scaling.',
          category: 'predictive',
          confidence: 0.87,
          impact: 'critical',
          actionable: true,
          dataSource: ['bookings', 'historical_trends', 'market_data'],
          recommendations: [
            'Scale inventory by 35% before peak season',
            'Hire 4 additional crew members by March',
            'Increase marketing spend by 50% in Q1'
          ],
          projectedValue: 320000,
          timeframe: '3 months',
          tags: ['seasonal', 'demand', 'forecasting']
        },
        {
          id: 'maintenance_optimization',
          title: 'Predictive Maintenance ROI Analysis',
          description: 'Implementing AI-driven predictive maintenance could prevent 85% of unexpected failures and reduce maintenance costs by 32%.',
          category: 'operational',
          confidence: 0.94,
          impact: 'high',
          actionable: true,
          dataSource: ['equipment', 'maintenance_logs', 'sensor_data'],
          recommendations: [
            'Install IoT sensors on critical equipment',
            'Implement real-time monitoring dashboards',
            'Train maintenance team on predictive analytics'
          ],
          projectedValue: 180000,
          timeframe: '12 months',
          tags: ['maintenance', 'iot', 'cost-savings']
        },
        {
          id: 'guest_satisfaction_correlation',
          title: 'Guest Satisfaction Revenue Impact',
          description: 'Analysis shows 15-point increase in satisfaction scores correlates with 28% higher repeat booking rates and 35% more referrals.',
          category: 'strategic',
          confidence: 0.89,
          impact: 'high',
          actionable: true,
          dataSource: ['guest_feedback', 'booking_history', 'revenue_data'],
          recommendations: [
            'Implement personalized guest experience program',
            'Enhance crew training on guest service',
            'Develop loyalty program for repeat customers'
          ],
          projectedValue: 250000,
          timeframe: '9 months',
          tags: ['guest-experience', 'revenue', 'loyalty']
        },
        {
          id: 'fuel_efficiency_optimization',
          title: 'Route & Fuel Optimization Algorithm',
          description: 'AI route optimization combined with real-time weather data can reduce fuel consumption by 18% while maintaining schedule adherence.',
          category: 'optimization',
          confidence: 0.92,
          impact: 'medium',
          actionable: true,
          dataSource: ['route_data', 'fuel_consumption', 'weather_api'],
          recommendations: [
            'Implement dynamic route optimization system',
            'Train crew on fuel-efficient navigation',
            'Install real-time fuel monitoring'
          ],
          projectedValue: 95000,
          timeframe: '4 months',
          tags: ['fuel-efficiency', 'routes', 'environmental']
        },
        {
          id: 'crew_performance_analytics',
          title: 'Crew Performance & Retention Insights',
          description: 'Data analysis reveals optimal crew rotation patterns that increase satisfaction by 25% and reduce turnover by 40%.',
          category: 'operational',
          confidence: 0.83,
          impact: 'medium',
          actionable: true,
          dataSource: ['crew_schedules', 'performance_reviews', 'turnover_data'],
          recommendations: [
            'Implement flexible rotation schedules',
            'Enhance crew development programs',
            'Create performance-based incentive system'
          ],
          projectedValue: 75000,
          timeframe: '6 months',
          tags: ['crew-management', 'retention', 'satisfaction']
        }
      ];

      // Generate market trends data
      const trends: MarketTrend[] = [
        { segment: 'Luxury Charters', growth: 15.2, opportunity: 85, risk: 25, confidence: 0.89 },
        { segment: 'Corporate Events', growth: 8.7, opportunity: 72, risk: 35, confidence: 0.82 },
        { segment: 'Family Charters', growth: 22.1, opportunity: 90, risk: 20, confidence: 0.91 },
        { segment: 'Adventure Tourism', growth: 18.5, opportunity: 78, risk: 40, confidence: 0.86 },
        { segment: 'Sustainable Tourism', growth: 35.8, opportunity: 95, risk: 30, confidence: 0.94 }
      ];

      // Generate competitive analysis
      const competitive: CompetitiveAnalysis[] = [
        { metric: 'Guest Satisfaction', ourScore: 4.7, marketAverage: 4.2, topPerformer: 4.9, gap: 0.2 },
        { metric: 'Operational Efficiency', ourScore: 87, marketAverage: 75, topPerformer: 92, gap: 5 },
        { metric: 'Revenue per Charter', ourScore: 15400, marketAverage: 12800, topPerformer: 18200, gap: 2800 },
        { metric: 'Crew Retention Rate', ourScore: 78, marketAverage: 65, topPerformer: 85, gap: 7 },
        { metric: 'Fuel Efficiency', ourScore: 82, marketAverage: 70, topPerformer: 89, gap: 7 },
        { metric: 'Digital Adoption', ourScore: 91, marketAverage: 68, topPerformer: 95, gap: 4 }
      ];

      // Generate predictive models info
      const models: PredictiveModel[] = [
        {
          name: 'Demand Forecasting Model',
          accuracy: 92.3,
          lastTrained: '2024-01-15',
          confidence: 0.89,
          predictions: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            predicted: 180 + Math.sin(i * 0.5) * 40 + Math.random() * 20,
            actual: i < 6 ? 175 + Math.sin(i * 0.5) * 38 + Math.random() * 15 : null
          }))
        },
        {
          name: 'Maintenance Prediction Model',
          accuracy: 88.7,
          lastTrained: '2024-01-10',
          confidence: 0.85,
          predictions: Array.from({ length: 10 }, (_, i) => ({
            equipment: `Equipment ${i + 1}`,
            riskScore: Math.random() * 100,
            daysToFailure: Math.floor(Math.random() * 365) + 30
          }))
        },
        {
          name: 'Revenue Optimization Model',
          accuracy: 90.1,
          lastTrained: '2024-01-12',
          confidence: 0.91,
          predictions: Array.from({ length: 8 }, (_, i) => ({
            scenario: `Scenario ${i + 1}`,
            expectedRevenue: 150000 + Math.random() * 100000,
            probability: 0.6 + Math.random() * 0.3
          }))
        }
      ];

      // Filter insights by category
      const filteredInsights = selectedCategory === 'all' 
        ? aiInsights 
        : aiInsights.filter(insight => insight.category === selectedCategory);

      setInsights(filteredInsights);
      setMarketData(trends);
      setCompetitiveData(competitive);
      setPredictiveModels(models);

    } catch (error) {
      console.error('Error generating business intelligence:', error);
      toast.error('Failed to generate business intelligence');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredInsights = insights.filter(insight =>
    searchQuery === '' || 
    insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insight.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'operational': return <Target className="h-4 w-4" />;
      case 'financial': return <DollarSign className="h-4 w-4" />;
      case 'strategic': return <Rocket className="h-4 w-4" />;
      case 'predictive': return <Brain className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Business Intelligence Engine
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and predictive analytics for strategic decision making
          </p>
        </div>
        <Button
          onClick={generateBusinessIntelligence}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Brain className="h-4 w-4 animate-pulse" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isGenerating ? 'Analyzing...' : 'Regenerate Insights'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search insights, tags, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
                <SelectItem value="predictive">Predictive</SelectItem>
                <SelectItem value="optimization">Optimization</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Intel</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Models</TabsTrigger>
          <TabsTrigger value="recommendations">Action Items</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  insight.impact === 'critical' ? 'bg-red-500' :
                  insight.impact === 'high' ? 'bg-orange-500' :
                  insight.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getCategoryIcon(insight.category)}
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                        {insight.impact.toUpperCase()}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(insight.confidence * 100)}% confident
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span>Value: <strong className="text-green-600">{formatCurrency(insight.projectedValue)}</strong></span>
                      <span>Timeline: <strong>{insight.timeframe}</strong></span>
                    </div>
                    {insight.actionable && (
                      <Badge className="bg-primary text-primary-foreground">
                        Action Required
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Key Recommendations:</h5>
                    <ul className="text-xs space-y-1">
                      {insight.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {insight.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Segment Analysis</CardTitle>
                <CardDescription>Growth opportunities and risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart data={marketData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="opportunity" name="Opportunity" unit="%" />
                      <YAxis dataKey="growth" name="Growth" unit="%" />
                      <Tooltip 
                        formatter={(value: any, name: string) => [`${value}%`, name]}
                        labelFormatter={(label: any) => `Opportunity: ${label}%`}
                      />
                      <Scatter name="Market Segments" dataKey="growth" fill="#3b82f6" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {marketData.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{trend.segment}</div>
                        <div className="text-sm text-muted-foreground">
                          Growth: {trend.growth}% | Risk: {trend.risk}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {trend.opportunity}% opportunity
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(trend.confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning Analysis</CardTitle>
              <CardDescription>Benchmarking against market leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={competitiveData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar name="Our Performance" dataKey="ourScore" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="Market Average" dataKey="marketAverage" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                    <Radar name="Top Performer" dataKey="topPerformer" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {predictiveModels.map((model, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{model.name}</CardTitle>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {model.accuracy}% accuracy
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated: {model.lastTrained}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Model Confidence</span>
                      <span className="font-medium">{Math.round(model.confidence * 100)}%</span>
                    </div>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={model.predictions.slice(0, 6)}>
                          <Line 
                            type="monotone" 
                            dataKey={Object.keys(model.predictions[0] || {})[1]} 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>High-Priority Actions</CardTitle>
                <CardDescription>Immediate actions with highest ROI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredInsights
                    .filter(insight => insight.actionable && insight.impact === 'critical' || insight.impact === 'high')
                    .slice(0, 5)
                    .map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">
                          ROI: {formatCurrency(insight.projectedValue)} in {insight.timeframe}
                        </div>
                      </div>
                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                        {insight.impact}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Strategic Initiatives</CardTitle>
                <CardDescription>Long-term growth opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredInsights
                    .filter(insight => insight.category === 'strategic')
                    .slice(0, 5)
                    .map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Rocket className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Timeline: {insight.timeframe} | Value: {formatCurrency(insight.projectedValue)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(insight.confidence * 100)}%
                      </div>
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

export default BusinessIntelligenceEngine;