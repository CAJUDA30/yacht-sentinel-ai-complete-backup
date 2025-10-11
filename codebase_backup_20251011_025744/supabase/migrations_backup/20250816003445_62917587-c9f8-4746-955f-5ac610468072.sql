-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Model Performance Metrics table
CREATE TABLE IF NOT EXISTS ai_model_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ai_models_unified(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  success_rate DECIMAL(3,2) DEFAULT 1.0,
  tokens_used INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector Knowledge Store with pgvector
CREATE TABLE IF NOT EXISTS ai_knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash TEXT UNIQUE NOT NULL,
  content_text TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding dimension
  module TEXT NOT NULL,
  knowledge_type TEXT NOT NULL, -- 'manual', 'scan_result', 'equipment_data', 'receipt', 'invoice'
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  yacht_id UUID,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_by UUID
);

-- Real-time AI Decision Audit Trail
CREATE TABLE IF NOT EXISTS ai_decision_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id TEXT NOT NULL,
  user_id UUID,
  task_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  model_chain TEXT[] NOT NULL, -- Array of models used
  final_decision JSONB NOT NULL,
  confidence_scores JSONB NOT NULL, -- Per-model confidence
  execution_time_ms INTEGER NOT NULL,
  cost_breakdown JSONB DEFAULT '{}',
  human_validated BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Cost Tracking
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,8) NOT NULL,
  user_id UUID,
  yacht_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Smart Scan Results with AI Processing
CREATE TABLE IF NOT EXISTS smart_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id TEXT UNIQUE NOT NULL,
  original_file_url TEXT,
  file_type TEXT NOT NULL, -- 'receipt', 'invoice', 'manual', 'equipment_label'
  processing_chain TEXT[] NOT NULL, -- Models used in sequence
  extracted_data JSONB NOT NULL,
  classification_result JSONB NOT NULL,
  routed_to_module TEXT, -- 'finance', 'inventory', 'maintenance'
  confidence_score DECIMAL(3,2) NOT NULL,
  human_validated BOOLEAN DEFAULT NULL,
  user_id UUID NOT NULL,
  yacht_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Provider Health Monitoring
CREATE TABLE IF NOT EXISTS ai_provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  last_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  uptime_24h DECIMAL(5,2) DEFAULT 100.0,
  success_rate_1h DECIMAL(5,2) DEFAULT 100.0,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_embedding ON ai_knowledge_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_module ON ai_knowledge_vectors(module);
CREATE INDEX IF NOT EXISTS idx_knowledge_vectors_yacht ON ai_knowledge_vectors(yacht_id);
CREATE INDEX IF NOT EXISTS idx_smart_scan_yacht ON smart_scan_results(yacht_id);
CREATE INDEX IF NOT EXISTS idx_smart_scan_user ON smart_scan_results(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_audit_user ON ai_decision_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_audit_task ON ai_decision_audit(task_type);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_timestamp ON ai_cost_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_user ON ai_cost_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_model ON ai_model_performance_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_provider_health_name ON ai_provider_health(provider_name);

-- Enable RLS on new tables
ALTER TABLE ai_model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decision_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own performance metrics" ON ai_model_performance_metrics FOR SELECT USING (true);
CREATE POLICY "System can insert performance metrics" ON ai_model_performance_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view knowledge vectors" ON ai_knowledge_vectors FOR SELECT USING (is_shared = true OR created_by = auth.uid());
CREATE POLICY "Users can create knowledge vectors" ON ai_knowledge_vectors FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their knowledge vectors" ON ai_knowledge_vectors FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can view their decision audit" ON ai_decision_audit FOR SELECT USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));
CREATE POLICY "System can insert decision audit" ON ai_decision_audit FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their cost tracking" ON ai_cost_tracking FOR SELECT USING (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()));
CREATE POLICY "System can insert cost tracking" ON ai_cost_tracking FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their scan results" ON smart_scan_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create scan results" ON smart_scan_results FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their scan results" ON smart_scan_results FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Everyone can view provider health" ON ai_provider_health FOR SELECT USING (true);
CREATE POLICY "System can manage provider health" ON ai_provider_health FOR ALL USING (true);