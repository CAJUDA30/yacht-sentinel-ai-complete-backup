
-- 1) Enable real-time event emission from core log tables via emit_log_event()
DO $$
BEGIN
  -- analytics_events -> event_bus
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_log_event_on_analytics_events') THEN
      EXECUTE 'CREATE TRIGGER trg_emit_log_event_on_analytics_events
               AFTER INSERT ON public.analytics_events
               FOR EACH ROW EXECUTE FUNCTION public.emit_log_event()';
    END IF;
  END IF;

  -- ai_model_logs -> event_bus
  IF to_regclass('public.ai_model_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_log_event_on_ai_model_logs') THEN
      EXECUTE 'CREATE TRIGGER trg_emit_log_event_on_ai_model_logs
               AFTER INSERT ON public.ai_model_logs
               FOR EACH ROW EXECUTE FUNCTION public.emit_log_event()';
    END IF;
  END IF;

  -- ai_performance_logs -> event_bus
  IF to_regclass('public.ai_performance_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_log_event_on_ai_performance_logs') THEN
      EXECUTE 'CREATE TRIGGER trg_emit_log_event_on_ai_performance_logs
               AFTER INSERT ON public.ai_performance_logs
               FOR EACH ROW EXECUTE FUNCTION public.emit_log_event()';
    END IF;
  END IF;

  -- ai_processing_logs -> event_bus
  IF to_regclass('public.ai_processing_logs') IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_emit_log_event_on_ai_processing_logs') THEN
      EXECUTE 'CREATE TRIGGER trg_emit_log_event_on_ai_processing_logs
               AFTER INSERT ON public.ai_processing_logs
               FOR EACH ROW EXECUTE FUNCTION public.emit_log_event()';
    END IF;
  END IF;
END $$;

-- 2) Add helpful indexes for fast log queries
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_analytics_events_severity ON public.analytics_events (severity)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_analytics_events_module ON public.analytics_events (module)';
  END IF;

  IF to_regclass('public.event_bus') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_bus_created_at ON public.event_bus (created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_bus_severity ON public.event_bus (severity)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_event_bus_module ON public.event_bus (module)';
  END IF;
END $$;

-- 3) RLS: allow superadmins to read all; allow authenticated users to read non-critical severities
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'analytics_events' AND policyname = 'analytics_events_read_superadmin'
    ) THEN
      EXECUTE $$CREATE POLICY analytics_events_read_superadmin
               ON public.analytics_events FOR SELECT
               USING (public.is_superadmin_or_named(auth.uid()))$$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'analytics_events' AND policyname = 'analytics_events_read_general'
    ) THEN
      EXECUTE $$CREATE POLICY analytics_events_read_general
               ON public.analytics_events FOR SELECT
               USING (coalesce(severity,'info') IN ('debug','info','warn'))$$;
    END IF;
  END IF;

  IF to_regclass('public.event_bus') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'event_bus' AND policyname = 'event_bus_read_superadmin'
    ) THEN
      EXECUTE $$CREATE POLICY event_bus_read_superadmin
               ON public.event_bus FOR SELECT
               USING (public.is_superadmin_or_named(auth.uid()))$$;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = 'event_bus' AND policyname = 'event_bus_read_general'
    ) THEN
      EXECUTE $$CREATE POLICY event_bus_read_general
               ON public.event_bus FOR SELECT
               USING (coalesce(severity,'info') IN ('debug','info','warn'))$$;
    END IF;
  END IF;
END $$;

-- 4) Backfill: copy recent AI logs into analytics_events so dashboards are not empty
--    We keep this simple and safe, without deep column assumptions.
DO $$
BEGIN
  IF to_regclass('public.analytics_events') IS NOT NULL AND to_regclass('public.ai_performance_logs') IS NOT NULL THEN
    INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, created_at)
    SELECT
      'backfill_ai_performance',
      'Backfilled from ai_performance_logs',
      'ai_performance_logs',
      'info',
      to_jsonb(t),
      COALESCE(t.created_at, now())
    FROM public.ai_performance_logs t
    WHERE t.created_at > now() - interval '14 days';
  END IF;

  IF to_regclass('public.analytics_events') IS NOT NULL AND to_regclass('public.ai_model_logs') IS NOT NULL THEN
    INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, created_at)
    SELECT
      'backfill_ai_model',
      'Backfilled from ai_model_logs',
      'ai_model_logs',
      'info',
      to_jsonb(t),
      COALESCE(t.created_at, now())
    FROM public.ai_model_logs t
    WHERE t.created_at > now() - interval '14 days';
  END IF;

  IF to_regclass('public.analytics_events') IS NOT NULL AND to_regclass('public.ai_processing_logs') IS NOT NULL THEN
    INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, created_at)
    SELECT
      'backfill_ai_processing',
      'Backfilled from ai_processing_logs',
      'ai_processing_logs',
      'info',
      to_jsonb(t),
      COALESCE(t.created_at, now())
    FROM public.ai_processing_logs t
    WHERE t.created_at > now() - interval '14 days';
  END IF;
END $$;
