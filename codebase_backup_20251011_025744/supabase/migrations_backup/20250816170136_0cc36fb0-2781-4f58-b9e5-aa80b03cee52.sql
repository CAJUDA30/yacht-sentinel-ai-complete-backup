-- Phase 1: Critical Security Fixes
-- Fix search path security issues for functions

-- Fix search paths for all existing functions (security issue)
ALTER FUNCTION public.is_superadmin(uuid) SET search_path = 'public';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = 'public';
ALTER FUNCTION public.has_named_role(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.is_superadmin_or_named(uuid) SET search_path = 'public';
ALTER FUNCTION public.log_security_event(text, text, uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.check_user_access(text, uuid) SET search_path = 'public';

-- Update the unified_ai_logs view to include the missing 'provider' column
-- Drop and recreate the view safely
DROP VIEW IF EXISTS public.unified_ai_logs;

CREATE VIEW public.unified_ai_logs AS
SELECT id,
    created_at,
    source,
    status,
    action,
    event_message,
    provider_id,
    model_ref,
    provider_name,
    provider_name as provider, -- Add the missing 'provider' column
    latency_ms,
    department,
    metadata,
    cost_usd,
    tokens_used
FROM ( 
    SELECT l.id,
        l.created_at,
        'model_logs'::text AS source,
        l.status,
        COALESCE(l.request_type, 'model_request'::text) AS action,
        COALESCE(l.error_message, l.response, l.prompt, 'AI Model Log'::text) AS event_message,
        COALESCE((p.id)::text, ''::text) AS provider_id,
        COALESCE(m.model_id, m.model_name, ''::text) AS model_ref,
        COALESCE(p.name, m.provider, 'unknown'::text) AS provider_name,
        l.latency_ms,
        'AI'::text AS department,
        COALESCE(l.metadata, '{}'::jsonb) AS metadata,
        l.cost_usd,
        l.tokens_used
    FROM (((ai_model_logs l
        LEFT JOIN ai_models m ON ((m.id = l.model_id)))
        LEFT JOIN ai_configs c ON ((c.model_id = m.model_id)))
        LEFT JOIN ai_providers p ON ((p.id = c.provider_id)))
    WHERE (l.created_at >= (now() - '30 days'::interval))
    
    UNION ALL
    
    SELECT pl.id,
        pl.created_at,
        'performance_logs'::text AS source,
        CASE WHEN pl.success THEN 'success'::text ELSE 'error'::text END AS status,
        COALESCE(pl.request_type, 'performance'::text) AS action,
        COALESCE(pl.error_message, pl.request_type, 'AI Performance Log'::text) AS event_message,
        ''::text AS provider_id,
        COALESCE(pl.request_type, ''::text) AS model_ref,
        COALESCE(pl.provider_name, 'unknown'::text) AS provider_name,
        pl.execution_time_ms AS latency_ms,
        'AI'::text AS department,
        COALESCE(pl.metadata, '{}'::jsonb) AS metadata,
        pl.cost_usd,
        pl.tokens_used
    FROM ai_performance_logs pl
    WHERE (pl.created_at >= (now() - '30 days'::interval))
    
    UNION ALL
    
    SELECT pr.id,
        pr.created_at,
        'processing_logs'::text AS source,
        CASE WHEN pr.success THEN 'success'::text ELSE 'error'::text END AS status,
        COALESCE(pr.request_type, 'processing'::text) AS action,
        COALESCE(pr.error_message, ((pr.model_name || ' '::text) || pr.request_type), 'AI Processing Log'::text) AS event_message,
        ''::text AS provider_id,
        COALESCE(pr.model_name, ''::text) AS model_ref,
        'processing'::text AS provider_name,
        pr.processing_time_ms AS latency_ms,
        'AI'::text AS department,
        jsonb_strip_nulls(jsonb_build_object('response_data', pr.response_data, 'session_id', pr.session_id)) AS metadata,
        (0)::numeric AS cost_usd,
        0 AS tokens_used
    FROM ai_processing_logs pr
    WHERE (pr.created_at >= (now() - '30 days'::interval))
    
    UNION ALL
    
    SELECT ae.id,
        ae.created_at,
        'analytics_events'::text AS source,
        ae.severity AS status,
        COALESCE(ae.event_type, 'analytics'::text) AS action,
        ae.event_message,
        ''::text AS provider_id,
        COALESCE(ae.event_type, ''::text) AS model_ref,
        'analytics'::text AS provider_name,
        0 AS latency_ms,
        CASE
            WHEN ((COALESCE(ae.module, ''::text) ~~* '%deploy%'::text) OR (COALESCE(ae.module, ''::text) ~~* '%build%'::text)) THEN 'Engineering'::text
            WHEN ((COALESCE(ae.module, ''::text) ~~* '%uptime%'::text) OR (COALESCE(ae.module, ''::text) ~~* '%edge%'::text) OR (COALESCE(ae.module, ''::text) ~~* '%system%'::text)) THEN 'Operations'::text
            WHEN ((COALESCE(ae.module, ''::text) ~~* '%finance%'::text) OR (COALESCE(ae.module, ''::text) ~~* '%billing%'::text)) THEN 'Finance'::text
            WHEN ((COALESCE(ae.module, ''::text) ~~* '%security%'::text) OR (COALESCE(ae.module, ''::text) ~~* '%auth%'::text)) THEN 'Security'::text
            WHEN (COALESCE(ae.module, ''::text) ~~* '%ai%'::text) THEN 'AI'::text
            ELSE 'General'::text
        END AS department,
        COALESCE(ae.metadata, '{}'::jsonb) AS metadata,
        (0)::numeric AS cost_usd,
        0 AS tokens_used
    FROM analytics_events ae
    WHERE (((ae.module ~~* '%ai%'::text) OR (ae.event_type ~~* '%ai%'::text)) AND (ae.created_at >= (now() - '30 days'::interval)))
) unified_data
ORDER BY created_at DESC;