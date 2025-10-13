-- Create unified_ai_configs table for Google Cloud Document AI configuration
CREATE TABLE IF NOT EXISTS public.unified_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (security-sensitive configuration)
CREATE POLICY "Service role full access" ON public.unified_ai_configs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_unified_ai_configs_updated_at 
  ON public.unified_ai_configs(updated_at DESC);

-- Add comment
COMMENT ON TABLE public.unified_ai_configs IS 'Stores unified AI configuration including Google Cloud Document AI settings. Service-role only access for security.';
