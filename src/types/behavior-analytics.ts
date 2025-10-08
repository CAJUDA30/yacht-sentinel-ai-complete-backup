export interface UserAction {
  id: string;
  user_id: string;
  action_type: string;
  module: string;
  context: Record<string, any>;
  timestamp: string;
  session_id: string;
  page_url?: string;
  metadata: Record<string, any>;
}

export interface BehaviorPattern {
  id: string;
  pattern_type: 'frequent_action' | 'workflow_sequence' | 'time_based' | 'context_switch';
  user_id?: string;
  module: string;
  pattern_data: Record<string, any>;
  confidence: number;
  frequency: number;
  last_occurrence: string;
  created_at: string;
}

export interface ProactiveSuggestion {
  id: string;
  suggestion_type: 'action' | 'workflow' | 'optimization' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggested_action: Record<string, any>;
  trigger_pattern: string;
  user_id: string;
  module: string;
  expires_at?: string;
  dismissed?: boolean;
  acted_upon?: boolean;
  created_at: string;
}

export interface BehaviorAnalytics {
  user_efficiency_score: number;
  most_used_modules: Array<{ module: string; usage_count: number; efficiency: number }>;
  workflow_patterns: BehaviorPattern[];
  time_patterns: Array<{ hour: number; activity_level: number }>;
  optimization_opportunities: Array<{
    type: string;
    description: string;
    potential_time_saved: number;
    implementation_effort: 'low' | 'medium' | 'high';
  }>;
  knowledge_gaps: Array<{
    area: string;
    evidence: string[];
    suggested_learning: string[];
  }>;
}

export interface SmartKnowledgeItem {
  id: string;
  title: string;
  content: string;
  content_type: 'text' | 'image' | 'video' | 'document' | 'scan_result';
  module: string;
  tags: string[];
  embedding_vector?: number[];
  confidence_score?: number;
  source_type: 'user_generated' | 'ai_extracted' | 'manual_upload' | 'scan_result';
  yacht_id?: string;
  is_shared: boolean;
  access_level: 'private' | 'yacht' | 'fleet' | 'public';
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export interface KnowledgeSearch {
  query: string;
  module?: string;
  content_types?: string[];
  max_results?: number;
  similarity_threshold?: number;
}

export interface KnowledgeSearchResult {
  item: SmartKnowledgeItem;
  similarity_score: number;
  relevance_explanation: string;
}