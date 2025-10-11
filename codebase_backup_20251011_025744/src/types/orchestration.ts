export interface OrchestrationRule {
  id: string;
  name: string;
  task_type: string;
  priority: number;
  is_active: boolean;
  conditions: OrchestrationCondition[];
  primary_model_id: string;
  fallback_models: string[];
  performance_threshold: number;
  cost_threshold?: number;
  latency_threshold?: number;
  created_at: string;
  updated_at: string;
}

export interface OrchestrationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'and' | 'or';
}

export interface TaskRequest {
  task_type: string;
  content: string;
  context?: Record<string, any>;
  requirements?: TaskRequirements;
  user_id?: string;
  module?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  max_cost?: number;
  max_latency?: number;
}

export interface TaskRequirements {
  vision?: boolean;
  function_calling?: boolean;
  max_tokens?: number;
  temperature?: number;
  languages?: string[];
  output_format?: 'text' | 'json' | 'structured';
}

export interface OrchestrationResult {
  task_id: string;
  selected_model: string;
  primary_result: ModelResult;
  fallback_results?: ModelResult[];
  consensus_result?: any;
  performance_metrics: PerformanceMetrics;
  cost_breakdown: CostBreakdown;
  routing_decision: RoutingDecision;
  created_at: string;
}

export interface ModelResult {
  model_id: string;
  provider_id: string;
  response: any;
  latency_ms: number;
  tokens_used: number;
  cost_usd: number;
  confidence_score?: number;
  error?: string;
  success: boolean;
}

export interface PerformanceMetrics {
  total_latency_ms: number;
  total_cost_usd: number;
  total_tokens: number;
  models_used: number;
  cache_hit: boolean;
  retry_count: number;
  success_rate: number;
}

export interface CostBreakdown {
  primary_model_cost: number;
  fallback_costs: number;
  total_cost: number;
  cost_per_token: number;
  budget_remaining?: number;
}

export interface RoutingDecision {
  rule_id?: string;
  reason: string;
  factors: Record<string, any>;
  alternatives_considered: string[];
  decision_time_ms: number;
}

export interface LoadBalancingConfig {
  strategy: 'round_robin' | 'weighted' | 'performance' | 'cost' | 'latency';
  weights?: Record<string, number>;
  health_check_interval: number;
  failure_threshold: number;
  recovery_threshold: number;
}

export interface ConsensusConfig {
  enabled: boolean;
  min_models: number;
  max_models: number;
  confidence_threshold: number;
  disagreement_handling: 'majority' | 'weighted' | 'primary' | 'human_review';
  similarity_threshold: number;
}

export interface ModelPerformanceStats {
  model_id: string;
  provider_id: string;
  avg_latency_ms: number;
  success_rate: number;
  cost_per_1k_tokens: number;
  throughput_rpm: number;
  quality_score: number;
  availability_score: number;
  last_updated: string;
  trend_7d: 'up' | 'down' | 'stable';
}

export interface OrchestrationAnalytics {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  cost_savings_percentage: number;
  model_usage_distribution: Record<string, number>;
  performance_trends: PerformanceTrend[];
  optimization_suggestions: OptimizationSuggestion[];
}

export interface PerformanceTrend {
  metric: string;
  current_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  time_period: string;
}

export interface OptimizationSuggestion {
  type: 'cost' | 'performance' | 'reliability';
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  impact: string;
  action_items: string[];
  estimated_savings?: number;
}