-- 1) Provider endpoint fields for flexible configuration
ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS chat_endpoint text,
  ADD COLUMN IF NOT EXISTS embeddings_endpoint text,
  ADD COLUMN IF NOT EXISTS tools_endpoint text;

-- 2) Seed xAI provider (Grok) if it does not already exist
INSERT INTO public.ai_providers (
  name,
  base_url,
  models_endpoint,
  test_endpoint,
  chat_endpoint,
  api_secret_name,
  auth_type,
  auth_header_name,
  supported_capabilities,
  request_format,
  response_format,
  is_active,
  rate_limit_per_minute
)
SELECT
  'xAI' AS name,
  'https://api.x.ai' AS base_url,
  '/v1/models' AS models_endpoint,
  '/v1/chat/completions' AS test_endpoint,
  '/v1/chat/completions' AS chat_endpoint,
  'GROK_API_KEY' AS api_secret_name,
  'bearer' AS auth_type,
  'Authorization' AS auth_header_name,
  '["chat","embeddings","tools","vision"]'::jsonb AS supported_capabilities,
  '{"method":"POST","headers":{"Content-Type":"application/json"},"body":"json"}'::jsonb AS request_format,
  '{"type":"json"}'::jsonb AS response_format,
  true AS is_active,
  60 AS rate_limit_per_minute
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_providers p WHERE p.name = 'xAI'
);

-- 3) Feature flags for incremental rollout
-- Store under a single config_key = 'feature_flags'
DELETE FROM public.ai_system_config WHERE config_key = 'feature_flags';
INSERT INTO public.ai_system_config (config_key, config_value)
VALUES (
  'feature_flags',
  jsonb_build_object(
    'grok_primary', false,
    'provider_endpoints_ui', false,
    'llm_streaming', false,
    'edge_warmups', false,
    'dept_log_cards', false
  )
);
