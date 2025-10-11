-- Fix consensus rules table and optimize performance

-- Add unique constraint for consensus rules to prevent conflicts
ALTER TABLE consensus_rules 
ADD CONSTRAINT consensus_rules_unique 
UNIQUE (module, action_type, risk_level);

-- Insert optimized consensus rules
INSERT INTO consensus_rules (
  module, action_type, risk_level, consensus_algorithm,
  required_agreement_threshold, minimum_models_required,
  auto_execute_threshold, human_approval_threshold,
  model_weights, fallback_models, timeout_seconds, is_active
) VALUES
('dashboard', 'analytics', 'low', 'majority', 0.6, 1, 0.8, 0.5, 
 '{"deepseek": 1.0}', '["deepseek-chat"]', 8, true),
('inventory', 'scan', 'low', 'majority', 0.7, 1, 0.9, 0.6,
 '{"vision": 1.0}', '["vision-api"]', 5, true),
('global', 'fallback', 'medium', 'majority', 0.5, 1, 0.7, 0.5,
 '{"deepseek": 1.0}', '["deepseek-chat"]', 10, true)
ON CONFLICT (module, action_type, risk_level) DO NOTHING;

-- Update existing AI models for better performance
UPDATE ai_models SET 
  parameters = jsonb_set(parameters, '{max_tokens}', '300'),
  priority = CASE 
    WHEN provider = 'deepseek' THEN 95
    WHEN provider = 'openai' THEN 85
    WHEN provider = 'grok' THEN 80
    WHEN provider = 'gemini' THEN 75
    ELSE priority
  END
WHERE is_active = true;