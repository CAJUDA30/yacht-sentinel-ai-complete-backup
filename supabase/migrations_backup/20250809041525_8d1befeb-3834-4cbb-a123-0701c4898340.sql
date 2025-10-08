
-- 1) Vision configuration (non-secret)
CREATE TABLE IF NOT EXISTS public.ai_vision_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'google',
  region text,
  features_enabled jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_preprocessing jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_modules jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_connection_test timestamptz,
  status text NOT NULL DEFAULT 'unknown',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Vision connection logs
CREATE TABLE IF NOT EXISTS public.vision_connection_logs (
  id bigserial PRIMARY KEY,
  config_id uuid REFERENCES public.ai_vision_config(id) ON DELETE SET NULL,
  status text,
  message text,
  error_details jsonb,
  latency_ms integer,
  tested_at timestamptz NOT NULL DEFAULT now()
);

-- 3) SmartScan per-module settings
CREATE TABLE IF NOT EXISTS public.smartscan_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  autofill_enabled boolean NOT NULL DEFAULT true,
  ocr_provider text NOT NULL DEFAULT 'google_vision',
  confidence_threshold numeric NOT NULL DEFAULT 0.7,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Uniqueness for module settings
CREATE UNIQUE INDEX IF NOT EXISTS smartscan_settings_module_key ON public.smartscan_settings (module);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS vision_logs_config_idx ON public.vision_connection_logs (config_id);
CREATE INDEX IF NOT EXISTS vision_logs_tested_at_idx ON public.vision_connection_logs (tested_at DESC);

-- Updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers to maintain updated_at
DROP TRIGGER IF EXISTS set_ai_vision_config_updated_at ON public.ai_vision_config;
CREATE TRIGGER set_ai_vision_config_updated_at
BEFORE UPDATE ON public.ai_vision_config
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_smartscan_settings_updated_at ON public.smartscan_settings;
CREATE TRIGGER set_smartscan_settings_updated_at
BEFORE UPDATE ON public.smartscan_settings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS (align with existing ai_* tables approach)
ALTER TABLE public.ai_vision_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartscan_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_vision_config'
  ) THEN
    CREATE POLICY "Allow all operations on ai_vision_config"
      ON public.ai_vision_config
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'vision_connection_logs'
  ) THEN
    CREATE POLICY "Allow all operations on vision_connection_logs"
      ON public.vision_connection_logs
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'smartscan_settings'
  ) THEN
    CREATE POLICY "Allow all operations on smartscan_settings"
      ON public.smartscan_settings
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
