import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Bell, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Zap,
  TrendingUp,
  Shield,
  Clock,
  X,
  Filter,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface SmartNotification {
  id: string;
  type: 'alert' | 'insight' | 'recommendation' | 'prediction' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  module: string;
  aiConfidence: number;
  modelConsensus: string[];
  timestamp: Date;
  actionable: boolean;
  dismissed: boolean;
  metadata?: {
    suggestedAction?: string;
    riskLevel?: string;
    predictedOutcome?: string;
    optimizationGain?: string;
  };
}

export const SmartNotificationCenter: React.FC = () => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<SmartNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Sample notifications with AI-powered insights
  useEffect(() => {
    const sampleNotifications: SmartNotification[] = [
      {
        id: '1',
        type: 'alert',
        priority: 'high',
        title: 'Engine Temperature Anomaly Detected',
        message: 'AI analysis indicates 89% probability of impeller blockage based on temperature patterns.',
        module: 'maintenance',
        aiConfidence: 0.89,
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        actionable: true,
        dismissed: false,
        metadata: {
          suggestedAction: 'Schedule impeller inspection within 24 hours',
          riskLevel: 'moderate',
          predictedOutcome: 'Potential engine damage if unaddressed'
        }
      },
      {
        id: '2',
        type: 'insight',
        priority: 'medium',
        title: 'Crew Efficiency Pattern Identified',
        message: 'AI detected 23% increase in task completion when crew rotations happen at 6-hour intervals.',
        module: 'crew',
        aiConfidence: 0.76,
        modelConsensus: ['GPT-4.1', 'Grok'],
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        actionable: true,
        dismissed: false,
        metadata: {
          suggestedAction: 'Implement optimized rotation schedule',
          optimizationGain: '23% efficiency improvement'
        }
      },
      {
        id: '3',
        type: 'prediction',
        priority: 'low',
        title: 'Weather Impact Forecast',
        message: 'AI weather analysis predicts optimal sailing conditions in 3 days. Fuel consumption could reduce by 15%.',
        module: 'navigation',
        aiConfidence: 0.82,
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        actionable: true,
        dismissed: false,
        metadata: {
          predictedOutcome: '15% fuel savings opportunity',
          suggestedAction: 'Plan departure for optimal weather window'
        }
      },
      {
        id: '4',
        type: 'optimization',
        priority: 'medium',
        title: 'Inventory Management Enhancement',
        message: 'AI suggests consolidating spare parts storage could reduce retrieval time by 40%.',
        module: 'inventory',
        aiConfidence: 0.91,
        modelConsensus: ['GPT-4.1', 'Grok', 'DeepSeek'],
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        actionable: true,
        dismissed: false,
        metadata: {
          optimizationGain: '40% faster part retrieval',
          suggestedAction: 'Implement smart storage reorganization'
        }
      }
    ];

    setNotifications(sampleNotifications);
    setFilteredNotifications(sampleNotifications);
  }, []);

  const filterNotifications = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setFilteredNotifications(notifications.filter(n => !n.dismissed));
    } else if (filter === 'actionable') {
      setFilteredNotifications(notifications.filter(n => n.actionable && !n.dismissed));
    } else if (filter === 'high-priority') {
      setFilteredNotifications(notifications.filter(n => 
        (n.priority === 'high' || n.priority === 'critical') && !n.dismissed
      ));
    } else {
      setFilteredNotifications(notifications.filter(n => n.type === filter && !n.dismissed));
    }
  };

  const generateSmartInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      // Get system data for analysis
      const systemData = {
        timestamp: new Date().toISOString(),
        modules: ['maintenance', 'crew', 'inventory', 'navigation', 'safety'],
        recentActivity: 'high',
        performanceMetrics: {
          efficiency: 0.87,
          alerts: 3,
          completedTasks: 24
        }
      };

      const response = await processWithAllLLMs({
        content: `Analyze current yacht operations and generate smart notifications for: ${JSON.stringify(systemData)}`,
        context: 'Proactive system monitoring and optimization',
        type: 'analysis',
        module: 'smart-notifications',
        priority: 'high'
      });

      if (response.insights && response.insights.length > 0) {
        // Generate new AI-powered notifications
        const newNotifications: SmartNotification[] = response.insights.slice(0, 3).map((insight: string, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          type: 'insight' as const,
          priority: 'medium' as const,
          title: `AI Generated Insight #${index + 1}`,
          message: insight,
          module: 'ai-analysis',
          aiConfidence: response.confidence,
          modelConsensus: ['Multi-AI Consensus'],
          timestamp: new Date(),
          actionable: true,
          dismissed: false,
          metadata: {
            suggestedAction: response.action || 'Review and implement suggested optimization'
          }
        }));

        setNotifications(prev => [...newNotifications, ...prev]);
        setFilteredNotifications(prev => [...newNotifications, ...prev]);

        toast({
          title: "Smart Insights Generated",
          description: `Generated ${newNotifications.length} new AI-powered insights`,
        });
      }
    } catch (error) {
      console.error('Error generating smart insights:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate new insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
    setFilteredNotifications(prev => prev.filter(n => n.id !== id));
  };

  const executeAction = async (notification: SmartNotification) => {
    if (!notification.metadata?.suggestedAction) return;
    
    try {
      // Execute the suggested action via AI
      const response = await processWithAllLLMs({
        content: `Execute action: ${notification.metadata.suggestedAction} for ${notification.title}`,
        context: `Smart notification action execution in ${notification.module}`,
        type: 'action',
        module: notification.module,
        priority: 'high'
      });

      toast({
        title: "Action Executed",
        description: response.consensus || "Action completed successfully",
      });

      // Mark as dismissed after action
      dismissNotification(notification.id);
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Action Failed",
        description: "Could not execute the suggested action.",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'insight': return <Brain className="h-4 w-4" />;
      case 'recommendation': return <Zap className="h-4 w-4" />;
      case 'prediction': return <TrendingUp className="h-4 w-4" />;
      case 'optimization': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'text-red-500';
      case 'insight': return 'text-blue-500';
      case 'recommendation': return 'text-purple-500';
      case 'prediction': return 'text-green-500';
      case 'optimization': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Smart Notification Center
          </h2>
          <p className="text-muted-foreground">AI-powered proactive alerts and insights</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={generateSmartInsights} 
            disabled={isGeneratingInsights || isProcessing}
            variant="outline"
          >
            <Brain className={`h-4 w-4 mr-2 ${isGeneratingInsights ? 'animate-pulse' : ''}`} />
            Generate Insights
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: notifications.filter(n => !n.dismissed).length },
          { key: 'actionable', label: 'Actionable', count: notifications.filter(n => n.actionable && !n.dismissed).length },
          { key: 'high-priority', label: 'High Priority', count: notifications.filter(n => (n.priority === 'high' || n.priority === 'critical') && !n.dismissed).length },
          { key: 'alert', label: 'Alerts', count: notifications.filter(n => n.type === 'alert' && !n.dismissed).length },
          { key: 'insight', label: 'Insights', count: notifications.filter(n => n.type === 'insight' && !n.dismissed).length },
          { key: 'prediction', label: 'Predictions', count: notifications.filter(n => n.type === 'prediction' && !n.dismissed).length }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={activeFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => filterNotifications(filter.key)}
            className="flex items-center gap-2"
          >
            <Filter className="h-3 w-3" />
            {filter.label}
            {filter.count > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {filter.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      <Card className="shadow-neumorphic border-border/50">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-4">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications match the current filter</p>
                  <p className="text-sm">Try generating new insights or changing filters</p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={getTypeColor(notification.type)}>
                              {getTypeIcon(notification.type)}
                            </div>
                            <Badge variant={getPriorityColor(notification.priority) as any}>
                              {notification.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {notification.module}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <h4 className="font-semibold mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                          
                          {/* AI Confidence & Model Consensus */}
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-3 w-3 text-blue-500" />
                              <span className="text-xs">AI Confidence:</span>
                              <Progress value={notification.aiConfidence * 100} className="w-16 h-1" />
                              <span className="text-xs font-medium">
                                {Math.round(notification.aiConfidence * 100)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">Models:</span>
                              {notification.modelConsensus.map((model, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {model}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Metadata */}
                          {notification.metadata && (
                            <div className="space-y-2 text-xs">
                              {notification.metadata.suggestedAction && (
                                <div className="flex items-center gap-2">
                                  <Zap className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">Suggested Action:</span>
                                  <span>{notification.metadata.suggestedAction}</span>
                                </div>
                              )}
                              {notification.metadata.optimizationGain && (
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                  <span className="font-medium">Potential Gain:</span>
                                  <span>{notification.metadata.optimizationGain}</span>
                                </div>
                              )}
                              {notification.metadata.riskLevel && (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                                  <span className="font-medium">Risk Level:</span>
                                  <span>{notification.metadata.riskLevel}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {notification.actionable && notification.metadata?.suggestedAction && (
                            <Button 
                              size="sm" 
                              onClick={() => executeAction(notification)}
                              disabled={isProcessing}
                            >
                              Execute
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => dismissNotification(notification.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};