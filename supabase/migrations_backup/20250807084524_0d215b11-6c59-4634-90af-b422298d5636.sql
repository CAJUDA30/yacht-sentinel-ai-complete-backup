-- Create AI models configuration table
CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- 'openai', 'grok', 'deepseek', 'gemini', 'vision'
  model_name TEXT NOT NULL,
  model_id TEXT NOT NULL, -- actual model identifier (e.g., 'gpt-4o', 'gemini-pro')
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['reasoning', 'vision', 'function_calling', 'multimodal']
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb, -- temperature, max_tokens, etc.
  priority INTEGER NOT NULL DEFAULT 50, -- 1-100, higher = more priority
  is_active BOOLEAN NOT NULL DEFAULT true,
  cost_per_token NUMERIC DEFAULT 0,
  avg_latency_ms INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 100,
  api_endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consensus rules configuration table
CREATE TABLE public.consensus_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL, -- 'inventory', 'maintenance', 'crew', 'finance', 'global'
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'suggest'
  risk_level TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  consensus_algorithm TEXT NOT NULL DEFAULT 'weighted', -- 'majority', 'weighted', 'unanimous', 'quorum'
  required_agreement_threshold NUMERIC NOT NULL DEFAULT 0.7, -- 0.0-1.0
  minimum_models_required INTEGER NOT NULL DEFAULT 2,
  auto_execute_threshold NUMERIC NOT NULL DEFAULT 0.85,
  human_approval_threshold NUMERIC NOT NULL DEFAULT 0.65,
  model_weights JSONB NOT NULL DEFAULT '{}'::jsonb, -- {'openai': 0.9, 'deepseek': 0.95, 'gemini': 0.92}
  fallback_models JSONB NOT NULL DEFAULT '[]'::jsonb, -- ordered list of fallback models
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI agent workflows table
CREATE TABLE public.ai_agent_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  module TEXT NOT NULL, -- 'inventory', 'maintenance', 'crew', 'finance'
  trigger_type TEXT NOT NULL, -- 'user_request', 'scheduled', 'event_driven', 'proactive'
  workflow_steps JSONB NOT NULL DEFAULT '[]'::jsonb, -- ordered array of workflow steps
  model_chain JSONB NOT NULL DEFAULT '[]'::jsonb, -- which models to use in sequence/parallel
  consensus_rule_id UUID REFERENCES consensus_rules(id),
  success_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  failure_handling JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI model performance tracking table
CREATE TABLE public.ai_model_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ai_models(id),
  workflow_id UUID REFERENCES ai_agent_workflows(id),
  module TEXT NOT NULL,
  action_type TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_usd NUMERIC DEFAULT 0,
  success BOOLEAN NOT NULL,
  confidence_score NUMERIC, -- 0.0-1.0
  consensus_contribution NUMERIC, -- how much this model influenced final decision
  error_message TEXT,
  user_feedback TEXT, -- 'helpful', 'not_helpful', 'incorrect'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI conversations and context table
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  module TEXT,
  conversation_context JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_workflow_id UUID REFERENCES ai_agent_workflows(id),
  consensus_decisions JSONB NOT NULL DEFAULT '[]'::jsonb,
  pending_approvals JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI module preferences table
CREATE TABLE public.ai_module_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'captain', 'engineer', 'manager', 'crew'
  preferred_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_prompts JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  auto_execution_enabled BOOLEAN NOT NULL DEFAULT false,
  risk_tolerance TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_active ON ai_models(is_active);
CREATE INDEX idx_consensus_rules_module ON consensus_rules(module, action_type);
CREATE INDEX idx_ai_workflows_module ON ai_agent_workflows(module, trigger_type);
CREATE INDEX idx_ai_performance_model ON ai_model_performance(model_id, created_at);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_module_prefs_module ON ai_module_preferences(module, user_role);

-- Insert default AI models
INSERT INTO ai_models (provider, model_name, model_id, capabilities, parameters, priority, cost_per_token) VALUES
('openai', 'GPT-4.1', 'gpt-4.1-2025-04-14', '["reasoning", "function_calling", "structured_output"]', '{"temperature": 0.7, "max_tokens": 4000}', 90, 0.00003),
('openai', 'GPT-4o', 'gpt-4o', '["reasoning", "vision", "function_calling", "multimodal"]', '{"temperature": 0.7, "max_tokens": 4000}', 85, 0.000015),
('openai', 'O3', 'o3-2025-04-16', '["advanced_reasoning", "complex_analysis"]', '{"temperature": 0.5}', 95, 0.000075),
('deepseek', 'DeepSeek V3', 'deepseek-chat', '["reasoning", "coding", "technical_analysis"]', '{"temperature": 0.6, "max_tokens": 8000}', 95, 0.000001),
('grok', 'Grok Beta', 'grok-beta', '["creative_thinking", "real_time_data"]', '{"temperature": 0.8, "max_tokens": 4000}', 85, 0.000025),
('gemini', 'Gemini Pro', 'gemini-1.5-pro', '["reasoning", "multimodal", "long_context"]', '{"temperature": 0.7, "max_tokens": 8000}', 92, 0.000025),
('vision', 'Google Vision', 'vision-api', '["vision", "ocr", "image_analysis"]', '{}', 90, 0.000015);

-- Insert default consensus rules
INSERT INTO consensus_rules (module, action_type, risk_level, consensus_algorithm, required_agreement_threshold, minimum_models_required, auto_execute_threshold, human_approval_threshold, model_weights) VALUES
('inventory', 'create', 'low', 'weighted', 0.6, 2, 0.8, 0.6, '{"deepseek": 0.95, "gemini": 0.9, "openai": 0.88}'),
('inventory', 'update', 'medium', 'weighted', 0.7, 2, 0.85, 0.65, '{"deepseek": 0.95, "gemini": 0.9, "openai": 0.88}'),
('inventory', 'delete', 'high', 'unanimous', 0.9, 3, 0.95, 0.8, '{"deepseek": 0.95, "gemini": 0.92, "openai": 0.9}'),
('maintenance', 'create', 'medium', 'weighted', 0.7, 2, 0.85, 0.7, '{"deepseek": 0.98, "gemini": 0.92, "openai": 0.9}'),
('maintenance', 'update', 'high', 'weighted', 0.8, 3, 0.9, 0.75, '{"deepseek": 0.98, "gemini": 0.92, "openai": 0.9}'),
('crew', 'create', 'medium', 'weighted', 0.75, 2, 0.85, 0.7, '{"gemini": 0.95, "openai": 0.92, "deepseek": 0.9}'),
('crew', 'update', 'high', 'weighted', 0.8, 3, 0.9, 0.75, '{"gemini": 0.95, "openai": 0.92, "deepseek": 0.9}'),
('finance', 'create', 'high', 'weighted', 0.85, 3, 0.95, 0.8, '{"openai": 0.95, "deepseek": 0.92, "gemini": 0.9}'),
('finance', 'approve', 'critical', 'unanimous', 0.95, 3, 0.98, 0.9, '{"openai": 0.95, "deepseek": 0.95, "gemini": 0.95}'),
('global', 'suggest', 'low', 'majority', 0.5, 2, 0.7, 0.5, '{"deepseek": 0.9, "gemini": 0.9, "openai": 0.9}');

-- Insert default workflows
INSERT INTO ai_agent_workflows (workflow_name, module, trigger_type, workflow_steps, model_chain, consensus_rule_id) VALUES
('Smart Inventory Analysis', 'inventory', 'user_request', 
 '[{"step": "extract_data", "description": "Extract item details from input"}, {"step": "validate_data", "description": "Validate against existing inventory"}, {"step": "suggest_actions", "description": "Suggest optimal inventory actions"}, {"step": "execute_consensus", "description": "Get model consensus on recommended actions"}]',
 '[{"models": ["deepseek", "vision"], "parallel": true, "purpose": "data_extraction"}, {"models": ["deepseek", "gemini", "openai"], "parallel": true, "purpose": "consensus_analysis"}]',
 (SELECT id FROM consensus_rules WHERE module = 'inventory' AND action_type = 'create' LIMIT 1)),
('Predictive Maintenance', 'maintenance', 'scheduled', 
 '[{"step": "analyze_equipment_data", "description": "Analyze equipment usage and performance"}, {"step": "predict_maintenance_needs", "description": "Predict upcoming maintenance requirements"}, {"step": "optimize_schedule", "description": "Optimize maintenance scheduling"}, {"step": "generate_recommendations", "description": "Generate actionable recommendations"}]',
 '[{"models": ["deepseek", "gemini"], "parallel": true, "purpose": "technical_analysis"}, {"models": ["openai"], "parallel": false, "purpose": "strategic_planning"}]',
 (SELECT id FROM consensus_rules WHERE module = 'maintenance' AND action_type = 'create' LIMIT 1)),
('Crew Intelligence', 'crew', 'proactive', 
 '[{"step": "monitor_crew_data", "description": "Monitor crew certifications and schedules"}, {"step": "identify_issues", "description": "Identify potential compliance or scheduling issues"}, {"step": "suggest_solutions", "description": "Suggest proactive solutions"}, {"step": "risk_assessment", "description": "Assess risk levels and priority"}]',
 '[{"models": ["gemini", "openai"], "parallel": true, "purpose": "crew_analysis"}, {"models": ["deepseek"], "parallel": false, "purpose": "compliance_check"}]',
 (SELECT id FROM consensus_rules WHERE module = 'crew' AND action_type = 'update' LIMIT 1));

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consensus_rules_updated_at BEFORE UPDATE ON consensus_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_workflows_updated_at BEFORE UPDATE ON ai_agent_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on ai_models" ON ai_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on consensus_rules" ON consensus_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_agent_workflows" ON ai_agent_workflows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_model_performance" ON ai_model_performance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_conversations" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ai_module_preferences" ON ai_module_preferences FOR ALL USING (true) WITH CHECK (true);