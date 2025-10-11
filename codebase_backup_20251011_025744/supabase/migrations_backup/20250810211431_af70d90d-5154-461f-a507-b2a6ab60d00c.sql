-- Phase: Create event bus, unified view, triggers, and indexes for logs unification and realtime sync

-- 1) event_bus table as central stream for app-wide events
CREATE TABLE IF NOT EXISTS public.event_bus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  module TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID
);

-- Enable RLS (consistent with existing tables policy style)
ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_bus' AND policyname = 'Allow all operations on event_bus'
  ) THEN
    CREATE POLICY "Allow all operations on event_bus"
    ON public.event_bus
    AS PERMISSIVE FOR ALL
    TO PUBLIC
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 2) Helper function to emit change events (providers/models/configs)
CREATE OR REPLACE FUNCTION public.emit_change_event()
RETURNS trigger AS $$
DECLARE
  evt_type TEXT;
  mod TEXT;
BEGIN
  evt_type := COALESCE(TG_ARGV[0], TG_OP);
  mod := TG_TABLE_NAME;
  INSERT INTO public.event_bus(event_type, module, severity, metadata, user_id)
  VALUES (evt_type, mod, 'info', to_jsonb(NEW), NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Helper function to emit log events (logs tables)
CREATE OR REPLACE FUNCTION public.emit_log_event()
RETURNS trigger AS $$
DECLARE
  sev TEXT;
  mod TEXT;
BEGIN
  mod := TG_TABLE_NAME;
  -- Compute severity heuristically if the table has status/error fields
  IF mod = 'ai_model_logs' THEN
    sev := CASE 
      WHEN NEW.error_message IS NOT NULL OR NEW.status ILIKE '%error%' THEN 'error'
      WHEN NEW.status ILIKE '%warn%' THEN 'warn'
      ELSE 'info' END;
  ELSIF mod = 'ai_performance_logs' THEN
    sev := CASE WHEN NEW.success IS FALSE OR NEW.error_message IS NOT NULL THEN 'error' ELSE 'info' END;
  ELSIF mod = 'ai_processing_logs' THEN
    sev := CASE WHEN NEW.success IS FALSE OR NEW.error_message IS NOT NULL THEN 'error' ELSE 'info' END;
  ELSIF mod = 'analytics_events' THEN
    sev := COALESCE(NEW.severity, 'info');
  ELSE
    sev := 'info';
  END IF;

  INSERT INTO public.event_bus(event_type, module, severity, metadata, user_id)
  VALUES (
    CASE WHEN mod = 'analytics_events' THEN COALESCE(NEW.event_type, TG_OP) ELSE TG_OP END,
    mod,
    sev,
    to_jsonb(NEW),
    COALESCE(NEW.user_id, NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Attach triggers for change events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_providers_emit_change') THEN
    CREATE TRIGGER tr_ai_providers_emit_change
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_providers
    FOR EACH ROW EXECUTE FUNCTION public.emit_change_event();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_models_emit_change') THEN
    CREATE TRIGGER tr_ai_models_emit_change
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_models
    FOR EACH ROW EXECUTE FUNCTION public.emit_change_event();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_configs_emit_change') THEN
    CREATE TRIGGER tr_ai_configs_emit_change
    AFTER INSERT OR UPDATE OR DELETE ON public.ai_configs
    FOR EACH ROW EXECUTE FUNCTION public.emit_change_event();
  END IF;
END $$;

-- 5) Attach triggers for log events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_model_logs_emit') THEN
    CREATE TRIGGER tr_ai_model_logs_emit
    AFTER INSERT ON public.ai_model_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_performance_logs_emit') THEN
    CREATE TRIGGER tr_ai_performance_logs_emit
    AFTER INSERT ON public.ai_performance_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_ai_processing_logs_emit') THEN
    CREATE TRIGGER tr_ai_processing_logs_emit
    AFTER INSERT ON public.ai_processing_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_analytics_events_emit') THEN
    CREATE TRIGGER tr_analytics_events_emit
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;
END $$;

-- 6) Unified view aggregating logs into one schema for the UI
DROP VIEW IF EXISTS public.unified_ai_logs;
CREATE VIEW public.unified_ai_logs AS
-- Model logs
SELECT
  l.id,
  l.created_at,
  'model_logs'::text AS source,
  l.status::text AS status,
  COALESCE(l.error_message, l.response, l.prompt)::text AS event_message,
  p.id::text AS provider_id,
  COALESCE(m.model_id, m.model_name)::text AS model_ref,
  COALESCE(p.name, m.provider)::text AS provider_name,
  l.latency_ms::int AS latency_ms,
  'General'::text AS department,
  l.metadata::jsonb AS metadata,
  l.cost_usd::numeric AS cost_usd,
  l.tokens_used::int AS tokens_used
FROM public.ai_model_logs l
LEFT JOIN public.ai_models m ON m.id = l.model_id
LEFT JOIN public.ai_configs c ON c.model_id = m.model_id
LEFT JOIN public.ai_providers p ON p.id = c.provider_id

UNION ALL
-- Performance logs
SELECT
  pl.id,
  pl.created_at,
  'performance_logs'::text AS source,
  (CASE WHEN pl.success THEN 'success' ELSE 'error' END)::text AS status,
  COALESCE(pl.error_message, pl.request_type)::text AS event_message,
  NULL::text AS provider_id,
  pl.request_type::text AS model_ref,
  pl.provider_name::text AS provider_name,
  pl.execution_time_ms::int AS latency_ms,
  'General'::text AS department,
  pl.metadata::jsonb AS metadata,
  pl.cost_usd::numeric AS cost_usd,
  pl.tokens_used::int AS tokens_used
FROM public.ai_performance_logs pl

UNION ALL
-- Processing logs
SELECT
  pr.id,
  pr.created_at,
  'processing_logs'::text AS source,
  (CASE WHEN pr.success THEN 'success' ELSE 'error' END)::text AS status,
  COALESCE(pr.error_message, (pr.model_name || ' ' || pr.request_type))::text AS event_message,
  NULL::text AS provider_id,
  pr.model_name::text AS model_ref,
  NULL::text AS provider_name,
  pr.processing_time_ms::int AS latency_ms,
  'General'::text AS department,
  jsonb_strip_nulls(jsonb_build_object('response_data', pr.response_data, 'session_id', pr.session_id, 'extra', pr.metadata)) AS metadata,
  NULL::numeric AS cost_usd,
  NULL::int AS tokens_used
FROM public.ai_processing_logs pr

UNION ALL
-- Analytics events (auto-department tagging based on module)
SELECT
  ae.id,
  ae.created_at,
  'analytics_events'::text AS source,
  ae.severity::text AS status,
  ae.event_message::text AS event_message,
  NULL::text AS provider_id,
  ae.event_type::text AS model_ref,
  NULL::text AS provider_name,
  NULL::int AS latency_ms,
  (
    CASE
      WHEN COALESCE(ae.module,'') ILIKE '%deploy%' OR COALESCE(ae.module,'') ILIKE '%build%' THEN 'Engineering'
      WHEN COALESCE(ae.module,'') ILIKE '%uptime%' OR COALESCE(ae.module,'') ILIKE '%edge%' OR COALESCE(ae.module,'') ILIKE '%system%' THEN 'Operations'
      WHEN COALESCE(ae.module,'') ILIKE '%finance%' OR COALESCE(ae.module,'') ILIKE '%billing%' THEN 'Finance'
      WHEN COALESCE(ae.module,'') ILIKE '%security%' OR COALESCE(ae.module,'') ILIKE '%auth%' THEN 'Security'
      WHEN COALESCE(ae.module,'') ILIKE '%marketing%' OR COALESCE(ae.module,'') ILIKE '%campaign%' THEN 'Marketing'
      WHEN COALESCE(ae.module,'') ILIKE '%hr%' OR COALESCE(ae.module,'') ILIKE '%onboarding%' THEN 'HR'
      WHEN COALESCE(ae.module,'') ILIKE '%sales%' OR COALESCE(ae.module,'') ILIKE '%crm%' THEN 'Sales'
      WHEN COALESCE(ae.module,'') ILIKE '%compliance%' OR COALESCE(ae.module,'') ILIKE '%audit%' THEN 'Compliance'
      ELSE 'General'
    END
  )::text AS department,
  ae.metadata::jsonb AS metadata,
  NULL::numeric AS cost_usd,
  NULL::int AS tokens_used
FROM public.analytics_events ae;

-- 7) Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_bus_created_at ON public.event_bus USING BTREE (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_bus_severity ON public.event_bus USING BTREE (severity);
CREATE INDEX IF NOT EXISTS idx_event_bus_module ON public.event_bus USING BTREE (module);

CREATE INDEX IF NOT EXISTS idx_ai_model_logs_created_at ON public.ai_model_logs USING BTREE (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_logs_status ON public.ai_model_logs USING BTREE (status);

CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_created_at ON public.ai_performance_logs USING BTREE (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_success ON public.ai_performance_logs USING BTREE (success);

CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON public.ai_processing_logs USING BTREE (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_success ON public.ai_processing_logs USING BTREE (success);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events USING BTREE (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_severity ON public.analytics_events USING BTREE (severity);
CREATE INDEX IF NOT EXISTS idx_analytics_events_module ON public.analytics_events USING BTREE (module);
CREATE INDEX IF NOT EXISTS idx_analytics_events_metadata_gin ON public.analytics_events USING GIN (metadata);

-- 8) Retention helper (manual invocation for now; can be scheduled later)
CREATE OR REPLACE FUNCTION public.purge_old_logs(retention_days integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_model_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_performance_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_processing_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.analytics_events WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.event_bus WHERE created_at < now() - make_interval(days => retention_days);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
