import { supabase } from '@/integrations/supabase/client';

export interface ModelCapability {
  vision: boolean;
  reasoning: boolean;
  functionCalling: boolean;
  multimodal: boolean;
  realTime: boolean;
  codeGeneration: boolean;
  imageGeneration: boolean;
}

export interface ModelMetrics {
  latency: number;
  cost: number;
  accuracy: number;
  successRate: number;
  lastUpdated: string;
}

export interface AIModelConfig {
  id: string;
  provider: string;
  modelName: string;
  modelId: string;
  capabilities: ModelCapability;
  parameters: Record<string, any>;
  metrics: ModelMetrics;
  priority: number;
  isActive: boolean;
  moduleSpecific?: string[];
}

export interface TaskRequirements {
  module: string;
  taskType: string;
  requiresVision: boolean;
  requiresReasoning: boolean;
  requiresRealTime: boolean;
  maxLatency?: number;
  maxCost?: number;
  minAccuracy?: number;
}

export class DynamicModelSelector {
  private modelCache = new Map<string, AIModelConfig[]>();
  private performanceCache = new Map<string, ModelMetrics>();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getOptimalModels(requirements: TaskRequirements): Promise<AIModelConfig[]> {
    const availableModels = await this.getActiveModels();
    
    // Filter models by capabilities
    const capableModels = availableModels.filter(model => 
      this.meetsRequirements(model, requirements)
    );

    // Sort by performance score
    const rankedModels = capableModels.sort((a, b) => 
      this.calculatePerformanceScore(b, requirements) - 
      this.calculatePerformanceScore(a, requirements)
    );

    // Return top 3 models for consensus
    return rankedModels.slice(0, 3);
  }

  async getModelsForModule(module: string): Promise<AIModelConfig[]> {
    const models = await this.getActiveModels();
    
    // Module-specific model preferences
    const modulePreferences = await this.getModulePreferences(module);
    
    return models
      .filter(model => 
        !model.moduleSpecific || 
        model.moduleSpecific.includes(module) ||
        model.moduleSpecific.includes('global')
      )
      .sort((a, b) => {
        const aScore = modulePreferences[a.id] || a.priority;
        const bScore = modulePreferences[b.id] || b.priority;
        return bScore - aScore;
      });
  }

  async selectModelForTask(
    module: string, 
    taskType: string, 
    requirements: Partial<TaskRequirements> = {}
  ): Promise<AIModelConfig | null> {
    const fullRequirements: TaskRequirements = {
      module,
      taskType,
      requiresVision: false,
      requiresReasoning: true,
      requiresRealTime: false,
      ...requirements
    };

    const optimalModels = await this.getOptimalModels(fullRequirements);
    
    if (optimalModels.length === 0) {
      console.warn(`No suitable models found for ${module}:${taskType}`);
      return null;
    }

    // Return the best model
    return optimalModels[0];
  }

  async updateModelPerformance(
    modelId: string, 
    metrics: Partial<ModelMetrics>
  ): Promise<void> {
    try {
      // Update database
      await supabase
        .from('ai_models')
        .update({
          avg_latency_ms: metrics.latency,
          success_rate: metrics.successRate,
          cost_per_token: metrics.cost,
          updated_at: new Date().toISOString()
        })
        .eq('id', modelId);

      // Update cache
      this.performanceCache.set(modelId, {
        ...this.performanceCache.get(modelId),
        ...metrics,
        lastUpdated: new Date().toISOString()
      } as ModelMetrics);

      // Track performance in analytics
      await supabase
        .from('ai_model_performance')
        .insert({
          model_id: modelId,
          module: 'system',
          action_type: 'performance_update',
          execution_time_ms: metrics.latency || 0,
          success: (metrics.successRate || 0) > 0.8,
          confidence_score: metrics.accuracy,
          cost_usd: metrics.cost,
          metadata: { source: 'dynamic_selector' }
        });

    } catch (error) {
      console.error('Error updating model performance:', error);
    }
  }

  async getLoadBalancingInfo(): Promise<{
    totalRequests: number;
    modelDistribution: Record<string, number>;
    averageLatency: number;
    costEfficiency: number;
  }> {
    const { data: performance } = await supabase
      .from('ai_model_performance')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (!performance) return {
      totalRequests: 0,
      modelDistribution: {},
      averageLatency: 0,
      costEfficiency: 0
    };

    const totalRequests = performance.length;
    const modelDistribution: Record<string, number> = {};
    let totalLatency = 0;
    let totalCost = 0;

    performance.forEach(perf => {
      modelDistribution[perf.model_id] = (modelDistribution[perf.model_id] || 0) + 1;
      totalLatency += perf.execution_time_ms || 0;
      totalCost += perf.cost_usd || 0;
    });

    return {
      totalRequests,
      modelDistribution,
      averageLatency: totalLatency / totalRequests,
      costEfficiency: totalRequests / (totalCost || 1)
    };
  }

  private async getActiveModels(): Promise<AIModelConfig[]> {
    const now = Date.now();
    const cacheKey = 'active_models';

    if (this.modelCache.has(cacheKey) && now - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.modelCache.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      const models: AIModelConfig[] = (data || []).map(model => ({
        id: model.id,
        provider: model.provider,
        modelName: model.model_name,
        modelId: model.model_id,
        capabilities: this.parseCapabilities(model.capabilities),
        parameters: typeof model.parameters === 'object' ? model.parameters : {},
        metrics: {
          latency: model.avg_latency_ms || 1000,
          cost: model.cost_per_token || 0.001,
          accuracy: 0.9,
          successRate: model.success_rate || 0.95,
          lastUpdated: model.updated_at || new Date().toISOString()
        },
        priority: model.priority,
        isActive: model.is_active
      }));

      this.modelCache.set(cacheKey, models);
      this.lastCacheUpdate = now;
      
      return models;
    } catch (error) {
      console.error('Error fetching active models:', error);
      return [];
    }
  }

  private async getModulePreferences(module: string): Promise<Record<string, number>> {
    try {
      const { data } = await supabase
        .from('ai_module_preferences')
        .select('preferred_models')
        .eq('module', module)
        .single();

      const preferredModels = data?.preferred_models;
      return typeof preferredModels === 'object' && preferredModels !== null && !Array.isArray(preferredModels) 
        ? preferredModels as Record<string, number>
        : {};
    } catch (error) {
      return {};
    }
  }

  private meetsRequirements(model: AIModelConfig, requirements: TaskRequirements): boolean {
    const { capabilities, metrics } = model;

    // Check capabilities
    if (requirements.requiresVision && !capabilities.vision) return false;
    if (requirements.requiresReasoning && !capabilities.reasoning) return false;
    if (requirements.requiresRealTime && !capabilities.realTime) return false;

    // Check performance thresholds
    if (requirements.maxLatency && metrics.latency > requirements.maxLatency) return false;
    if (requirements.maxCost && metrics.cost > requirements.maxCost) return false;
    if (requirements.minAccuracy && metrics.accuracy < requirements.minAccuracy) return false;

    return true;
  }

  private calculatePerformanceScore(model: AIModelConfig, requirements: TaskRequirements): number {
    const { metrics } = model;
    
    // Base score from model priority
    let score = model.priority;

    // Performance factors (higher is better)
    score += (metrics.successRate * 100);
    score += (metrics.accuracy * 50);
    
    // Latency factor (lower is better)
    score -= (metrics.latency / 100);
    
    // Cost factor (lower is better)
    score -= (metrics.cost * 1000);

    // Task-specific bonuses
    if (requirements.requiresVision && model.capabilities.vision) score += 20;
    if (requirements.requiresReasoning && model.capabilities.reasoning) score += 15;
    if (requirements.requiresRealTime && model.capabilities.realTime) score += 25;

    return score;
  }

  private parseCapabilities(capabilities: any): ModelCapability {
    if (Array.isArray(capabilities)) {
      return {
        vision: capabilities.includes('vision'),
        reasoning: capabilities.includes('reasoning'),
        functionCalling: capabilities.includes('function_calling'),
        multimodal: capabilities.includes('multimodal'),
        realTime: capabilities.includes('real_time'),
        codeGeneration: capabilities.includes('code_generation'),
        imageGeneration: capabilities.includes('image_generation')
      };
    }

    return {
      vision: false,
      reasoning: true,
      functionCalling: false,
      multimodal: false,
      realTime: false,
      codeGeneration: false,
      imageGeneration: false
    };
  }
}

// Singleton instance
export const dynamicModelSelector = new DynamicModelSelector();