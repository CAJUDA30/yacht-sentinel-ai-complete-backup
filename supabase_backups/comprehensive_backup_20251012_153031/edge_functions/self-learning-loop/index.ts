import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LearningRequest {
  action: 'submit_feedback' | 'analyze_performance' | 'detect_patterns' | 'trigger_improvement' | 'get_insights';
  feedback_data?: any;
  model_name?: string;
  pattern_type?: string;
  analysis_period?: string;
  data?: any;
}

interface LearningResponse {
  success: boolean;
  feedback_id?: string;
  performance_metrics?: any;
  patterns?: any[];
  improvement_actions?: any[];
  insights?: any;
  error?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: LearningRequest = await req.json();
    console.log(`🧠 Learning operation: ${request.action}`);

    let result: LearningResponse;

    switch (request.action) {
      case 'submit_feedback':
        result = await submitUserFeedback(request);
        break;
      case 'analyze_performance':
        result = await analyzeModelPerformance(request);
        break;
      case 'detect_patterns':
        result = await detectLearningPatterns(request);
        break;
      case 'trigger_improvement':
        result = await triggerImprovementAction(request);
        break;
      case 'get_insights':
        result = await getLearningInsights(request);
        break;
      default:
        throw new Error(`Unsupported learning action: ${request.action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('🚨 Learning operation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Learning operation failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function submitUserFeedback(request: LearningRequest): Promise<LearningResponse> {
  const { feedback_data } = request;

  if (!feedback_data) {
    throw new Error('Feedback data is required');
  }

  console.log(`📝 Submitting user feedback: ${feedback_data.feedback_type}`);

  // Enrich feedback with additional context
  const enrichedFeedback = await enrichFeedbackData(feedback_data);

  // Insert feedback into database
  const { data: feedback, error } = await supabase
    .from('user_feedback')
    .insert({
      ...enrichedFeedback,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit feedback: ${error.message}`);
  }

  // Trigger immediate analysis if feedback is critical
  if (feedback.feedback_type === 'bug_report' || feedback.rating <= 2) {
    await triggerCriticalFeedbackAnalysis(feedback.id);
  }

  // Update aggregated metrics
  await updateFeedbackAggregations(feedback);

  return {
    success: true,
    feedback_id: feedback.id
  };
}

async function analyzeModelPerformance(request: LearningRequest): Promise<LearningResponse> {
  const { model_name, analysis_period = '7d' } = request;

  console.log(`📊 Analyzing performance for model: ${model_name || 'all'}`);

  // Calculate performance metrics for the specified period
  const performanceData = await calculatePerformanceMetrics(model_name, analysis_period);

  // Detect performance degradation
  const degradationAlerts = await detectPerformanceDegradation(model_name, performanceData);

  // Generate performance insights
  const insights = await generatePerformanceInsights(performanceData, degradationAlerts);

  // Store performance record
  if (model_name && performanceData) {
    const { error } = await supabase
      .from('ai_model_performance')
      .insert({
        model_name,
        model_version: performanceData.version || 'current',
        model_type: performanceData.type || 'unknown',
        evaluation_period_start: new Date(Date.now() - parsePeriod(analysis_period)).toISOString(),
        evaluation_period_end: new Date().toISOString(),
        ...performanceData.metrics
      });

    if (error) {
      console.error('Failed to store performance data:', error);
    }
  }

  return {
    success: true,
    performance_metrics: performanceData,
    insights
  };
}

async function detectLearningPatterns(request: LearningRequest): Promise<LearningResponse> {
  const { pattern_type = 'user_behavior' } = request;

  console.log(`🔍 Detecting learning patterns: ${pattern_type}`);

  let patterns: any[] = [];

  switch (pattern_type) {
    case 'user_behavior':
      patterns = await detectUserBehaviorPatterns();
      break;
    case 'usage_pattern':
      patterns = await detectUsagePatterns();
      break;
    case 'error_pattern':
      patterns = await detectErrorPatterns();
      break;
    case 'performance_pattern':
      patterns = await detectPerformancePatterns();
      break;
    default:
      patterns = await detectAllPatterns();
  }

  // Store significant patterns
  for (const pattern of patterns.filter(p => p.confidence_score >= 0.7)) {
    const { error } = await supabase
      .from('learning_patterns')
      .upsert({
        pattern_type,
        pattern_name: pattern.name,
        pattern_description: pattern.description,
        detection_method: 'statistical',
        confidence_score: pattern.confidence_score,
        pattern_data: pattern.data,
        supporting_evidence: pattern.evidence,
        business_impact: pattern.impact_level,
        recommended_actions: pattern.actions
      });

    if (error) {
      console.error('Failed to store pattern:', error);
    }
  }

  return {
    success: true,
    patterns
  };
}

async function triggerImprovementAction(request: LearningRequest): Promise<LearningResponse> {
  const { data } = request;

  console.log(`🚀 Triggering improvement action`);

  // Get learning configuration
  const { data: config } = await supabase
    .from('learning_configuration')
    .select('*')
    .eq('config_type', 'auto_improvement')
    .eq('is_active', true)
    .single();

  if (!config || !config.auto_tuning_enabled) {
    return {
      success: false,
      error: 'Auto-improvement is not enabled'
    };
  }

  // Identify improvement opportunities
  const { data: opportunities, error } = await supabase.rpc('identify_learning_opportunities');

  if (error) {
    throw new Error(`Failed to identify opportunities: ${error.message}`);
  }

  const improvementActions = [];

  // Create improvement actions for high-priority opportunities
  for (const opp of opportunities.filter((o: any) => o.priority_score >= 3.0)) {
    const { data: action, error: actionError } = await supabase
      .from('improvement_actions')
      .insert({
        action_name: `Auto-generated: ${opp.opportunity_type}`,
        action_type: 'model_improvement',
        priority_level: opp.potential_impact === 'critical' ? 'critical' : 'high',
        identified_issue: opp.description,
        proposed_solution: opp.recommended_action,
        action_status: config.human_approval_required ? 'planned' : 'approved'
      })
      .select()
      .single();

    if (!actionError) {
      improvementActions.push(action);
    }
  }

  return {
    success: true,
    improvement_actions: improvementActions
  };
}

async function getLearningInsights(request: LearningRequest): Promise<LearningResponse> {
  const { analysis_period = '30d' } = request;

  console.log(`💡 Generating learning insights for period: ${analysis_period}`);

  // Get recent feedback aggregations
  const { data: feedbackAggs } = await supabase
    .from('feedback_aggregations')
    .select('*')
    .gte('aggregation_period_start', new Date(Date.now() - parsePeriod(analysis_period)).toISOString())
    .order('aggregation_period_start', { ascending: false });

  // Get recent performance data
  const { data: performanceData } = await supabase
    .from('ai_model_performance')
    .select('*')
    .gte('evaluation_period_start', new Date(Date.now() - parsePeriod(analysis_period)).toISOString())
    .order('evaluation_period_start', { ascending: false });

  // Get active patterns
  const { data: patterns } = await supabase
    .from('learning_patterns')
    .select('*')
    .eq('validation_status', 'validated')
    .gte('discovered_at', new Date(Date.now() - parsePeriod(analysis_period)).toISOString());

  // Generate comprehensive insights
  const insights = {
    period: analysis_period,
    feedback_summary: generateFeedbackInsights(feedbackAggs || []),
    performance_summary: generatePerformanceInsights(performanceData || []),
    patterns_summary: generatePatternInsights(patterns || []),
    recommendations: generateActionableRecommendations(feedbackAggs, performanceData, patterns),
    key_metrics: calculateKeyMetrics(feedbackAggs, performanceData),
    trend_analysis: calculateTrends(feedbackAggs, performanceData)
  };

  return {
    success: true,
    insights
  };
}

// Helper functions

async function enrichFeedbackData(feedbackData: any) {
  // Add system context, user session info, etc.
  return {
    ...feedbackData,
    device_info: feedbackData.device_info || {},
    session_id: feedbackData.session_id || generateSessionId(),
    interaction_duration_ms: feedbackData.interaction_duration_ms || 0
  };
}

async function triggerCriticalFeedbackAnalysis(feedbackId: string) {
  // Immediate analysis for critical feedback
  console.log(`🚨 Critical feedback analysis triggered for: ${feedbackId}`);
  
  // This would trigger immediate ML analysis pipeline
  // For now, just mark for urgent review
  await supabase
    .from('user_feedback')
    .update({ 
      feedback_status: 'reviewed',
      processing_notes: 'Triggered critical analysis',
      follow_up_required: true
    })
    .eq('id', feedbackId);
}

async function updateFeedbackAggregations(feedback: any) {
  // Update daily aggregation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('feedback_aggregations')
    .select('*')
    .eq('aggregation_type', 'daily_summary')
    .eq('feedback_category', feedback.feedback_category)
    .gte('aggregation_period_start', today.toISOString())
    .single();

  if (existing) {
    // Update existing aggregation
    const newCount = existing.total_feedback_count + 1;
    const newAvgRating = feedback.rating ? 
      ((existing.avg_rating * existing.total_feedback_count) + feedback.rating) / newCount :
      existing.avg_rating;

    await supabase
      .from('feedback_aggregations')
      .update({
        total_feedback_count: newCount,
        avg_rating: newAvgRating,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new aggregation
    await supabase
      .from('feedback_aggregations')
      .insert({
        aggregation_type: 'daily_summary',
        aggregation_period_start: today.toISOString(),
        aggregation_period_end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        feedback_category: feedback.feedback_category,
        total_feedback_count: 1,
        avg_rating: feedback.rating || null
      });
  }
}

async function calculatePerformanceMetrics(modelName?: string, period = '7d') {
  const startDate = new Date(Date.now() - parsePeriod(period));

  // This would integrate with actual ML metrics collection
  // For now, generate sample metrics based on feedback
  const { data: feedbacks } = await supabase
    .from('user_feedback')
    .select('rating, accuracy_assessment, usefulness_rating')
    .gte('created_at', startDate.toISOString())
    .eq('feedback_category', modelName ? getModelCategory(modelName) : undefined);

  if (!feedbacks || feedbacks.length === 0) {
    return null;
  }

  const validRatings = feedbacks.filter(f => f.rating).map(f => f.rating);
  const usefulnessRatings = feedbacks.filter(f => f.usefulness_rating).map(f => f.usefulness_rating);
  
  return {
    metrics: {
      total_interactions: feedbacks.length,
      avg_user_rating: validRatings.length > 0 ? 
        validRatings.reduce((a, b) => a + b, 0) / validRatings.length : null,
      user_satisfaction_rate: validRatings.filter(r => r >= 4).length / validRatings.length,
      avg_usefulness: usefulnessRatings.length > 0 ?
        usefulnessRatings.reduce((a, b) => a + b, 0) / usefulnessRatings.length : null
    },
    version: 'current',
    type: modelName ? getModelType(modelName) : 'general'
  };
}

async function detectPerformanceDegradation(modelName?: string, currentData?: any) {
  if (!currentData || !modelName) return [];

  // Get historical performance
  const { data: historical } = await supabase
    .from('ai_model_performance')
    .select('*')
    .eq('model_name', modelName)
    .order('evaluation_period_start', { ascending: false })
    .limit(5);

  const alerts = [];

  if (historical && historical.length > 0) {
    const lastPerformance = historical[0];
    const avgHistorical = historical.reduce((sum, h) => sum + (h.avg_user_rating || 0), 0) / historical.length;

    if (currentData.metrics.avg_user_rating < avgHistorical * 0.9) {
      alerts.push({
        type: 'performance_degradation',
        severity: 'warning',
        message: 'User satisfaction has decreased significantly',
        current_value: currentData.metrics.avg_user_rating,
        historical_avg: avgHistorical
      });
    }
  }

  return alerts;
}

async function detectUserBehaviorPatterns() {
  // Analyze user behavior patterns
  const { data: behaviorData } = await supabase
    .from('user_feedback')
    .select('user_id, feedback_type, rating, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const patterns = [];

  if (behaviorData && behaviorData.length > 0) {
    // Pattern: Users who give low ratings tend to...
    const lowRatingUsers = behaviorData
      .filter(f => f.rating && f.rating <= 2)
      .map(f => f.user_id);

    if (lowRatingUsers.length > 5) {
      patterns.push({
        name: 'Low satisfaction user behavior',
        description: 'Users giving low ratings show specific feedback patterns',
        confidence_score: 0.8,
        data: { affected_users: lowRatingUsers.length },
        evidence: { sample_size: behaviorData.length },
        impact_level: 'medium',
        actions: ['Investigate common pain points', 'Provide additional user support']
      });
    }
  }

  return patterns;
}

async function detectUsagePatterns() {
  // Analyze usage patterns from feedback timing and frequency
  const patterns = [];

  const { data: usageData } = await supabase
    .from('user_feedback')
    .select('created_at, feedback_category, user_id')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (usageData && usageData.length > 0) {
    // Group by hour to find peak usage times
    const hourlyUsage = new Array(24).fill(0);
    usageData.forEach(f => {
      const hour = new Date(f.created_at).getHours();
      hourlyUsage[hour]++;
    });

    const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
    
    patterns.push({
      name: 'Peak usage hours',
      description: `Most feedback received during hour ${peakHour}`,
      confidence_score: 0.9,
      data: { peak_hour: peakHour, hourly_distribution: hourlyUsage },
      evidence: { total_samples: usageData.length },
      impact_level: 'low',
      actions: ['Optimize system performance during peak hours']
    });
  }

  return patterns;
}

async function detectErrorPatterns() {
  const patterns = [];

  const { data: errorData } = await supabase
    .from('user_feedback')
    .select('*')
    .eq('feedback_type', 'bug_report')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (errorData && errorData.length > 0) {
    patterns.push({
      name: 'Bug report frequency',
      description: `${errorData.length} bug reports in the last 30 days`,
      confidence_score: 1.0,
      data: { bug_count: errorData.length },
      evidence: { reports: errorData.map(e => e.feedback_description) },
      impact_level: errorData.length > 10 ? 'high' : 'medium',
      actions: ['Prioritize bug fixes', 'Improve testing procedures']
    });
  }

  return patterns;
}

async function detectPerformancePatterns() {
  // This would analyze performance trends
  return [];
}

async function detectAllPatterns() {
  const allPatterns = await Promise.all([
    detectUserBehaviorPatterns(),
    detectUsagePatterns(),
    detectErrorPatterns(),
    detectPerformancePatterns()
  ]);

  return allPatterns.flat();
}

function generateFeedbackInsights(aggregations: any[]) {
  if (aggregations.length === 0) return { message: 'No feedback data available' };

  const totalFeedback = aggregations.reduce((sum, agg) => sum + agg.total_feedback_count, 0);
  const avgRating = aggregations
    .filter(agg => agg.avg_rating)
    .reduce((sum, agg, _, arr) => sum + agg.avg_rating / arr.length, 0);

  return {
    total_feedback: totalFeedback,
    average_rating: avgRating,
    satisfaction_trend: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative'
  };
}

function generatePerformanceInsights(performanceData: any[]) {
  if (performanceData.length === 0) return { message: 'No performance data available' };

  const avgAccuracy = performanceData
    .filter(p => p.accuracy_score)
    .reduce((sum, p, _, arr) => sum + p.accuracy_score / arr.length, 0);

  return {
    models_tracked: performanceData.length,
    average_accuracy: avgAccuracy,
    performance_trend: avgAccuracy >= 0.8 ? 'good' : avgAccuracy >= 0.6 ? 'acceptable' : 'needs_improvement'
  };
}

function generatePatternInsights(patterns: any[]) {
  return {
    patterns_identified: patterns.length,
    high_confidence_patterns: patterns.filter(p => p.confidence_score >= 0.8).length,
    critical_patterns: patterns.filter(p => p.business_impact === 'high').length
  };
}

function generateActionableRecommendations(feedbacks: any[], performance: any[], patterns: any[]) {
  const recommendations = [];

  // Based on feedback
  const lowSatisfaction = feedbacks?.some(f => f.avg_rating < 3);
  if (lowSatisfaction) {
    recommendations.push({
      type: 'user_experience',
      priority: 'high',
      action: 'Investigate and address user satisfaction issues'
    });
  }

  // Based on performance
  const lowPerformance = performance?.some(p => p.accuracy_score < 0.7);
  if (lowPerformance) {
    recommendations.push({
      type: 'model_improvement',
      priority: 'high',
      action: 'Retrain or fine-tune underperforming models'
    });
  }

  // Based on patterns
  const criticalPatterns = patterns?.filter(p => p.business_impact === 'high');
  if (criticalPatterns?.length > 0) {
    recommendations.push({
      type: 'pattern_response',
      priority: 'medium',
      action: 'Address critical behavioral patterns identified'
    });
  }

  return recommendations;
}

function calculateKeyMetrics(feedbacks: any[], performance: any[]) {
  return {
    total_feedback_items: feedbacks?.length || 0,
    avg_user_satisfaction: feedbacks?.reduce((sum, f, _, arr) => sum + (f.avg_rating || 0) / arr.length, 0) || 0,
    models_monitored: performance?.length || 0,
    avg_model_accuracy: performance?.reduce((sum, p, _, arr) => sum + (p.accuracy_score || 0) / arr.length, 0) || 0
  };
}

function calculateTrends(feedbacks: any[], performance: any[]) {
  // Simplified trend calculation
  return {
    feedback_trend: feedbacks?.length > 0 ? 'increasing' : 'stable',
    performance_trend: performance?.length > 0 ? 'stable' : 'unknown'
  };
}

// Utility functions
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

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function getModelCategory(modelName: string): string {
  if (modelName.includes('yachtie')) return 'yachtie_ai';
  if (modelName.includes('safety')) return 'safety_recommendations';
  if (modelName.includes('maintenance')) return 'maintenance_predictions';
  return 'general';
}

function getModelType(modelName: string): string {
  if (modelName.includes('consensus')) return 'llm_consensus';
  if (modelName.includes('yachtie')) return 'yachtie_ai';
  if (modelName.includes('safety')) return 'safety_prediction';
  return 'general';
}