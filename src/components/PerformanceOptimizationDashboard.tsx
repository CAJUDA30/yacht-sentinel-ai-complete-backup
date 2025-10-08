import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  DollarSign, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';

export const PerformanceOptimizationDashboard: React.FC = () => {
  const {
    metrics,
    suggestions,
    modelHealth,
    isAnalyzing,
    autoOptimizationEnabled,
    analyzePerformance,
    implementOptimization,
    enableAutoOptimization
  } = usePerformanceOptimization();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'failing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Optimization</h2>
          <p className="text-muted-foreground">
            Monitor and optimize AI model performance across your yacht management system
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoOptimizationEnabled}
              onCheckedChange={enableAutoOptimization}
            />
            <span className="text-sm">Auto-optimization</span>
          </div>
          <Button 
            onClick={analyzePerformance}
            disabled={isAnalyzing}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(metrics.averageLatency)}ms</div>
              <p className="text-xs text-muted-foreground">
                {metrics.averageLatency > 5000 ? 'Above target' : 'Within target'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
              <Progress value={metrics.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost/Request</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.costPerRequest.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.costPerRequest > 0.005 ? 'Above target' : 'Optimized'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2" />
              <p>All systems optimized! No suggestions at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                      <span className="font-medium">{suggestion.description}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => implementOptimization(suggestion)}
                    >
                      Implement
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p><strong>Impact:</strong> {suggestion.impact}</p>
                    <p><strong>Implementation:</strong> {suggestion.implementation}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Estimated improvement:</span>
                    <Progress value={suggestion.estimatedImprovement} className="flex-1 max-w-[200px]" />
                    <span className="text-sm font-medium">{suggestion.estimatedImprovement}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Model Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {modelHealth.map((model) => (
              <div key={model.modelId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(model.status)}
                    <span className="font-medium">{model.modelName}</span>
                    <Badge variant={model.status === 'healthy' ? 'default' : 'destructive'}>
                      {model.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Last check: {new Date(model.lastCheck).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm font-medium">Latency</p>
                    <p className="text-lg">{Math.round(model.latency)}ms</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Success Rate</p>
                    <p className="text-lg">{model.successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cost Efficiency</p>
                    <p className="text-lg">{model.costEfficiency.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Recommendations:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {model.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};