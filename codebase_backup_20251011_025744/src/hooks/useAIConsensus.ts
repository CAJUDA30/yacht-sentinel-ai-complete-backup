import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConsensusRule {
  id: string;
  module: string;
  action_type: string;
  risk_level: string;
  consensus_algorithm: string;
  required_agreement_threshold: number;
  minimum_models_required: number;
  auto_execute_threshold: number;
  human_approval_threshold: number;
  model_weights: Record<string, number>;
  fallback_models: string[];
  timeout_seconds: number;
  is_active: boolean;
}

export interface AIModel {
  id: string;
  provider: string;
  model_name: string;
  model_id: string;
  capabilities: string[];
  parameters: Record<string, any>;
  priority: number;
  is_active: boolean;
  cost_per_token: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface WorkflowStep {
  step: string;
  description: string;
  models?: string[];
  parallel?: boolean;
  purpose?: string;
}

export interface AgentWorkflow {
  id: string;
  workflow_name: string;
  module: string;
  trigger_type: string;
  workflow_steps: WorkflowStep[];
  model_chain: Array<{
    models: string[];
    parallel: boolean;
    purpose: string;
  }>;
  consensus_rule_id: string;
  success_criteria: Record<string, any>;
  failure_handling: Record<string, any>;
  is_active: boolean;
}

export interface ConsensusRequest {
  content: string;
  context?: string;
  module: string;
  action_type: string;
  risk_level?: string;
  session_id?: string;
  user_id?: string;
}

export interface ConsensusResponse {
  consensus: string;
  confidence: number;
  action: string;
  insights: string[];
  recommendations: string[];
  consensus_metadata: {
    algorithm_used: string;
    models_used: string[];
    agreement_score: number;
    execution_decision: string;
    risk_assessment: string;
  };
  timestamp: string;
}

export const useAIConsensus = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [models, setModels] = useState<AIModel[]>([]);
  const [consensusRules, setConsensusRules] = useState<ConsensusRule[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);

  const loadModels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      const models = (data || []).map(model => ({
        ...model,
        capabilities: Array.isArray(model.capabilities) ? model.capabilities : [],
        parameters: typeof model.parameters === 'object' ? model.parameters : {},
      })) as AIModel[];
      setModels(models);
      return models;
    } catch (error) {
      console.error('Error loading AI models:', error);
      return [];
    }
  }, []);

  const loadConsensusRules = useCallback(async (module?: string) => {
    try {
      let query = supabase
        .from('consensus_rules')
        .select('*')
        .eq('is_active', true);

      if (module) {
        query = query.or(`module.eq.${module},module.eq.global`);
      }

      const { data, error } = await query.order('risk_level', { ascending: false });

      if (error) throw error;
      const rules = (data || []).map(rule => ({
        ...rule,
        model_weights: typeof rule.model_weights === 'object' ? rule.model_weights : {},
        fallback_models: Array.isArray(rule.fallback_models) ? rule.fallback_models : [],
      })) as ConsensusRule[];
      setConsensusRules(rules);
      return rules;
    } catch (error) {
      console.error('Error loading consensus rules:', error);
      return [];
    }
  }, []);

  const loadWorkflows = useCallback(async (module?: string) => {
    try {
      let query = supabase
        .from('ai_agent_workflows')
        .select('*')
        .eq('is_active', true);

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      const workflows = (data || []).map(workflow => ({
        ...workflow,
        workflow_steps: Array.isArray(workflow.workflow_steps) ? workflow.workflow_steps as unknown as WorkflowStep[] : [],
        model_chain: Array.isArray(workflow.model_chain) ? workflow.model_chain as Array<{models: string[]; parallel: boolean; purpose: string;}> : [],
        success_criteria: typeof workflow.success_criteria === 'object' && workflow.success_criteria !== null ? workflow.success_criteria as Record<string, any> : {},
        failure_handling: typeof workflow.failure_handling === 'object' && workflow.failure_handling !== null ? workflow.failure_handling as Record<string, any> : {},
      })) as AgentWorkflow[];
      setWorkflows(workflows);
      return workflows;
    } catch (error) {
      console.error('Error loading workflows:', error);
      return [];
    }
  }, []);

  const processWithConsensus = useCallback(async (request: ConsensusRequest): Promise<ConsensusResponse> => {
    setIsProcessing(true);

    try {
      // Load relevant consensus rules and models
      await Promise.all([
        loadModels(),
        loadConsensusRules(request.module),
        loadWorkflows(request.module)
      ]);

      // Call the enhanced multi-AI processor
      const { data, error } = await supabase.functions.invoke('multi-ai-processor', {
        body: {
          content: request.content,
          context: request.context,
          module: request.module,
          action_type: request.action_type,
          risk_level: request.risk_level,
          session_id: request.session_id,
          user_id: request.user_id,
          timestamp: new Date().toISOString()
        }
      });

      if (error) throw error;

      return data as ConsensusResponse;
    } catch (error) {
      console.error('Error processing AI consensus:', error);
      // Return fallback response
      return {
        consensus: 'Error processing request',
        confidence: 0,
        action: 'retry',
        insights: ['System temporarily unavailable'],
        recommendations: ['Please try again later'],
        consensus_metadata: {
          algorithm_used: 'fallback',
          models_used: [],
          agreement_score: 0,
          execution_decision: 'manual_review',
          risk_assessment: 'high'
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsProcessing(false);
    }
  }, [loadModels, loadConsensusRules, loadWorkflows]);

  const updateModelConfig = useCallback(async (modelId: string, updates: Partial<AIModel>) => {
    try {
      const { error } = await supabase
        .from('ai_models')
        .update(updates)
        .eq('id', modelId);

      if (error) throw error;
      await loadModels(); // Refresh models
    } catch (error) {
      console.error('Error updating model config:', error);
      throw error;
    }
  }, [loadModels]);

  const updateConsensusRule = useCallback(async (ruleId: string, updates: Partial<ConsensusRule>) => {
    try {
      const { error } = await supabase
        .from('consensus_rules')
        .update(updates)
        .eq('id', ruleId);

      if (error) throw error;
      await loadConsensusRules(); // Refresh rules
    } catch (error) {
      console.error('Error updating consensus rule:', error);
      throw error;
    }
  }, [loadConsensusRules]);

  const trackPerformance = useCallback(async (performanceData: {
    model_id: string;
    workflow_id?: string;
    module: string;
    action_type: string;
    execution_time_ms: number;
    tokens_used?: number;
    cost_usd?: number;
    success: boolean;
    confidence_score?: number;
    consensus_contribution?: number;
    error_message?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { error } = await supabase
        .from('ai_model_performance')
        .insert(performanceData);

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  }, []);

  return {
    isProcessing,
    models,
    consensusRules,
    workflows,
    loadModels,
    loadConsensusRules,
    loadWorkflows,
    processWithConsensus,
    updateModelConfig,
    updateConsensusRule,
    trackPerformance
  };
};