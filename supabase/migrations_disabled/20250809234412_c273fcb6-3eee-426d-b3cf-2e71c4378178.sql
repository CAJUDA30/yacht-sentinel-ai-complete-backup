
-- 1) Create unified_ai_configs table
CREATE TABLE IF NOT EXISTS public.unified_ai_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (deny by default; Edge Function uses service role and bypasses RLS)
ALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY;

-- Keep updated_at fresh on updates
DROP TRIGGER IF EXISTS trg_unified_ai_configs_updated_at ON public.unified_ai_configs;
CREATE TRIGGER trg_unified_ai_configs_updated_at
BEFORE UPDATE ON public.unified_ai_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index for recency queries
CREATE INDEX IF NOT EXISTS unified_ai_configs_updated_at_idx ON public.unified_ai_configs (updated_at DESC);

-- 2) Create unified_ai_logs table
CREATE TABLE IF NOT EXISTS public.unified_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  provider text,
  success boolean NOT NULL DEFAULT false,
  latency_ms integer,
  error_message text,
  cost_estimate_usd numeric DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text
);

-- Enable Row Level Security (deny by default; service role bypasses RLS)
ALTER TABLE public.unified_ai_logs ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for log viewing
CREATE INDEX IF NOT EXISTS unified_ai_logs_created_at_idx ON public.unified_ai_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS unified_ai_logs_action_idx ON public.unified_ai_logs (action);
CREATE INDEX IF NOT EXISTS unified_ai_logs_provider_idx ON public.unified_ai_logs (provider);
