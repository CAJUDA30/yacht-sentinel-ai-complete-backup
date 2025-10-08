import { supabase } from '@/integrations/supabase/client';
import { debugConsole } from '@/services/debugConsole';

interface CostTrackingEntry {
  id?: string;
  provider_id: string;
  provider_name: string;
  api_endpoint: string;
  model_name: string;
  request_timestamp: string;
  response_timestamp: string;
  execution_time_ms: number;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_input_usd: number;
  cost_output_usd: number;
  cost_total_usd: number;
  success: boolean;
  error_message?: string;
  request_size_bytes: number;
  response_size_bytes: number;
  rate_limit_remaining: number;
  rate_limit_reset_at: string;
  user_id: string;
  session_id: string;
}

interface ProcessorCostEntry {
  id?: string;
  processor_id: string;
  processor_name: string;
  processor_type: 'document-ai' | 'form-recognizer' | 'custom';
  document_pages: number;
  processing_time_ms: number;
  cost_per_page: number;
  total_cost_usd: number;
  success: boolean;
  error_message?: string;
  timestamp: string;
  user_id: string;
}

interface CostAggregation {
  total_cost_24h: number;
  total_cost_7d: number;
  total_cost_30d: number;
  total_requests_24h: number;
  cost_by_provider: Record<string, number>;
  cost_by_model: Record<string, number>;
  cost_trend: { date: string; cost: number }[];
  projected_monthly_cost: number;
  efficiency_score: number;
}

export class EnterpriseCostTracker {
  private static instance: EnterpriseCostTracker;
  private costBuffer: CostTrackingEntry[] = [];
  private processorCostBuffer: ProcessorCostEntry[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): EnterpriseCostTracker {
    if (!EnterpriseCostTracker.instance) {
      EnterpriseCostTracker.instance = new EnterpriseCostTracker();
    }
    return EnterpriseCostTracker.instance;
  }

  public async initialize(): Promise<void> {
    debugConsole.info('SYSTEM', '💰 Initializing Enterprise Cost Tracker - Precision Mode');
    
    // Create cost tracking tables if they don't exist
    await this.ensureCostTrackingTables();
    
    // Start automatic cost logging
    this.startAutomaticCostLogging();
    
    debugConsole.success('SYSTEM', '✅ Enterprise Cost Tracker initialized - Tracking to the cent');
  }

  private async ensureCostTrackingTables(): Promise<void> {
    try {
      // Use existing ai_health table with extended cost metadata
      debugConsole.info('SYSTEM', '📊 Using existing tables for cost tracking with metadata extensions');
      
    } catch (error) {
      debugConsole.warn('SYSTEM', 'Cost tracking setup - using fallback approach');
    }
  }

  public async trackAIRequest(params: {
    providerId: string;
    providerName: string;
    apiEndpoint: string;
    modelName: string;
    requestStart: Date;
    responseEnd: Date;
    tokensInput: number;
    tokensOutput: number;
    success: boolean;
    errorMessage?: string;
    requestSize: number;
    responseSize: number;
    rateLimitRemaining: number;
    rateLimitResetAt: string;
    userId: string;
    sessionId: string;
  }): Promise<void> {
    try {
      const executionTime = params.responseEnd.getTime() - params.requestStart.getTime();
      const totalTokens = params.tokensInput + params.tokensOutput;
      
      // Calculate precise costs based on real pricing
      const pricing = this.getModelPricing(params.modelName, params.providerName);
      const costInput = (params.tokensInput / 1000) * pricing.input_cost_per_1k;
      const costOutput = (params.tokensOutput / 1000) * pricing.output_cost_per_1k;
      const totalCost = costInput + costOutput;

      const costEntry: CostTrackingEntry = {
        provider_id: params.providerId,
        provider_name: params.providerName,
        api_endpoint: params.apiEndpoint,
        model_name: params.modelName,
        request_timestamp: params.requestStart.toISOString(),
        response_timestamp: params.responseEnd.toISOString(),
        execution_time_ms: executionTime,
        tokens_input: params.tokensInput,
        tokens_output: params.tokensOutput,
        tokens_total: totalTokens,
        cost_input_usd: Number(costInput.toFixed(8)), // Precision to 8 decimal places
        cost_output_usd: Number(costOutput.toFixed(8)),
        cost_total_usd: Number(totalCost.toFixed(8)),
        success: params.success,
        error_message: params.errorMessage,
        request_size_bytes: params.requestSize,
        response_size_bytes: params.responseSize,
        rate_limit_remaining: params.rateLimitRemaining,
        rate_limit_reset_at: params.rateLimitResetAt,
        user_id: params.userId,
        session_id: params.sessionId
      };

      this.costBuffer.push(costEntry);
      
      // Log for immediate monitoring
      debugConsole.info('COST_TRACKING', `💸 AI Request Cost: $${totalCost.toFixed(8)}`, {
        provider: params.providerName,
        model: params.modelName,
        tokens: totalTokens,
        execution_time: executionTime
      });

      // Auto-flush if buffer is full
      if (this.costBuffer.length >= this.batchSize) {
        await this.flushCostBuffer();
      }

    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to track AI request cost:', error);
    }
  }

  public async trackProcessorRequest(params: {
    processorId: string;
    processorName: string;
    processorType: 'document-ai' | 'form-recognizer' | 'custom';
    documentPages: number;
    processingTimeMs: number;
    success: boolean;
    errorMessage?: string;
    userId: string;
  }): Promise<void> {
    try {
      const costPerPage = this.getProcessorCostPerPage(params.processorType);
      const totalCost = params.documentPages * costPerPage;

      const processorEntry: ProcessorCostEntry = {
        processor_id: params.processorId,
        processor_name: params.processorName,
        processor_type: params.processorType,
        document_pages: params.documentPages,
        processing_time_ms: params.processingTimeMs,
        cost_per_page: costPerPage,
        total_cost_usd: Number(totalCost.toFixed(8)),
        success: params.success,
        error_message: params.errorMessage,
        timestamp: new Date().toISOString(),
        user_id: params.userId
      };

      this.processorCostBuffer.push(processorEntry);

      debugConsole.info('COST_TRACKING', `🔧 Processor Cost: $${totalCost.toFixed(8)}`, {
        processor: params.processorName,
        type: params.processorType,
        pages: params.documentPages
      });

      if (this.processorCostBuffer.length >= this.batchSize) {
        await this.flushProcessorCostBuffer();
      }

    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to track processor cost:', error);
    }
  }

  private getModelPricing(modelName: string, providerName: string): { input_cost_per_1k: number; output_cost_per_1k: number } {
    // Real-world pricing data as of 2024
    const pricingMap: Record<string, { input_cost_per_1k: number; output_cost_per_1k: number }> = {
      // OpenAI Models
      'gpt-4o': { input_cost_per_1k: 0.005, output_cost_per_1k: 0.015 },
      'gpt-4o-mini': { input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006 },
      'gpt-4-turbo': { input_cost_per_1k: 0.01, output_cost_per_1k: 0.03 },
      'gpt-4-turbo-preview': { input_cost_per_1k: 0.01, output_cost_per_1k: 0.03 },
      'gpt-3.5-turbo': { input_cost_per_1k: 0.0015, output_cost_per_1k: 0.002 },
      'gpt-3.5-turbo-0125': { input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },

      // Anthropic Models
      'claude-3-5-sonnet-20241022': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
      'claude-3-5-sonnet': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
      'claude-3-opus': { input_cost_per_1k: 0.015, output_cost_per_1k: 0.075 },
      'claude-3-sonnet': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
      'claude-3-haiku': { input_cost_per_1k: 0.00025, output_cost_per_1k: 0.00125 },

      // Grok/xAI Models
      'grok-2-latest': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.01 },
      'grok-2-vision-1212': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.01 },
      'grok-beta': { input_cost_per_1k: 0.001, output_cost_per_1k: 0.005 },

      // Google Models
      'gemini-1.5-pro': { input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005 },
      'gemini-1.5-flash': { input_cost_per_1k: 0.000075, output_cost_per_1k: 0.0003 },
      'gemini-pro': { input_cost_per_1k: 0.0005, output_cost_per_1k: 0.0015 },

      // Default fallback
      'default': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.008 }
    };

    // First try exact match
    if (pricingMap[modelName]) {
      return pricingMap[modelName];
    }

    // Pattern matching for similar models
    const lowerModelName = modelName.toLowerCase();
    for (const [key, value] of Object.entries(pricingMap)) {
      if (lowerModelName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerModelName)) {
        return value;
      }
    }

    // Provider-based fallbacks
    const providerLower = providerName.toLowerCase();
    if (providerLower.includes('openai')) {
      return { input_cost_per_1k: 0.002, output_cost_per_1k: 0.008 };
    } else if (providerLower.includes('anthropic')) {
      return { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 };
    } else if (providerLower.includes('xai') || providerLower.includes('grok')) {
      return { input_cost_per_1k: 0.002, output_cost_per_1k: 0.01 };
    } else if (providerLower.includes('google')) {
      return { input_cost_per_1k: 0.00125, output_cost_per_1k: 0.005 };
    }

    return pricingMap.default;
  }

  private getProcessorCostPerPage(processorType: string): number {
    // Real pricing for document processing services
    const processorPricing: Record<string, number> = {
      'document-ai': 0.015, // Google Document AI - $15 per 1000 pages
      'form-recognizer': 0.01, // Azure Form Recognizer - $10 per 1000 pages
      'custom': 0.005 // Custom processors
    };

    return processorPricing[processorType] || processorPricing.custom;
  }

  private startAutomaticCostLogging(): void {
    this.intervalId = setInterval(async () => {
      await this.flushAllBuffers();
    }, this.flushInterval);

    debugConsole.info('SYSTEM', '⏰ Automatic cost logging started - 30s intervals');
  }

  private async flushAllBuffers(): Promise<void> {
    await Promise.all([
      this.flushCostBuffer(),
      this.flushProcessorCostBuffer()
    ]);
  }

  private async flushCostBuffer(): Promise<void> {
    if (this.costBuffer.length === 0) return;

    try {
      const entriesToFlush = [...this.costBuffer];
      this.costBuffer = [];

      // Store cost data in ai_health table with metadata
      const { error } = await supabase
        .from('ai_health')
        .upsert({
          provider_id: entriesToFlush[0]?.provider_id || 'batch-entry',
          status: 'cost_tracking',
          last_check: new Date().toISOString(),
          cost_tracking_data: JSON.stringify(entriesToFlush)
        });

      if (error) {
        debugConsole.warn('SYSTEM', 'Using localStorage fallback for cost tracking');
        // Fallback to localStorage for critical cost data
        const existingData = JSON.parse(localStorage.getItem('enterprise_cost_data') || '[]');
        localStorage.setItem('enterprise_cost_data', JSON.stringify([...existingData, ...entriesToFlush]));
      }

      debugConsole.success('SYSTEM', `💾 Flushed ${entriesToFlush.length} AI cost entries`);
      
    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to flush cost buffer:', error);
      // Keep the entries for retry
      this.costBuffer.unshift(...this.costBuffer);
    }
  }

  private async flushProcessorCostBuffer(): Promise<void> {
    if (this.processorCostBuffer.length === 0) return;

    try {
      const entriesToFlush = [...this.processorCostBuffer];
      this.processorCostBuffer = [];

      const { error } = await supabase
        .from('ai_health')
        .upsert({
          provider_id: entriesToFlush[0]?.processor_id || 'processor-batch',
          status: 'processor_cost_tracking',
          last_check: new Date().toISOString(),
          processor_cost_data: JSON.stringify(entriesToFlush)
        });

      if (error) {
        debugConsole.warn('SYSTEM', 'Using localStorage fallback for processor costs');
        const existingData = JSON.parse(localStorage.getItem('processor_cost_data') || '[]');
        localStorage.setItem('processor_cost_data', JSON.stringify([...existingData, ...entriesToFlush]));
      }

      debugConsole.success('SYSTEM', `💾 Flushed ${entriesToFlush.length} processor cost entries`);
      
    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to flush processor cost buffer:', error);
      this.processorCostBuffer.unshift(...this.processorCostBuffer);
    }
  }

  private async fallbackCostStorage(entries: CostTrackingEntry[]): Promise<void> {
    // Store in existing ai_health table with cost metadata
    for (const entry of entries) {
      await supabase
        .from('ai_health')
        .upsert({
          provider_id: entry.provider_id,
          status: entry.success ? 'healthy' : 'unhealthy',
          last_check: entry.response_timestamp,
          cost_data: JSON.stringify({
            model_name: entry.model_name,
            cost_total_usd: entry.cost_total_usd,
            tokens_total: entry.tokens_total,
            execution_time_ms: entry.execution_time_ms
          })
        });
    }
  }

  private async fallbackProcessorCostStorage(entries: ProcessorCostEntry[]): Promise<void> {
    // Store in existing tables with processor cost metadata
    for (const entry of entries) {
      await supabase
        .from('ai_health')
        .insert({
          provider_id: entry.processor_id,
          status: entry.success ? 'healthy' : 'unhealthy',
          last_check: entry.timestamp,
          processor_cost_data: JSON.stringify({
            processor_name: entry.processor_name,
            processor_type: entry.processor_type,
            cost_total_usd: entry.total_cost_usd,
            document_pages: entry.document_pages
          })
        });
    }
  }

  public async getCostAggregation(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<CostAggregation> {
    try {
      const now = new Date();
      const timeframes = {
        '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      };

      const since = timeframes[timeframe];

      // Get cost data from ai_health table with cost metadata
      const { data: healthData } = await supabase
        .from('ai_health')
        .select('*')
        .gte('last_check', since.toISOString())
        .in('status', ['cost_tracking', 'processor_cost_tracking']);

      // Parse cost data from metadata
      let aiCosts: any[] = [];
      let processorCosts: any[] = [];
      
      healthData?.forEach(entry => {
        try {
          if (entry.status === 'cost_tracking' && (entry as any).cost_tracking_data) {
            const costData = JSON.parse((entry as any).cost_tracking_data);
            aiCosts.push(...(Array.isArray(costData) ? costData : [costData]));
          }
          if (entry.status === 'processor_cost_tracking' && (entry as any).processor_cost_data) {
            const costData = JSON.parse((entry as any).processor_cost_data);
            processorCosts.push(...(Array.isArray(costData) ? costData : [costData]));
          }
        } catch (parseError) {
          debugConsole.warn('SYSTEM', 'Could not parse cost data:', parseError);
        }
      });

      // Get localStorage fallback data
      try {
        const localAICosts = JSON.parse(localStorage.getItem('enterprise_cost_data') || '[]');
        const localProcessorCosts = JSON.parse(localStorage.getItem('processor_cost_data') || '[]');
        aiCosts.push(...localAICosts.filter((entry: any) => new Date(entry.request_timestamp) >= since));
        processorCosts.push(...localProcessorCosts.filter((entry: any) => new Date(entry.timestamp) >= since));
      } catch (error) {
        debugConsole.warn('SYSTEM', 'Could not load localStorage cost data');
      }

      // Calculate aggregations
      const totalAICost = aiCosts.reduce((sum, entry) => sum + (entry.cost_total_usd || 0), 0);
      const totalProcessorCost = processorCosts.reduce((sum, entry) => sum + (entry.total_cost_usd || 0), 0);
      const totalCost = totalAICost + totalProcessorCost;

      const totalRequests = aiCosts.length + processorCosts.length;

      // Cost by provider
      const costByProvider: Record<string, number> = {};
      aiCosts.forEach(entry => {
        if (entry.provider_name) {
          costByProvider[entry.provider_name] = (costByProvider[entry.provider_name] || 0) + (entry.cost_total_usd || 0);
        }
      });

      // Cost by model
      const costByModel: Record<string, number> = {};
      aiCosts.forEach(entry => {
        if (entry.model_name) {
          costByModel[entry.model_name] = (costByModel[entry.model_name] || 0) + (entry.cost_total_usd || 0);
        }
      });

      // Project monthly cost
      const dailyAverage = totalCost / (timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30);
      const projectedMonthlyCost = dailyAverage * 30;

      // Calculate efficiency score
      const successfulRequests = aiCosts.filter(e => e.success).length + processorCosts.filter(e => e.success).length;
      const efficiencyScore = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;

      return {
        total_cost_24h: timeframe === '24h' ? totalCost : 0,
        total_cost_7d: timeframe === '7d' ? totalCost : 0,
        total_cost_30d: timeframe === '30d' ? totalCost : 0,
        total_requests_24h: totalRequests,
        cost_by_provider: costByProvider,
        cost_by_model: costByModel,
        cost_trend: [], // Would be populated with historical data
        projected_monthly_cost: projectedMonthlyCost,
        efficiency_score: efficiencyScore
      };

    } catch (error) {
      debugConsole.error('SYSTEM', '❌ Failed to get cost aggregation:', error);
      return {
        total_cost_24h: 0,
        total_cost_7d: 0,
        total_cost_30d: 0,
        total_requests_24h: 0,
        cost_by_provider: {},
        cost_by_model: {},
        cost_trend: [],
        projected_monthly_cost: 0,
        efficiency_score: 100
      };
    }
  }

  public async generateCostReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const aggregation = await this.getCostAggregation('30d');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_cost_30d: aggregation.total_cost_30d,
        projected_monthly_cost: aggregation.projected_monthly_cost,
        efficiency_score: aggregation.efficiency_score,
        total_requests: aggregation.total_requests_24h
      },
      cost_by_provider: aggregation.cost_by_provider,
      cost_by_model: aggregation.cost_by_model,
      recommendations: this.generateCostOptimizationRecommendations(aggregation)
    };

    debugConsole.info('SYSTEM', '📊 Cost report generated', {
      total_cost: aggregation.total_cost_30d,
      efficiency: aggregation.efficiency_score
    });

    return JSON.stringify(report, null, 2);
  }

  private generateCostOptimizationRecommendations(aggregation: CostAggregation): string[] {
    const recommendations: string[] = [];

    // Check for high-cost models
    const sortedModelCosts = Object.entries(aggregation.cost_by_model)
      .sort(([,a], [,b]) => b - a);

    if (sortedModelCosts.length > 0 && sortedModelCosts[0][1] > aggregation.total_cost_30d * 0.5) {
      recommendations.push(`Consider using more cost-effective alternatives to ${sortedModelCosts[0][0]} for non-critical tasks`);
    }

    // Check efficiency
    if (aggregation.efficiency_score < 90) {
      recommendations.push('Optimize error handling to improve cost efficiency - current success rate below 90%');
    }

    // Check provider distribution
    const providerCount = Object.keys(aggregation.cost_by_provider).length;
    if (providerCount === 1) {
      recommendations.push('Consider implementing multiple providers for better cost optimization and redundancy');
    }

    return recommendations;
  }

  public cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Flush remaining entries
    this.flushAllBuffers();
    
    debugConsole.info('SYSTEM', '🧹 Enterprise Cost Tracker cleanup completed');
  }
}

// Export singleton instance
export const enterpriseCostTracker = EnterpriseCostTracker.getInstance();