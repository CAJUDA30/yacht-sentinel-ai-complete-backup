import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MessageSquare,
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Zap,
  Lightbulb,
  Settings,
  RefreshCw,
  Plus,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useLearningSystem,
  useFeedbackManagement,
  usePerformanceMonitoring,
  useLearningPatterns,
  useImprovementActions,
  useLearningInsights,
  UserFeedback
} from '@/hooks/useLearning';

// Component definitions
// Feedback Analytics Card Component
const FeedbackAnalyticsCard: React.FC<{
  feedbacks: UserFeedback[];
  onRefresh: () => void;
}> = ({ feedbacks, onRefresh }) => {
  const avgRating = feedbacks.length > 0 ? 
    feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length : 0;
  
  const feedbacksByType = feedbacks.reduce((acc, f) => {
    acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Analytics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold">{feedbacks.length}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Feedback by Type</h4>
            <div className="space-y-2">
              {Object.entries(feedbacksByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Feedback History Table Component
const FeedbackHistoryTable: React.FC<{ feedbacks: UserFeedback[] }> = ({ feedbacks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Rating</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.slice(0, 10).map((feedback) => (
                <tr key={feedback.id} className="border-b">
                  <td className="p-2">
                    <Badge variant="outline">
                      {feedback.feedback_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      {feedback.rating || 'N/A'}
                    </div>
                  </td>
                  <td className="p-2 max-w-xs truncate">
                    {feedback.feedback_description}
                  </td>
                  <td className="p-2">
                    {new Date(feedback.created_at || '').toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No feedback available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Metrics Card Component
const PerformanceMetricsCard: React.FC<{
  performances: any[];
  onRefresh: () => void;
}> = ({ performances, onRefresh }) => {
  const avgAccuracy = performances.length > 0 ?
    performances.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / performances.length : 0;
  
  const avgResponseTime = performances.length > 0 ?
    performances.reduce((sum, p) => sum + (p.avg_response_time_ms || 0), 0) / performances.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Accuracy</p>
              <p className="text-2xl font-bold">{(avgAccuracy * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Model Performance</h4>
            <div className="space-y-2">
              {performances.slice(0, 5).map((perf) => (
                <div key={perf.id} className="flex items-center justify-between">
                  <span className="text-sm">{perf.model_name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(perf.accuracy_score || 0) * 100} className="w-16 h-2" />
                    <span className="text-sm">{((perf.accuracy_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Model Comparison Table Component
const ModelComparisonTable: React.FC<{ performances: any[] }> = ({ performances }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Model</th>
                <th className="text-left p-2">Version</th>
                <th className="text-right p-2">Accuracy</th>
                <th className="text-right p-2">Response Time</th>
                <th className="text-right p-2">User Rating</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((perf) => (
                <tr key={perf.id} className="border-b">
                  <td className="p-2 font-medium">{perf.model_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">{perf.model_version}</Badge>
                  </td>
                  <td className="p-2 text-right">
                    {((perf.accuracy_score || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="p-2 text-right">
                    {(perf.avg_response_time_ms || 0).toFixed(0)}ms
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      {(perf.avg_user_rating || 0).toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {performances.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No performance data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Patterns Analysis Card Component
const PatternsAnalysisCard: React.FC<{
  patterns: any[];
  onValidate: (patternId: string, validated: boolean) => void;
  onRefresh: () => void;
}> = ({ patterns, onValidate, onRefresh }) => {
  const validatedPatterns = patterns.filter(p => p.validation_status === 'validated').length;
  const highImpactPatterns = patterns.filter(p => p.business_impact === 'high').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Pattern Analysis
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Patterns</p>
              <p className="text-2xl font-bold">{patterns.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validated</p>
              <p className="text-2xl font-bold">{validatedPatterns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Impact</p>
              <p className="text-2xl font-bold">{highImpactPatterns}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recent Patterns</h4>
            <div className="space-y-2">
              {patterns.slice(0, 3).map((pattern) => (
                <div key={pattern.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{pattern.pattern_name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {pattern.pattern_type}
                      </Badge>
                      <Badge variant={pattern.business_impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {pattern.business_impact}
                      </Badge>
                    </div>
                  </div>
                  {pattern.validation_status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onValidate(pattern.id, true)}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onValidate(pattern.id, false)}>
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Patterns Table Component
const PatternsTable: React.FC<{ patterns: any[] }> = ({ patterns }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Pattern Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Impact</th>
                <th className="text-right p-2">Confidence</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Discovered</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern) => (
                <tr key={pattern.id} className="border-b">
                  <td className="p-2 font-medium">{pattern.pattern_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {pattern.pattern_type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={pattern.business_impact === 'high' ? 'destructive' : 'secondary'}>
                      {pattern.business_impact}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    {((pattern.confidence_score || 0) * 100).toFixed(0)}%
                  </td>
                  <td className="p-2">
                    <Badge variant={pattern.validation_status === 'validated' ? 'default' : 'secondary'}>
                      {pattern.validation_status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {new Date(pattern.discovered_at || pattern.created_at || '').toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patterns.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No patterns discovered yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Improvement Actions Card Component
const ImprovementActionsCard: React.FC<{
  actions: any[];
  onUpdateStatus: (actionId: string, status: string) => void;
  onCreate: (action: any) => void;
}> = ({ actions, onUpdateStatus, onCreate }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const pendingActions = actions.filter(a => a.action_status === 'pending').length;
  const completedActions = actions.filter(a => a.action_status === 'completed').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Improvement Actions
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Action
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Improvement Action</DialogTitle>
              </DialogHeader>
              {/* Add create action form here */}
              <p className="text-muted-foreground">Action creation form would go here</p>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold">{actions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingActions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedActions}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recent Actions</h4>
            <div className="space-y-2">
              {actions.slice(0, 3).map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{action.action_name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {action.priority_level}
                      </Badge>
                      <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {action.action_status}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateStatus(action.id, action.action_status === 'pending' ? 'in_progress' : 'completed')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Actions Table Component
const ActionsTable: React.FC<{
  actions: any[];
  onUpdateStatus: (actionId: string, status: string) => void;
}> = ({ actions, onUpdateStatus }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Action Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Priority</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Target Date</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-b">
                  <td className="p-2 font-medium">{action.action_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {action.action_type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={action.priority_level === 'critical' ? 'destructive' : 'secondary'}>
                      {action.priority_level}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'}>
                      {action.action_status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {action.target_completion_date ? 
                      new Date(action.target_completion_date).toLocaleDateString() : 
                      'No date set'
                    }
                  </td>
                  <td className="p-2 text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUpdateStatus(action.id, 'in_progress')}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No improvement actions found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface LearningDashboardProps {
  yachtId?: string;
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({ yachtId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<UserFeedback['feedback_type']>('feature_feedback');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const { toast } = useToast();

  // Learning hooks
  const learningSystem = useLearningSystem();
  const feedbackMgmt = useFeedbackManagement();
  const performanceMonitoring = usePerformanceMonitoring();
  const learningPatterns = useLearningPatterns();
  const improvementActions = useImprovementActions();
  const learningInsights = useLearningInsights();

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([
          feedbackMgmt.loadUserFeedbacks(),
          performanceMonitoring.loadModelPerformances(),
          learningPatterns.loadPatterns(),
          improvementActions.loadActions('pending')
        ]);
      } catch (error) {
        console.error('Failed to load learning data:', error);
      }
    };

    loadInitialData();
  }, []);

  const handleQuickFeedback = async (rating: number, description: string) => {
    try {
      await feedbackMgmt.submitQuickFeedback(
        selectedFeedbackType,
        'general',
        rating,
        description,
        { yacht_id: yachtId }
      );
      setFeedbackDialogOpen(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const triggerAnalysis = async () => {
    try {
      await learningSystem.triggerImprovement();
      await learningInsights.refreshInsights();
    } catch (error) {
      console.error('Failed to trigger analysis:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Learning Center</h2>
          <p className="text-muted-foreground">
            AI self-learning analytics and continuous improvement
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={triggerAnalysis} disabled={learningSystem.loading}>
            <Brain className="h-4 w-4 mr-2" />
            Analyze & Improve
          </Button>
          
          <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Give Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Feedback</DialogTitle>
              </DialogHeader>
              <QuickFeedbackForm 
                onSubmit={handleQuickFeedback}
                selectedType={selectedFeedbackType}
                onTypeChange={setSelectedFeedbackType}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard
          title="Learning Score"
          value={learningInsights.insights?.key_metrics?.avg_model_accuracy ? 
            `${(learningInsights.insights.key_metrics.avg_model_accuracy * 100).toFixed(0)}%` : 'N/A'}
          icon={Brain}
          trend="up"
          color="blue"
        />
        
        <OverviewCard
          title="User Satisfaction"
          value={learningInsights.insights?.key_metrics?.avg_user_satisfaction ? 
            `${learningInsights.insights.key_metrics.avg_user_satisfaction.toFixed(1)}/5` : 'N/A'}
          icon={Star}
          trend="up"
          color="green"
        />
        
        <OverviewCard
          title="Active Patterns"
          value={learningPatterns.patterns.filter(p => p.validation_status === 'validated').length}
          icon={Target}
          trend="stable"
          color="purple"
        />
        
        <OverviewCard
          title="Improvements"
          value={improvementActions.actions.filter(a => a.action_status === 'completed').length}
          icon={CheckCircle}
          trend="up"
          color="orange"
        />
      </div>

      {/* Learning Insights Alert */}
      {learningInsights.insights?.recommendations?.length > 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Learning Recommendations</AlertTitle>
          <AlertDescription>
            {learningInsights.insights.recommendations[0].action}
            <Button variant="link" className="p-0 h-auto ml-2">
              View All ({learningInsights.insights.recommendations.length})
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LearningInsightsCard insights={learningInsights.insights} />
            <RecentActivityCard 
              feedbacks={feedbackMgmt.feedbacks.slice(0, 5)}
              actions={improvementActions.actions.slice(0, 5)}
            />
          </div>
          
          <ModelPerformanceChart performances={performanceMonitoring.performances} />
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <FeedbackAnalyticsCard 
            feedbacks={feedbackMgmt.feedbacks}
            onRefresh={feedbackMgmt.loadUserFeedbacks}
          />
          <FeedbackHistoryTable feedbacks={feedbackMgmt.feedbacks} />
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetricsCard 
            performances={performanceMonitoring.performances}
            onRefresh={performanceMonitoring.loadModelPerformances}
          />
          <ModelComparisonTable performances={performanceMonitoring.performances} />
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <PatternsAnalysisCard 
            patterns={learningPatterns.patterns}
            onValidate={learningPatterns.validatePattern}
            onRefresh={learningPatterns.loadPatterns}
          />
          <PatternsTable patterns={learningPatterns.patterns} />
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <ImprovementActionsCard 
            actions={improvementActions.actions}
            onUpdateStatus={improvementActions.updateActionStatus}
            onCreate={improvementActions.createAction}
          />
          <ActionsTable 
            actions={improvementActions.actions}
            onUpdateStatus={improvementActions.updateActionStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Overview Card Component
const OverviewCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'stable';
  color: string;
}> = ({ title, value, icon: Icon, trend, color }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : BarChart3;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center mt-1">
              <TrendIcon className={`h-3 w-3 mr-1 ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} />
              <span className="text-xs text-muted-foreground">
                {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
              </span>
            </div>
          )}
        </div>
        <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
      </CardContent>
    </Card>
  );
};

// Quick Feedback Form Component
const QuickFeedbackForm: React.FC<{
  onSubmit: (rating: number, description: string) => void;
  selectedType: UserFeedback['feedback_type'];
  onTypeChange: (type: UserFeedback['feedback_type']) => void;
}> = ({ onSubmit, selectedType, onTypeChange }) => {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (description.trim()) {
      onSubmit(rating, description);
      setDescription('');
      setRating(5);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Feedback Type</label>
        <select 
          value={selectedType} 
          onChange={(e) => onTypeChange(e.target.value as UserFeedback['feedback_type'])}
          className="w-full mt-1 p-2 border rounded"
        >
          <option value="feature_feedback">Feature Feedback</option>
          <option value="bug_report">Bug Report</option>
          <option value="suggestion">Suggestion</option>
          <option value="ai_response_rating">AI Response Rating</option>
          <option value="user_experience">User Experience</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Rating (1-5)</label>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe your feedback..."
          className="mt-1"
        />
      </div>

      <Button onClick={handleSubmit} disabled={!description.trim()} className="w-full">
        Submit Feedback
      </Button>
    </div>
  );
};

// Learning Insights Card Component
const LearningInsightsCard: React.FC<{ insights: any }> = ({ insights }) => {
  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Learning Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading insights...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Learning Insights
        </CardTitle>
        <CardDescription>
          Analysis for {insights.period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium">Key Metrics</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm">
                <span className="text-muted-foreground">Feedback Items:</span>
                <span className="ml-2 font-medium">{insights.key_metrics?.total_feedback_items || 0}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Models Monitored:</span>
                <span className="ml-2 font-medium">{insights.key_metrics?.models_monitored || 0}</span>
              </div>
            </div>
          </div>

          {insights.recommendations?.length > 0 && (
            <div>
              <h4 className="font-medium">Top Recommendations</h4>
              <div className="space-y-2 mt-2">
                {insights.recommendations.slice(0, 2).map((rec: any, index: number) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    <Badge variant="outline" className="mb-1">{rec.type}</Badge>
                    <p>{rec.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Recent Activity Card Component
const RecentActivityCard: React.FC<{
  feedbacks: UserFeedback[];
  actions: any[];
}> = ({ feedbacks, actions }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feedbacks.slice(0, 3).map((feedback) => (
            <div key={feedback.id} className="flex items-center justify-between text-sm">
              <span>New {feedback.feedback_type} feedback</span>
              <span className="text-muted-foreground">
                {new Date(feedback.created_at || '').toLocaleDateString()}
              </span>
            </div>
          ))}
          
          {actions.slice(0, 2).map((action) => (
            <div key={action.id} className="flex items-center justify-between text-sm">
              <span>Action: {action.action_name}</span>
              <Badge variant="outline">{action.action_status}</Badge>
            </div>
          ))}
          
          {feedbacks.length === 0 && actions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Model Performance Chart Component
const ModelPerformanceChart: React.FC<{ performances: any[] }> = ({ performances }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {performances.length > 0 ? (
          <div className="space-y-4">
            {performances.slice(0, 5).map((perf) => (
              <div key={perf.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{perf.model_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(perf.accuracy_score * 100).toFixed(1)}% accuracy
                  </span>
                </div>
                <Progress value={perf.accuracy_score * 100} className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No performance data available
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Feedback Analytics Card Component
const FeedbackAnalyticsCard: React.FC<{
  feedbacks: UserFeedback[];
  onRefresh: () => void;
}> = ({ feedbacks, onRefresh }) => {
  const avgRating = feedbacks.length > 0 ? 
    feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length : 0;
  
  const feedbacksByType = feedbacks.reduce((acc, f) => {
    acc[f.feedback_type] = (acc[f.feedback_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback Analytics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}/5</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold">{feedbacks.length}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Feedback by Type</h4>
            <div className="space-y-2">
              {Object.entries(feedbacksByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Feedback History Table Component
const FeedbackHistoryTable: React.FC<{ feedbacks: UserFeedback[] }> = ({ feedbacks }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Rating</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.slice(0, 10).map((feedback) => (
                <tr key={feedback.id} className="border-b">
                  <td className="p-2">
                    <Badge variant="outline">
                      {feedback.feedback_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      {feedback.rating || 'N/A'}
                    </div>
                  </td>
                  <td className="p-2 max-w-xs truncate">
                    {feedback.feedback_description}
                  </td>
                  <td className="p-2">
                    {new Date(feedback.created_at || '').toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {feedbacks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No feedback available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Performance Metrics Card Component
const PerformanceMetricsCard: React.FC<{
  performances: any[];
  onRefresh: () => void;
}> = ({ performances, onRefresh }) => {
  const avgAccuracy = performances.length > 0 ?
    performances.reduce((sum, p) => sum + (p.accuracy_score || 0), 0) / performances.length : 0;
  
  const avgResponseTime = performances.length > 0 ?
    performances.reduce((sum, p) => sum + (p.avg_response_time_ms || 0), 0) / performances.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Average Accuracy</p>
              <p className="text-2xl font-bold">{(avgAccuracy * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold">{avgResponseTime.toFixed(0)}ms</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Model Performance</h4>
            <div className="space-y-2">
              {performances.slice(0, 5).map((perf) => (
                <div key={perf.id} className="flex items-center justify-between">
                  <span className="text-sm">{perf.model_name}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(perf.accuracy_score || 0) * 100} className="w-16 h-2" />
                    <span className="text-sm">{((perf.accuracy_score || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Model Comparison Table Component
const ModelComparisonTable: React.FC<{ performances: any[] }> = ({ performances }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Model</th>
                <th className="text-left p-2">Version</th>
                <th className="text-right p-2">Accuracy</th>
                <th className="text-right p-2">Response Time</th>
                <th className="text-right p-2">User Rating</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((perf) => (
                <tr key={perf.id} className="border-b">
                  <td className="p-2 font-medium">{perf.model_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">{perf.model_version}</Badge>
                  </td>
                  <td className="p-2 text-right">
                    {((perf.accuracy_score || 0) * 100).toFixed(1)}%
                  </td>
                  <td className="p-2 text-right">
                    {(perf.avg_response_time_ms || 0).toFixed(0)}ms
                  </td>
                  <td className="p-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="h-4 w-4 fill-current text-yellow-500" />
                      {(perf.avg_user_rating || 0).toFixed(1)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {performances.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No performance data available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Patterns Analysis Card Component
const PatternsAnalysisCard: React.FC<{
  patterns: any[];
  onValidate: (patternId: string, validated: boolean) => void;
  onRefresh: () => void;
}> = ({ patterns, onValidate, onRefresh }) => {
  const validatedPatterns = patterns.filter(p => p.validation_status === 'validated').length;
  const highImpactPatterns = patterns.filter(p => p.business_impact === 'high').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Pattern Analysis
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Patterns</p>
              <p className="text-2xl font-bold">{patterns.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validated</p>
              <p className="text-2xl font-bold">{validatedPatterns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Impact</p>
              <p className="text-2xl font-bold">{highImpactPatterns}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recent Patterns</h4>
            <div className="space-y-2">
              {patterns.slice(0, 3).map((pattern) => (
                <div key={pattern.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{pattern.pattern_name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {pattern.pattern_type}
                      </Badge>
                      <Badge variant={pattern.business_impact === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {pattern.business_impact}
                      </Badge>
                    </div>
                  </div>
                  {pattern.validation_status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => onValidate(pattern.id, true)}>
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onValidate(pattern.id, false)}>
                        <AlertCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Patterns Table Component
const PatternsTable: React.FC<{ patterns: any[] }> = ({ patterns }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Patterns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Pattern Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Impact</th>
                <th className="text-right p-2">Confidence</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Discovered</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern) => (
                <tr key={pattern.id} className="border-b">
                  <td className="p-2 font-medium">{pattern.pattern_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {pattern.pattern_type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={pattern.business_impact === 'high' ? 'destructive' : 'secondary'}>
                      {pattern.business_impact}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    {((pattern.confidence_score || 0) * 100).toFixed(0)}%
                  </td>
                  <td className="p-2">
                    <Badge variant={pattern.validation_status === 'validated' ? 'default' : 'secondary'}>
                      {pattern.validation_status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {new Date(pattern.discovered_at || pattern.created_at || '').toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {patterns.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No patterns discovered yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Improvement Actions Card Component
const ImprovementActionsCard: React.FC<{
  actions: any[];
  onUpdateStatus: (actionId: string, status: string) => void;
  onCreate: (action: any) => void;
}> = ({ actions, onUpdateStatus, onCreate }) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const pendingActions = actions.filter(a => a.action_status === 'pending').length;
  const completedActions = actions.filter(a => a.action_status === 'completed').length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Improvement Actions
        </CardTitle>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Action
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Improvement Action</DialogTitle>
              </DialogHeader>
              {/* Add create action form here */}
              <p className="text-muted-foreground">Action creation form would go here</p>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Actions</p>
              <p className="text-2xl font-bold">{actions.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingActions}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedActions}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recent Actions</h4>
            <div className="space-y-2">
              {actions.slice(0, 3).map((action) => (
                <div key={action.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <span className="font-medium text-sm">{action.action_name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {action.priority_level}
                      </Badge>
                      <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                        {action.action_status}
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateStatus(action.id, action.action_status === 'pending' ? 'in_progress' : 'completed')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Actions Table Component
const ActionsTable: React.FC<{
  actions: any[];
  onUpdateStatus: (actionId: string, status: string) => void;
}> = ({ actions, onUpdateStatus }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Action Name</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Priority</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Target Date</th>
                <th className="text-right p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-b">
                  <td className="p-2 font-medium">{action.action_name}</td>
                  <td className="p-2">
                    <Badge variant="outline">
                      {action.action_type}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={action.priority_level === 'critical' ? 'destructive' : 'secondary'}>
                      {action.priority_level}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'}>
                      {action.action_status}
                    </Badge>
                  </td>
                  <td className="p-2">
                    {action.target_completion_date ? 
                      new Date(action.target_completion_date).toLocaleDateString() : 
                      'No date set'
                    }
                  </td>
                  <td className="p-2 text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onUpdateStatus(action.id, 'in_progress')}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No improvement actions found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningDashboard;