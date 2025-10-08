-- Multi-LLM Consensus System Schema
-- Enhanced consensus tracking and worker agent management

-- AI consensus logs for tracking multi-model decisions
CREATE TABLE IF NOT EXISTS public.ai_consensus_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL CHECK (task_type IN (
    'ocr_classification', 'maintenance_prediction', 'safety_assessment', 
    'financial_analysis', 'procurement_decision', 'general_analysis'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  yacht_id UUID,
  input_data JSONB NOT NULL,
  consensus_achieved BOOLEAN NOT NULL,
  final_decision JSONB,
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  consensus_method TEXT NOT NULL CHECK (consensus_method IN (
    'unanimous', 'majority', 'weighted', 'expert_override'
  )),
  worker_responses JSONB NOT NULL DEFAULT '[]',
  processing_time_ms INTEGER DEFAULT 0,
  cost_total DECIMAL(10,6) DEFAULT 0.0,
  debate_rounds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker agent configurations and performance tracking
CREATE TABLE IF NOT EXISTS public.ai_worker_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT UNIQUE NOT NULL,
  worker_name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  model_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  performance_metrics JSONB DEFAULT '{}',
  cost_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Worker performance tracking
CREATE TABLE IF NOT EXISTS public.ai_worker_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id TEXT NOT NULL,
  consensus_log_id UUID REFERENCES ai_consensus_logs(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  processing_time_ms INTEGER NOT NULL,
  cost_estimate DECIMAL(10,6) DEFAULT 0.0,
  was_selected BOOLEAN DEFAULT false, -- Whether this worker's decision was chosen
  accuracy_score DECIMAL(3,2), -- Post-evaluation accuracy (when available)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consensus rules and thresholds
CREATE TABLE IF NOT EXISTS public.ai_consensus_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  module TEXT,
  min_workers INTEGER DEFAULT 2,
  max_workers INTEGER DEFAULT 5,
  consensus_threshold DECIMAL(3,2) DEFAULT 0.67,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  enable_debate BOOLEAN DEFAULT true,
  max_debate_rounds INTEGER DEFAULT 3,
  worker_selection_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consensus preferences
CREATE TABLE IF NOT EXISTS public.user_consensus_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_consensus_method TEXT DEFAULT 'weighted',
  confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
  enable_debate BOOLEAN DEFAULT true,
  max_processing_time_ms INTEGER DEFAULT 30000,
  cost_limit_per_decision DECIMAL(10,6) DEFAULT 0.10,
  preferred_workers JSONB DEFAULT '[]',
  blocked_workers JSONB DEFAULT '[]',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consensus feedback for learning
CREATE TABLE IF NOT EXISTS public.ai_consensus_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consensus_log_id UUID NOT NULL REFERENCES ai_consensus_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'correct', 'incorrect', 'partially_correct', 'needs_improvement'
  )),
  feedback_details JSONB,
  alternative_decision JSONB, -- What the user thinks the correct decision should be
  confidence_in_feedback DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_consensus_logs_user ON ai_consensus_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_consensus_logs_task_type ON ai_consensus_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_consensus_logs_created ON ai_consensus_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consensus_logs_consensus ON ai_consensus_logs(consensus_achieved);

CREATE INDEX IF NOT EXISTS idx_worker_performance_worker ON ai_worker_performance(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_performance_selected ON ai_worker_performance(was_selected);
CREATE INDEX IF NOT EXISTS idx_worker_performance_confidence ON ai_worker_performance(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_consensus_rules_task ON ai_consensus_rules(task_type);
CREATE INDEX IF NOT EXISTS idx_consensus_rules_active ON ai_consensus_rules(is_active);

CREATE INDEX IF NOT EXISTS idx_consensus_feedback_log ON ai_consensus_feedback(consensus_log_id);
CREATE INDEX IF NOT EXISTS idx_consensus_feedback_type ON ai_consensus_feedback(feedback_type);

-- Enable Row Level Security
ALTER TABLE ai_consensus_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_worker_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consensus_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consensus_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consensus logs" ON ai_consensus_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create consensus logs" ON ai_consensus_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view worker performance for their decisions" ON ai_worker_performance
  FOR SELECT USING (
    consensus_log_id IN (
      SELECT id FROM ai_consensus_logs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their consensus preferences" ON user_consensus_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can provide feedback on their consensus decisions" ON ai_consensus_feedback
  FOR ALL USING (auth.uid() = user_id);

-- Functions for consensus system management

-- Function to get optimal workers for a task
CREATE OR REPLACE FUNCTION get_optimal_workers(
  p_task_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_max_workers INTEGER DEFAULT 3
)
RETURNS TABLE(
  worker_id TEXT,
  worker_name TEXT,
  specialization TEXT,
  model_name TEXT,
  provider TEXT,
  weight DECIMAL,
  avg_confidence DECIMAL,
  success_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH worker_stats AS (
    SELECT 
      wa.worker_id,
      wa.worker_name,
      wa.specialization,
      wa.model_name,
      wa.provider,
      wa.weight,
      COALESCE(AVG(wp.confidence_score), 0.5) as avg_confidence,
      COALESCE(
        COUNT(CASE WHEN wp.was_selected THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(wp.id), 0), 0.5
      ) as success_rate
    FROM ai_worker_agents wa
    LEFT JOIN ai_worker_performance wp ON wa.worker_id = wp.worker_id
    LEFT JOIN ai_consensus_logs cl ON wp.consensus_log_id = cl.id
    WHERE wa.is_active = true
      AND (p_user_id IS NULL OR cl.user_id = p_user_id OR cl.user_id IS NULL)
      AND (cl.created_at IS NULL OR cl.created_at > NOW() - INTERVAL '30 days')
    GROUP BY wa.worker_id, wa.worker_name, wa.specialization, 
             wa.model_name, wa.provider, wa.weight
  )
  SELECT 
    ws.worker_id,
    ws.worker_name,
    ws.specialization,
    ws.model_name,
    ws.provider,
    ws.weight,
    ws.avg_confidence,
    ws.success_rate
  FROM worker_stats ws
  WHERE ws.specialization LIKE '%' || CASE 
    WHEN p_task_type = 'financial_analysis' THEN 'financial'
    WHEN p_task_type = 'maintenance_prediction' THEN 'maintenance'
    WHEN p_task_type = 'safety_assessment' THEN 'safety'
    WHEN p_task_type = 'procurement_decision' THEN 'inventory'
    ELSE ''
  END || '%'
  ORDER BY (ws.avg_confidence * ws.success_rate * ws.weight) DESC
  LIMIT p_max_workers;
END;
$$ LANGUAGE plpgsql;

-- Function to update worker performance metrics
CREATE OR REPLACE FUNCTION update_worker_metrics()
RETURNS void AS $$
BEGIN
  UPDATE ai_worker_agents 
  SET 
    performance_metrics = JSONB_BUILD_OBJECT(
      'avg_confidence', COALESCE(stats.avg_confidence, 0.5),
      'success_rate', COALESCE(stats.success_rate, 0.5),
      'total_decisions', COALESCE(stats.total_decisions, 0),
      'avg_processing_time', COALESCE(stats.avg_processing_time, 0),
      'last_updated', NOW()
    ),
    cost_metrics = JSONB_BUILD_OBJECT(
      'total_cost', COALESCE(stats.total_cost, 0),
      'avg_cost_per_decision', COALESCE(stats.avg_cost, 0),
      'cost_efficiency', COALESCE(stats.cost_efficiency, 0)
    ),
    updated_at = NOW()
  FROM (
    SELECT 
      wp.worker_id,
      AVG(wp.confidence_score) as avg_confidence,
      COUNT(CASE WHEN wp.was_selected THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(wp.id), 0) as success_rate,
      COUNT(wp.id) as total_decisions,
      AVG(wp.processing_time_ms) as avg_processing_time,
      SUM(wp.cost_estimate) as total_cost,
      AVG(wp.cost_estimate) as avg_cost,
      CASE 
        WHEN AVG(wp.cost_estimate) > 0 THEN 
          AVG(wp.confidence_score) / AVG(wp.cost_estimate)
        ELSE 0 
      END as cost_efficiency
    FROM ai_worker_performance wp
    WHERE wp.created_at > NOW() - INTERVAL '30 days'
    GROUP BY wp.worker_id
  ) stats
  WHERE ai_worker_agents.worker_id = stats.worker_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update worker performance
CREATE OR REPLACE FUNCTION trigger_update_worker_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance metrics for the worker
  PERFORM update_worker_metrics();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_worker_performance_trigger
  AFTER INSERT OR UPDATE ON ai_worker_performance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_update_worker_performance();

-- Insert default worker agents
INSERT INTO ai_worker_agents (worker_id, worker_name, specialization, model_name, provider, system_prompt, weight) VALUES
(
  'finance_expert',
  'Finance Expert',
  'financial_analysis',
  'gpt-4-turbo',
  'openai',
  'You are a yacht finance expert. Analyze financial documents, receipts, and expenses. Focus on categorization, cost analysis, budget compliance, and tax implications. Provide structured financial insights with confidence scores.',
  1.2
),
(
  'maintenance_specialist',
  'Maintenance Specialist',
  'maintenance_prediction',
  'claude-3-sonnet',
  'anthropic',
  'You are a yacht maintenance specialist. Analyze equipment data, schedules, and technical documents. Focus on predictive maintenance, safety compliance, and operational efficiency. Provide actionable maintenance recommendations with priority levels.',
  1.3
),
(
  'inventory_manager',
  'Inventory Manager',
  'inventory_management',
  'grok-beta',
  'xai',
  'You are a yacht inventory management expert. Analyze product data, stock levels, and procurement needs. Focus on optimization, cost efficiency, and availability. Consider seasonal demands and emergency requirements. Provide inventory insights with reorder recommendations.',
  1.0
),
(
  'safety_officer',
  'Safety Officer',
  'safety_assessment',
  'gpt-4-vision-preview',
  'openai',
  'You are a yacht safety officer. Analyze safety equipment, compliance documents, and risk assessments. Focus on regulatory compliance, crew safety, and emergency preparedness. Provide safety recommendations with urgency levels and compliance status.',
  1.4
),
(
  'operations_coordinator',
  'Operations Coordinator',
  'general_operations',
  'gemini-pro',
  'google',
  'You are a yacht operations coordinator. Analyze general operational data and coordinate between departments. Focus on workflow optimization, resource allocation, and operational efficiency. Provide balanced operational insights considering all yacht departments.',
  1.1
)
ON CONFLICT (worker_id) DO UPDATE SET
  worker_name = EXCLUDED.worker_name,
  model_name = EXCLUDED.model_name,
  provider = EXCLUDED.provider,
  system_prompt = EXCLUDED.system_prompt,
  weight = EXCLUDED.weight,
  updated_at = NOW();

-- Insert default consensus rules
INSERT INTO ai_consensus_rules (task_type, min_workers, max_workers, consensus_threshold, confidence_threshold, enable_debate, max_debate_rounds) VALUES
('ocr_classification', 2, 3, 0.67, 0.8, true, 2),
('maintenance_prediction', 2, 3, 0.67, 0.9, true, 3),
('safety_assessment', 3, 4, 0.75, 0.95, true, 3),
('financial_analysis', 2, 2, 0.5, 0.8, true, 2),
('procurement_decision', 2, 3, 0.67, 0.8, true, 2),
('general_analysis', 2, 5, 0.6, 0.7, true, 2)
ON CONFLICT (task_type) DO UPDATE SET
  min_workers = EXCLUDED.min_workers,
  max_workers = EXCLUDED.max_workers,
  consensus_threshold = EXCLUDED.consensus_threshold,
  confidence_threshold = EXCLUDED.confidence_threshold,
  enable_debate = EXCLUDED.enable_debate,
  max_debate_rounds = EXCLUDED.max_debate_rounds,
  updated_at = NOW();

-- Grant permissions
GRANT ALL ON ai_consensus_logs TO authenticated;
GRANT SELECT ON ai_worker_agents TO authenticated;
GRANT ALL ON ai_worker_performance TO authenticated;
GRANT SELECT ON ai_consensus_rules TO authenticated;
GRANT ALL ON user_consensus_preferences TO authenticated;
GRANT ALL ON ai_consensus_feedback TO authenticated;

-- Create default user preferences for existing users
INSERT INTO user_consensus_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_consensus_preferences)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE ai_consensus_logs IS 'Tracks multi-LLM consensus decisions and their outcomes';
COMMENT ON TABLE ai_worker_agents IS 'Configuration and metadata for AI worker agents';
COMMENT ON TABLE ai_worker_performance IS 'Performance tracking for individual worker agents';
COMMENT ON TABLE ai_consensus_rules IS 'Rules and thresholds for consensus decision making';
COMMENT ON TABLE user_consensus_preferences IS 'User-specific preferences for consensus behavior';
COMMENT ON TABLE ai_consensus_feedback IS 'User feedback on consensus decisions for learning';