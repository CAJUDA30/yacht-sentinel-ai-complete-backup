-- Update base URL for Yachtie built-in provider to multi-LLM compatible endpoint
UPDATE ai_providers_unified 
SET base_url = 'https://api.yachtie-multi.ai/v1', updated_at = now()
WHERE provider_type = 'yachtie';

-- Seed minimal active models so ai-consensus-engine can operate across 3+ providers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_models WHERE provider = 'openai' AND is_active = true) THEN
    INSERT INTO ai_models (provider, model_id, model_name, model_type, is_active, priority, capabilities, parameters)
    VALUES ('openai', 'gpt-4-turbo-preview', 'OpenAI GPT-4 Turbo', 'chat', true, 90, '["chat","text_generation","function_calling"]'::jsonb, '{"temperature":0.3}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ai_models WHERE provider = 'google' AND is_active = true) THEN
    INSERT INTO ai_models (provider, model_id, model_name, model_type, is_active, priority, capabilities, parameters)
    VALUES ('google', 'gemini-pro', 'Google Gemini Pro', 'chat', true, 85, '["chat","vision"]'::jsonb, '{"temperature":0.4}'::jsonb);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM ai_models WHERE provider = 'deepseek' AND is_active = true) THEN
    INSERT INTO ai_models (provider, model_id, model_name, model_type, is_active, priority, capabilities, parameters)
    VALUES ('deepseek', 'deepseek-chat', 'DeepSeek Chat', 'chat', true, 80, '["chat","code_generation"]'::jsonb, '{"temperature":0.2}'::jsonb);
  END IF;

  -- Include xai if desired; consensus will use whichever are present and have secrets
  IF NOT EXISTS (SELECT 1 FROM ai_models WHERE provider = 'xai' AND is_active = true) THEN
    INSERT INTO ai_models (provider, model_id, model_name, model_type, is_active, priority, capabilities, parameters)
    VALUES ('xai', 'grok-beta', 'xAI Grok Beta', 'chat', true, 80, '["chat","vision"]'::jsonb, '{"temperature":0.3}'::jsonb);
  END IF;
END $$;