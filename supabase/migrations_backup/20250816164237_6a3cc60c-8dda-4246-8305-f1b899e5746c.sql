-- 1) Create triggers to emit event_bus entries for key log tables
DO $$ BEGIN
  -- analytics_events -> event_bus
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_analytics_events_emit_log'
  ) THEN
    CREATE TRIGGER trg_analytics_events_emit_log
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;

  -- ai_model_logs -> event_bus
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_model_logs_emit_log'
  ) THEN
    CREATE TRIGGER trg_ai_model_logs_emit_log
    AFTER INSERT ON public.ai_model_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;

  -- ai_performance_logs -> event_bus
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_performance_logs_emit_log'
  ) THEN
    CREATE TRIGGER trg_ai_performance_logs_emit_log
    AFTER INSERT ON public.ai_performance_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;

  -- ai_processing_logs -> event_bus
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ai_processing_logs_emit_log'
  ) THEN
    CREATE TRIGGER trg_ai_processing_logs_emit_log
    AFTER INSERT ON public.ai_processing_logs
    FOR EACH ROW EXECUTE FUNCTION public.emit_log_event();
  END IF;
END $$;

-- 2) Helpful indexes for fast monitoring queries
-- analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_severity_created ON public.analytics_events (severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_module_created ON public.analytics_events (module, created_at DESC);

-- ai_model_logs
CREATE INDEX IF NOT EXISTS idx_ai_model_logs_created_at ON public.ai_model_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_logs_status ON public.ai_model_logs (status);
CREATE INDEX IF NOT EXISTS idx_ai_model_logs_model_created ON public.ai_model_logs (model_id, created_at DESC);

-- ai_performance_logs
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_created_at ON public.ai_performance_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_success ON public.ai_performance_logs (success);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_model_created ON public.ai_performance_logs (model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_request_type ON public.ai_performance_logs (request_type);

-- ai_processing_logs
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_created_at ON public.ai_processing_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_success ON public.ai_processing_logs (success);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_request_type ON public.ai_processing_logs (request_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_model_name ON public.ai_processing_logs (model_name);
CREATE INDEX IF NOT EXISTS idx_ai_processing_logs_session_id ON public.ai_processing_logs (session_id);

-- event_bus (if present)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='event_bus') THEN
    CREATE INDEX IF NOT EXISTS idx_event_bus_created_at ON public.event_bus (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_event_bus_module_created ON public.event_bus (module, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_event_bus_event_type_created ON public.event_bus (event_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_event_bus_severity_created ON public.event_bus (severity, created_at DESC);
  END IF;
END $$;

-- 3) Backfill last 14 days into analytics_events for visibility
-- Map key AI logs into analytics_events with source metadata

-- ai_model_logs -> analytics_events
INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, user_id)
SELECT 
  'ai_model_log' AS event_type,
  COALESCE(NULLIF(aml.error_message, ''), aml.status) AS event_message,
  'ai' AS module,
  CASE 
    WHEN aml.error_message IS NOT NULL OR aml.status ILIKE '%error%' THEN 'error'
    WHEN aml.status ILIKE '%warn%' THEN 'warn'
    ELSE 'info'
  END AS severity,
  jsonb_build_object(
    'source_table','ai_model_logs',
    'source_id', aml.id,
    'model_id', aml.model_id,
    'latency_ms', aml.latency_ms,
    'tokens_used', aml.tokens_used,
    'cost_usd', aml.cost_usd,
    'request_type', aml.request_type,
    'prompt', aml.prompt,
    'response', aml.response
  ),
  NULL
FROM public.ai_model_logs aml
WHERE aml.created_at >= now() - interval '14 days'
ON CONFLICT DO NOTHING;

-- ai_performance_logs -> analytics_events
INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, user_id)
SELECT 
  'ai_performance' AS event_type,
  COALESCE(apl.error_message, 'performance_log') AS event_message,
  'ai' AS module,
  CASE WHEN apl.success IS FALSE OR apl.error_message IS NOT NULL THEN 'error' ELSE 'info' END AS severity,
  jsonb_build_object(
    'source_table','ai_performance_logs',
    'source_id', apl.id,
    'model_id', apl.model_id,
    'execution_time_ms', apl.execution_time_ms,
    'tokens_used', apl.tokens_used,
    'cost_usd', apl.cost_usd,
    'request_type', apl.request_type,
    'confidence_score', apl.confidence_score,
    'user_feedback', apl.user_feedback
  ),
  NULL
FROM public.ai_performance_logs apl
WHERE apl.created_at >= now() - interval '14 days'
ON CONFLICT DO NOTHING;

-- ai_processing_logs -> analytics_events
INSERT INTO public.analytics_events (event_type, event_message, module, severity, metadata, user_id)
SELECT 
  'ai_processing' AS event_type,
  COALESCE(apl.error_message, 'processing_log') AS event_message,
  'ai' AS module,
  CASE WHEN apl.success IS FALSE OR apl.error_message IS NOT NULL THEN 'error' ELSE 'info' END AS severity,
  jsonb_build_object(
    'source_table','ai_processing_logs',
    'source_id', apl.id,
    'model_name', apl.model_name,
    'processing_time_ms', apl.processing_time_ms,
    'request_type', apl.request_type,
    'session_id', apl.session_id,
    'confidence', apl.confidence,
    'response_data', apl.response_data
  ),
  NULL
FROM public.ai_processing_logs apl
WHERE apl.created_at >= now() - interval '14 days'
ON CONFLICT DO NOTHING;