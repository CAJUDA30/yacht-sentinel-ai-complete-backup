-- Create optimized consensus rules for better performance

-- Insert default optimized consensus rules
INSERT INTO consensus_rules (
  module, action_type, risk_level, consensus_algorithm,
  required_agreement_threshold, minimum_models_required,
  auto_execute_threshold, human_approval_threshold,
  model_weights, fallback_models, timeout_seconds, is_active
) VALUES
-- Fast single-model rules for simple operations
('dashboard', 'analytics', 'low', 'majority', 0.6, 1, 0.8, 0.5, 
 '{"deepseek": 1.0}', '["deepseek-chat"]', 8, true),
 
('dashboard', 'prediction', 'low', 'majority', 0.6, 1, 0.8, 0.5,
 '{"deepseek": 1.0}', '["deepseek-chat"]', 8, true),
 
('dashboard', 'optimization', 'medium', 'majority', 0.7, 2, 0.8, 0.6,
 '{"deepseek": 0.6, "grok": 0.4}', '["deepseek-chat", "grok-beta"]', 15, true),

-- Quick processing rules for common operations
('inventory', 'scan', 'low', 'majority', 0.7, 1, 0.9, 0.6,
 '{"vision": 1.0}', '["vision-api"]', 5, true),

('equipment', 'analysis', 'medium', 'majority', 0.7, 2, 0.8, 0.6,
 '{"deepseek": 0.7, "openai": 0.3}', '["deepseek-chat", "gpt-4o"]', 12, true),

-- Global fallback rule with minimal requirements
('global', 'fallback', 'high', 'majority', 0.5, 1, 0.7, 0.5,
 '{"deepseek": 1.0}', '["deepseek-chat"]', 10, true)

ON CONFLICT (module, action_type, risk_level) DO UPDATE SET
  minimum_models_required = EXCLUDED.minimum_models_required,
  timeout_seconds = EXCLUDED.timeout_seconds,
  updated_at = now();