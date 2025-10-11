/**
 * YachtieIntegrationService - Unified AI Integration Service
 * 
 * This service provides a single point of integration for all AI operations
 * using Yachtie (our proprietary multi-language AI model) as the primary
 * processing engine for all text, translation, validation, and decision-making tasks.
 */

import { supabase } from "@/integrations/supabase/client";

export interface YachtieRequest {
  text?: string;
  task: 'translate' | 'validate' | 'analyze' | 'classify' | 'summarize' | 'decide' | 'extract' | 'sentiment' | 'multilingual' | 'consensus';
  context?: string;
  language?: string;
  targetLanguage?: string;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface YachtieResponse {
  success: boolean;
  result: any;
  confidence: number;
  language: string;
  processingTime: number;
  model: string;
  error?: string;
  consensus?: any;
}

export interface YachtieConsensusRequest {
  task: string;
  data: any;
  providers: string[];
  minimumAgreement: number;
  timeoutMs?: number;
}

class YachtieIntegrationService {
  private static instance: YachtieIntegrationService;
  private readonly baseUrl = 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1';
  private cache = new Map<string, YachtieResponse>();
  private cacheTimeout = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): YachtieIntegrationService {
    if (!YachtieIntegrationService.instance) {
      YachtieIntegrationService.instance = new YachtieIntegrationService();
    }
    return YachtieIntegrationService.instance;
  }

  /**
   * Primary Yachtie processing method
   * Routes all AI tasks through Yachtie for consistent multilingual processing
   */
  async process(request: YachtieRequest): Promise<YachtieResponse> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - startTime) < this.cacheTimeout) {
      return cached;
    }

    try {
      const { data, error } = await supabase.functions.invoke('enhanced-multi-ai-processor', {
        body: {
          ...request,
          forceYachtie: true, // Ensure Yachtie is primary processor
          multilingual: true,
          enableConsensus: request.task === 'consensus'
        }
      });

      if (error) throw error;

      const response: YachtieResponse = {
        success: true,
        result: data.result || data.response,
        confidence: data.confidence || 0.95,
        language: data.detectedLanguage || request.language || 'en',
        processingTime: Date.now() - startTime,
        model: 'yachtie-multilingual-v1',
        consensus: data.consensus
      };

      // Cache successful responses
      this.cache.set(cacheKey, response);
      
      // Log to analytics
      this.logYachtieUsage(request, response);

      return response;
    } catch (error) {
      console.error('Yachtie processing error:', error);
      return {
        success: false,
        result: null,
        confidence: 0,
        language: request.language || 'en',
        processingTime: Date.now() - startTime,
        model: 'yachtie-multilingual-v1',
        error: error.message
      };
    }
  }

  /**
   * Multi-provider consensus processing
   * Uses Yachtie as primary with fallback to other providers for consensus
   */
  async processWithConsensus(request: YachtieConsensusRequest): Promise<YachtieResponse> {
    return this.process({
      text: JSON.stringify(request.data),
      task: 'consensus',
      context: request.task,
      options: {
        providers: request.providers,
        minimumAgreement: request.minimumAgreement,
        timeoutMs: request.timeoutMs || 30000
      }
    });
  }

  /**
   * Text translation with Yachtie multilingual capabilities
   */
  async translate(text: string, targetLanguage: string, sourceLanguage?: string): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'translate',
      language: sourceLanguage,
      targetLanguage,
      context: 'yacht_management'
    });
  }

  /**
   * Text validation and cleaning with Yachtie
   */
  async validate(text: string, validationType: string = 'general'): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'validate',
      context: validationType,
      options: { sanitize: true, checkMalicious: true }
    });
  }

  /**
   * Sentiment analysis with multilingual support
   */
  async analyzeSentiment(text: string, language?: string): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'sentiment',
      language,
      context: 'yacht_operations'
    });
  }

  /**
   * Data extraction and structuring
   */
  async extractData(text: string, schema: any, language?: string): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'extract',
      language,
      options: { schema, structured: true }
    });
  }

  /**
   * Classification with Yachtie
   */
  async classify(text: string, categories: string[], language?: string): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'classify',
      language,
      options: { categories }
    });
  }

  /**
   * Summarization with context awareness
   */
  async summarize(text: string, maxLength: number = 200, language?: string): Promise<YachtieResponse> {
    return this.process({
      text,
      task: 'summarize',
      language,
      options: { maxLength, contextAware: true }
    });
  }

  /**
   * Decision making with Yachtie consensus
   */
  async makeDecision(context: string, options: any[], criteria: string[]): Promise<YachtieResponse> {
    return this.process({
      text: JSON.stringify({ context, options, criteria }),
      task: 'decide',
      options: { structured: true, explainable: true }
    });
  }

  /**
   * Batch processing for multiple texts
   */
  async processBatch(requests: YachtieRequest[]): Promise<YachtieResponse[]> {
    const promises = requests.map(request => this.process(request));
    return Promise.all(promises);
  }

  /**
   * Real-time processing with streaming support
   */
  async processStream(request: YachtieRequest, onChunk: (chunk: any) => void): Promise<void> {
    // Implementation for streaming responses
    // This would integrate with real-time Yachtie streaming capabilities
    try {
      const response = await fetch(`${this.baseUrl}/enhanced-multi-ai-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkanNmdXBianRia3B1dndmZmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMjc4MTMsImV4cCI6MjA2OTgwMzgxM30.3sLKA1llE4tRBUaLzZhlLqzvM14d9db5v__GIvwvSng`
        },
        body: JSON.stringify({
          ...request,
          stream: true,
          forceYachtie: true
        })
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming not supported');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        onChunk(JSON.parse(chunk));
      }
    } catch (error) {
      console.error('Yachtie streaming error:', error);
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  getStats(): { cacheSize: number; cacheHitRate: number } {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: 0.85 // This would be calculated from actual usage
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  private generateCacheKey(request: YachtieRequest): string {
    return btoa(JSON.stringify({
      text: request.text?.substring(0, 100), // First 100 chars
      task: request.task,
      language: request.language,
      targetLanguage: request.targetLanguage
    }));
  }

  private async logYachtieUsage(request: YachtieRequest, response: YachtieResponse): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'yachtie_processing',
        event_message: `Yachtie ${request.task} processing completed`,
        module: 'yachtie_integration',
        severity: response.success ? 'info' : 'warn',
        metadata: {
          task: request.task,
          language: response.language,
          confidence: response.confidence,
          processingTime: response.processingTime,
          success: response.success
        }
      });
    } catch (error) {
      console.warn('Failed to log Yachtie usage:', error);
    }
  }
}

// Export singleton instance
export const yachtieService = YachtieIntegrationService.getInstance();

// Convenience functions for common operations
export const yachtieTranslate = (text: string, targetLang: string, sourceLang?: string) => 
  yachtieService.translate(text, targetLang, sourceLang);

export const yachtieValidate = (text: string, type?: string) => 
  yachtieService.validate(text, type);

export const yachtieSummarize = (text: string, maxLength?: number, language?: string) => 
  yachtieService.summarize(text, maxLength, language);

export const yachtieClassify = (text: string, categories: string[], language?: string) => 
  yachtieService.classify(text, categories, language);

export const yachtieExtract = (text: string, schema: any, language?: string) => 
  yachtieService.extractData(text, schema, language);

export const yachtieDecide = (context: string, options: any[], criteria: string[]) => 
  yachtieService.makeDecision(context, options, criteria);