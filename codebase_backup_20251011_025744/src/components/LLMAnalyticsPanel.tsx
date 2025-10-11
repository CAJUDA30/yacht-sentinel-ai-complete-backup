import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, TrendingUp, Lightbulb, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLLMAnalytics } from '@/hooks/useLLMAnalytics';

interface LLMAnalyticsPanelProps {
  module: string;
  data: any;
  className?: string;
}

const LLMAnalyticsPanel: React.FC<LLMAnalyticsPanelProps> = ({ module, data, className }) => {
  const { analytics, refreshAnalytics, isProcessing, error, hasInsights, hasPredictions, hasOptimizations } = useLLMAnalytics(module, data);
  const [selectedTab, setSelectedTab] = useState('insights');

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Analytics - {module}</CardTitle>
          </div>
          <Button
            onClick={refreshAnalytics}
            disabled={isProcessing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Multi-LLM analysis and insights for enhanced decision making
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
              {hasInsights && <Badge variant="secondary" className="ml-1">●</Badge>}
            </TabsTrigger>
            <TabsTrigger value="predictions" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Predictions
              {hasPredictions && <Badge variant="secondary" className="ml-1">●</Badge>}
            </TabsTrigger>
            <TabsTrigger value="optimizations" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Optimizations
              {hasOptimizations && <Badge variant="secondary" className="ml-1">●</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4">
            {analytics.insights ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">AI Insights</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <Progress 
                      value={analytics.insights.confidence * 100} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm font-medium">
                      {Math.round(analytics.insights.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{analytics.insights.consensus}</p>
                </div>

                {analytics.insights.insights && analytics.insights.insights.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2">Key Insights:</h5>
                    <ul className="space-y-1">
                      {analytics.insights.insights.map((insight: string, index: number) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="font-medium">OpenAI</div>
                    <div className="text-blue-600">
                      {analytics.insights.openai ? '✓ Active' : '○ Pending'}
                    </div>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <div className="font-medium">Grok</div>
                    <div className="text-purple-600">
                      {analytics.insights.grok ? '✓ Active' : '○ Pending'}
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <div className="font-medium">DeepSeek</div>
                    <div className="text-green-600">
                      {analytics.insights.deepseek ? '✓ Active' : '○ Pending'}
                    </div>
                  </div>
                  <div className="p-2 bg-orange-50 rounded">
                    <div className="font-medium">Vision</div>
                    <div className="text-orange-600">
                      {analytics.insights.vision ? '✓ Active' : '○ Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isProcessing ? 'Generating insights...' : 'No insights available'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            {analytics.predictions ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Predictive Analysis</h4>
                  <Badge variant={analytics.predictions.confidence > 0.7 ? 'default' : 'secondary'}>
                    {Math.round(analytics.predictions.confidence * 100)}% confidence
                  </Badge>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{analytics.predictions.consensus}</p>
                </div>

                {analytics.predictions.recommendations && (
                  <div>
                    <h5 className="font-medium mb-2">Recommendations:</h5>
                    <div className="space-y-2">
                      {analytics.predictions.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isProcessing ? 'Generating predictions...' : 'No predictions available'}
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimizations" className="space-y-4">
            {analytics.optimizations ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Optimization Suggestions</h4>
                  <Badge variant="outline">
                    Action: {analytics.optimizations.action}
                  </Badge>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{analytics.optimizations.consensus}</p>
                </div>

                {analytics.optimizations.recommendations && (
                  <div className="space-y-2">
                    {analytics.optimizations.recommendations.map((opt: string, index: number) => (
                      <div key={index} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{opt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {isProcessing ? 'Generating optimizations...' : 'No optimizations available'}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {analytics.lastUpdated && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Last updated: {formatTimestamp(analytics.lastUpdated)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LLMAnalyticsPanel;