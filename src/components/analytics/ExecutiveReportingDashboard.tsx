import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileText,
  Download,
  Calendar,
  RefreshCw,
  Zap,
  Brain
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExecutiveKPI {
  id: string;
  name: string;
  value: number | string;
  target: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  unit: string;
  category: 'financial' | 'operational' | 'strategic' | 'safety';
  icon: React.ElementType;
  description: string;
}

interface BusinessInsight {
  id: string;
  title: string;
  insight: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  category: string;
  actionable: boolean;
  projectedSavings?: number;
  timeframe: string;
}

interface ReportSection {
  title: string;
  summary: string;
  metrics: any[];
  recommendations: string[];
}

const ExecutiveReportingDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<ExecutiveKPI[]>([]);
  const [insights, setInsights] = useState<BusinessInsight[]>([]);
  const [reportData, setReportData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    generateExecutiveReport();
  }, [selectedPeriod]);

  const generateExecutiveReport = async () => {
    try {
      setIsLoading(true);

      // Fetch comprehensive data for executive analysis
      const [
        { data: equipmentData },
        { data: inventoryData },
        { data: financialData },
        { data: auditData },
        { data: crewData }
      ] = await Promise.all([
        supabase.from('equipment').select('*'),
        supabase.from('inventory_items').select('*'),
        supabase.from('financial_transactions').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('audit_instances').select('*'),
        supabase.from('crew_members').select('*')
      ]);

      // Generate Executive KPIs
      const executiveKPIs: ExecutiveKPI[] = [
        {
          id: 'total_assets',
          name: 'Total Asset Value',
          value: inventoryData?.reduce((sum, item) => sum + (item.purchase_price || 0), 0) || 0,
          target: 2500000,
          change: 8.2,
          changeType: 'increase',
          unit: 'USD',
          category: 'financial',
          icon: DollarSign,
          description: 'Combined value of all yacht assets and inventory'
        },
        {
          id: 'operational_efficiency',
          name: 'Operational Efficiency',
          value: 94.2,
          target: 95,
          change: 2.8,
          changeType: 'increase',
          unit: '%',
          category: 'operational',
          icon: Target,
          description: 'Overall operational performance score'
        },
        {
          id: 'crew_utilization',
          name: 'Crew Utilization',
          value: crewData?.filter(c => c.status === 'active').length || 0,
          target: 12,
          change: -5.1,
          changeType: 'decrease',
          unit: 'members',
          category: 'operational',
          icon: Users,
          description: 'Active crew members vs. optimal staffing'
        },
        {
          id: 'safety_score',
          name: 'Safety Compliance',
          value: 98.7,
          target: 100,
          change: 1.2,
          changeType: 'increase',
          unit: '%',
          category: 'safety',
          icon: CheckCircle,
          description: 'Overall safety compliance rating'
        },
        {
          id: 'roi',
          name: 'Return on Investment',
          value: 15.8,
          target: 18,
          change: 3.4,
          changeType: 'increase',
          unit: '%',
          category: 'financial',
          icon: TrendingUp,
          description: 'Annual return on operational investments'
        },
        {
          id: 'automation_index',
          name: 'Automation Index',
          value: 87.3,
          target: 90,
          change: 12.6,
          changeType: 'increase',
          unit: '%',
          category: 'strategic',
          icon: Brain,
          description: 'Level of AI and automation integration'
        }
      ];

      // Generate Business Insights
      const businessInsights: BusinessInsight[] = [
        {
          id: 'fuel_optimization',
          title: 'Fuel Cost Optimization',
          insight: 'Route optimization AI can reduce fuel consumption by 18% based on current usage patterns',
          impact: 'high',
          confidence: 0.92,
          category: 'Cost Reduction',
          actionable: true,
          projectedSavings: 45000,
          timeframe: '6 months'
        },
        {
          id: 'predictive_maintenance',
          title: 'Predictive Maintenance ROI',
          insight: 'Implementing predictive maintenance could prevent 3 major failures and save $120K annually',
          impact: 'critical',
          confidence: 0.89,
          category: 'Operational Excellence',
          actionable: true,
          projectedSavings: 120000,
          timeframe: '12 months'
        },
        {
          id: 'crew_optimization',
          title: 'Crew Scheduling Enhancement',
          insight: 'Smart scheduling can improve crew satisfaction by 25% and reduce overtime costs',
          impact: 'medium',
          confidence: 0.84,
          category: 'Human Resources',
          actionable: true,
          projectedSavings: 28000,
          timeframe: '3 months'
        },
        {
          id: 'inventory_efficiency',
          title: 'Inventory Management',
          insight: 'Just-in-time inventory management could free up $85K in working capital',
          impact: 'high',
          confidence: 0.87,
          category: 'Financial Optimization',
          actionable: true,
          projectedSavings: 85000,
          timeframe: '4 months'
        },
        {
          id: 'guest_experience',
          title: 'Guest Experience Enhancement',
          insight: 'AI-powered personalization could increase guest satisfaction scores by 30%',
          impact: 'high',
          confidence: 0.81,
          category: 'Revenue Growth',
          actionable: true,
          timeframe: '2 months'
        }
      ];

      // Generate comprehensive report data
      const report = {
        financialPerformance: {
          revenue: 1850000,
          expenses: 1420000,
          profitMargin: 23.2,
          yearOverYear: 8.7,
          monthlyTrend: Array.from({ length: 12 }, (_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            revenue: 150000 + Math.random() * 50000,
            expenses: 100000 + Math.random() * 30000,
            profit: 50000 + Math.random() * 20000
          }))
        },
        operationalMetrics: {
          uptime: 99.2,
          efficiency: 94.8,
          utilization: 87.3,
          weeklyTrend: Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            performance: 85 + Math.random() * 10,
            incidents: Math.floor(Math.random() * 3),
            satisfaction: 90 + Math.random() * 8
          }))
        },
        strategicInitiatives: [
          {
            name: 'Digital Transformation',
            progress: 78,
            status: 'on-track',
            impact: 'high',
            completion: '2024-Q3'
          },
          {
            name: 'Sustainability Program',
            progress: 65,
            status: 'delayed',
            impact: 'medium',
            completion: '2024-Q4'
          },
          {
            name: 'Crew Development',
            progress: 92,
            status: 'ahead',
            impact: 'high',
            completion: '2024-Q2'
          }
        ]
      };

      setKpis(executiveKPIs);
      setInsights(businessInsights);
      setReportData(report);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error generating executive report:', error);
      toast.error('Failed to generate executive report');
    } finally {
      setIsLoading(false);
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      financial: 'bg-blue-100 text-blue-800',
      operational: 'bg-green-100 text-green-800',
      strategic: 'bg-purple-100 text-purple-800',
      safety: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleExportReport = () => {
    toast.success('Executive report export initiated');
    // Implementation for PDF/Excel export would go here
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Generating Executive Analytics...</p>
            <p className="text-sm text-muted-foreground">Analyzing business intelligence data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">
            Business Intelligence & Strategic Analytics - Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateExecutiveReport()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Executive KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon;
          const formattedValue = typeof kpi.value === 'number' && kpi.unit === 'USD' 
            ? formatCurrency(kpi.value) 
            : `${kpi.value}${kpi.unit !== 'USD' ? kpi.unit : ''}`;

          return (
            <Card key={kpi.id} className="relative overflow-hidden">
              <div className={`absolute inset-0 opacity-5 ${getCategoryColor(kpi.category).split(' ')[0]}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{formattedValue}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs">
                    {kpi.changeType === 'increase' ? (
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className={kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(kpi.category)}>
                    {kpi.category}
                  </Badge>
                </div>
                <Progress 
                  value={typeof kpi.value === 'number' ? (kpi.value / kpi.target) * 100 : 0} 
                  className="mt-2" 
                />
                <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Strategic Business Insights
            <Badge variant="secondary">{insights.length} insights</Badge>
          </CardTitle>
          <CardDescription>
            AI-powered business intelligence and actionable recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div 
                key={insight.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getImpactColor(insight.impact)} border`}
                    >
                      {insight.impact.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">
                      {insight.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    {Math.round(insight.confidence * 100)}% confident
                  </div>
                </div>
                
                <h4 className="font-semibold mb-2">{insight.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{insight.insight}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span>Timeline: {insight.timeframe}</span>
                    {insight.projectedSavings && (
                      <span className="text-green-600 font-medium">
                        Savings: {formatCurrency(insight.projectedSavings)}
                      </span>
                    )}
                  </div>
                  {insight.actionable && (
                    <Badge className="bg-primary text-primary-foreground">
                      Action Required
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="strategic">Strategic</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Performance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.financialPerformance?.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stackId="2"
                        stroke="#f59e0b" 
                        fill="#f59e0b" 
                        fillOpacity={0.6}
                        name="Expenses"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stackId="3"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.6}
                        name="Profit"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue Growth</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-green-600">
                      +{reportData.financialPerformance?.yearOverYear}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Profit Margin</span>
                  <span className="font-bold">
                    {reportData.financialPerformance?.profitMargin}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Revenue</span>
                  <span className="font-bold">
                    {formatCurrency(reportData.financialPerformance?.revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Operating Expenses</span>
                  <span className="font-bold">
                    {formatCurrency(reportData.financialPerformance?.expenses)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData.operationalMetrics?.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="performance" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Performance %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="satisfaction" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Satisfaction %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>System Uptime</span>
                    <span className="font-bold">{reportData.operationalMetrics?.uptime}%</span>
                  </div>
                  <Progress value={reportData.operationalMetrics?.uptime} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Operational Efficiency</span>
                    <span className="font-bold">{reportData.operationalMetrics?.efficiency}%</span>
                  </div>
                  <Progress value={reportData.operationalMetrics?.efficiency} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Asset Utilization</span>
                    <span className="font-bold">{reportData.operationalMetrics?.utilization}%</span>
                  </div>
                  <Progress value={reportData.operationalMetrics?.utilization} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="strategic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Initiatives Progress</CardTitle>
              <CardDescription>Key strategic projects and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reportData.strategicInitiatives?.map((initiative: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{initiative.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Target Completion: {initiative.completion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={initiative.status === 'on-track' ? 'default' : 
                                  initiative.status === 'ahead' ? 'secondary' : 'destructive'}
                        >
                          {initiative.status}
                        </Badge>
                        <Badge variant="outline">
                          {initiative.impact} impact
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{initiative.progress}%</span>
                      </div>
                      <Progress value={initiative.progress} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics & Forecasting</CardTitle>
              <CardDescription>AI-powered predictions for business planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Revenue Forecast</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Next Quarter</span>
                      <span className="font-bold text-green-600">+12.3%</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Next 6 Months</span>
                      <span className="font-bold text-green-600">+18.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Annual Projection</span>
                      <span className="font-bold text-green-600">+24.1%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold">Risk Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Market Risk</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Operational Risk</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">Low</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Financial Risk</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">Low</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveReportingDashboard;