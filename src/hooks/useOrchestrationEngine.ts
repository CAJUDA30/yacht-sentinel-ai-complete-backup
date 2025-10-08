import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  OrchestrationRule, 
  TaskRequest, 
  OrchestrationResult,
  LoadBalancingConfig,
  ConsensusConfig,
  OrchestrationAnalytics,
  ModelPerformanceStats
} from "@/types/orchestration";

export function useOrchestrationEngine() {
  const queryClient = useQueryClient();

  // Get orchestration rules
  const orchestrationRules = useQuery({
    queryKey: ["orchestration-rules"],
    queryFn: async (): Promise<OrchestrationRule[]> => {
      const { data, error } = await supabase
        .from('ai_orchestration_rules')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.rule_name,
        task_type: item.task_type,
        priority: item.priority,
        is_active: item.is_active,
        conditions: typeof item.conditions === 'string' ? JSON.parse(item.conditions) : item.conditions || [],
        primary_model_id: item.primary_model_id || '',
        fallback_models: typeof item.fallback_models === 'string' ? JSON.parse(item.fallback_models) : item.fallback_models || [],
        performance_threshold: item.performance_threshold || 0.8,
        cost_threshold: 0,
        latency_threshold: 0,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as OrchestrationRule[];
    },
  });

  // Get performance analytics
  const analytics = useQuery({
    queryKey: ["orchestration-analytics"],
    queryFn: async (): Promise<OrchestrationAnalytics> => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { action: "get_analytics" },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get model performance stats
  const modelPerformance = useQuery({
    queryKey: ["model-performance"],
    queryFn: async (): Promise<ModelPerformanceStats[]> => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { action: "get_model_performance" },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Process task with orchestration
  const processTask = useMutation({
    mutationFn: async (taskRequest: TaskRequest): Promise<OrchestrationResult> => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "process_task",
          task: taskRequest 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate analytics to refresh stats
      queryClient.invalidateQueries({ queryKey: ["orchestration-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["model-performance"] });
    },
  });

  // Create orchestration rule
  const createRule = useMutation({
    mutationFn: async (rule: Omit<OrchestrationRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "create_rule",
          rule 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration-rules"] });
    },
  });

  // Update orchestration rule
  const updateRule = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<OrchestrationRule> }) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "update_rule",
          rule_id: ruleId,
          updates 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration-rules"] });
    },
  });

  // Delete orchestration rule
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "delete_rule",
          rule_id: ruleId 
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration-rules"] });
    },
  });

  // Update load balancing configuration
  const updateLoadBalancing = useMutation({
    mutationFn: async (config: LoadBalancingConfig) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "update_load_balancing",
          config 
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Update consensus configuration
  const updateConsensus = useMutation({
    mutationFn: async (config: ConsensusConfig) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "update_consensus",
          config 
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Test routing decision
  const testRouting = useMutation({
    mutationFn: async (taskRequest: Partial<TaskRequest>) => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { 
          action: "test_routing",
          task: taskRequest 
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Optimize performance
  const optimizePerformance = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-orchestration-engine", {
        body: { action: "optimize_performance" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orchestration-rules"] });
      queryClient.invalidateQueries({ queryKey: ["orchestration-analytics"] });
    },
  });

  // Helper functions for common tasks
  const processText = async (text: string, options?: Partial<TaskRequest>) => {
    return processTask.mutateAsync({
      task_type: 'text_generation',
      content: text,
      ...options
    });
  };

  const processVision = async (imageData: string, prompt: string, options?: Partial<TaskRequest>) => {
    return processTask.mutateAsync({
      task_type: 'vision',
      content: prompt,
      context: { image_data: imageData },
      requirements: { vision: true },
      ...options
    });
  };

  const processCode = async (code: string, task: string, options?: Partial<TaskRequest>) => {
    return processTask.mutateAsync({
      task_type: 'code_generation',
      content: `Task: ${task}\n\nCode: ${code}`,
      ...options
    });
  };

  return {
    // Queries
    orchestrationRules,
    analytics,
    modelPerformance,
    
    // Mutations
    processTask,
    createRule,
    updateRule,
    deleteRule,
    updateLoadBalancing,
    updateConsensus,
    testRouting,
    optimizePerformance,
    
    // Helper functions
    processText,
    processVision,
    processCode,
    
    // Computed values
    isLoading: orchestrationRules.isLoading || analytics.isLoading,
    activeRules: orchestrationRules.data?.filter(r => r.is_active) || [],
    totalCost: analytics.data?.total_cost_usd || 0,
    avgLatency: analytics.data?.avg_latency_ms || 0,
    successRate: analytics.data?.success_rate || 0,
    costSavings: analytics.data?.cost_savings_percentage || 0,
  };
}