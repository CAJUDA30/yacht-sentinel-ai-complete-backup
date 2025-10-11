-- Add missing AI provider discovery functionality
ALTER TABLE ai_providers 
ADD COLUMN IF NOT EXISTS discovery_url TEXT,
ADD COLUMN IF NOT EXISTS test_endpoint TEXT,
ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS model_prefix TEXT;

-- Add real-time model testing and monitoring 
ALTER TABLE ai_models
ADD COLUMN IF NOT EXISTS test_prompt TEXT DEFAULT 'Hello! Please respond briefly to confirm you are connected to YachtExcel.',
ADD COLUMN IF NOT EXISTS test_response TEXT,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_requests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS temperature NUMERIC DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 4096,
ADD COLUMN IF NOT EXISTS system_prompt TEXT DEFAULT 'You are a helpful AI assistant for yacht management.',
ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;

-- Create system configuration table for global AI settings
CREATE TABLE IF NOT EXISTS ai_system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Insert default AI system configurations
INSERT INTO ai_system_config (config_key, config_value) VALUES
('auto_optimization_enabled', 'true'),
('performance_monitoring_interval', '300'),
('max_concurrent_requests', '10'),
('default_timeout_seconds', '30'),
('consensus_threshold', '0.75')
ON CONFLICT (config_key) DO NOTHING;

-- Create table for AI model logs and debugging
CREATE TABLE IF NOT EXISTS ai_model_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ai_models(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  status TEXT NOT NULL, -- success, error, timeout
  error_message TEXT,
  latency_ms INTEGER,
  tokens_used INTEGER,
  cost_usd NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on new tables
ALTER TABLE ai_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on ai_system_config" ON ai_system_config FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_model_logs" ON ai_model_logs FOR ALL USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_ai_system_config_updated_at 
  BEFORE UPDATE ON ai_system_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI providers with discovery endpoints
INSERT INTO ai_providers (name, base_url, auth_type, models_endpoint, discovery_url, test_endpoint, request_format, response_format, supported_capabilities) VALUES
('OpenAI', 'https://api.openai.com/v1', 'bearer', '/models', 'https://api.openai.com/v1/models', 'https://api.openai.com/v1/chat/completions', 
 '{"model": "MODEL_ID", "messages": [{"role": "user", "content": "PROMPT"}]}',
 '{"choices": [{"message": {"content": "RESPONSE"}}]}',
 '["text", "vision", "function_calling", "reasoning"]'),
('Anthropic', 'https://api.anthropic.com', 'bearer', '/v1/models', 'https://api.anthropic.com/v1/models', 'https://api.anthropic.com/v1/messages',
 '{"model": "MODEL_ID", "messages": [{"role": "user", "content": "PROMPT"}], "max_tokens": 1024}',
 '{"content": [{"text": "RESPONSE"}]}',
 '["text", "reasoning", "function_calling"]'),
('Google', 'https://generativelanguage.googleapis.com', 'api_key', '/v1/models', 'https://generativelanguage.googleapis.com/v1/models', 'https://generativelanguage.googleapis.com/v1/models/MODEL_ID:generateContent',
 '{"contents": [{"parts": [{"text": "PROMPT"}]}]}',
 '{"candidates": [{"content": {"parts": [{"text": "RESPONSE"}]}}]}',
 '["text", "vision", "multimodal"]'),
('Grok', 'https://api.x.ai/v1', 'bearer', '/models', 'https://api.x.ai/v1/models', 'https://api.x.ai/v1/chat/completions',
 '{"model": "MODEL_ID", "messages": [{"role": "user", "content": "PROMPT"}]}',
 '{"choices": [{"message": {"content": "RESPONSE"}}]}',
 '["text", "reasoning", "humor"]'),
('DeepSeek', 'https://api.deepseek.com/v1', 'bearer', '/models', 'https://api.deepseek.com/v1/models', 'https://api.deepseek.com/v1/chat/completions',
 '{"model": "MODEL_ID", "messages": [{"role": "user", "content": "PROMPT"}]}',
 '{"choices": [{"message": {"content": "RESPONSE"}}]}',
 '["text", "reasoning", "coding"]')
ON CONFLICT (name) DO UPDATE SET
  base_url = EXCLUDED.base_url,
  models_endpoint = EXCLUDED.models_endpoint,
  discovery_url = EXCLUDED.discovery_url,
  test_endpoint = EXCLUDED.test_endpoint,
  request_format = EXCLUDED.request_format,
  response_format = EXCLUDED.response_format,
  supported_capabilities = EXCLUDED.supported_capabilities,
  updated_at = now();