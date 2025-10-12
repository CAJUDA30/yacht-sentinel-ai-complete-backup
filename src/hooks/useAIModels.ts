import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIModelOption {
  id: string;
  name: string;
  description: string;
  context_length: number;
  cost_per_1k_tokens: number;
  recommended_for: string[];
  provider_type?: string;
  is_active?: boolean;
  priority?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  provider_type: string;
  endpoint_url?: string;
  is_active: boolean;
  description?: string;
  capabilities?: string[];
  created_at: string;
  updated_at: string;
  configuration?: any;
}

export const useAIModels = () => {
  // Fetch AI providers
  const providersQuery = useQuery({
    queryKey: ['ai-providers'],
    queryFn: async (): Promise<AIProvider[]> => {
      const { data, error } = await supabase
        .from('ai_providers_with_keys')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Failed to fetch AI providers:', error);
        return [];
      }

      return data || [];
    },
  });

  // Fetch AI models
  const modelsQuery = useQuery({
    queryKey: ['ai-models'],
    queryFn: async (): Promise<AIModelOption[]> => {
      const { data, error } = await supabase
        .from('ai_models_unified')
        .select(`
          *,
          provider:ai_providers_unified(
            name,
            provider_type
          )
        `)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Failed to fetch AI models:', error);
        return [];
      }

      return (data || []).map(model => ({
        id: model.model_id || model.id,
        name: model.name,
        description: `${model.name} - Advanced AI model`,
        context_length: model.max_context_length || 4096,
        cost_per_1k_tokens: 0.001, // Default cost, will be updated from database
        recommended_for: [],
        provider_type: (model.provider as any)?.provider_type,
        is_active: model.is_active,
        priority: model.priority
      }));
    },
  });

  // Group models by provider type
  const getModelsByProvider = (providerType: string): AIModelOption[] => {
    return modelsQuery.data?.filter(model => model.provider_type === providerType) || [];
  };

  // Get available models grouped by provider type
  const getAvailableModelsGrouped = (): Record<string, AIModelOption[]> => {
    const grouped: Record<string, AIModelOption[]> = {};
    
    providersQuery.data?.forEach(provider => {
      grouped[provider.provider_type] = getModelsByProvider(provider.provider_type);
    });

    return grouped;
  };

  return {
    providers: providersQuery.data || [],
    models: modelsQuery.data || [],
    isLoadingProviders: providersQuery.isLoading,
    isLoadingModels: modelsQuery.isLoading,
    isLoading: providersQuery.isLoading || modelsQuery.isLoading,
    error: providersQuery.error || modelsQuery.error,
    getModelsByProvider,
    getAvailableModelsGrouped,
    refetch: () => {
      providersQuery.refetch();
      modelsQuery.refetch();
    }
  };
};