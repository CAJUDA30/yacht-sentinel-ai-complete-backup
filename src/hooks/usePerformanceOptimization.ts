import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { dynamicModelSelector } from '@/services/dynamicModelSelection';

interface PerformanceMetrics {
  totalRequests: number;
  averageLatency: number;
  successRate: number;
  costPerRequest: number;
  modelDistribution: Record<string, number>;
  errorRate: number;
  lastUpdated: string;
}

interface OptimizationSuggestion {
  type: 'model_replacement' | 'load_balancing' | 'cost_reduction' | 'latency_improvement';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number;
}

interface ModelHealthStatus {
  modelId: string;
  modelName: string;
  status: 'healthy' | 'degraded' | 'failing';
  latency: number;
  successRate: number;
  costEfficiency: number;
  lastCheck: string;
  recommendations: string[];
}

export const usePerformanceOptimization = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [modelHealth, setModelHealth] = useState<ModelHealthStatus[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(false);

  const analyzePerformance = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Get performance data from last 24 hours
      const { data: performanceData, error } = await supabase
        .from('ai_model_performance')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!performanceData || performanceData.length === 0) {
        setMetrics({
          totalRequests: 0,
          averageLatency: 0,
          successRate: 100,
          costPerRequest: 0,
          modelDistribution: {},
          errorRate: 0,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      // Calculate metrics
      const totalRequests = performanceData.length;
      const successfulRequests = performanceData.filter(p => p.success).length;
      const totalLatency = performanceData.reduce((sum, p) => sum + (p.execution_time_ms || 0), 0);
      const totalCost = performanceData.reduce((sum, p) => sum + (p.cost_usd || 0), 0);
      
      const modelDistribution: Record<string, number> = {};
      performanceData.forEach(p => {
        const modelKey = p.model_id || 'unknown';
        modelDistribution[modelKey] = (modelDistribution[modelKey] || 0) + 1;
      });

      const calculatedMetrics: PerformanceMetrics = {
        totalRequests,
        averageLatency: totalLatency / totalRequests,
        successRate: (successfulRequests / totalRequests) * 100,
        costPerRequest: totalCost / totalRequests,
        modelDistribution,
        errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
        lastUpdated: new Date().toISOString()
      };

      setMetrics(calculatedMetrics);

      // Analyze model health
      await analyzeModelHealth(performanceData);

      // Generate optimization suggestions
      await generateOptimizationSuggestions(calculatedMetrics, performanceData);

    } catch (error) {
      console.error('Error analyzing performance:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const analyzeModelHealth = async (performanceData: any[]) => {
    try {
      // Get all active models
      const { data: models, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const healthStatuses: ModelHealthStatus[] = models?.map(model => {
        const modelPerformance = performanceData.filter(p => p.model_id === model.id);
        
        if (modelPerformance.length === 0) {
          return {
            modelId: model.id,
            modelName: model.model_name,
            status: 'healthy' as const,
            latency: model.avg_latency_ms || 1000,
            successRate: model.success_rate || 95,
            costEfficiency: 1 / (model.cost_per_token || 0.001),
            lastCheck: new Date().toISOString(),
            recommendations: ['No recent usage data available']
          };
        }

        const successRate = (modelPerformance.filter(p => p.success).length / modelPerformance.length) * 100;
        const avgLatency = modelPerformance.reduce((sum, p) => sum + (p.execution_time_ms || 0), 0) / modelPerformance.length;
        const avgCost = modelPerformance.reduce((sum, p) => sum + (p.cost_usd || 0), 0) / modelPerformance.length;
        
        let status: 'healthy' | 'degraded' | 'failing' = 'healthy';
        const recommendations: string[] = [];

        if (successRate < 80) {
          status = 'failing';
          recommendations.push('Success rate below 80% - investigate API issues');
        } else if (successRate < 95) {
          status = 'degraded';
          recommendations.push('Success rate declining - monitor closely');
        }

        if (avgLatency > 10000) {
          status = status === 'healthy' ? 'degraded' : status;
          recommendations.push('High latency detected - consider model optimization');
        }

        if (avgCost > 0.01) {
          recommendations.push('High cost per request - evaluate cost efficiency');
        }

        return {
          modelId: model.id,
          modelName: model.model_name,
          status,
          latency: avgLatency,
          successRate,
          costEfficiency: 1 / (avgCost || 0.001),
          lastCheck: new Date().toISOString(),
          recommendations: recommendations.length > 0 ? recommendations : ['Model performing well']
        };
      }) || [];

      setModelHealth(healthStatuses);
    } catch (error) {
      console.error('Error analyzing model health:', error);
    }
  };

  const generateOptimizationSuggestions = async (metrics: PerformanceMetrics, performanceData: any[]) => {
    const suggestions: OptimizationSuggestion[] = [];

    // High latency suggestion
    if (metrics.averageLatency > 5000) {
      suggestions.push({
        type: 'latency_improvement',
        priority: 'high',
        description: 'Average response time is above 5 seconds',
        impact: `Reduce latency by ${Math.round((metrics.averageLatency - 3000) / metrics.averageLatency * 100)}%`,
        implementation: 'Switch to faster models for real-time tasks or implement request caching',
        estimatedImprovement: 40
      });
    }

    // High cost suggestion
    if (metrics.costPerRequest > 0.005) {
      suggestions.push({
        type: 'cost_reduction',
        priority: 'medium',
        description: 'Cost per request is above optimal threshold',
        impact: 'Potential 30-50% cost reduction',
        implementation: 'Use more cost-effective models for simple tasks',
        estimatedImprovement: 35
      });
    }

    // Low success rate suggestion
    if (metrics.successRate < 95) {
      suggestions.push({
        type: 'model_replacement',
        priority: 'high',
        description: 'Overall success rate is below 95%',
        impact: 'Improve reliability and user experience',
        implementation: 'Replace failing models with more reliable alternatives',
        estimatedImprovement: 20
      });
    }

    // Load balancing suggestion
    const modelUsage = Object.values(metrics.modelDistribution);
    const maxUsage = Math.max(...modelUsage);
    const minUsage = Math.min(...modelUsage);
    
    if (maxUsage > minUsage * 3 && modelUsage.length > 1) {
      suggestions.push({
        type: 'load_balancing',
        priority: 'medium',
        description: 'Uneven load distribution across models',
        impact: 'Better resource utilization and reduced bottlenecks',
        implementation: 'Implement intelligent load balancing based on model capabilities',
        estimatedImprovement: 25
      });
    }

    setSuggestions(suggestions);
  };

  const implementOptimization = useCallback(async (suggestion: OptimizationSuggestion) => {
    try {
      switch (suggestion.type) {
        case 'model_replacement':
          await optimizeModelSelection();
          break;
        case 'latency_improvement':
          await optimizeForLatency();
          break;
        case 'cost_reduction':
          await optimizeForCost();
          break;
        case 'load_balancing':
          await optimizeLoadBalancing();
          break;
      }

      // Re-analyze after optimization
      setTimeout(() => analyzePerformance(), 2000);
    } catch (error) {
      console.error('Error implementing optimization:', error);
    }
  }, [analyzePerformance]);

  const optimizeModelSelection = async () => {
    // Get failing models and suggest replacements
    const failingModels = modelHealth.filter(m => m.status === 'failing');
    
    for (const model of failingModels) {
      await supabase
        .from('ai_models')
        .update({ is_active: false })
        .eq('id', model.modelId);
    }
  };

  const optimizeForLatency = async () => {
    // Prioritize faster models
    const { data: models } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('avg_latency_ms', { ascending: true });

    if (models && models.length > 0) {
      // Update priorities based on latency
      const updates = models.map((model, index) => ({
        id: model.id,
        priority: 100 - (index * 10)
      }));

      for (const update of updates) {
        await supabase
          .from('ai_models')
          .update({ priority: update.priority })
          .eq('id', update.id);
      }
    }
  };

  const optimizeForCost = async () => {
    // Prioritize cost-effective models
    const { data: models } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_token', { ascending: true });

    if (models && models.length > 0) {
      // Update priorities based on cost
      const updates = models.map((model, index) => ({
        id: model.id,
        priority: Math.max(10, 90 - (index * 15))
      }));

      for (const update of updates) {
        await supabase
          .from('ai_models')
          .update({ priority: update.priority })
          .eq('id', update.id);
      }
    }
  };

  const optimizeLoadBalancing = async () => {
    // Update model weights for better load distribution
    const { data: rules } = await supabase
      .from('consensus_rules')
      .select('*')
      .eq('is_active', true);

    if (rules) {
      for (const rule of rules) {
        // Create balanced model weights
        const balancedWeights: Record<string, number> = {};
        modelHealth.forEach(model => {
          balancedWeights[model.modelId] = 
            model.status === 'healthy' ? 1.0 : 
            model.status === 'degraded' ? 0.7 : 0.3;
        });

        await supabase
          .from('consensus_rules')
          .update({ model_weights: balancedWeights })
          .eq('id', rule.id);
      }
    }
  };

  const enableAutoOptimization = useCallback(async (enabled: boolean) => {
    setAutoOptimizationEnabled(enabled);
    
    // Store preference in system settings
    try {
      await supabase
        .from('system_settings')
        .upsert({
          id: 'auto_optimization',
          ai_settings: { auto_optimization_enabled: enabled }
        });
    } catch (error) {
      console.error('Error saving auto-optimization preference:', error);
    }
  }, []);

  // Auto-optimization interval
  useEffect(() => {
    if (autoOptimizationEnabled) {
      const interval = setInterval(async () => {
        await analyzePerformance();
        
        // Auto-implement high-priority suggestions
        const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
        for (const suggestion of highPrioritySuggestions) {
          await implementOptimization(suggestion);
        }
      }, 30 * 60 * 1000); // Every 30 minutes

      return () => clearInterval(interval);
    }
  }, [autoOptimizationEnabled, suggestions, implementOptimization, analyzePerformance]);

  // Load auto-optimization preference on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('ai_settings')
          .eq('id', 'auto_optimization')
          .single();

        const aiSettings = data?.ai_settings as Record<string, any> | null;
        if (aiSettings?.auto_optimization_enabled) {
          setAutoOptimizationEnabled(true);
        }
      } catch (error) {
        // Preference not set, use default
      }
    };

    loadPreferences();
  }, []);

  return {
    metrics,
    suggestions,
    modelHealth,
    isAnalyzing,
    autoOptimizationEnabled,
    analyzePerformance,
    implementOptimization,
    enableAutoOptimization
  };
};