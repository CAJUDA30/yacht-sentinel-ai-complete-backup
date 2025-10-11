-- Recreate event_bus and policies idempotently, and ensure functions are SECURITY INVOKER
CREATE TABLE IF NOT EXISTS public.event_bus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  module TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID
);

ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on event_bus" ON public.event_bus;
CREATE POLICY "Allow all operations on event_bus"
ON public.event_bus
AS PERMISSIVE FOR ALL
TO PUBLIC
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.emit_change_event()
RETURNS trigger AS $$
DECLARE evt_type TEXT; mod TEXT; BEGIN
  evt_type := COALESCE(TG_ARGV[0], TG_OP);
  mod := TG_TABLE_NAME;
  INSERT INTO public.event_bus(event_type, module, severity, metadata, user_id)
  VALUES (evt_type, mod, 'info', to_jsonb(NEW), NULL);
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.emit_log_event()
RETURNS trigger AS $$
DECLARE sev TEXT; mod TEXT; BEGIN
  mod := TG_TABLE_NAME;
  IF mod = 'ai_model_logs' THEN
    sev := CASE WHEN NEW.error_message IS NOT NULL OR NEW.status ILIKE '%error%' THEN 'error' WHEN NEW.status ILIKE '%warn%' THEN 'warn' ELSE 'info' END;
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
    NULL
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.purge_old_logs(retention_days integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_model_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_performance_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_processing_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.analytics_events WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.event_bus WHERE created_at < now() - make_interval(days => retention_days);
END; $$ LANGUAGE plpgsql;