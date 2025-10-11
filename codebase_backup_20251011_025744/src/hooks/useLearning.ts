import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserFeedback {
  id?: string;
  user_id: string;
  yacht_id?: string;
  feedback_type: 'ai_response_rating' | 'feature_feedback' | 'bug_report' | 'suggestion' | 
                 'recommendation_feedback' | 'prediction_accuracy' | 'user_experience' |
                 'workflow_efficiency' | 'safety_feedback' | 'performance_feedback';
  feedback_category: 'yachtie_ai' | 'safety_recommendations' | 'maintenance_predictions' |
                    'expense_management' | 'inventory_management' | 'weather_routing' |
                    'equipment_monitoring' | 'user_interface' | 'data_accuracy' | 'general';
  feedback_title?: string;
  feedback_description: string;
  rating?: number;
  confidence_level?: number;
  interaction_context?: any;
  user_input?: string;
  system_output?: string;
  expected_output?: string;
  actual_outcome?: string;
  accuracy_assessment?: 'very_accurate' | 'accurate' | 'partially_accurate' | 'inaccurate' | 'very_inaccurate';
  usefulness_rating?: number;
  clarity_rating?: number;
  timeliness_rating?: number;
  time_saved_minutes?: number;
  cost_impact_usd?: number;
  safety_impact?: 'positive' | 'neutral' | 'negative' | 'critical';
  operational_impact?: 'significant_improvement' | 'improvement' | 'no_change' | 'minor_issue' | 'major_issue';
  suggested_improvements?: string;
  would_recommend?: boolean;
  likelihood_to_use_again?: number;
  created_at?: string;
}

export interface ModelPerformance {
  id?: string;
  model_name: string;
  model_version: string;
  model_type: string;
  accuracy_score?: number;
  precision_score?: number;
  recall_score?: number;
  f1_score?: number;
  avg_user_rating?: number;
  user_satisfaction_rate?: number;
  avg_response_time_ms?: number;
  cost_savings_usd?: number;
  time_savings_hours?: number;
  created_at?: string;
}

export interface LearningPattern {
  id?: string;
  pattern_type: string;
  pattern_name: string;
  pattern_description?: string;
  confidence_score?: number;
  pattern_data: any;
  business_impact?: 'high' | 'medium' | 'low' | 'negligible';
  recommended_actions?: any;
  implementation_priority?: 'critical' | 'high' | 'medium' | 'low';
  validation_status?: 'pending' | 'validated' | 'rejected';
  discovered_at?: string;
  created_at?: string;
}

export interface ImprovementAction {
  id?: string;
  action_name: string;
  action_type: string;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  identified_issue: string;
  proposed_solution: string;
  action_status: 'planned' | 'approved' | 'in_progress' | 'testing' | 'deployed' | 'completed' | 'cancelled';
  target_completion_date?: string;
  estimated_effort_hours?: number;
  estimated_cost_usd?: number;
}

export interface LearningInsights {
  period: string;
  feedback_summary: any;
  performance_summary: any;
  patterns_summary: any;
  recommendations: any[];
  key_metrics: any;
  trend_analysis: any;
}

// Main learning system hook
export function useLearningSystem() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callLearningAPI = useCallback(async (action: string, data?: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('self-learning-loop', {
        body: {
          action,
          ...data
        }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error(`Learning ${action} error:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action}`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const submitFeedback = useCallback(async (feedbackData: UserFeedback) => {
    setLoading(true);
    try {
      const result = await callLearningAPI('submit_feedback', {
        feedback_data: feedbackData
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve.",
      });

      return result;
    } finally {
      setLoading(false);
    }
  }, [callLearningAPI, toast]);

  const analyzePerformance = useCallback(async (modelName?: string, period = '7d') => {
    setLoading(true);
    try {
      return await callLearningAPI('analyze_performance', {
        model_name: modelName,
        analysis_period: period
      });
    } finally {
      setLoading(false);
    }
  }, [callLearningAPI]);

  const detectPatterns = useCallback(async (patternType?: string) => {
    setLoading(true);
    try {
      return await callLearningAPI('detect_patterns', {
        pattern_type: patternType
      });
    } finally {
      setLoading(false);
    }
  }, [callLearningAPI]);

  const triggerImprovement = useCallback(async (data?: any) => {
    setLoading(true);
    try {
      const result = await callLearningAPI('trigger_improvement', { data });
      
      toast({
        title: "Improvement Analysis",
        description: "Automated improvement analysis completed",
      });

      return result;
    } finally {
      setLoading(false);
    }
  }, [callLearningAPI, toast]);

  const getInsights = useCallback(async (period = '30d') => {
    setLoading(true);
    try {
      return await callLearningAPI('get_insights', {
        analysis_period: period
      });
    } finally {
      setLoading(false);
    }
  }, [callLearningAPI]);

  return {
    loading,
    submitFeedback,
    analyzePerformance,
    detectPatterns,
    triggerImprovement,
    getInsights
  };
}

// Simple mock implementations for missing hooks
export function useLearningInsights() {
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshInsights = useCallback(async () => {
    setInsights({
      period: '30d',
      feedback_summary: {},
      performance_summary: {},
      patterns_summary: {},
      recommendations: [],
      key_metrics: { avg_model_accuracy: 0.85, avg_user_satisfaction: 4.2 },
      trend_analysis: {}
    });
  }, []);

  return { insights, loading, refreshInsights };
}

// User feedback management hook
export function useFeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const learningSystem = useLearningSystem();

  const loadUserFeedbacks = useCallback(async (userId?: string, limit = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
      toast({
        title: "Error",
        description: "Failed to load user feedbacks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const submitQuickFeedback = useCallback(async (
    feedbackType: UserFeedback['feedback_type'],
    category: UserFeedback['feedback_category'],
    rating: number,
    description: string,
    context?: any
  ) => {
    try {
      const feedback: UserFeedback = {
        user_id: 'current_user',
        feedback_type: feedbackType,
        feedback_category: category,
        feedback_description: description,
        rating,
        interaction_context: context,
        created_at: new Date().toISOString()
      };

      await learningSystem.submitFeedback(feedback);
      await loadUserFeedbacks();
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }, [learningSystem, loadUserFeedbacks, toast]);

  const getFeedbackStats = useCallback(async (period = '30d') => {
    try {
      const { data, error } = await supabase
        .from('feedback_aggregations')
        .select('*')
        .gte('aggregation_period_start', new Date(Date.now() - parsePeriod(period)).toISOString())
        .order('aggregation_period_start', { ascending: false });

      if (error) throw error;

      return {
        total_feedback: data?.reduce((sum, agg) => sum + agg.total_feedback_count, 0) || 0,
        avg_rating: data?.reduce((sum, agg, _, arr) => sum + (agg.avg_rating || 0) / arr.length, 0) || 0,
        satisfaction_trend: 'positive'
      };
    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadUserFeedbacks();
  }, [loadUserFeedbacks]);

  return {
    feedbacks,
    loading,
    loadUserFeedbacks,
    submitQuickFeedback,
    getFeedbackStats
  };
}

export function usePerformanceMonitoring() {
  const [performances, setPerformances] = useState<ModelPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadModelPerformances = useCallback(async (modelName?: string, limit = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_model_performance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (modelName) {
        query = query.eq('model_name', modelName);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to match our ModelPerformance interface
      const transformedData = data?.map(item => ({
        id: item.id,
        model_name: item.module || 'unknown',
        model_version: '1.0',
        model_type: 'ai_model',
        accuracy_score: item.confidence_score || 0,
        avg_response_time_ms: item.execution_time_ms || 0,
        avg_user_rating: item.user_feedback === 'helpful' ? 5 : item.user_feedback === 'not_helpful' ? 2 : 3,
        created_at: item.created_at
      })) || [];
      
      setPerformances(transformedData);
    } catch (error) {
      console.error('Failed to load performances:', error);
      toast({
        title: "Error",
        description: "Failed to load model performances",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getPerformanceTrends = useCallback(async (modelName: string, period = '30d') => {
    try {
      const { data, error } = await supabase
        .from('ai_model_performance')
        .select('created_at, confidence_score')
        .eq('module', modelName)
        .gte('created_at', new Date(Date.now() - parsePeriod(period)).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data?.map(d => ({
        date: d.created_at,
        accuracy: d.confidence_score
      })) || [];
    } catch (error) {
      console.error('Failed to get performance trends:', error);
      return [];
    }
  }, []);

  const getModelComparison = useCallback(async () => {
    try {
      // Get latest performance for each model
      const uniqueModels = [...new Set(performances.map(p => p.model_name))];
      
      const comparison = await Promise.all(
        uniqueModels.map(async (modelName) => {
          const latest = performances
            .filter(p => p.model_name === modelName)
            .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0];
          
          return {
            model_name: modelName,
            accuracy_score: latest?.accuracy_score || 0,
            avg_response_time_ms: latest?.avg_response_time_ms || 0
          };
        })
      );

      return comparison;
    } catch (error) {
      console.error('Failed to get model comparison:', error);
      return [];
    }
  }, [performances]);

  useEffect(() => {
    loadModelPerformances();
  }, [loadModelPerformances]);

  return {
    performances,
    loading,
    loadModelPerformances,
    getPerformanceTrends,
    getModelComparison
  };
}

export function useLearningPatterns() {
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPatterns = useCallback(async (patternType?: string, limit = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('learning_patterns')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (patternType) {
        query = query.eq('pattern_type', patternType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatterns(data || []);
    } catch (error) {
      console.error('Failed to load patterns:', error);
      toast({
        title: "Error",
        description: "Failed to load learning patterns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const validatePattern = useCallback(async (patternId: string, validated: boolean) => {
    try {
      const { error } = await supabase
        .from('learning_patterns')
        .update({
          validation_status: validated ? 'validated' : 'rejected',
          last_validated_at: new Date().toISOString()
        })
        .eq('id', patternId);

      if (error) throw error;

      // Update local state
      setPatterns(prev => prev.map(p => 
        p.id === patternId 
          ? { ...p, validation_status: validated ? 'validated' : 'rejected' }
          : p
      ));

      toast({
        title: "Pattern Updated",
        description: `Pattern ${validated ? 'validated' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Failed to validate pattern:', error);
      toast({
        title: "Error",
        description: "Failed to update pattern",
        variant: "destructive",
      });
    }
  }, [toast]);

  const getPatternInsights = useCallback(async () => {
    try {
      const validatedPatterns = patterns.filter(p => p.validation_status === 'validated');
      const highImpactPatterns = validatedPatterns.filter(p => p.business_impact === 'high');
      const patternsByType = validatedPatterns.reduce((acc, p) => {
        acc[p.pattern_type] = (acc[p.pattern_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_patterns: patterns.length,
        validated_patterns: validatedPatterns.length,
        high_impact_patterns: highImpactPatterns.length,
        patterns_by_type: patternsByType,
        avg_confidence: validatedPatterns.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / validatedPatterns.length || 0
      };
    } catch (error) {
      console.error('Failed to get pattern insights:', error);
      return null;
    }
  }, [patterns]);

  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);

  return {
    patterns,
    loading,
    loadPatterns,
    validatePattern,
    getPatternInsights
  };
}

export function useImprovementActions() {
  const [actions, setActions] = useState<ImprovementAction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadActions = useCallback(async (status?: string, limit = 50) => {
    setLoading(true);
    try {
      let query = supabase
        .from('improvement_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('action_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Failed to load actions:', error);
      toast({
        title: "Error",
        description: "Failed to load improvement actions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateActionStatus = useCallback(async (actionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('improvement_actions')
        .update({ action_status: status })
        .eq('id', actionId);

      if (error) throw error;

      // Update local state
      setActions(prev => prev.map(a => 
        a.id === actionId 
          ? { ...a, action_status: status as ImprovementAction['action_status'] }
          : a
      ));

      toast({
        title: "Action Updated",
        description: "Action status updated successfully",
      });
    } catch (error) {
      console.error('Failed to update action:', error);
      toast({
        title: "Error",
        description: "Failed to update action status",
        variant: "destructive",
      });
    }
  }, [toast]);

  const createAction = useCallback(async (actionData: Partial<ImprovementAction>) => {
    try {
      const { data, error } = await supabase
        .from('improvement_actions')
        .insert([actionData])
        .select()
        .single();

      if (error) throw error;

      setActions(prev => [data, ...prev]);
      
      toast({
        title: "Action Created",
        description: "Improvement action created successfully",
      });
    } catch (error) {
      console.error('Failed to create action:', error);
      toast({
        title: "Error",
        description: "Failed to create improvement action",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  return {
    actions,
    loading,
    loadActions,
    updateActionStatus,
    createAction
  };
}

// Utility function
function parsePeriod(period: string): number {
  const value = parseInt(period);
  const unit = period.slice(-1);
  
  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
  }
}