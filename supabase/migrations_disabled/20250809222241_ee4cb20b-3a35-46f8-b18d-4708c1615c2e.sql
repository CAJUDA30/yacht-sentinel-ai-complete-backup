-- Fix realtime configuration and AI sync issues

-- Enable realtime for AI tables
ALTER PUBLICATION supabase_realtime ADD TABLE ai_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_providers;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_models;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_health;

-- Set replica identity for realtime tables
ALTER TABLE ai_configs REPLICA IDENTITY FULL;
ALTER TABLE ai_providers REPLICA IDENTITY FULL;
ALTER TABLE ai_models REPLICA IDENTITY FULL;
ALTER TABLE ai_health REPLICA IDENTITY FULL;

-- Create default AI configurations for existing providers
INSERT INTO ai_configs (provider_id, module, model_id, active, params, priority)
SELECT 
  p.id as provider_id,
  'universal_search' as module,
  CASE 
    WHEN p.name = 'OpenAI' THEN 'gpt-4o'
    WHEN p.name = 'Google' THEN 'gemini-1.5-pro'
    WHEN p.name = 'DeepSeek' THEN 'deepseek-chat'
    WHEN p.name = 'Grok' THEN 'grok-beta'
    WHEN p.name = 'Anthropic' THEN 'claude-3-5-sonnet-20241022'
    ELSE 'default-model'
  END as model_id,
  true as active,
  jsonb_build_object(
    'temperature', 0.7,
    'max_tokens', 4000,
    'timeout', 30
  ) as params,
  CASE 
    WHEN p.name = 'OpenAI' THEN 90
    WHEN p.name = 'Google' THEN 85
    WHEN p.name = 'DeepSeek' THEN 95
    WHEN p.name = 'Grok' THEN 80
    WHEN p.name = 'Anthropic' THEN 88
    ELSE 50
  END as priority
FROM ai_providers p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_configs c 
  WHERE c.provider_id = p.id AND c.module = 'universal_search'
)
AND p.is_active = true;

-- Create AI health monitoring entries for providers without them
INSERT INTO ai_health (provider_id, status, uptime_24h, error_rate_1h, metadata)
SELECT 
  p.id,
  'unknown' as status,
  1.0 as uptime_24h,
  0.0 as error_rate_1h,
  jsonb_build_object(
    'last_ping', null,
    'response_time_ms', null,
    'error_message', null
  ) as metadata
FROM ai_providers p
WHERE NOT EXISTS (
  SELECT 1 FROM ai_health h 
  WHERE h.provider_id = p.id
)
AND p.is_active = true;

-- Update provider secret mappings
UPDATE ai_providers SET api_secret_name = 
  CASE 
    WHEN name = 'OpenAI' THEN 'OPENAI_API_KEY'
    WHEN name = 'Google' THEN 'GEMINI_API_KEY'
    WHEN name = 'Google Gemini' THEN 'GEMINI_API_KEY'
    WHEN name = 'DeepSeek' THEN 'DEEPSEEK_API_KEY'
    WHEN name = 'Grok' THEN 'GROK_API_KEY'
    WHEN name = 'xAI Grok' THEN 'GROK_API_KEY'
    WHEN name = 'Anthropic' THEN 'ANTHROPIC_API_KEY'
    ELSE null
  END
WHERE api_secret_name IS NULL;

-- Create function to sync AI provider status
CREATE OR REPLACE FUNCTION sync_ai_provider_status()
RETURNS void AS $$
BEGIN
  -- Update provider status based on health checks
  UPDATE ai_providers p
  SET updated_at = now()
  FROM ai_health h
  WHERE p.id = h.provider_id
  AND h.status != 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;