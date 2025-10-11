import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AIProvider, AIModel, ProviderTestResult, ModelDiscoveryResult } from "@/types/ai-providers";

export function useAIProviderManagement() {
  const queryClient = useQueryClient();

  // Get all providers
  const providers = useQuery({
    queryKey: ["ai-providers"],
    queryFn: async (): Promise<AIProvider[]> => {
      const { data, error } = await supabase
        .from('ai_providers_unified')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Enhanced error handling for missing table
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[AI Providers] Table does not exist yet - returning empty array');
          return [];
        }
        throw error;
      }
      return (data || []).map(item => ({
        ...item,
        auth_method: (item as any).auth_method || 'api_key',
        config: typeof item.config === 'string' ? JSON.parse(item.config) : 
                item.config || 
                (typeof (item as any).configuration === 'string' ? JSON.parse((item as any).configuration) : (item as any).configuration) || 
                {},
        capabilities: Array.isArray((item as any).capabilities) ? (item as any).capabilities : [],
        supported_languages: Array.isArray((item as any).supported_languages) ? (item as any).supported_languages : ['en']
      })) as AIProvider[];
    },
  });

  // Get all models
  const models = useQuery({
    queryKey: ["ai-models"],
    queryFn: async (): Promise<AIModel[]> => {
      const { data, error } = await supabase
        .from('ai_models_unified')
        .select('*')
        .order('priority', { ascending: false });
      
      // Enhanced error handling for missing table
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('[AI Models] Table does not exist yet - returning empty array');
          return [];
        }
        throw error;
      }
      return (data || []).map(item => ({
        ...item,
        parameters: typeof (item as any).parameters === 'string' ? JSON.parse((item as any).parameters) : (item as any).parameters || {},
        rate_limits: typeof (item as any).rate_limits === 'string' ? JSON.parse((item as any).rate_limits) : (item as any).rate_limits || { per_minute: 60, per_hour: 1000 },
        specialization: Array.isArray((item as any).specialization) ? (item as any).specialization : [],
        // Add missing properties with defaults
        cost_per_1k_tokens: (item as any).cost_per_1k_tokens || 0.001,
        supports_vision: (item as any).supports_vision || false,
        supports_function_calling: (item as any).supports_function_calling || false,
        response_time_avg_ms: (item as any).response_time_avg_ms || 1000,
        success_rate: (item as any).success_rate || 95.0
      })) as AIModel[];
    },
  });

  // Create provider
  const createProvider = useMutation({
    mutationFn: async (provider: Partial<AIProvider>) => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "create_provider",
          provider
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
    },
  });

  // Update provider
  const updateProvider = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIProvider> }) => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "update_provider",
          provider_id: id,
          updates
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
    },
  });

  // Delete provider
  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "delete_provider",
          provider_id: id
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
    },
  });

  // Test provider connection
  const testProvider = useMutation({
    mutationFn: async (provider: Partial<AIProvider>): Promise<ProviderTestResult> => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "test_provider",
          provider
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Discover models for provider
  const discoverModels = useMutation({
    mutationFn: async (providerId: string): Promise<ModelDiscoveryResult> => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "discover_models",
          provider_id: providerId
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
    },
  });

  // Set primary provider
  const setPrimaryProvider = useMutation({
    mutationFn: async (providerId: string) => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "set_primary_provider",
          provider_id: providerId
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
    },
  });

  // Sync provider health
  const syncProviderHealth = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "sync_health"
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] });
    },
  });

  // Update model configuration
  const updateModel = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AIModel> }) => {
      const { data, error } = await supabase.functions.invoke("unified-ai-provider", {
        body: {
          action: "update_model",
          model_id: id,
          updates
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-models"] });
    },
  });

  return {
    // Queries
    providers,
    models,
    
    // Mutations
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    discoverModels,
    setPrimaryProvider,
    syncProviderHealth,
    updateModel,
    
    // Computed values
    isLoading: providers.isLoading || models.isLoading,
    activeProviders: providers.data?.filter(p => p.is_active) || [],
    primaryProvider: providers.data?.find(p => p.is_primary),
    totalModels: models.data?.length || 0,
  };
}