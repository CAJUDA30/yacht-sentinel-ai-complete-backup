import { FC } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Lightbulb,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';
import { useBehaviorAnalytics } from '@/hooks/useBehaviorAnalytics';

export const ProactiveIntelligenceDashboard: React.FC = () => {
  const {
    analytics,
    suggestions,
    isLoading,
    dismissSuggestion,
    actOnSuggestion,
    isDismissingSuggestion,
    isActingOnSuggestion
  } = useBehaviorAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Proactive Intelligence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t" />
              <CardContent className="h-32 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <Target className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <Lightbulb className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Proactive Intelligence</h2>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          AI-Powered
        </Badge>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Efficiency Score</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.user_efficiency_score)}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <Progress value={analytics.user_efficiency_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Patterns</p>
                  <p className="text-2xl font-bold">{analytics.workflow_patterns?.length || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Optimizations</p>
                  <p className="text-2xl font-bold">{analytics.optimization_opportunities?.length || 0}</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Knowledge Gaps</p>
                  <p className="text-2xl font-bold">{analytics.knowledge_gaps?.length || 0}</p>
                </div>
                <Brain className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proactive Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Proactive Suggestions
          </CardTitle>
          <CardDescription>
            AI-generated recommendations based on your usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions?.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getPriorityIcon(suggestion.priority)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <Badge variant={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Badge>
                          <Badge variant="outline">{suggestion.module}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {suggestion.description}
                        </p>
                        {suggestion.suggested_action && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Suggested Action:</strong> {JSON.stringify(suggestion.suggested_action)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => actOnSuggestion(suggestion.id)}
                        disabled={isActingOnSuggestion}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Act
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => dismissSuggestion(suggestion.id)}
                        disabled={isDismissingSuggestion}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No proactive suggestions at the moment.</p>
              <p className="text-sm">Keep using the system to unlock AI-powered insights!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Module Usage & Efficiency */}
      {analytics?.most_used_modules && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Module Usage & Efficiency
            </CardTitle>
            <CardDescription>
              Your most used modules and their efficiency scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.most_used_modules.map((moduleData, index) => (
                <div key={moduleData.module} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{moduleData.module}</span>
                      <Badge variant="outline">{moduleData.usage_count} uses</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(moduleData.efficiency)}% efficient
                    </span>
                  </div>
                  <Progress value={moduleData.efficiency} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Opportunities */}
      {analytics?.optimization_opportunities && analytics.optimization_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Optimization Opportunities
            </CardTitle>
            <CardDescription>
              AI-identified ways to improve your workflow efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.optimization_opportunities.map((opportunity, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{opportunity.type}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {opportunity.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Save {opportunity.potential_time_saved}min/day
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {opportunity.implementation_effort} effort
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Gaps */}
      {analytics?.knowledge_gaps && analytics.knowledge_gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Knowledge Gaps & Learning Suggestions
            </CardTitle>
            <CardDescription>
              Areas where additional knowledge could improve efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.knowledge_gaps.map((gap, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{gap.area}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                      <ul className="text-sm space-y-1">
                        {gap.evidence.map((evidence, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{evidence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Suggested Learning:</p>
                      <ul className="text-sm space-y-1">
                        {gap.suggested_learning.map((learning, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-primary">→</span>
                            <span>{learning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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