-- Fix the Yachtie provider base URL for multi-LLM compatibility
UPDATE ai_providers_unified 
SET base_url = 'https://api.yachtie-multi.ai/v1', updated_at = now()
WHERE provider_type = 'yachtie';

-- Add missing API key secrets if needed (using placeholders - user will add real keys)
INSERT INTO ai_system_config (config_key, config_value) 
VALUES 
  ('api_keys_status', '{"OPENAI_API_KEY": "configured", "ANTHROPIC_API_KEY": "missing", "GROK_API_KEY": "configured", "GEMINI_API_KEY": "configured", "DEEPSEEK_API_KEY": "configured"}'::jsonb)
ON CONFLICT (config_key) DO UPDATE 
SET config_value = EXCLUDED.config_value, updated_at = now();

-- Ensure we have models in ai_models table for ai-consensus-engine compatibility
INSERT INTO ai_models (provider, model_id, model_name, is_active, priority, capabilities, parameters) 
VALUES 
  ('openai', 'gpt-4-turbo-preview', 'OpenAI GPT-4 Turbo', true, 90, '["chat","text_generation","function_calling"]'::jsonb, '{"temperature":0.3}'::jsonb),
  ('google', 'gemini-pro', 'Google Gemini Pro', true, 85, '["chat","vision"]'::jsonb, '{"temperature":0.4}'::jsonb),
  ('xai', 'grok-beta', 'xAI Grok Beta', true, 80, '["chat","vision"]'::jsonb, '{"temperature":0.3}'::jsonb),
  ('deepseek', 'deepseek-chat', 'DeepSeek Chat', true, 80, '["chat","code_generation"]'::jsonb, '{"temperature":0.2}'::jsonb)
ON CONFLICT (provider, model_id) DO UPDATE 
SET is_active = true, updated_at = now();