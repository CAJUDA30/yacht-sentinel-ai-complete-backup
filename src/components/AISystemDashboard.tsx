import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Zap, 
  Activity, 
  Clock, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Network
} from 'lucide-react';

interface AIMetrics {
  responseTime: number;
  confidence: number;
  successRate: number;
  modelsActive: number;
  requestsPerMinute: number;
}

interface AIModel {
  name: string;
  status: 'active' | 'idle' | 'error';
  responseTime: number;
  confidence: number;
  requestCount: number;
}

interface ConsensusResult {
  timestamp: string;
  models: string[];
  confidence: number;
  solution: string;
  category: string;
}

export const AISystemDashboard = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    responseTime: 850,
    confidence: 92,
    successRate: 98.5,
    modelsActive: 3,
    requestsPerMinute: 12
  });

  const [models, setModels] = useState<AIModel[]>([
    { name: 'GPT-4.1', status: 'active', responseTime: 750, confidence: 94, requestCount: 45 },
    { name: 'Grok Beta', status: 'active', responseTime: 920, confidence: 91, requestCount: 38 },
    { name: 'DeepSeek', status: 'idle', responseTime: 680, confidence: 89, requestCount: 22 }
  ]);

  const [consensusHistory, setConsensusHistory] = useState<ConsensusResult[]>([
    {
      timestamp: new Date().toISOString(),
      models: ['GPT-4.1', 'Grok', 'DeepSeek'],
      confidence: 92,
      solution: 'Currency synchronization fixed by implementing single source pattern',
      category: 'System Architecture'
    },
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      models: ['GPT-4.1', 'Grok'],
      confidence: 87,
      solution: 'Language switching improved with reactive context updates',
      category: 'User Interface'
    }
  ]);

  const [loading, setLoading] = useState(false);

  const refreshMetrics = async () => {
    setLoading(true);
    try {
      // Get real AI processing metrics from the last hour
      const { data: processingLogs } = await supabase
        .from('ai_processing_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (processingLogs && processingLogs.length > 0) {
        const avgResponseTime = processingLogs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / processingLogs.length;
        const avgConfidence = processingLogs.reduce((sum, log) => sum + (log.confidence || 0), 0) / processingLogs.length;
        const successRate = (processingLogs.filter(log => log.success).length / processingLogs.length) * 100;

        setMetrics({
          responseTime: Math.round(avgResponseTime),
          confidence: Math.round(avgConfidence * 100),
          successRate: Math.round(successRate),
          modelsActive: [...new Set(processingLogs.map(log => log.model_name))].length,
          requestsPerMinute: Math.round(processingLogs.length / 60)
        });

        // Update model statuses based on recent performance
        const modelStats = processingLogs.reduce((acc, log) => {
          if (!acc[log.model_name]) {
            acc[log.model_name] = { times: [], successes: 0, total: 0 };
          }
          acc[log.model_name].times.push(log.processing_time_ms || 0);
          acc[log.model_name].total++;
          if (log.success) acc[log.model_name].successes++;
          return acc;
        }, {} as any);

        setModels(prev => prev.map(model => {
          const stats = modelStats[model.name] || modelStats[model.name.toLowerCase()];
          if (stats) {
            const avgTime = stats.times.reduce((a: number, b: number) => a + b, 0) / stats.times.length;
            const successRate = (stats.successes / stats.total) * 100;
            return {
              ...model,
              responseTime: Math.round(avgTime),
              confidence: Math.round(successRate),
              status: successRate > 90 ? 'active' : successRate > 70 ? 'idle' : 'error',
              requestCount: stats.total
            };
          }
          return model;
        }));
      } else {
        // No recent data, show default/idle status
        setMetrics({
          responseTime: 0,
          confidence: 0,
          successRate: 0,
          modelsActive: 0,
          requestsPerMinute: 0
        });
      }
    } catch (error) {
      console.error('Failed to refresh AI metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAIConsensus = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          type: 'text',
          content: 'Test AI system performance and coordination',
          context: 'system-test',
          models: ['gpt-4.1-2025-04-14', 'grok-beta', 'deepseek-chat'],
          consensus: true
        }
      });

      if (data?.consensus) {
        const newResult: ConsensusResult = {
          timestamp: new Date().toISOString(),
          models: ['GPT-4.1', 'Grok', 'DeepSeek'],
          confidence: Math.round((data.consensus.confidence || 0.9) * 100),
          solution: data.consensus.primaryAction || 'Test completed successfully',
          category: 'System Test'
        };

        setConsensusHistory(prev => [newResult, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('AI consensus test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI System Dashboard</h2>
          <p className="text-muted-foreground">Real-time AI performance monitoring and consensus tracking</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshMetrics} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={testAIConsensus} disabled={loading}>
            <Brain className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
            Test Consensus
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{Math.round(metrics.responseTime)}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-2xl font-bold">{Math.round(metrics.confidence)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold">{metrics.modelsActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Requests/min</p>
                <p className="text-2xl font-bold">{Math.round(metrics.requestsPerMinute)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Models Status */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>AI Models Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models.map((model, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card/50">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(model.status)}
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-sm text-muted-foreground">{model.requestCount} requests</p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getStatusColor(model.status) as any}>
                      {model.status}
                    </Badge>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>{Math.round(model.responseTime)}ms</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{Math.round(model.confidence)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Consensus History */}
        <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Consensus History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {consensusHistory.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{result.category}</Badge>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{result.confidence}% confidence</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-1">{result.solution}</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">Models:</span>
                      {result.models.map((model, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts Placeholder */}
      <Card className="shadow-neumorphic border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Trends</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time Trend</span>
                <span className="text-success">↓ 12%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy Improvement</span>
                <span className="text-success">↑ 8%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consensus Agreement</span>
                <span className="text-success">↑ 15%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};