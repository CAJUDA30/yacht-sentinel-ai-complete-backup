-- Add secret name column for per-model API key resolution
ALTER TABLE public.ai_models
ADD COLUMN IF NOT EXISTS api_secret_name text;

-- Optional: index to look up by provider+model_id for status updates
CREATE INDEX IF NOT EXISTS idx_ai_models_provider_model ON public.ai_models (provider, model_id);
