import { useState, useEffect, useCallback } from 'react';
import { useUniversalLLM } from '@/contexts/UniversalLLMContext';

interface AnalyticsData {
  module: string;
  data: any;
  insights?: any;
  predictions?: any;
  optimizations?: any;
  lastUpdated?: string;
}

export const useLLMAnalytics = (module: string, data: any, autoRefresh = true) => {
  const { getAnalytics, getPredictiveInsights, getOptimizationSuggestions, isProcessing } = useUniversalLLM();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    module,
    data,
    lastUpdated: new Date().toISOString()
  });
  const [error, setError] = useState<string | null>(null);

  const refreshAnalytics = useCallback(async () => {
    if (!data || Object.keys(data).length === 0) return;

    try {
      setError(null);
      
      // Get all analytics in parallel
      const [insights, predictions, optimizations] = await Promise.all([
        getAnalytics(module, data),
        getPredictiveInsights(module, data),
        getOptimizationSuggestions(module, data)
      ]);

      setAnalytics({
        module,
        data,
        insights,
        predictions,
        optimizations,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analytics processing failed');
      console.error(`Analytics error for ${module}:`, err);
    }
  }, [module, data, getAnalytics, getPredictiveInsights, getOptimizationSuggestions]);

  // Auto-refresh analytics when data changes
  useEffect(() => {
    if (autoRefresh) {
      refreshAnalytics();
    }
  }, [refreshAnalytics, autoRefresh]);

  // Periodic refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAnalytics, autoRefresh]);

  return {
    analytics,
    refreshAnalytics,
    isProcessing,
    error,
    hasInsights: !!analytics.insights,
    hasPredictions: !!analytics.predictions,
    hasOptimizations: !!analytics.optimizations
  };
};

export const useLLMInsights = (module: string) => {
  const { processWithAllLLMs, isProcessing } = useUniversalLLM();
  const [insights, setInsights] = useState<any[]>([]);

  const generateInsights = useCallback(async (prompt: string, context?: string) => {
    const response = await processWithAllLLMs({
      content: prompt,
      context: context || `Insights for ${module}`,
      type: 'insight',
      module,
      priority: 'medium'
    });

    const newInsight = {
      id: Date.now(),
      module,
      content: response.consensus,
      confidence: response.confidence,
      recommendations: response.recommendations,
      timestamp: response.timestamp,
      llmResponses: {
        openai: response.openai,
        grok: response.grok,
        deepseek: response.deepseek,
        vision: response.vision
      }
    };

    setInsights(prev => [newInsight, ...prev.slice(0, 9)]); // Keep last 10 insights
    return newInsight;
  }, [processWithAllLLMs, module]);

  return {
    insights,
    generateInsights,
    isProcessing,
    clearInsights: () => setInsights([])
  };
};