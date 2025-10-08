-- Fix the unified_ai_logs view to include action column with proper type casting
-- First drop the existing view if it exists
DROP VIEW IF EXISTS unified_ai_logs;

-- Create a proper unified_ai_logs view that combines different AI log tables
CREATE VIEW unified_ai_logs AS
SELECT 
    id,
    created_at,
    source,
    status,
    action,
    event_message,
    provider_id,
    model_ref,
    provider_name,
    latency_ms,
    department,
    metadata,
    cost_usd,
    tokens_used
FROM (
    -- AI Model Logs
    SELECT 
        l.id,
        l.created_at,
        'model_logs'::text AS source,
        l.status,
        COALESCE(l.request_type, 'model_request') as action,
        COALESCE(l.error_message, l.response, l.prompt, 'AI Model Log') AS event_message,
        COALESCE((p.id)::text, '') AS provider_id,
        COALESCE(m.model_id, m.model_name, '') AS model_ref,
        COALESCE(p.name, m.provider, 'unknown') AS provider_name,
        l.latency_ms,
        'AI' AS department,
        COALESCE(l.metadata, '{}'::jsonb) AS metadata,
        l.cost_usd,
        l.tokens_used
    FROM ai_model_logs l
    LEFT JOIN ai_models m ON m.id = l.model_id
    LEFT JOIN ai_configs c ON c.model_id = m.model_id
    LEFT JOIN ai_providers p ON p.id = c.provider_id
    WHERE l.created_at >= now() - interval '30 days'
    
    UNION ALL
    
    -- AI Performance Logs  
    SELECT 
        pl.id,
        pl.created_at,
        'performance_logs'::text AS source,
        CASE
            WHEN pl.success THEN 'success'::text
            ELSE 'error'::text
        END AS status,
        COALESCE(pl.request_type, 'performance') as action,
        COALESCE(pl.error_message, pl.request_type, 'AI Performance Log') AS event_message,
        '' AS provider_id,
        COALESCE(pl.request_type, '') AS model_ref,
        COALESCE(pl.provider_name, 'unknown') AS provider_name,
        pl.execution_time_ms AS latency_ms,
        'AI' AS department,
        COALESCE(pl.metadata, '{}'::jsonb) AS metadata,
        pl.cost_usd,
        pl.tokens_used
    FROM ai_performance_logs pl
    WHERE pl.created_at >= now() - interval '30 days'
    
    UNION ALL
    
    -- AI Processing Logs
    SELECT 
        pr.id,
        pr.created_at,
        'processing_logs'::text AS source,
        CASE
            WHEN pr.success THEN 'success'::text
            ELSE 'error'::text
        END AS status,
        COALESCE(pr.request_type, 'processing') as action,
        COALESCE(pr.error_message, pr.model_name || ' ' || pr.request_type, 'AI Processing Log') AS event_message,
        '' AS provider_id,
        COALESCE(pr.model_name, '') AS model_ref,
        'processing' AS provider_name,
        pr.processing_time_ms AS latency_ms,
        'AI' AS department,
        jsonb_strip_nulls(jsonb_build_object('response_data', pr.response_data, 'session_id', pr.session_id)) AS metadata,
        0::numeric AS cost_usd,
        0 AS tokens_used
    FROM ai_processing_logs pr
    WHERE pr.created_at >= now() - interval '30 days'
    
    UNION ALL
    
    -- Analytics Events (AI related)
    SELECT 
        ae.id,
        ae.created_at,
        'analytics_events'::text AS source,
        ae.severity AS status,
        COALESCE(ae.event_type, 'analytics') as action,
        ae.event_message,
        '' AS provider_id,
        COALESCE(ae.event_type, '') AS model_ref,
        'analytics' AS provider_name,
        0 AS latency_ms,
        CASE
            WHEN COALESCE(ae.module, '') ILIKE '%deploy%' OR COALESCE(ae.module, '') ILIKE '%build%' THEN 'Engineering'
            WHEN COALESCE(ae.module, '') ILIKE '%uptime%' OR COALESCE(ae.module, '') ILIKE '%edge%' OR COALESCE(ae.module, '') ILIKE '%system%' THEN 'Operations'
            WHEN COALESCE(ae.module, '') ILIKE '%finance%' OR COALESCE(ae.module, '') ILIKE '%billing%' THEN 'Finance'
            WHEN COALESCE(ae.module, '') ILIKE '%security%' OR COALESCE(ae.module, '') ILIKE '%auth%' THEN 'Security'
            WHEN COALESCE(ae.module, '') ILIKE '%ai%' THEN 'AI'
            ELSE 'General'
        END AS department,
        COALESCE(ae.metadata, '{}'::jsonb) AS metadata,
        0::numeric AS cost_usd,
        0 AS tokens_used
    FROM analytics_events ae
    WHERE (ae.module ILIKE '%ai%' OR ae.event_type ILIKE '%ai%')
    AND ae.created_at >= now() - interval '30 days'
) unified_data
ORDER BY created_at DESC;