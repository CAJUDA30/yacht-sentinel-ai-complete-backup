import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LLMRequest {
  content: string;
  context?: string;
  type?: string;
  module?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface LLMResponse {
  openai?: any;
  grok?: any;
  deepseek?: any;
  vision?: any;
  gemini?: any;
  consensus: string;
  confidence: number;
  action: string;
  insights: string[];
  recommendations: string[];
  timestamp: string;
}

interface UniversalLLMContextType {
  processWithAllLLMs: (request: LLMRequest) => Promise<LLMResponse>;
  getAnalytics: (module: string, data: any) => Promise<LLMResponse>;
  getPredictiveInsights: (module: string, historicalData: any) => Promise<LLMResponse>;
  getOptimizationSuggestions: (module: string, currentState: any) => Promise<LLMResponse>;
  isProcessing: boolean;
  lastResponse: LLMResponse | null;
}

const UniversalLLMContext = createContext<UniversalLLMContextType | undefined>(undefined);

export const useUniversalLLM = () => {
  const context = useContext(UniversalLLMContext);
  if (!context) {
    throw new Error('useUniversalLLM must be used within UniversalLLMProvider');
  }
  return context;
};

export const UniversalLLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<LLMResponse | null>(null);

  const processWithAllLLMs = useCallback(async (request: LLMRequest): Promise<LLMResponse> => {
    setIsProcessing(true);
    try {
      // Use the new multi-LLM orchestrator for enterprise-grade processing
      const { data, error } = await supabase.functions.invoke('multi-llm-orchestrator', {
        body: {
          task_type: request.priority === 'high' ? 'consensus' : 'general',
          content: request.content,
          context: request.context,
          module: request.module,
          priority: request.priority || 'medium',
          require_consensus: request.priority === 'high' || request.type === 'critical'
        }
      });

      if (error) throw error;

      const response: LLMResponse = {
        consensus: data.final_result || 'No response',
        confidence: data.consensus_confidence || 0,
        action: data.execution_strategy || 'processed',
        insights: data.model_results?.map((r: any) => `${r.provider}: ${r.response.slice(0, 100)}...`) || [],
        recommendations: data.recommendations || [],
        timestamp: new Date().toISOString(),
        openai: data.model_results?.find((r: any) => r.provider === 'openai'),
        grok: data.model_results?.find((r: any) => r.provider === 'xai'),
        deepseek: data.model_results?.find((r: any) => r.provider === 'deepseek'),
        gemini: data.model_results?.find((r: any) => r.provider === 'google')
      };

      setLastResponse(response);
      return response;
    } catch (error) {
      console.error('LLM processing error:', error);
      const fallbackResponse: LLMResponse = {
        consensus: 'Error processing request',
        confidence: 0,
        action: 'retry',
        insights: ['System temporarily unavailable'],
        recommendations: ['Please try again later'],
        timestamp: new Date().toISOString()
      };
      setLastResponse(fallbackResponse);
      return fallbackResponse;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const getAnalytics = useCallback(async (module: string, data: any): Promise<LLMResponse> => {
    return processWithAllLLMs({
      content: `Analyze this ${module} data: ${JSON.stringify(data)}`,
      context: `Analytics for ${module} module`,
      type: 'analytics',
      module,
      priority: 'high'
    });
  }, [processWithAllLLMs]);

  const getPredictiveInsights = useCallback(async (module: string, historicalData: any): Promise<LLMResponse> => {
    return processWithAllLLMs({
      content: `Generate predictive insights for ${module} based on historical data: ${JSON.stringify(historicalData)}`,
      context: `Predictive analytics for ${module}`,
      type: 'prediction',
      module,
      priority: 'high'
    });
  }, [processWithAllLLMs]);

  const getOptimizationSuggestions = useCallback(async (module: string, currentState: any): Promise<LLMResponse> => {
    return processWithAllLLMs({
      content: `Suggest optimizations for ${module} current state: ${JSON.stringify(currentState)}`,
      context: `Optimization suggestions for ${module}`,
      type: 'optimization',
      module,
      priority: 'medium'
    });
  }, [processWithAllLLMs]);

  const value = {
    processWithAllLLMs,
    getAnalytics,
    getPredictiveInsights,
    getOptimizationSuggestions,
    isProcessing,
    lastResponse
  };

  return (
    <UniversalLLMContext.Provider value={value}>
      {children}
    </UniversalLLMContext.Provider>
  );
};