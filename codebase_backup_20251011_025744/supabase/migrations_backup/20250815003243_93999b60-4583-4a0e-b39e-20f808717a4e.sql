-- Fix the remaining security warnings
-- 1. Fix function search paths that are mutable

-- Update emit_change_event function
CREATE OR REPLACE FUNCTION public.emit_change_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE evt_type TEXT; mod TEXT; BEGIN
  evt_type := COALESCE(TG_ARGV[0], TG_OP);
  mod := TG_TABLE_NAME;
  INSERT INTO public.event_bus(event_type, module, severity, metadata, user_id)
  VALUES (evt_type, mod, 'info', to_jsonb(NEW), NULL);
  RETURN NEW;
END; $function$;

-- Update emit_log_event function
CREATE OR REPLACE FUNCTION public.emit_log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
END; $function$;

-- Update purge_old_logs function
CREATE OR REPLACE FUNCTION public.purge_old_logs(retention_days integer DEFAULT 90)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.ai_model_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_performance_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.ai_processing_logs WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.analytics_events WHERE created_at < now() - make_interval(days => retention_days);
  DELETE FROM public.event_bus WHERE created_at < now() - make_interval(days => retention_days);
END; $function$;