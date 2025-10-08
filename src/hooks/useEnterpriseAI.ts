import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnterpriseAIRequest {
  task_type: 'consensus' | 'vision' | 'analysis' | 'general' | 'cost_optimized';
  content: string;
  context?: Record<string, any>;
  module?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  require_consensus?: boolean;
  max_cost?: number;
  max_latency?: number;
}

interface EnterpriseAIResponse {
  final_result: string;
  consensus_confidence: number;
  model_results: Array<{
    provider: string;
    model: string;
    response: string;
    confidence: number;
    latency_ms: number;
    cost_usd: number;
    success: boolean;
  }>;
  total_cost: number;
  total_latency: number;
  routing_decision: string;
  execution_strategy: string;
  recommendations: string[];
}

export const useEnterpriseAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<EnterpriseAIResponse | null>(null);
  const { toast } = useToast();

  const processWithMultiLLM = useCallback(async (request: EnterpriseAIRequest): Promise<EnterpriseAIResponse> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-llm-orchestrator', {
        body: request
      });

      if (error) throw error;

      const response = data as EnterpriseAIResponse;
      setLastResponse(response);

      // Show success toast with key metrics
      toast({
        title: "AI Processing Complete",
        description: `Strategy: ${response.execution_strategy} | Confidence: ${Math.round(response.consensus_confidence * 100)}% | Cost: $${response.total_cost.toFixed(4)}`,
      });

      return response;
    } catch (error) {
      console.error('Enterprise AI processing error:', error);
      
      const fallbackResponse: EnterpriseAIResponse = {
        final_result: 'Error processing request with multi-LLM system',
        consensus_confidence: 0,
        model_results: [],
        total_cost: 0,
        total_latency: 0,
        routing_decision: 'fallback',
        execution_strategy: 'error_handling',
        recommendations: ['Please check AI provider configurations and try again']
      };

      setLastResponse(fallbackResponse);
      
      toast({
        title: "AI Processing Error",
        description: error.message || "Failed to process with multi-LLM system",
        variant: "destructive"
      });

      return fallbackResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const generateConsensus = useCallback(async (content: string, module?: string): Promise<EnterpriseAIResponse> => {
    return processWithMultiLLM({
      task_type: 'consensus',
      content,
      module,
      priority: 'high',
      require_consensus: true
    });
  }, [processWithMultiLLM]);

  const analyzeWithVision = useCallback(async (content: string, imageContext?: any, module?: string): Promise<EnterpriseAIResponse> => {
    return processWithMultiLLM({
      task_type: 'vision',
      content,
      context: { image: imageContext },
      module,
      priority: 'medium'
    });
  }, [processWithMultiLLM]);

  const optimizeCost = useCallback(async (content: string, maxCost: number = 0.05, module?: string): Promise<EnterpriseAIResponse> => {
    return processWithMultiLLM({
      task_type: 'cost_optimized',
      content,
      module,
      priority: 'low',
      max_cost: maxCost
    });
  }, [processWithMultiLLM]);

  const criticalAnalysis = useCallback(async (content: string, module?: string): Promise<EnterpriseAIResponse> => {
    return processWithMultiLLM({
      task_type: 'consensus',
      content,
      module,
      priority: 'critical',
      require_consensus: true,
      max_latency: 30000 // 30 seconds max for critical tasks
    });
  }, [processWithMultiLLM]);

  return {
    processWithMultiLLM,
    generateConsensus,
    analyzeWithVision,
    optimizeCost,
    criticalAnalysis,
    isProcessing,
    lastResponse
  };
};