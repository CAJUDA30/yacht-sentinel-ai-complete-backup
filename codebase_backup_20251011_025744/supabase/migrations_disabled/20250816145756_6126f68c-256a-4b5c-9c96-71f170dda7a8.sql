-- Phase 1: Replace fake Yachtie provider with real enterprise-grade providers

-- First, disable the existing fake Yachtie provider
UPDATE ai_providers_unified 
SET is_active = false, is_primary = false 
WHERE provider_type = 'yachtie';

-- Add OpenAI as primary provider
INSERT INTO ai_providers_unified (
  name, provider_type, base_url, auth_method, is_active, is_primary,
  capabilities, config, supported_languages, rate_limit_per_minute, rate_limit_per_day,
  cost_tracking_enabled, health_check_endpoint, documentation_url
) VALUES (
  'OpenAI GPT Models', 'openai', 'https://api.openai.com', 'api_key', true, true,
  '["text_generation", "chat_completion", "vision", "embeddings", "function_calling", "code_generation"]'::jsonb,
  '{
    "endpoints": {
      "chat": "/v1/chat/completions",
      "models": "/v1/models", 
      "embeddings": "/v1/embeddings",
      "test": "/v1/models"
    },
    "auth": {
      "header_name": "Authorization",
      "token_prefix": "Bearer",
      "secret_name": "OPENAI_API_KEY"
    },
    "defaults": {
      "temperature": 0.7,
      "max_tokens": 4096,
      "timeout": 30000,
      "max_retries": 3
    },
    "features": {
      "streaming": true,
      "function_calling": true,
      "vision": true,
      "embeddings": true,
      "fine_tuning": true
    }
  }'::jsonb,
  '["en", "fr", "es", "de", "it", "pt", "nl", "sv", "no", "da", "zh", "ja", "ko", "ar", "ru"]'::jsonb,
  3500, 200000, true,
  'https://api.openai.com/v1/models',
  'https://platform.openai.com/docs/api-reference'
);

-- Add Anthropic Claude as secondary provider  
INSERT INTO ai_providers_unified (
  name, provider_type, base_url, auth_method, is_active, is_primary,
  capabilities, config, supported_languages, rate_limit_per_minute, rate_limit_per_day,
  cost_tracking_enabled, health_check_endpoint, documentation_url
) VALUES (
  'Anthropic Claude', 'anthropic', 'https://api.anthropic.com', 'api_key', true, false,
  '["text_generation", "chat_completion", "vision", "function_calling", "code_generation", "sentiment_analysis"]'::jsonb,
  '{
    "endpoints": {
      "chat": "/v1/messages",
      "models": "/v1/models", 
      "test": "/v1/messages"
    },
    "auth": {
      "header_name": "x-api-key",
      "secret_name": "ANTHROPIC_API_KEY"
    },
    "defaults": {
      "temperature": 0.7,
      "max_tokens": 4096,
      "timeout": 60000,
      "max_retries": 3
    },
    "features": {
      "streaming": true,
      "function_calling": true,
      "vision": true,
      "embeddings": false,
      "fine_tuning": false
    }
  }'::jsonb,
  '["en", "fr", "es", "de", "it", "pt", "nl", "sv", "no", "da", "zh", "ja", "ko", "ar", "ru"]'::jsonb,
  4000, 300000, true,
  'https://api.anthropic.com/v1/messages',
  'https://docs.anthropic.com/claude/reference'
);

-- Add xAI Grok as tertiary provider
INSERT INTO ai_providers_unified (
  name, provider_type, base_url, auth_method, is_active, is_primary,
  capabilities, config, supported_languages, rate_limit_per_minute, rate_limit_per_day,
  cost_tracking_enabled, health_check_endpoint, documentation_url  
) VALUES (
  'xAI Grok', 'xai', 'https://api.x.ai', 'api_key', true, false,
  '["text_generation", "chat_completion", "vision", "function_calling", "code_generation"]'::jsonb,
  '{
    "endpoints": {
      "chat": "/v1/chat/completions",
      "models": "/v1/models",
      "test": "/v1/chat/completions"
    },
    "auth": {
      "header_name": "Authorization", 
      "token_prefix": "Bearer",
      "secret_name": "GROK_API_KEY"
    },
    "defaults": {
      "temperature": 0.3,
      "max_tokens": 8192,
      "timeout": 30000,
      "max_retries": 3
    },
    "features": {
      "streaming": true,
      "function_calling": true,
      "vision": true,
      "embeddings": false,
      "fine_tuning": false
    }
  }'::jsonb,
  '["en", "fr", "es", "de", "it", "pt", "nl", "sv", "no", "da", "zh", "ja", "ko", "ar", "ru"]'::jsonb,
  6000, 500000, true,
  'https://api.x.ai/v1/chat/completions',
  'https://docs.x.ai'
);

-- Deactivate old fake Yachtie models
UPDATE ai_models_unified 
SET is_active = false 
WHERE provider_id = (SELECT id FROM ai_providers_unified WHERE provider_type = 'yachtie' AND is_active = false);

-- Add real enterprise-grade AI models for the three providers
-- Get provider IDs for the new providers
DO $$
DECLARE
    openai_provider_id uuid;
    anthropic_provider_id uuid;
    xai_provider_id uuid;
BEGIN
    -- Get provider IDs
    SELECT id INTO openai_provider_id FROM ai_providers_unified WHERE provider_type = 'openai' AND is_active = true;
    SELECT id INTO anthropic_provider_id FROM ai_providers_unified WHERE provider_type = 'anthropic' AND is_active = true;
    SELECT id INTO xai_provider_id FROM ai_providers_unified WHERE provider_type = 'xai' AND is_active = true;
    
    -- Add OpenAI models
    INSERT INTO ai_models_unified (
        provider_id, model_id, model_name, model_type, priority, is_active,
        max_context_length, cost_per_1k_tokens, supports_vision, supports_function_calling,
        parameters, rate_limits, specialization
    ) VALUES 
    (openai_provider_id, 'gpt-4-turbo', 'GPT-4 Turbo', 'chat', 90, true, 128000, 0.03, true, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 3500, "per_hour": 200000, "per_day": 500000}'::jsonb,
     '["reasoning", "analysis", "coding", "general"]'::text[]
    ),
    (openai_provider_id, 'gpt-4o', 'GPT-4o', 'multimodal', 95, true, 128000, 0.025, true, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 3500, "per_hour": 200000, "per_day": 500000}'::jsonb,
     '["vision", "multimodal", "reasoning", "general"]'::text[]
    ),
    (openai_provider_id, 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 'chat', 70, true, 16385, 0.002, false, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 3500, "per_hour": 200000, "per_day": 500000}'::jsonb,
     '["general", "fast_response", "cost_effective"]'::text[]
    ),
    
    -- Add Anthropic models  
    (anthropic_provider_id, 'claude-3-opus-20240229', 'Claude 3 Opus', 'chat', 95, true, 200000, 0.075, true, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 4000, "per_hour": 300000, "per_day": 600000}'::jsonb,
     '["reasoning", "analysis", "complex_tasks", "coding"]'::text[]
    ),
    (anthropic_provider_id, 'claude-3-sonnet-20240229', 'Claude 3 Sonnet', 'chat', 85, true, 200000, 0.015, true, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 4000, "per_hour": 300000, "per_day": 600000}'::jsonb,
     '["balanced", "general", "cost_effective", "reasoning"]'::text[]
    ),
    (anthropic_provider_id, 'claude-3-haiku-20240307', 'Claude 3 Haiku', 'chat', 75, true, 200000, 0.0025, false, true,
     '{"temperature": 0.7, "max_tokens": 4096, "top_p": 1}'::jsonb,
     '{"per_minute": 4000, "per_hour": 300000, "per_day": 600000}'::jsonb,
     '["fast_response", "cost_effective", "general"]'::text[]
    ),
    
    -- Add xAI models
    (xai_provider_id, 'grok-beta', 'Grok Beta', 'chat', 80, true, 32768, 0.01, true, true,
     '{"temperature": 0.3, "max_tokens": 8192, "top_p": 1}'::jsonb,
     '{"per_minute": 6000, "per_hour": 500000, "per_day": 1000000}'::jsonb,
     '["real_time", "creative", "humor", "current_events"]'::text[]
    ),
    (xai_provider_id, 'grok-vision-beta', 'Grok Vision Beta', 'multimodal', 85, true, 32768, 0.015, true, true,
     '{"temperature": 0.3, "max_tokens": 8192, "top_p": 1}'::jsonb,
     '{"per_minute": 6000, "per_hour": 500000, "per_day": 1000000}'::jsonb,
     '["vision", "multimodal", "real_time", "creative"]'::text[]
    );
END $$;

-- Create enhanced orchestration rules for multi-provider consensus
INSERT INTO ai_orchestration_rules (
    rule_name, task_type, priority, is_active, 
    conditions, primary_model_id, fallback_models,
    performance_threshold
) VALUES 
('High-Stakes Decision Making', 'consensus', 100, true,
 '{"min_confidence": 0.85, "require_multiple_providers": true, "max_cost": 0.50}'::jsonb,
 (SELECT id FROM ai_models_unified WHERE model_id = 'gpt-4o' AND is_active = true LIMIT 1),
 '[]'::jsonb,
 0.85
),
('General Yacht Management', 'general', 80, true,
 '{"cost_priority": "medium", "speed_priority": "medium"}'::jsonb,
 (SELECT id FROM ai_models_unified WHERE model_id = 'claude-3-sonnet-20240229' AND is_active = true LIMIT 1),
 (SELECT jsonb_agg(id) FROM ai_models_unified WHERE model_id IN ('gpt-4-turbo', 'grok-beta') AND is_active = true),
 0.75
),
('Vision and Image Analysis', 'vision', 90, true,
 '{"requires_vision": true, "max_processing_time": 30000}'::jsonb,
 (SELECT id FROM ai_models_unified WHERE model_id = 'gpt-4o' AND is_active = true LIMIT 1),
 (SELECT jsonb_agg(id) FROM ai_models_unified WHERE model_id IN ('claude-3-opus-20240229', 'grok-vision-beta') AND is_active = true),
 0.80
),
('Cost-Effective Operations', 'cost_optimized', 60, true,
 '{"max_cost_per_request": 0.05, "acceptable_latency": 10000}'::jsonb,
 (SELECT id FROM ai_models_unified WHERE model_id = 'gpt-3.5-turbo' AND is_active = true LIMIT 1),
 (SELECT jsonb_agg(id) FROM ai_models_unified WHERE model_id IN ('claude-3-haiku-20240307') AND is_active = true),
 0.70
);