import { supabase } from '@/integrations/supabase/client';

export interface OrchestrationRequest {
  task_type: 'smart_scan' | 'ocr' | 'classification' | 'analysis' | 'decision' | 'search';
  content: string | object | Blob;
  context?: {
    user_id?: string;
    yacht_id?: string;
    module?: string;
    session_id?: string;
  };
  options?: {
    cache_enabled?: boolean;
    fallback_enabled?: boolean;
    max_models?: number;
  };
}

export interface ModelResponse {
  model_id: string;
  model_name: string;
  provider: string;
  response: any;
  confidence: number;
  processing_time_ms: number;
  success: boolean;
  error?: string;
  cost_estimate?: number;
}

export interface OrchestrationResult {
  task_type: string;
  primary_result: any;
  consensus_result?: any;
  models_used: ModelResponse[];
  total_processing_time_ms: number;
  confidence_score: number;
  cache_hit: boolean;
  suggestions?: string[];
}

export class YachtieOrchestrator {
  private static instance: YachtieOrchestrator;
  private sessionId: string;

  private constructor() {
    this.sessionId = crypto.randomUUID();
  }

  static getInstance(): YachtieOrchestrator {
    if (!YachtieOrchestrator.instance) {
      YachtieOrchestrator.instance = new YachtieOrchestrator();
    }
    return YachtieOrchestrator.instance;
  }

  async processSmartScan(
    content: string | Blob, 
    context?: Partial<OrchestrationRequest['context']>
  ): Promise<OrchestrationResult> {
    let processedContent: string;
    
    if (content instanceof Blob) {
      // Convert blob to base64 for image processing
      const arrayBuffer = await content.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      processedContent = base64;
    } else {
      processedContent = content;
    }

    return this.orchestrate({
      task_type: 'smart_scan',
      content: processedContent,
      context: {
        ...context,
        module: 'smart_scan',
        session_id: this.sessionId
      },
      options: {
        cache_enabled: true,
        fallback_enabled: true,
        max_models: 3
      }
    });
  }

  async classifyDocument(
    text: string,
    context?: Partial<OrchestrationRequest['context']>
  ): Promise<OrchestrationResult> {
    return this.orchestrate({
      task_type: 'classification',
      content: text,
      context: {
        ...context,
        module: 'document_classification',
        session_id: this.sessionId
      }
    });
  }

  async analyzeData(
    data: object,
    context?: Partial<OrchestrationRequest['context']>
  ): Promise<OrchestrationResult> {
    return this.orchestrate({
      task_type: 'analysis',
      content: data,
      context: {
        ...context,
        module: 'data_analysis',
        session_id: this.sessionId
      }
    });
  }

  async searchKnowledge(
    query: string,
    context?: Partial<OrchestrationRequest['context']>
  ): Promise<OrchestrationResult> {
    return this.orchestrate({
      task_type: 'search',
      content: { query, search_type: 'knowledge_library' },
      context: {
        ...context,
        module: 'knowledge_search',
        session_id: this.sessionId
      }
    });
  }

  async makeDecision(
    analysis: any,
    context?: Partial<OrchestrationRequest['context']>
  ): Promise<OrchestrationResult> {
    return this.orchestrate({
      task_type: 'decision',
      content: analysis,
      context: {
        ...context,
        module: 'decision_making',
        session_id: this.sessionId
      }
    });
  }

  private async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
    try {
      // Add current user context if not provided
      if (!request.context?.user_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          request.context = { ...request.context, user_id: user.id };
        }
      }

      const { data, error } = await supabase.functions.invoke('yachtie-orchestrator', {
        body: request
      });

      if (error) {
        throw new Error(`Orchestration failed: ${error.message}`);
      }

      return data as OrchestrationResult;
    } catch (error) {
      console.error('Yachtie orchestration error:', error);
      throw error;
    }
  }

  // Behavior Analytics Methods
  async getUserBehaviorPatterns(userId?: string, days: number = 7) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('No user ID available');

    const { data, error } = await supabase
      .from('user_behavior_analytics')
      .select('*')
      .eq('user_id', targetUserId)
      .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return this.analyzeBehaviorPatterns(data || []);
  }

  private analyzeBehaviorPatterns(actions: any[]) {
    const patterns = {
      mostFrequentActions: this.getMostFrequent(actions, 'action_type'),
      mostUsedModules: this.getMostFrequent(actions, 'module_context'),
      dailyActivity: this.getDailyActivity(actions),
      sessionPatterns: this.getSessionPatterns(actions)
    };

    const insights = this.generateBehaviorInsights(patterns);
    
    return { patterns, insights };
  }

  private getMostFrequent(items: any[], field: string) {
    const counts = items.reduce((acc, item) => {
      const value = item[field];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([key, count]) => ({ [field]: key, count }));
  }

  private getDailyActivity(actions: any[]) {
    const daily = actions.reduce((acc, action) => {
      const date = new Date(action.timestamp).toDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(daily).map(([date, count]) => ({ date, count }));
  }

  private getSessionPatterns(actions: any[]) {
    const sessions = actions.reduce((acc, action) => {
      const sessionId = action.session_id || 'unknown';
      if (!acc[sessionId]) {
        acc[sessionId] = [];
      }
      acc[sessionId].push(action);
      return acc;
    }, {});

    return Object.entries(sessions).map(([sessionId, sessionActions]) => ({
      sessionId,
      actionCount: (sessionActions as any[]).length,
      duration: this.calculateSessionDuration(sessionActions as any[]),
      actions: sessionActions
    }));
  }

  private calculateSessionDuration(actions: any[]): number {
    if (actions.length < 2) return 0;
    
    const timestamps = actions.map(a => new Date(a.timestamp).getTime()).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private generateBehaviorInsights(patterns: any): string[] {
    const insights = [];
    
    if (patterns.mostFrequentActions.length > 0) {
      const topAction = patterns.mostFrequentActions[0];
      insights.push(`Most frequent activity: ${topAction.action_type} (${topAction.count} times)`);
    }

    if (patterns.mostUsedModules.length > 0) {
      const topModule = patterns.mostUsedModules[0];
      insights.push(`Primary module usage: ${topModule.module_context}`);
    }

    if (patterns.dailyActivity.length > 0) {
      const avgDaily = patterns.dailyActivity.reduce((sum: number, day: any) => sum + day.count, 0) / patterns.dailyActivity.length;
      insights.push(`Average daily activities: ${Math.round(avgDaily)}`);
    }

    return insights;
  }

  // Proactive Suggestions
  async getProactiveSuggestions(userId?: string) {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('No user ID available');

    const { data, error } = await supabase
      .from('proactive_suggestions')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async respondToSuggestion(suggestionId: string, action: 'accepted' | 'dismissed') {
    const { error } = await supabase
      .from('proactive_suggestions')
      .update({
        status: action,
        responded_at: new Date().toISOString()
      })
      .eq('id', suggestionId);

    if (error) throw error;
  }

  // Knowledge Library Integration
  async addToKnowledgeLibrary(
    title: string,
    content: any,
    type: 'manual' | 'technical_spec' | 'safety_document' | 'maintenance_guide',
    metadata?: any
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('shared_knowledge_library')
      .insert({
        knowledge_type: type,
        title,
        content_data: content,
        content_text: typeof content === 'string' ? content : JSON.stringify(content),
        confidence_score: 1.0,
        updated_by: user?.id,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async searchKnowledgeLibrary(query: string, type?: string) {
    let queryBuilder = supabase
      .from('shared_knowledge_library')
      .select('*')
      .textSearch('content_text', query, { type: 'websearch' });

    if (type) {
      queryBuilder = queryBuilder.eq('knowledge_type', type);
    }

    const { data, error } = await queryBuilder
      .eq('is_public', true)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  }

  // Model Performance Monitoring
  async getModelPerformanceMetrics() {
    const { data, error } = await supabase
      .from('ai_models_unified')
      .select(`
        *,
        provider:ai_providers_unified(name, base_url)
      `)
      .eq('is_active', true)
      .order('success_rate', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getOrchestrationRules() {
    const { data, error } = await supabase
      .from('ai_orchestration_rules')
      .select(`
        *,
        primary_model:ai_models_unified(model_name, provider_name),
        fallback_models_details:ai_models_unified!inner(model_name, provider_name)
      `)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}