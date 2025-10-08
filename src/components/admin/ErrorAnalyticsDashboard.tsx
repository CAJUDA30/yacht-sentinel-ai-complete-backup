import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Shield,
  Zap,
  Database
} from "lucide-react";
import { ErrorAnalytics } from "@/hooks/useEnhancedErrorLogs";

interface ErrorAnalyticsDashboardProps {
  analytics?: ErrorAnalytics;
  isLoading?: boolean;
}

const ErrorAnalyticsDashboard: React.FC<ErrorAnalyticsDashboardProps> = ({ 
  analytics, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No analytics data available
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-destructive" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-emerald-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-destructive';
      case 'down': return 'text-emerald-500';
      default: return 'text-muted-foreground';
    }
  };

  const resolutionRate = analytics.totalErrors > 0 
    ? Math.round((analytics.resolvedErrors / analytics.totalErrors) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{analytics.totalErrors}</p>
                  <div className={`flex items-center gap-1 ${getTrendColor(analytics.trendDirection)}`}>
                    {getTrendIcon(analytics.trendDirection)}
                    <span className="text-xs font-medium">
                      {analytics.trendDirection}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Errors</p>
                <p className="text-3xl font-bold text-destructive">{analytics.criticalErrors}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalErrors > 0 
                    ? `${Math.round((analytics.criticalErrors / analytics.totalErrors) * 100)}% of total`
                    : '0% of total'
                  }
                </p>
              </div>
              <Shield className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolution Rate</p>
                <p className="text-3xl font-bold text-emerald-500">{resolutionRate}%</p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${resolutionRate}%` }}
                  />
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                <p className="text-3xl font-bold">{analytics.avgResolutionTime}</p>
                <p className="text-xs text-muted-foreground">MTTR (Mean Time To Resolution)</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Categories & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Error Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Error Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.topCategories.length > 0 ? (
              analytics.topCategories.slice(0, 5).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{category.count}</Badge>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          backgroundColor: category.color,
                          width: `${(category.count / analytics.totalErrors) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No error categories data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Error Timeline (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.errorsByTime.length > 0 ? (
              <div className="space-y-3">
                {analytics.errorsByTime.slice(0, 8).map((timePoint, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(timePoint.time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {timePoint.count}
                      </Badge>
                      {timePoint.criticalCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {timePoint.criticalCount} critical
                        </Badge>
                      )}
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((timePoint.count / Math.max(...analytics.errorsByTime.map(t => t.count))) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No timeline data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Indicator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Error Rate</p>
              <p className="text-2xl font-bold">
                {analytics.errorRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge 
                variant={
                  analytics.errorRate > 10 ? "destructive" :
                  analytics.errorRate > 5 ? "outline" : "default"
                }
              >
                {analytics.errorRate > 10 ? "Critical" :
                 analytics.errorRate > 5 ? "Warning" : "Healthy"}
              </Badge>
            </div>
          </div>
          <Progress 
            value={Math.min(analytics.errorRate, 100)} 
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Target: &lt;5% error rate for optimal system health
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorAnalyticsDashboard;