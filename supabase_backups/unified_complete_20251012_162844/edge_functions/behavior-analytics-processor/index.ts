import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserAction {
  action_type: string;
  module: string;
  context: Record<string, any>;
  user_id: string;
  session_id: string;
  timestamp: string;
  page_url?: string;
  metadata: Record<string, any>;
}

interface BehaviorPattern {
  pattern_type: 'frequent_action' | 'workflow_sequence' | 'time_based' | 'context_switch';
  user_id: string;
  module: string;
  pattern_data: Record<string, any>;
  confidence: number;
  frequency: number;
  last_occurrence: string;
}

interface ProactiveSuggestion {
  suggestion_type: 'action' | 'workflow' | 'optimization' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggested_action: Record<string, any>;
  trigger_pattern: string;
  user_id: string;
  module: string;
  expires_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from JWT token
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || 'anonymous';
      } catch (error) {
        console.log('Could not authenticate user:', error.message);
      }
    }

    switch (action) {
      case 'track_action':
        return await trackUserAction(supabase, { ...data, user_id: userId });
        
      case 'get_analytics':
        return await getBehaviorAnalytics(supabase, userId);
        
      case 'get_suggestions':
        return await getProactiveSuggestions(supabase, userId);
        
      case 'dismiss_suggestion':
        return await dismissSuggestion(supabase, data.suggestion_id, userId);
        
      case 'act_on_suggestion':
        return await actOnSuggestion(supabase, data.suggestion_id, userId);
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Behavior analytics error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function trackUserAction(supabase: any, actionData: UserAction) {
  try {
    // Store the action
    const { error: insertError } = await supabase
      .from('user_actions')
      .insert({
        action_type: actionData.action_type,
        module: actionData.module,
        context: actionData.context,
        user_id: actionData.user_id,
        session_id: actionData.session_id,
        page_url: actionData.page_url,
        metadata: actionData.metadata
      });

    if (insertError) throw insertError;

    // Analyze patterns in background (don't wait for completion)
    analyzePatterns(supabase, actionData.user_id).catch(console.error);
    
    // Generate proactive suggestions in background
    generateProactiveSuggestions(supabase, actionData.user_id).catch(console.error);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to track action: ${error.message}`);
  }
}

async function getBehaviorAnalytics(supabase: any, userId: string) {
  try {
    // Get user actions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: actions, error: actionsError } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (actionsError) throw actionsError;

    // Get behavior patterns
    const { data: patterns, error: patternsError } = await supabase
      .from('behavior_patterns')
      .select('*')
      .eq('user_id', userId);

    if (patternsError) throw patternsError;

    // Calculate analytics
    const analytics = calculateBehaviorAnalytics(actions || [], patterns || []);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

async function getProactiveSuggestions(supabase: any, userId: string) {
  try {
    const { data: suggestions, error } = await supabase
      .from('proactive_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('dismissed', false)
      .eq('acted_upon', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify(suggestions || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to get suggestions: ${error.message}`);
  }
}

async function dismissSuggestion(supabase: any, suggestionId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('proactive_suggestions')
      .update({ dismissed: true, dismissed_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to dismiss suggestion: ${error.message}`);
  }
}

async function actOnSuggestion(supabase: any, suggestionId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('proactive_suggestions')
      .update({ acted_upon: true, acted_upon_at: new Date().toISOString() })
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) throw error;

    // Track the action
    await supabase
      .from('user_actions')
      .insert({
        action_type: 'suggestion_acted',
        module: 'proactive_intelligence',
        context: { suggestion_id: suggestionId },
        user_id: userId,
        session_id: `suggestion_${Date.now()}`,
        metadata: {}
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    throw new Error(`Failed to act on suggestion: ${error.message}`);
  }
}

function calculateBehaviorAnalytics(actions: any[], patterns: any[]) {
  // Module usage analysis
  const moduleUsage = actions.reduce((acc, action) => {
    const module = action.module || 'unknown';
    acc[module] = (acc[module] || 0) + 1;
    return acc;
  }, {});

  const mostUsedModules = Object.entries(moduleUsage)
    .map(([module, count]) => ({
      module,
      usage_count: count as number,
      efficiency: calculateModuleEfficiency(actions.filter(a => a.module === module))
    }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);

  // Time patterns
  const timePatterns = calculateTimePatterns(actions);

  // Efficiency score
  const userEfficiencyScore = calculateEfficiencyScore(actions, patterns);

  // Optimization opportunities
  const optimizationOpportunities = identifyOptimizationOpportunities(actions, patterns);

  // Knowledge gaps
  const knowledgeGaps = identifyKnowledgeGaps(actions);

  return {
    user_efficiency_score: userEfficiencyScore,
    most_used_modules: mostUsedModules,
    workflow_patterns: patterns,
    time_patterns: timePatterns,
    optimization_opportunities: optimizationOpportunities,
    knowledge_gaps: knowledgeGaps
  };
}

function calculateModuleEfficiency(moduleActions: any[]): number {
  if (moduleActions.length === 0) return 100;

  // Simple efficiency calculation based on action patterns
  const uniqueActionTypes = new Set(moduleActions.map(a => a.action_type)).size;
  const totalActions = moduleActions.length;
  const avgTimeBetweenActions = calculateAvgTimeBetweenActions(moduleActions);
  
  // More unique actions with reasonable timing = higher efficiency
  const diversityScore = Math.min(uniqueActionTypes / 5, 1) * 40; // Max 40 points for diversity
  const timingScore = Math.max(60 - (avgTimeBetweenActions / 1000 / 60), 0); // Penalize very long delays
  const volumeScore = Math.min(totalActions / 10, 1) * 20; // Max 20 points for volume

  return Math.round(diversityScore + timingScore + volumeScore);
}

function calculateAvgTimeBetweenActions(actions: any[]): number {
  if (actions.length < 2) return 0;

  const sortedActions = actions.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  let totalTime = 0;
  
  for (let i = 1; i < sortedActions.length; i++) {
    totalTime += new Date(sortedActions[i].created_at).getTime() - new Date(sortedActions[i-1].created_at).getTime();
  }
  
  return totalTime / (sortedActions.length - 1);
}

function calculateTimePatterns(actions: any[]) {
  const hourlyActivity = new Array(24).fill(0);
  
  actions.forEach(action => {
    const hour = new Date(action.created_at).getHours();
    hourlyActivity[hour]++;
  });

  return hourlyActivity.map((activity, hour) => ({
    hour,
    activity_level: activity
  }));
}

function calculateEfficiencyScore(actions: any[], patterns: any[]): number {
  if (actions.length === 0) return 50;

  // Base score on action diversity, timing, and pattern recognition
  const uniqueModules = new Set(actions.map(a => a.module)).size;
  const uniqueActionTypes = new Set(actions.map(a => a.action_type)).size;
  const patternScore = patterns.length * 5;
  
  const diversityScore = Math.min((uniqueModules * 10) + (uniqueActionTypes * 5), 50);
  const efficiencyScore = Math.min(patternScore, 30);
  const consistencyScore = 20; // Base score
  
  return Math.min(diversityScore + efficiencyScore + consistencyScore, 100);
}

function identifyOptimizationOpportunities(actions: any[], patterns: any[]) {
  const opportunities = [];

  // Check for repetitive actions that could be automated
  const actionCounts = actions.reduce((acc, action) => {
    const key = `${action.module}:${action.action_type}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  Object.entries(actionCounts).forEach(([actionKey, count]) => {
    if (count > 20) {
      const [module, actionType] = actionKey.split(':');
      opportunities.push({
        type: 'Automation Opportunity',
        description: `You've performed "${actionType}" ${count} times in ${module}. Consider setting up automation.`,
        potential_time_saved: Math.round(count * 0.5), // Estimate 30 seconds saved per action
        implementation_effort: 'medium' as const
      });
    }
  });

  // Check for module switching patterns
  const frequentSwitches = identifyModuleSwitches(actions);
  if (frequentSwitches.length > 0) {
    opportunities.push({
      type: 'Workflow Optimization',
      description: 'Frequent module switching detected. Consider using cross-module features.',
      potential_time_saved: 15,
      implementation_effort: 'low' as const
    });
  }

  return opportunities.slice(0, 5); // Limit to top 5 opportunities
}

function identifyModuleSwitches(actions: any[]) {
  const switches = [];
  for (let i = 1; i < actions.length; i++) {
    if (actions[i].module !== actions[i-1].module) {
      switches.push({
        from: actions[i-1].module,
        to: actions[i].module,
        timestamp: actions[i].created_at
      });
    }
  }
  return switches;
}

function identifyKnowledgeGaps(actions: any[]) {
  const gaps = [];

  // Check for error patterns or repeated similar actions
  const errorActions = actions.filter(a => 
    a.action_type.includes('error') || 
    a.context?.error || 
    a.metadata?.error
  );

  if (errorActions.length > 5) {
    gaps.push({
      area: 'Error Resolution',
      evidence: [`${errorActions.length} error-related actions detected`],
      suggested_learning: [
        'Review system documentation',
        'Practice common workflows',
        'Use guided tutorials'
      ]
    });
  }

  // Check for underutilized modules
  const moduleUsage = actions.reduce((acc, action) => {
    acc[action.module] = (acc[action.module] || 0) + 1;
    return acc;
  }, {});

  const allModules = ['inventory', 'equipment', 'maintenance', 'finance', 'procurement', 'safety', 'crew', 'navigation'];
  const underutilizedModules = allModules.filter(module => (moduleUsage[module] || 0) < 3);

  if (underutilizedModules.length > 3) {
    gaps.push({
      area: 'Module Exploration',
      evidence: [`Limited usage of ${underutilizedModules.length} available modules`],
      suggested_learning: [
        'Explore unused modules',
        'Try SmartScan features',
        'Review module capabilities'
      ]
    });
  }

  return gaps;
}

async function analyzePatterns(supabase: any, userId: string) {
  // This would run more complex pattern analysis
  // For now, just a placeholder that identifies basic patterns
  
  try {
    const { data: recentActions } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!recentActions || recentActions.length < 10) return;

    // Simple pattern: frequent action detection
    const actionCounts = recentActions.reduce((acc, action) => {
      const key = `${action.module}:${action.action_type}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    for (const [actionKey, count] of Object.entries(actionCounts)) {
      if (count >= 5) { // Frequent action threshold
        const [module, actionType] = actionKey.split(':');
        
        await supabase
          .from('behavior_patterns')
          .upsert({
            pattern_type: 'frequent_action',
            user_id: userId,
            module,
            pattern_data: { action_type: actionType, count },
            confidence: Math.min(count / 10, 1),
            frequency: count,
            last_occurrence: new Date().toISOString()
          }, { onConflict: 'user_id,module,pattern_type' });
      }
    }

  } catch (error) {
    console.error('Pattern analysis error:', error);
  }
}

async function generateProactiveSuggestions(supabase: any, userId: string) {
  try {
    const { data: patterns } = await supabase
      .from('behavior_patterns')
      .select('*')
      .eq('user_id', userId);

    const { data: recentActions } = await supabase
      .from('user_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!patterns || !recentActions) return;

    // Generate suggestions based on patterns
    for (const pattern of patterns) {
      if (pattern.pattern_type === 'frequent_action' && pattern.frequency > 10) {
        const suggestion = {
          suggestion_type: 'optimization',
          priority: 'medium',
          title: 'Automation Opportunity Detected',
          description: `You frequently perform "${pattern.pattern_data.action_type}" in ${pattern.module}. Consider setting up automation to save time.`,
          suggested_action: {
            type: 'setup_automation',
            module: pattern.module,
            action: pattern.pattern_data.action_type
          },
          trigger_pattern: pattern.id,
          user_id: userId,
          module: pattern.module,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };

        // Check if similar suggestion already exists
        const { data: existing } = await supabase
          .from('proactive_suggestions')
          .select('id')
          .eq('user_id', userId)
          .eq('module', pattern.module)
          .eq('suggestion_type', 'optimization')
          .eq('dismissed', false)
          .eq('acted_upon', false);

        if (!existing || existing.length === 0) {
          await supabase
            .from('proactive_suggestions')
            .insert(suggestion);
        }
      }
    }

  } catch (error) {
    console.error('Proactive suggestions error:', error);
  }
}