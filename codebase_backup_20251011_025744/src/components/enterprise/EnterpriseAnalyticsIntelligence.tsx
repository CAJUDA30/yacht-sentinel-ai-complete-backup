import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  Users,
  Ship,
  Calendar,
  Target,
  Zap,
  Brain,
  PieChart,
  LineChart,
  Download,
  Lightbulb,
  Plus
} from 'lucide-react';

interface ExecutiveKPI {
  name: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  target: string;
  status: 'on-track' | 'at-risk' | 'critical';
  icon: React.ComponentType<any>;
}

interface BusinessInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  category: string;
  timestamp: string;
}

interface PredictiveModel {
  name: string;
  accuracy: number;
  lastTrained: string;
  predictions: {
    timeframe: string;
    metric: string;
    current: number;
    predicted: number;
    confidence: number;
  }[];
}

export default function EnterpriseAnalyticsIntelligence() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [executiveKPIs, setExecutiveKPIs] = useState<ExecutiveKPI[]>([]);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsight[]>([]);
  const [predictiveModels, setPredictiveModels] = useState<PredictiveModel[]>([]);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = () => {
    // Mock Executive KPIs
    const kpis: ExecutiveKPI[] = [
      {
        name: 'Total Revenue',
        value: '$2.4M',
        change: 12.5,
        changeType: 'increase',
        target: '$2.8M',
        status: 'on-track',
        icon: DollarSign
      },
      {
        name: 'Active Customers',
        value: '1,247',
        change: 8.3,
        changeType: 'increase',
        target: '1,500',
        status: 'on-track',
        icon: Users
      },
      {
        name: 'Fleet Utilization',
        value: '87.2%',
        change: -2.1,
        changeType: 'decrease',
        target: '90%',
        status: 'at-risk',
        icon: Ship
      },
      {
        name: 'Customer Satisfaction',
        value: '4.8/5',
        change: 0.2,
        changeType: 'increase',
        target: '4.9/5',
        status: 'on-track',
        icon: Target
      },
      {
        name: 'Operational Efficiency',
        value: '94.1%',
        change: 3.7,
        changeType: 'increase',
        target: '95%',
        status: 'on-track',
        icon: Zap
      },
      {
        name: 'Market Share',
        value: '23.4%',
        change: 1.8,
        changeType: 'increase',
        target: '25%',
        status: 'on-track',
        icon: TrendingUp
      }
    ];

    // Mock Business Insights
    const insights: BusinessInsight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Mediterranean Market Expansion',
        description: 'Data shows 34% increase in Mediterranean charter requests. Consider expanding fleet presence in this region.',
        impact: 'high',
        confidence: 87,
        actionable: true,
        category: 'Market Analysis',
        timestamp: '2024-01-15 09:30:00'
      },
      {
        id: '2',
        type: 'recommendation',
        title: 'Predictive Maintenance Optimization',
        description: 'AI analysis suggests implementing predictive maintenance could reduce operational costs by 18% and increase availability by 12%.',
        impact: 'high',
        confidence: 92,
        actionable: true,
        category: 'Operations',
        timestamp: '2024-01-15 08:45:00'
      },
      {
        id: '3',
        type: 'trend',
        title: 'Luxury Service Demand Surge',
        description: 'Premium service bookings increased 45% month-over-month, indicating strong demand for luxury experiences.',
        impact: 'medium',
        confidence: 95,
        actionable: false,
        category: 'Customer Behavior',
        timestamp: '2024-01-15 10:15:00'
      },
      {
        id: '4',
        type: 'risk',
        title: 'Seasonal Demand Volatility',
        description: 'Weather pattern analysis indicates potential 22% decrease in bookings during upcoming storm season.',
        impact: 'medium',
        confidence: 78,
        actionable: true,
        category: 'Risk Management',
        timestamp: '2024-01-15 07:20:00'
      }
    ];

    // Mock Predictive Models
    const models: PredictiveModel[] = [
      {
        name: 'Revenue Forecasting',
        accuracy: 94.2,
        lastTrained: '2024-01-14',
        predictions: [
          { timeframe: 'Next Month', metric: 'Revenue', current: 240000, predicted: 267000, confidence: 89 },
          { timeframe: 'Next Quarter', metric: 'Revenue', current: 720000, predicted: 834000, confidence: 82 },
          { timeframe: 'Next Year', metric: 'Revenue', current: 2400000, predicted: 3120000, confidence: 75 }
        ]
      },
      {
        name: 'Fleet Utilization',
        accuracy: 91.7,
        lastTrained: '2024-01-13',
        predictions: [
          { timeframe: 'Next Month', metric: 'Utilization', current: 87.2, predicted: 89.5, confidence: 91 },
          { timeframe: 'Next Quarter', metric: 'Utilization', current: 87.2, predicted: 91.3, confidence: 86 },
          { timeframe: 'Peak Season', metric: 'Utilization', current: 87.2, predicted: 96.8, confidence: 88 }
        ]
      },
      {
        name: 'Customer Churn',
        accuracy: 88.9,
        lastTrained: '2024-01-12',
        predictions: [
          { timeframe: 'Next Month', metric: 'Churn Rate', current: 3.2, predicted: 2.8, confidence: 85 },
          { timeframe: 'Next Quarter', metric: 'Churn Rate', current: 3.2, predicted: 2.4, confidence: 80 },
          { timeframe: 'Next Year', metric: 'Churn Rate', current: 3.2, predicted: 2.1, confidence: 72 }
        ]
      }
    ];

    setExecutiveKPIs(kpis);
    setBusinessInsights(insights);
    setPredictiveModels(models);
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'recommendation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trend':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'risk':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const generateExecutiveReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      timeRange,
      executiveKPIs,
      businessInsights,
      predictiveModels,
      summary: {
        totalKPIs: executiveKPIs.length,
        onTrackKPIs: executiveKPIs.filter(kpi => kpi.status === 'on-track').length,
        highImpactInsights: businessInsights.filter(insight => insight.impact === 'high').length,
        averageModelAccuracy: Math.round(predictiveModels.reduce((sum, model) => sum + model.accuracy, 0) / predictiveModels.length)
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'executive-analytics-report.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enterprise Analytics & Intelligence</h2>
          <p className="text-muted-foreground">Executive dashboard with AI-powered business insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateExecutiveReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Executive Report
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {executiveKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <kpi.icon className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getKPIStatusColor(kpi.status)}>
                    {kpi.status.replace('-', ' ').toUpperCase()}
                  </Badge>
                  <div className={`text-sm mt-1 ${kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.changeType === 'increase' ? '+' : ''}{kpi.change}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target: {kpi.target}</span>
                  <span>{Math.round((parseFloat(kpi.value.replace(/[^\d.-]/g, '')) / parseFloat(kpi.target.replace(/[^\d.-]/g, ''))) * 100)}%</span>
                </div>
                <Progress 
                  value={Math.round((parseFloat(kpi.value.replace(/[^\d.-]/g, '')) / parseFloat(kpi.target.replace(/[^\d.-]/g, ''))) * 100)} 
                  className="h-2 mt-2" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {businessInsights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription>{insight.category} • {insight.timestamp}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getInsightTypeColor(insight.type)}>
                        {insight.type.toUpperCase()}
                      </Badge>
                      {insight.actionable && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          ACTIONABLE
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{insight.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Impact: </span>
                        <span className={`font-semibold ${getImpactColor(insight.impact)}`}>
                          {insight.impact.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Confidence: </span>
                        <span className="font-semibold">{insight.confidence}%</span>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        View Actions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid gap-6">
            {predictiveModels.map((model, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LineChart className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <CardDescription>Accuracy: {model.accuracy}% • Last trained: {model.lastTrained}</CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {model.accuracy}% ACCURACY
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {model.predictions.map((prediction, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-semibold">{prediction.timeframe}</div>
                          <div className="text-sm text-muted-foreground">{prediction.metric}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {prediction.current.toLocaleString()} → {prediction.predicted.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {prediction.confidence}%
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${
                          prediction.predicted > prediction.current ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {prediction.predicted > prediction.current ? '+' : ''}
                          {(((prediction.predicted - prediction.current) / prediction.current) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Monthly Target</span>
                    <span className="font-semibold">$280K</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Current Performance</span>
                    <span className="font-semibold text-green-600">$267K</span>
                  </div>
                  <Progress value={95.4} className="h-3" />
                  <div className="text-sm text-muted-foreground">95.4% of target achieved</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Fleet Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Utilization Rate</span>
                    <span className="font-semibold">87.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Maintenance Efficiency</span>
                    <span className="font-semibold text-green-600">94.1%</span>
                  </div>
                  <Progress value={87.2} className="h-3" />
                  <div className="text-sm text-muted-foreground">Above industry average</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create and schedule automated business intelligence reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Available Report Types:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Executive Summary Dashboard</li>
                    <li>• Financial Performance Analysis</li>
                    <li>• Fleet Utilization Report</li>
                    <li>• Customer Behavior Analysis</li>
                    <li>• Market Trend Analysis</li>
                    <li>• Predictive Forecasting Report</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Scheduling Options:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Daily automated reports</li>
                    <li>• Weekly executive summaries</li>
                    <li>• Monthly performance reviews</li>
                    <li>• Quarterly business analysis</li>
                    <li>• Annual strategic planning</li>
                    <li>• On-demand custom reports</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Report
                </Button>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}