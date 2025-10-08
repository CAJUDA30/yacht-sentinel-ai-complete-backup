-- Forcefully reset unified_ai_logs object regardless of its current type (table/view/materialized view)
DO $$ BEGIN
  -- Try dropping as a materialized view
  BEGIN
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS public.unified_ai_logs';
  EXCEPTION WHEN others THEN
    -- ignore
  END;
  -- Try dropping as a table
  BEGIN
    EXECUTE 'DROP TABLE IF EXISTS public.unified_ai_logs';
  EXCEPTION WHEN others THEN
    -- ignore
  END;
  -- Finally, drop as a regular view
  BEGIN
    EXECUTE 'DROP VIEW IF EXISTS public.unified_ai_logs';
  EXCEPTION WHEN others THEN
    -- ignore
  END;
END $$;

-- Recreate as a VIEW
CREATE VIEW public.unified_ai_logs AS
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
  jsonb_strip_nulls(jsonb_build_object('response_data', pr.response_data, 'session_id', pr.session_id)) AS metadata,
  NULL::numeric AS cost_usd,
  NULL::int AS tokens_used
FROM public.ai_processing_logs pr
UNION ALL
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