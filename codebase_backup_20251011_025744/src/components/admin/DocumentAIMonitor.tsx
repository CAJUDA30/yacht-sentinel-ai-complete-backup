import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';

interface DocumentAIMetrics {
  totalRequests: number;
  successfulRequests: number; 
  failedRequests: number;
  averageProcessingTime: number;
  averageConfidence: number;
  totalCost: number;
  quotaUsage: number;
  quotaLimit: number;
  topErrorTypes: { type: string; count: number }[];
  dailyUsage: { date: string; requests: number }[];
}

interface DocumentAIMonitorProps {
  className?: string;
}

const DocumentAIMonitor: React.FC<DocumentAIMonitorProps> = ({ className }) => {
  const { user } = useSupabaseAuth();
  const [metrics, setMetrics] = useState<DocumentAIMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  const fetchMetrics = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch Document AI usage metrics from Supabase analytics
      const { data: analyticsData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('module', 'smartscan')
        .eq('event_type', 'document_ai_processing')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process analytics data to calculate metrics
      const processedMetrics = calculateMetrics(analyticsData || []);
      setMetrics(processedMetrics);
      setLastUpdated(new Date());

      // Check for alerts
      checkAlerts(processedMetrics);

    } catch (error) {
      console.error('Error fetching Document AI metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMetrics = (data: any[]): DocumentAIMetrics => {
    const totalRequests = data.length;
    const successfulRequests = data.filter(d => d.success === true).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const processingTimes = data
      .filter(d => d.processing_time_ms)
      .map(d => d.processing_time_ms || 0);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0;

    const confidenceScores = data
      .filter(d => d.confidence && d.confidence > 0)
      .map(d => d.confidence || 0);
    const averageConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : 0;

    // Estimate cost (Document AI pricing: $1.50 per 1,000 pages)
    const totalCost = (totalRequests / 1000) * 1.50;

    // Process daily usage
    const dailyUsage = data.reduce((acc: any[], item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.requests++;
      } else {
        acc.push({ date, requests: 1 });
      }
      return acc;
    }, []).sort((a, b) => a.date.localeCompare(b.date));

    // Process error types
    const errorTypes = data
      .filter(d => !d.success && d.error_message)
      .reduce((acc: any[], item) => {
        const errorType = item.error_message.split(':')[0] || 'Unknown Error';
        const existing = acc.find(e => e.type === errorType);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type: errorType, count: 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageProcessingTime: Math.round(averageProcessingTime),
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      quotaUsage: totalRequests, // Simplified - would need actual Google Cloud quota API
      quotaLimit: 1000, // Free tier limit
      topErrorTypes: errorTypes,
      dailyUsage: dailyUsage.slice(-7) // Last 7 days
    };
  };

  const checkAlerts = (metrics: DocumentAIMetrics) => {
    const newAlerts: string[] = [];

    // High error rate
    const errorRate = metrics.totalRequests > 0 
      ? (metrics.failedRequests / metrics.totalRequests) * 100 
      : 0;
    if (errorRate > 20) {
      newAlerts.push(`High error rate: ${Math.round(errorRate)}% of requests are failing`);
    }

    // Slow processing
    if (metrics.averageProcessingTime > 5000) {
      newAlerts.push(`Slow processing: Average ${metrics.averageProcessingTime}ms response time`);
    }

    // Low confidence
    if (metrics.averageConfidence < 0.7) {
      newAlerts.push(`Low confidence: Average ${Math.round(metrics.averageConfidence * 100)}% confidence score`);
    }

    // Quota usage
    const quotaUsagePercent = (metrics.quotaUsage / metrics.quotaLimit) * 100;
    if (quotaUsagePercent > 80) {
      newAlerts.push(`High quota usage: ${Math.round(quotaUsagePercent)}% of monthly limit used`);
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  const getSuccessRate = () => {
    if (!metrics || metrics.totalRequests === 0) return 0;
    return Math.round((metrics.successfulRequests / metrics.totalRequests) * 100);
  };

  const getQuotaUsagePercent = () => {
    if (!metrics) return 0;
    return Math.round((metrics.quotaUsage / metrics.quotaLimit) * 100);
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Please log in to view Document AI monitoring dashboard
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document AI Monitor</h2>
          <p className="text-gray-600">
            Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
          </p>
        </div>
        <Button onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{metrics?.totalRequests || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{getSuccessRate()}%</p>
              </div>
              {getSuccessRate() >= 95 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Processing</p>
                <p className="text-2xl font-bold">{metrics?.averageProcessingTime || 0}ms</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Cost</p>
                <p className="text-2xl font-bold">${metrics?.totalCost || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quota Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quota Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Monthly Usage</span>
                <span>{metrics?.quotaUsage || 0} / {metrics?.quotaLimit || 1000}</span>
              </div>
              <Progress value={getQuotaUsagePercent()} className="w-full" />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Free Tier: 1,000 pages/month</span>
                <span>{getQuotaUsagePercent()}% used</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Confidence</span>
                <Badge variant={metrics && metrics.averageConfidence > 0.8 ? "default" : "secondary"}>
                  {Math.round((metrics?.averageConfidence || 0) * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <Badge variant={getSuccessRate() >= 95 ? "default" : "destructive"}>
                  {getSuccessRate()}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Failed Requests</span>
                <Badge variant="outline">
                  {metrics?.failedRequests || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis */}
      {metrics && metrics.topErrorTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Error Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topErrorTypes.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{error.type}</span>
                  <Badge variant="destructive">{error.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Usage Chart */}
      {metrics && metrics.dailyUsage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Usage (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.dailyUsage.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (day.requests / Math.max(...metrics.dailyUsage.map(d => d.requests))) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{day.requests}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentAIMonitor;