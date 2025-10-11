import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePerformance } from '@/contexts/PerformanceContext';
import { Activity, Zap, TrendingUp, Gauge, RefreshCw } from 'lucide-react';

export const PerformanceMonitor = () => {
  const { 
    metrics, 
    isOptimized, 
    optimizePerformance 
  } = usePerformance();

  const getPerformanceScore = () => {
    let score = 100;
    
    // Deduct points for poor metrics
    if (metrics.renderTime > 16) score -= 20; // 60fps threshold
    if (metrics.apiResponseTime > 2000) score -= 25;
    if (metrics.memoryUsage > 100) score -= 25;
    if (metrics.errorRate > 5) score -= 30;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const score = getPerformanceScore();

  return (
    <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Performance Monitor</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isOptimized ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <Gauge className="h-3 w-3" />
              Score: {score}
            </Badge>
            <Button 
              onClick={optimizePerformance}
              size="sm"
              variant="outline"
              disabled={isOptimized}
            >
              <Zap className="h-4 w-4 mr-1" />
              Optimize
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Performance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Performance</span>
            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
              {score}/100
            </span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Render Time</p>
                <p className="text-xs text-muted-foreground">Target: &lt;16ms (60fps)</p>
              </div>
              <Badge 
                variant="outline" 
                className={metrics.renderTime <= 16 ? 'text-green-600' : 'text-red-600'}
              >
                {metrics.renderTime.toFixed(1)}ms
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">API Response</p>
                <p className="text-xs text-muted-foreground">Target: &lt;2s</p>
              </div>
              <Badge 
                variant="outline" 
                className={metrics.apiResponseTime <= 2000 ? 'text-green-600' : 'text-red-600'}
              >
                {metrics.apiResponseTime.toFixed(0)}ms
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Memory Usage</p>
                <p className="text-xs text-muted-foreground">Target: &lt;100MB</p>
              </div>
              <Badge 
                variant="outline" 
                className={metrics.memoryUsage <= 100 ? 'text-green-600' : 'text-red-600'}
              >
                {metrics.memoryUsage.toFixed(1)}MB
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Error Rate</p>
                <p className="text-xs text-muted-foreground">Target: &lt;5%</p>
              </div>
              <Badge 
                variant="outline" 
                className={metrics.errorRate <= 5 ? 'text-green-600' : 'text-red-600'}
              >
                {metrics.errorRate.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Performance Tips */}
        {!isOptimized && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Performance Recommendations:</h4>
            <ul className="text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
              {metrics.renderTime > 16 && <li>• Consider reducing visual complexity or animations</li>}
              {metrics.apiResponseTime > 2000 && <li>• API responses are slow - check network connection</li>}
              {metrics.memoryUsage > 100 && <li>• High memory usage detected - consider clearing cache</li>}
              {metrics.errorRate > 5 && <li>• High error rate - check console for issues</li>}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <TrendingUp className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <Button size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear Cache
          </Button>
          <Button size="sm" variant="outline">
            <Activity className="h-4 w-4 mr-1" />
            Run Benchmark
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};