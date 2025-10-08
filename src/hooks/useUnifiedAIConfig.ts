import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnifiedAIConfigState {
  projectId: string;
  region: string;
  authMode: "api_key" | "oauth" | "service_account";
  services: {
    vision: {
      apiKey?: string; // never returned from server
      serviceAccountJson?: string; // never returned from server
      endpoint?: string;
    };
    vertex: {
      apiKey?: string;
      endpoint?: string;
      authType?: "api_key" | "oauth" | "service_account";
    };
    documentAI: {
      apiKey?: string;
      processorId?: string;
      processorType?: string;
      endpoint?: string;
    };
  };
  features: Record<string, any>;
  workflow: Record<string, any>;
  rateLimits: { perMinute: number };
  caching: { enabled: boolean; ttlSeconds: number };
}

const defaultConfig: UnifiedAIConfigState = {
  projectId: "",
  region: "us-central1",
  authMode: "service_account",
  services: {
    vision: { endpoint: "vision.googleapis.com" },
    vertex: { endpoint: "vertex-ai.googleapis.com", authType: "service_account" },
    documentAI: { endpoint: "documentai.googleapis.com" },
  },
  features: {},
  workflow: {},
  rateLimits: { perMinute: 60 },
  caching: { enabled: false, ttlSeconds: 600 },
};

export function useUnifiedAIConfig() {
  const qc = useQueryClient();

  const status = useQuery({
    queryKey: ["unified-ai", "status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gcp-unified-config", {
        body: { action: "status" },
      });
      if (error) throw error;
      return data as {
        config: Partial<UnifiedAIConfigState>;
        updated_at: string | null;
        secrets: Record<string, boolean>;
        logs: any[];
        docs: Record<string, string>;
      };
    },
  });

  const save = useMutation({
    mutationFn: async (config: UnifiedAIConfigState) => {
      const { data, error } = await supabase.functions.invoke("gcp-unified-config", {
        body: { action: "config_update", payload: { config } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["unified-ai", "status"] }),
  });

  const testAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gcp-unified-config", {
        body: { action: "test_all_connections" },
      });
      if (error) throw error;
      return data as { results: Record<string, any>; total_ms: number };
    },
  });

  const runTest = useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke("gcp-unified-config", {
        body: { action: "run_test", payload },
      });
      if (error) throw error;
      return data as any;
    },
  });

  const checkUpdates = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gcp-unified-config", {
        body: { action: "check_updates" },
      });
      if (error) throw error;
      return data as any;
    },
  });

  return { status, save, testAll, runTest, checkUpdates, defaultConfig };
}
