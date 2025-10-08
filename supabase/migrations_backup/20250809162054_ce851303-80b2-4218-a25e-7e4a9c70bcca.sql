-- Fix reserved keyword usage and (re)apply migration safely with IF NOT EXISTS/IF EXISTS guards

-- 1) Extend ai_providers with api_secret_name reference
ALTER TABLE public.ai_providers
ADD COLUMN IF NOT EXISTS api_secret_name text;

-- 2) ai_configs
CREATE TABLE IF NOT EXISTS public.ai_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  model_id text NOT NULL,
  module text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 50,
  connected boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_configs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_configs' AND policyname = 'Allow all operations on ai_configs'
  ) THEN
    CREATE POLICY "Allow all operations on ai_configs"
    ON public.ai_configs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_configs_module ON public.ai_configs(module);
CREATE INDEX IF NOT EXISTS idx_ai_configs_provider ON public.ai_configs(provider_id);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_configs_updated_at') THEN
    CREATE TRIGGER trg_ai_configs_updated_at
    BEFORE UPDATE ON public.ai_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) module_mappings
CREATE TABLE IF NOT EXISTS public.module_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  provider_id uuid NOT NULL,
  model_id text NOT NULL,
  defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.module_mappings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'module_mappings' AND policyname = 'Allow all operations on module_mappings'
  ) THEN
    CREATE POLICY "Allow all operations on module_mappings"
    ON public.module_mappings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_module_mapping ON public.module_mappings(module);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_module_mappings_updated_at') THEN
    CREATE TRIGGER trg_module_mappings_updated_at
    BEFORE UPDATE ON public.module_mappings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) ai_field_rules
CREATE TABLE IF NOT EXISTS public.ai_field_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  field_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  human_review boolean NOT NULL DEFAULT false,
  confidence_threshold numeric NOT NULL DEFAULT 0.8,
  validation_regex text,
  min_value numeric,
  max_value numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_field_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_field_rules' AND policyname = 'Allow all operations on ai_field_rules'
  ) THEN
    CREATE POLICY "Allow all operations on ai_field_rules"
    ON public.ai_field_rules FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ai_field_rules ON public.ai_field_rules(module, field_name);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_field_rules_updated_at') THEN
    CREATE TRIGGER trg_ai_field_rules_updated_at
    BEFORE UPDATE ON public.ai_field_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) ai_provider_logs
CREATE TABLE IF NOT EXISTS public.ai_provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid,
  status text NOT NULL,
  message text,
  latency_ms integer,
  tested_at timestamptz NOT NULL DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_provider_logs' AND policyname = 'Allow all operations on ai_provider_logs'
  ) THEN
    CREATE POLICY "Allow all operations on ai_provider_logs"
    ON public.ai_provider_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_provider ON public.ai_provider_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_tested_at ON public.ai_provider_logs(tested_at);

-- 6) ai_health
CREATE TABLE IF NOT EXISTS public.ai_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  uptime_24h numeric DEFAULT 1,
  error_rate_1h numeric DEFAULT 0,
  last_checked_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_health' AND policyname = 'Allow all operations on ai_health'
  ) THEN
    CREATE POLICY "Allow all operations on ai_health"
    ON public.ai_health FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ai_health_provider ON public.ai_health(provider_id);

-- 7) ai_usage_metrics (use metric_window instead of reserved keyword)
CREATE TABLE IF NOT EXISTS public.ai_usage_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid,
  model_id text,
  module text,
  requests integer DEFAULT 0,
  success_rate numeric DEFAULT 1,
  avg_latency_ms integer DEFAULT 0,
  cost_usd numeric DEFAULT 0,
  metric_window text NOT NULL DEFAULT '1h',
  collected_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage_metrics' AND policyname = 'Allow all operations on ai_usage_metrics'
  ) THEN
    CREATE POLICY "Allow all operations on ai_usage_metrics"
    ON public.ai_usage_metrics FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_window ON public.ai_usage_metrics(metric_window);
CREATE INDEX IF NOT EXISTS idx_ai_usage_metrics_collected ON public.ai_usage_metrics(collected_at);

-- 8) llm_provider_models
CREATE TABLE IF NOT EXISTS public.llm_provider_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  model_id text NOT NULL,
  model_name text,
  capabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, model_id)
);
ALTER TABLE public.llm_provider_models ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'llm_provider_models' AND policyname = 'Allow all operations on llm_provider_models'
  ) THEN
    CREATE POLICY "Allow all operations on llm_provider_models"
    ON public.llm_provider_models FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_llm_provider_models_provider ON public.llm_provider_models(provider_id);

-- 9) ai_action_logs
CREATE TABLE IF NOT EXISTS public.ai_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  module text,
  user_id uuid,
  trace_id text,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.ai_action_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_action_logs' AND policyname = 'Allow all operations on ai_action_logs'
  ) THEN
    CREATE POLICY "Allow all operations on ai_action_logs"
    ON public.ai_action_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_created_at ON public.ai_action_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_action_logs_action_type ON public.ai_action_logs(action_type);

-- 10) ai_jobs & ai_job_attempts
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 50,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text
);
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_jobs' AND policyname = 'Allow all operations on ai_jobs'
  ) THEN
    CREATE POLICY "Allow all operations on ai_jobs"
    ON public.ai_jobs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON public.ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_type ON public.ai_jobs(job_type);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_jobs_updated_at') THEN
    CREATE TRIGGER trg_ai_jobs_updated_at
    BEFORE UPDATE ON public.ai_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_job_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  attempt_number integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  success boolean DEFAULT false,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public.ai_job_attempts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_job_attempts' AND policyname = 'Allow all operations on ai_job_attempts'
  ) THEN
    CREATE POLICY "Allow all operations on ai_job_attempts"
    ON public.ai_job_attempts FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_ai_job_attempts_job ON public.ai_job_attempts(job_id);
