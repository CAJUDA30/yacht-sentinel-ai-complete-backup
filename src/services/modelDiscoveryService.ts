import { supabase } from '@/integrations/supabase/client';

export interface DiscoveredModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  cost_per_1k_tokens: number;
  capabilities: string[];
  provider_type: string;
  model_type: string;
  owned_by?: string;
  created?: number;
}

export interface ModelDiscoveryResult {
  models: DiscoveredModel[];
  provider_type: string;
  success: boolean;
  error?: string;
}

class ModelDiscoveryService {
  private async fetchGrokModels(apiKey: string): Promise<ModelDiscoveryResult> {
    try {
      const response = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const models: DiscoveredModel[] = (data.data || []).map((model: any) => ({
        id: model.id,
        name: this.formatModelName(model.id),
        description: this.generateModelDescription(model.id),
        context_length: this.estimateContextLength(model.id),
        cost_per_1k_tokens: this.estimateCost(model.id),
        capabilities: this.inferCapabilities(model.id),
        provider_type: 'grok',
        model_type: this.inferModelType(model.id),
        owned_by: model.owned_by,
        created: model.created
      }));

      return {
        models,
        provider_type: 'grok',
        success: true
      };
    } catch (error: any) {
      console.error('Failed to fetch Grok models:', error);
      return {
        models: [],
        provider_type: 'grok',
        success: false,
        error: error.message
      };
    }
  }

  private async fetchOpenAIModels(apiKey: string): Promise<ModelDiscoveryResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const models: DiscoveredModel[] = (data.data || [])
        .filter((model: any) => this.isUsefulModel(model.id))
        .map((model: any) => ({
          id: model.id,
          name: this.formatModelName(model.id),
          description: this.generateModelDescription(model.id),
          context_length: this.estimateContextLength(model.id),
          cost_per_1k_tokens: this.estimateCost(model.id),
          capabilities: this.inferCapabilities(model.id),
          provider_type: 'openai',
          model_type: this.inferModelType(model.id),
          owned_by: model.owned_by,
          created: model.created
        }));

      return {
        models,
        provider_type: 'openai',
        success: true
      };
    } catch (error: any) {
      console.error('Failed to fetch OpenAI models:', error);
      return {
        models: [],
        provider_type: 'openai',
        success: false,
        error: error.message
      };
    }
  }

  private formatModelName(modelId: string): string {
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateModelDescription(modelId: string): string {
    const descriptions: Record<string, string> = {
      'grok-4': 'Latest Grok 4 with enhanced reasoning and analysis capabilities',
      'grok-3': 'Powerful Grok 3 model for complex tasks and document processing',
      'grok-2': 'Balanced Grok 2 model with vision and text capabilities',
      'gpt-4': 'Most capable OpenAI model for complex reasoning and analysis',
      'gpt-3.5': 'Fast and efficient model for most tasks',
      'claude-3': 'Advanced Anthropic model with long context understanding'
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      if (modelId.includes(key)) {
        return desc;
      }
    }

    return `Advanced AI model optimized for text generation and analysis`;
  }

  private estimateContextLength(modelId: string): number {
    if (modelId.includes('grok-4')) return 2000000;
    if (modelId.includes('grok-3')) return 131072;
    if (modelId.includes('grok-2')) return 32768;
    if (modelId.includes('gpt-4')) return 128000;
    if (modelId.includes('gpt-3.5')) return 16385;
    if (modelId.includes('claude-3')) return 200000;
    return 4096;
  }

  private estimateCost(modelId: string): number {
    if (modelId.includes('grok-4')) return 0.20;
    if (modelId.includes('grok-3')) return 3.00;
    if (modelId.includes('grok-2')) return 2.00;
    if (modelId.includes('gpt-4')) return 0.01;
    if (modelId.includes('gpt-3.5')) return 0.001;
    if (modelId.includes('claude-3-opus')) return 0.015;
    if (modelId.includes('claude-3-sonnet')) return 0.003;
    if (modelId.includes('claude-3-haiku')) return 0.00025;
    return 0.001;
  }

  private inferCapabilities(modelId: string): string[] {
    const capabilities = ['text_generation', 'chat_completion'];
    
    if (modelId.includes('vision')) capabilities.push('vision', 'image_analysis');
    if (modelId.includes('grok')) capabilities.push('reasoning', 'analysis', 'document_processing');
    if (modelId.includes('gpt-4')) capabilities.push('function_calling', 'vision');
    if (modelId.includes('claude')) capabilities.push('long_context', 'analysis');
    
    return capabilities;
  }

  private inferModelType(modelId: string): string {
    if (modelId.includes('vision')) return 'vision';
    if (modelId.includes('embedding')) return 'embedding';
    return 'chat';
  }

  private isUsefulModel(modelId: string): boolean {
    // Filter out deprecated or non-chat models
    const excludePatterns = [
      'davinci', 'curie', 'babbage', 'ada',
      'whisper', 'tts', 'dall-e',
      'text-embedding', 'text-moderation'
    ];
    
    return !excludePatterns.some(pattern => modelId.includes(pattern));
  }

  private getRecommendedFor(modelId: string): string[] {
    if (modelId.includes('grok-4')) return ['complex_reasoning', 'document_analysis', 'yacht_mapping'];
    if (modelId.includes('grok-3')) return ['general_use', 'document_processing', 'reliable_performance'];
    if (modelId.includes('grok-2')) return ['image_analysis', 'visual_documents', 'multimodal_tasks'];
    if (modelId.includes('gpt-4')) return ['general_use', 'complex_tasks', 'multimodal'];
    if (modelId.includes('gpt-3.5')) return ['general_use', 'simple_tasks', 'cost_efficiency'];
    if (modelId.includes('claude-3')) return ['complex_reasoning', 'long_documents', 'analysis'];
    return ['general_use'];
  }

  async discoverModels(provider: string, apiKey: string): Promise<ModelDiscoveryResult> {
    switch (provider) {
      case 'grok':
        return this.fetchGrokModels(apiKey);
      case 'openai':
        return this.fetchOpenAIModels(apiKey);
      default:
        return {
          models: [],
          provider_type: provider,
          success: false,
          error: 'Provider not supported for model discovery'
        };
    }
  }

  async saveDiscoveredModels(providerType: string, models: DiscoveredModel[]): Promise<void> {
    try {
      console.log(`Saving ${models.length} discovered models for ${providerType}`);
      // For now, just log the models. We'll implement database saving later.
      models.forEach(model => {
        console.log(`- ${model.name} (${model.id})`);
      });
    } catch (error) {
      console.error('Failed to save discovered models:', error);
      throw error;
    }
  }

  private calculatePriority(modelId: string): number {
    if (modelId.includes('grok-4')) return 100;
    if (modelId.includes('gpt-4')) return 95;
    if (modelId.includes('grok-3')) return 90;
    if (modelId.includes('grok-2')) return 85;
    if (modelId.includes('claude-3-opus')) return 80;
    if (modelId.includes('claude-3-sonnet')) return 75;
    if (modelId.includes('gpt-3.5')) return 70;
    if (modelId.includes('claude-3-haiku')) return 65;
    return 50;
  }
}

export const modelDiscoveryService = new ModelDiscoveryService();