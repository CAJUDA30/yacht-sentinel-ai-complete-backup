import { enterpriseCostTracker } from '@/services/enterpriseCostTracker';
import { debugConsole } from '@/services/debugConsole';
import { supabase } from '@/integrations/supabase/client';

interface AIRequestParams {
  providerId: string;
  providerName: string;
  apiEndpoint: string;
  modelName: string;
  requestPayload: any;
  userId?: string;
  sessionId?: string;
}

interface AIResponseData {
  success: boolean;
  responseData?: any;
  errorMessage?: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  rateLimitInfo?: {
    remaining: number;
    resetAt: string;
  };
}

export class AIRequestInterceptor {
  private static instance: AIRequestInterceptor;
  
  static getInstance(): AIRequestInterceptor {
    if (!AIRequestInterceptor.instance) {
      AIRequestInterceptor.instance = new AIRequestInterceptor();
    }
    return AIRequestInterceptor.instance;
  }

  /**
   * Automatically intercept and track all AI requests
   */
  public async interceptAIRequest(
    params: AIRequestParams,
    requestFunction: () => Promise<any>
  ): Promise<any> {
    const requestStart = new Date();
    let responseData: AIResponseData = { success: false };

    try {
      debugConsole.info('AI_INTERCEPTOR', `🚀 Intercepting AI request to ${params.providerName}/${params.modelName}`);

      // Execute the actual AI request
      const result = await requestFunction();
      
      responseData = {
        success: true,
        responseData: result,
        tokensUsed: this.extractTokenUsage(result, params.modelName),
        rateLimitInfo: this.extractRateLimitInfo(result)
      };

      return result;

    } catch (error: any) {
      responseData = {
        success: false,
        errorMessage: error.message || 'Unknown error',
        tokensUsed: { input: 0, output: 0, total: 0 }
      };
      
      throw error;

    } finally {
      const requestEnd = new Date();
      
      // Always track the request for cost monitoring
      await this.trackRequest(params, requestStart, requestEnd, responseData);
    }
  }

  private async trackRequest(
    params: AIRequestParams,
    requestStart: Date,
    requestEnd: Date,
    responseData: AIResponseData
  ): Promise<void> {
    try {
      const requestSize = JSON.stringify(params.requestPayload).length;
      const responseSize = responseData.responseData ? JSON.stringify(responseData.responseData).length : 0;

      // Track with enterprise cost tracker
      await enterpriseCostTracker.trackAIRequest({
        providerId: params.providerId,
        providerName: params.providerName,
        apiEndpoint: params.apiEndpoint,
        modelName: params.modelName,
        requestStart,
        responseEnd: requestEnd,
        tokensInput: responseData.tokensUsed?.input || 0,
        tokensOutput: responseData.tokensUsed?.output || 0,
        success: responseData.success,
        errorMessage: responseData.errorMessage,
        requestSize,
        responseSize,
        rateLimitRemaining: responseData.rateLimitInfo?.remaining || 1000,
        rateLimitResetAt: responseData.rateLimitInfo?.resetAt || new Date(Date.now() + 3600000).toISOString(),
        userId: params.userId || 'system',
        sessionId: params.sessionId || `session-${Date.now()}`
      });

      // Also store in production metrics for real-time monitoring
      await this.storeProductionMetrics(params, requestStart, requestEnd, responseData);

    } catch (error) {
      debugConsole.error('AI_INTERCEPTOR', '❌ Failed to track AI request:', error);
    }
  }

  private extractTokenUsage(result: any, modelName: string): { input: number; output: number; total: number } {
    // Handle different response formats from various providers
    if (result?.usage) {
      return {
        input: result.usage.prompt_tokens || 0,
        output: result.usage.completion_tokens || 0,
        total: result.usage.total_tokens || 0
      };
    }

    if (result?.token_count) {
      return {
        input: result.token_count.input || 0,
        output: result.token_count.output || 0,
        total: result.token_count.total || 0
      };
    }

    // Estimate tokens if not provided
    const estimatedInput = this.estimateTokens(result?.prompt || '', modelName);
    const estimatedOutput = this.estimateTokens(result?.content || result?.text || '', modelName);
    
    return {
      input: estimatedInput,
      output: estimatedOutput,
      total: estimatedInput + estimatedOutput
    };
  }

  private extractRateLimitInfo(result: any): { remaining: number; resetAt: string } | undefined {
    // Handle different rate limit header formats
    if (result?.headers) {
      const remaining = result.headers['x-ratelimit-remaining'] || 
                       result.headers['ratelimit-remaining'] ||
                       result.headers['rate-limit-remaining'];
      
      const resetAt = result.headers['x-ratelimit-reset'] ||
                     result.headers['ratelimit-reset'] ||
                     result.headers['rate-limit-reset'];

      if (remaining !== undefined) {
        return {
          remaining: parseInt(remaining),
          resetAt: resetAt ? new Date(parseInt(resetAt) * 1000).toISOString() : new Date(Date.now() + 3600000).toISOString()
        };
      }
    }

    return undefined;
  }

  private estimateTokens(text: string, modelName: string): number {
    if (!text) return 0;
    
    // Rough estimation: 1 token ≈ 4 characters for most models
    // This varies by model and language, but provides a reasonable estimate
    const baseEstimate = Math.ceil(text.length / 4);
    
    // Adjust based on model type
    if (modelName.toLowerCase().includes('gpt-4')) {
      return Math.ceil(baseEstimate * 1.1); // GPT-4 tends to use slightly more tokens
    } else if (modelName.toLowerCase().includes('claude')) {
      return Math.ceil(baseEstimate * 0.9); // Claude tends to be more efficient
    }
    
    return baseEstimate;
  }

  private async storeProductionMetrics(
    params: AIRequestParams,
    requestStart: Date,
    requestEnd: Date,
    responseData: AIResponseData
  ): Promise<void> {
    try {
      const executionTime = requestEnd.getTime() - requestStart.getTime();
      const tokenUsage = responseData.tokensUsed || { input: 0, output: 0, total: 0 };

      // Store in production readiness engine format
      const metricsEntry = {
        provider_id: params.providerId,
        provider_name: params.providerName,
        model_name: params.modelName,
        execution_time_ms: executionTime,
        success: responseData.success,
        tokens_used: tokenUsage.total,
        cost_estimated: this.calculateEstimatedCost(params.modelName, params.providerName, tokenUsage),
        timestamp: requestEnd.toISOString(),
        error_message: responseData.errorMessage
      };

      // Use Supabase functions to store metrics
      await supabase.functions.invoke('production-readiness-engine', {
        body: {
          action: 'store_ai_metrics',
          metrics: metricsEntry
        }
      });

    } catch (error) {
      debugConsole.warn('AI_INTERCEPTOR', '⚠️ Could not store production metrics:', error);
    }
  }

  private calculateEstimatedCost(modelName: string, providerName: string, tokenUsage: { input: number; output: number; total: number }): number {
    // Use the same pricing logic as the cost tracker
    const pricingMap: Record<string, { input_cost_per_1k: number; output_cost_per_1k: number }> = {
      'gpt-4o': { input_cost_per_1k: 0.005, output_cost_per_1k: 0.015 },
      'gpt-4o-mini': { input_cost_per_1k: 0.00015, output_cost_per_1k: 0.0006 },
      'claude-3-5-sonnet': { input_cost_per_1k: 0.003, output_cost_per_1k: 0.015 },
      'grok-2-latest': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.01 },
      'default': { input_cost_per_1k: 0.002, output_cost_per_1k: 0.008 }
    };

    const pricing = pricingMap[modelName] || pricingMap.default;
    const inputCost = (tokenUsage.input / 1000) * pricing.input_cost_per_1k;
    const outputCost = (tokenUsage.output / 1000) * pricing.output_cost_per_1k;
    
    return inputCost + outputCost;
  }

  /**
   * Utility method to wrap any AI request function with automatic tracking
   */
  public wrapAIRequest<T>(
    params: AIRequestParams,
    requestFunction: () => Promise<T>
  ): Promise<T> {
    return this.interceptAIRequest(params, requestFunction);
  }

  /**
   * Track processor costs automatically
   */
  public async trackProcessorRequest(params: {
    processorId: string;
    processorName: string;
    processorType: 'document-ai' | 'form-recognizer' | 'custom';
    documentPages: number;
    userId?: string;
  }): Promise<void> {
    const startTime = new Date();
    
    try {
      debugConsole.info('PROCESSOR_INTERCEPTOR', `📄 Tracking processor request: ${params.processorName}`);

      // Simulate processing time based on pages
      const processingTimeMs = params.documentPages * 1000 + Math.random() * 2000;
      
      await enterpriseCostTracker.trackProcessorRequest({
        processorId: params.processorId,
        processorName: params.processorName,
        processorType: params.processorType,
        documentPages: params.documentPages,
        processingTimeMs,
        success: true,
        userId: params.userId || 'system'
      });

    } catch (error) {
      debugConsole.error('PROCESSOR_INTERCEPTOR', '❌ Failed to track processor request:', error);
    }
  }
}

// Export singleton instance
export const aiRequestInterceptor = AIRequestInterceptor.getInstance();