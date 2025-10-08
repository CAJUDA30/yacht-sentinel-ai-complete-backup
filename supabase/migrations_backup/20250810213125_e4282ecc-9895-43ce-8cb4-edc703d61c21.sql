-- Add explicit search_path for functions to satisfy linter 0011
CREATE OR REPLACE FUNCTION public.emit_change_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE evt_type TEXT; mod TEXT; BEGIN
  evt_type := COALESCE(TG_ARGV[0], TG_OP);
  mod := TG_TABLE_NAME;
  INSERT INTO public.event_bus(event_type, module, severity, metadata, user_id)
  VALUES (evt_type, mod, 'info', to_jsonb(NEW), NULL);
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.emit_log_event()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.purge_old_logs(retention_days integer DEFAULT 90)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.ai_model_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_performance_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_processing_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.analytics_events WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.event_bus WHERE created_at < now() - make_interval(days => retention_days);
END; $$;