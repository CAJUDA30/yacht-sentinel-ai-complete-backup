import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePredictiveMaintenanceData } from '@/hooks/usePredictiveMaintenanceData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Wrench,
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  Zap,
  Fuel,
  Thermometer,
  Activity,
  CheckCircle,
  XCircle,
  Timer,
  Target
} from 'lucide-react';

// Import types from the hook
import type { MaintenanceItem, PredictiveInsight } from '@/hooks/usePredictiveMaintenanceData';

const PredictiveMaintenanceEngine: React.FC = () => {
  const { maintenanceItems, insights, metrics, loading, selectedTimeframe, setSelectedTimeframe, implementInsight } = usePredictiveMaintenanceData();

  const getRiskColor = (risk: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'outline';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return 'text-success';
    if (condition >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'engine': return <Fuel className="h-4 w-4" />;
      case 'electrical': return <Zap className="h-4 w-4" />;
      case 'hydraulic': return <Activity className="h-4 w-4" />;
      case 'hvac': return <Thermometer className="h-4 w-4" />;
      case 'navigation': return <Target className="h-4 w-4" />;
      case 'safety': return <CheckCircle className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <DollarSign className="h-4 w-4 text-success" />;
      case 'medium': return <Timer className="h-4 w-4 text-info" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-warning" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const MaintenanceCard = ({ item }: { item: MaintenanceItem }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getCategoryIcon(item.type)}
            {item.equipment}
          </CardTitle>
          <Badge variant={getRiskColor(item.riskLevel)}>
            {item.riskLevel} risk
          </Badge>
        </div>
        <CardDescription>
          Location: {item.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Condition Status */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Condition</span>
            <span className={`font-medium ${getConditionColor(item.condition)}`}>
              {Math.round(item.condition)}%
            </span>
          </div>
          <Progress value={item.condition} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.nextDue}</div>
              <div className="text-xs text-muted-foreground">next due</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">${item.estimatedCost.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">estimated cost</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.predictedFailure}</div>
              <div className="text-xs text-muted-foreground">predicted failure</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{item.lastInspection}</div>
              <div className="text-xs text-muted-foreground">last inspection</div>
            </div>
          </div>
        </div>

        {/* Recommended Actions */}
        {item.recommendedActions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recommended Actions
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {item.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></div>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button size="sm" variant="outline">
            Schedule Now
          </Button>
          <Button size="sm" variant="outline">
            View Details
          </Button>
          <Button size="sm" variant="outline">
            Order Parts
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const InsightCard = ({ insight }: { insight: PredictiveInsight }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getImpactIcon(insight.impact)}
            {insight.title}
          </CardTitle>
          <Badge variant="outline">
            {insight.confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {insight.description}
        </p>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-success">
              ${insight.potentialSavings.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">potential savings</div>
          </div>
          <div>
            <div className="font-medium capitalize">
              {insight.complexity}
            </div>
            <div className="text-xs text-muted-foreground">complexity</div>
          </div>
          <div>
            <div className="font-medium capitalize">
              {insight.impact}
            </div>
            <div className="text-xs text-muted-foreground">impact level</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button 
            size="sm"
            onClick={() => implementInsight(insight.id)}
          >
            Implement
          </Button>
          <Button size="sm" variant="outline">
            Learn More
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalItems = maintenanceItems.filter(item => item.riskLevel === 'critical' || item.riskLevel === 'high');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predictive Maintenance</h1>
          <p className="text-muted-foreground">
            AI-powered maintenance scheduling and failure prediction
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm">AI Active</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.criticalItems}</div>
            <div className="text-xs text-muted-foreground">Require immediate attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Estimated Costs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.estimatedCosts.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Next 90 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Potential Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${metrics.potentialSavings.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Through AI optimization</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(metrics.aiAccuracy)}%
          </div>
            <div className="text-xs text-muted-foreground">Prediction confidence</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="maintenance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="space-y-4">
          {criticalItems.length > 0 && (
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{criticalItems.length} critical maintenance items</strong> require immediate attention to prevent equipment failure.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {maintenanceItems.map((item) => (
              <MaintenanceCard key={item.id} item={item} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
              <p className="text-sm text-muted-foreground">
                Optimization recommendations based on predictive analysis
              </p>
            </div>
            <Select value={selectedTimeframe} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedTimeframe(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Health Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Advanced analytics dashboard coming soon</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Cost optimization insights</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveMaintenanceEngine;