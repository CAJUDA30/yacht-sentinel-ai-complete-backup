import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YachtieProvider {
  id: string;
  name: string;
  base_url: string;
  provider_type: string;
  is_primary: boolean;
  is_active: boolean;
  config: any;
  capabilities: string[];
  supported_languages: string[];
  has_credentials?: boolean;
}

export interface YachtieModel {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: string;
  priority: number;
  parameters: any;
  rate_limits: any;
  is_active: boolean;
}

export interface YachtieLanguage {
  id: string;
  language_code: string;
  language_name: string;
  is_active: boolean;
  script_direction: string;
  locale_data: any;
}

export interface YachtieStatus {
  providers: YachtieProvider[];
  models: YachtieModel[];
  languages: YachtieLanguage[];
  primary_provider: string;
  total_languages: number;
  yachtie_configured: boolean;
}

export interface InferenceRequest {
  task: 'infer' | 'ocr' | 'translate' | 'analyze' | 'sentiment';
  text?: string;
  imageBase64?: string;
  language?: string;
  targetLanguage?: string;
  model?: string;
  parameters?: Record<string, any>;
}

export function useYachtieMultiAI() {
  const queryClient = useQueryClient();

  // Get status and configuration
  const status = useQuery({
    queryKey: ["yachtie-multi-ai", "status"],
    queryFn: async (): Promise<YachtieStatus> => {
      const { data, error } = await supabase.functions.invoke("yachtie-multi-ai", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data;
    },
  });

  // Test all connections
  const testConnections = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("yachtie-multi-ai", {
        body: { action: "test_connections" },
      });
      if (error) throw error;
      return data;
    },
  });

  // Add new language
  const addLanguage = useMutation({
    mutationFn: async (params: { language_code: string; language_name: string; script_direction?: string }) => {
      const { data, error } = await supabase.functions.invoke("yachtie-multi-ai", {
        body: { 
          action: "add_language", 
          payload: params 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yachtie-multi-ai", "status"] });
    },
  });

  // Run AI inference
  const runInference = useMutation({
    mutationFn: async (request: InferenceRequest) => {
      const { data, error } = await supabase.functions.invoke("yachtie-multi-ai", {
        body: { 
          action: "run_inference", 
          payload: request 
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Update provider configuration
  const updateProviderConfig = useMutation({
    mutationFn: async (params: { provider_id: string; config: any }) => {
      const { data, error } = await supabase.functions.invoke("yachtie-multi-ai", {
        body: { 
          action: "update_provider_config", 
          payload: params 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yachtie-multi-ai", "status"] });
    },
  });

  // Helper functions for common tasks
  const translateText = async (text: string, from: string, to: string) => {
    return runInference.mutateAsync({
      task: 'translate',
      text,
      language: from,
      targetLanguage: to,
    });
  };

  const analyzeImage = async (imageBase64: string, language = 'en') => {
    return runInference.mutateAsync({
      task: 'ocr',
      imageBase64,
      language,
    });
  };

  const analyzeSentiment = async (text: string, language = 'en') => {
    return runInference.mutateAsync({
      task: 'sentiment',
      text,
      language,
    });
  };

  const processText = async (text: string, language = 'en', model?: string) => {
    return runInference.mutateAsync({
      task: 'infer',
      text,
      language,
      model,
    });
  };

  return {
    status,
    testConnections,
    addLanguage,
    runInference,
    updateProviderConfig,
    
    // Helper methods
    translateText,
    analyzeImage,
    analyzeSentiment,
    processText,
    
    // Computed values
    isLoading: status.isLoading,
    yachtieConfigured: status.data?.yachtie_configured ?? false,
    primaryProvider: status.data?.primary_provider,
    availableLanguages: status.data?.languages ?? [],
    availableModels: status.data?.models ?? [],
    providers: status.data?.providers ?? [],
  };
}