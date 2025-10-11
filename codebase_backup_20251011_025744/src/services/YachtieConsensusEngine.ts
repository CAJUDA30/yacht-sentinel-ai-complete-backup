/**
 * YachtieConsensusEngine - Multi-AI Decision Making System
 * 
 * Orchestrates multiple AI providers with Yachtie as the primary processor
 * to achieve consensus on critical yacht management decisions.
 */

import { yachtieService, YachtieResponse } from './YachtieIntegrationService';
import { supabase } from "@/integrations/supabase/client";

export interface ConsensusRequest {
  task: string;
  data: any;
  context: string;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanApproval?: boolean;
  timeoutMs?: number;
}

export interface ConsensusResponse {
  decision: any;
  confidence: number;
  agreement: number;
  providers: string[];
  yachtieResult: any;
  alternativeResults: any[];
  explanation: string;
  requiresApproval: boolean;
  metadata: Record<string, any>;
}

export interface ConsensusRule {
  id: string;
  name: string;
  condition: string;
  minimumAgreement: number;
  requiredProviders: string[];
  humanApprovalRequired: boolean;
  enabled: boolean;
}

class YachtieConsensusEngine {
  private static instance: YachtieConsensusEngine;
  private consensusRules: ConsensusRule[] = [];
  private activeConsensusJobs = new Map<string, any>();

  private constructor() {
    this.loadConsensusRules();
  }

  static getInstance(): YachtieConsensusEngine {
    if (!YachtieConsensusEngine.instance) {
      YachtieConsensusEngine.instance = new YachtieConsensusEngine();
    }
    return YachtieConsensusEngine.instance;
  }

  /**
   * Process a request through consensus engine with Yachtie as primary
   */
  async processConsensus(request: ConsensusRequest): Promise<ConsensusResponse> {
    const jobId = this.generateJobId();
    const startTime = Date.now();

    try {
      // Store active job
      this.activeConsensusJobs.set(jobId, {
        request,
        startTime,
        status: 'processing'
      });

      // Get applicable consensus rules
      const applicableRules = this.getApplicableRules(request);
      const rule = applicableRules.length > 0 ? applicableRules[0] : this.getDefaultRule(request.criticalityLevel);

      // Step 1: Get Yachtie's primary result
      const yachtieResult = await yachtieService.process({
        text: JSON.stringify(request.data),
        task: 'analyze',
        context: request.context,
        options: {
          detailed: true,
          explainable: true,
          contextAware: true
        }
      });

      // Step 2: Get alternative provider results for consensus
      const alternativeResults = await this.getAlternativeResults(request, rule.requiredProviders);

      // Step 3: Calculate consensus
      const consensus = this.calculateConsensus(yachtieResult, alternativeResults, rule);

      // Step 4: Generate explanation
      const explanation = await this.generateExplanation(request, yachtieResult, alternativeResults, consensus);

      // Step 5: Determine if human approval is needed
      const requiresApproval = this.requiresHumanApproval(request, consensus, rule);

      const response: ConsensusResponse = {
        decision: consensus.decision,
        confidence: consensus.confidence,
        agreement: consensus.agreement,
        providers: [yachtieResult.model, ...alternativeResults.map(r => r.model)],
        yachtieResult: yachtieResult.result,
        alternativeResults: alternativeResults.map(r => r.result),
        explanation,
        requiresApproval,
        metadata: {
          jobId,
          processingTime: Date.now() - startTime,
          rule: rule.name,
          criticalityLevel: request.criticalityLevel
        }
      };

      // Log consensus decision
      await this.logConsensusDecision(request, response);

      // Update job status
      this.activeConsensusJobs.set(jobId, {
        ...this.activeConsensusJobs.get(jobId),
        status: 'completed',
        response
      });

      return response;

    } catch (error) {
      console.error('Consensus processing error:', error);
      
      // Update job status
      this.activeConsensusJobs.set(jobId, {
        ...this.activeConsensusJobs.get(jobId),
        status: 'failed',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get real-time consensus status
   */
  getConsensusStatus(jobId: string): any {
    return this.activeConsensusJobs.get(jobId);
  }

  /**
   * Get all active consensus jobs
   */
  getActiveJobs(): any[] {
    return Array.from(this.activeConsensusJobs.values());
  }

  private async getAlternativeResults(request: ConsensusRequest, providers: string[]): Promise<YachtieResponse[]> {
    const results: YachtieResponse[] = [];

    for (const provider of providers) {
      if (provider === 'yachtie') continue; // Skip Yachtie as it's already processed

      try {
        const result = await supabase.functions.invoke('multi-ai-processor', {
          body: {
            text: JSON.stringify(request.data),
            task: 'analyze',
            context: request.context,
            preferredProvider: provider,
            timeout: request.timeoutMs || 30000
          }
        });

        if (result.data && !result.error) {
          results.push({
            success: true,
            result: result.data.response,
            confidence: result.data.confidence || 0.8,
            language: result.data.detectedLanguage || 'en',
            processingTime: result.data.processingTime || 0,
            model: provider
          });
        }
      } catch (error) {
        console.warn(`Alternative provider ${provider} failed:`, error);
        // Continue with other providers
      }
    }

    return results;
  }

  private calculateConsensus(yachtieResult: YachtieResponse, alternativeResults: YachtieResponse[], rule: ConsensusRule): any {
    const allResults = [yachtieResult, ...alternativeResults];
    const validResults = allResults.filter(r => r.success);

    if (validResults.length === 0) {
      return {
        decision: null,
        confidence: 0,
        agreement: 0
      };
    }

    // Yachtie gets higher weight in consensus
    const yachtieWeight = 2.0;
    const otherWeight = 1.0;

    // Calculate weighted agreement
    let totalWeight = yachtieWeight;
    let agreementScore = yachtieResult.confidence * yachtieWeight;

    for (const result of alternativeResults) {
      if (result.success) {
        totalWeight += otherWeight;
        // Simple similarity check (in real implementation, this would be more sophisticated)
        const similarity = this.calculateSimilarity(yachtieResult.result, result.result);
        agreementScore += result.confidence * similarity * otherWeight;
      }
    }

    const finalConfidence = agreementScore / totalWeight;
    const agreement = agreementScore / (totalWeight * Math.max(yachtieResult.confidence, 0.1));

    return {
      decision: yachtieResult.result, // Yachtie's result is primary
      confidence: finalConfidence,
      agreement: Math.min(agreement, 1.0)
    };
  }

  private calculateSimilarity(result1: any, result2: any): number {
    // Simplified similarity calculation
    // In production, this would use more sophisticated NLP techniques
    try {
      const str1 = JSON.stringify(result1).toLowerCase();
      const str2 = JSON.stringify(result2).toLowerCase();
      
      if (str1 === str2) return 1.0;
      
      const commonChars = str1.split('').filter(char => str2.includes(char)).length;
      const totalChars = Math.max(str1.length, str2.length);
      
      return commonChars / totalChars;
    } catch {
      return 0.5; // Default similarity
    }
  }

  private async generateExplanation(request: ConsensusRequest, yachtieResult: YachtieResponse, alternativeResults: YachtieResponse[], consensus: any): Promise<string> {
    const explanationRequest = {
      text: JSON.stringify({
        task: request.task,
        yachtieResult: yachtieResult.result,
        alternativeResults: alternativeResults.map(r => r.result),
        consensus: consensus,
        agreement: consensus.agreement,
        confidence: consensus.confidence
      }),
      task: 'summarize' as const,
      context: 'consensus_explanation',
      options: {
        maxLength: 300,
        explainable: true
      }
    };

    const explanation = await yachtieService.process(explanationRequest);
    return explanation.success ? explanation.result : 'Consensus achieved through multi-provider analysis with Yachtie as primary processor.';
  }

  private requiresHumanApproval(request: ConsensusRequest, consensus: any, rule: ConsensusRule): boolean {
    return request.requiresHumanApproval ||
           rule.humanApprovalRequired ||
           request.criticalityLevel === 'critical' ||
           consensus.confidence < 0.7 ||
           consensus.agreement < rule.minimumAgreement;
  }

  private getApplicableRules(request: ConsensusRequest): ConsensusRule[] {
    return this.consensusRules.filter(rule => {
      return rule.enabled && this.ruleMatches(rule, request);
    });
  }

  private ruleMatches(rule: ConsensusRule, request: ConsensusRequest): boolean {
    // Simple rule matching - in production, this would be more sophisticated
    return rule.condition === 'default' || 
           rule.condition.includes(request.task) ||
           rule.condition.includes(request.context);
  }

  private getDefaultRule(criticalityLevel: string): ConsensusRule {
    const rules = {
      low: { minimumAgreement: 0.6, requiredProviders: ['yachtie'], humanApprovalRequired: false },
      medium: { minimumAgreement: 0.7, requiredProviders: ['yachtie', 'openai'], humanApprovalRequired: false },
      high: { minimumAgreement: 0.8, requiredProviders: ['yachtie', 'openai', 'gemini'], humanApprovalRequired: true },
      critical: { minimumAgreement: 0.9, requiredProviders: ['yachtie', 'openai', 'gemini', 'deepseek'], humanApprovalRequired: true }
    };

    const ruleConfig = rules[criticalityLevel] || rules.medium;
    
    return {
      id: 'default',
      name: `Default ${criticalityLevel} rule`,
      condition: 'default',
      ...ruleConfig,
      enabled: true
    };
  }

  private async loadConsensusRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_workflows')
        .select('*')
        .eq('trigger_type', 'consensus');

      if (!error && data) {
        this.consensusRules = data.map(rule => {
          // Safely parse success_criteria
          let successCriteria: any = {};
          if (rule.success_criteria && typeof rule.success_criteria === 'object') {
            successCriteria = rule.success_criteria;
          }
          
          // Safely parse model_chain
          let providers: string[] = ['yachtie'];
          if (Array.isArray(rule.model_chain)) {
            providers = rule.model_chain.filter((p): p is string => typeof p === 'string');
          }
          
          return {
            id: rule.id,
            name: rule.workflow_name,
            condition: rule.trigger_type,
            minimumAgreement: successCriteria.minimumAgreement || 0.7,
            requiredProviders: providers,
            humanApprovalRequired: successCriteria.humanApproval || false,
            enabled: rule.is_active
          };
        });
      }
    } catch (error) {
      console.warn('Failed to load consensus rules:', error);
      // Use default rules
      this.consensusRules = [];
    }
  }

  private async logConsensusDecision(request: ConsensusRequest, response: ConsensusResponse): Promise<void> {
    try {
      await supabase.from('ai_model_performance').insert({
        action_type: 'consensus_decision',
        module: request.context,
        success: true,
        confidence_score: response.confidence,
        execution_time_ms: response.metadata.processingTime,
        metadata: {
          task: request.task,
          agreement: response.agreement,
          providers: response.providers,
          criticalityLevel: request.criticalityLevel,
          requiresApproval: response.requiresApproval
        }
      });
    } catch (error) {
      console.warn('Failed to log consensus decision:', error);
    }
  }

  private generateJobId(): string {
    return `consensus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const yachtieConsensus = YachtieConsensusEngine.getInstance();

// Convenience functions
export const processConsensus = (request: ConsensusRequest) => 
  yachtieConsensus.processConsensus(request);

export const getConsensusStatus = (jobId: string) => 
  yachtieConsensus.getConsensusStatus(jobId);