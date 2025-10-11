-- Add missing columns to ai_providers_unified table to match expected schema

-- Add auth_method column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'api_key';

-- Add provider_type column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'openai';

-- Add priority column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Add is_primary column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add rate_limit_per_minute column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 60;

-- Add supported_languages column (array of text)
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[];

-- Add last_health_check column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;

-- Add health_status column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown';

-- Add error_count column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

-- Add success_rate column
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 100.00;

-- Update existing providers with correct provider_type based on name
UPDATE public.ai_providers_unified 
SET provider_type = CASE 
  WHEN name ILIKE '%openai%' THEN 'openai'
  WHEN name ILIKE '%gemini%' OR name ILIKE '%google%' THEN 'google'
  WHEN name ILIKE '%deepseek%' THEN 'deepseek'
  WHEN name ILIKE '%anthropic%' OR name ILIKE '%claude%' THEN 'anthropic'
  ELSE 'custom'
END
WHERE provider_type IS NULL OR provider_type = 'openai';

-- Update existing providers with auth_method based on auth_type
UPDATE public.ai_providers_unified 
SET auth_method = COALESCE(auth_type, 'api_key')
WHERE auth_method IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_primary ON public.ai_providers_unified(is_primary);
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_priority ON public.ai_providers_unified(priority);
CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_health_status ON public.ai_providers_unified(health_status);

-- Add comment explaining the schema
COMMENT ON TABLE public.ai_providers_unified IS 'Unified AI provider configuration table with complete schema including auth_method, provider_type, priority, and health monitoring fields';
