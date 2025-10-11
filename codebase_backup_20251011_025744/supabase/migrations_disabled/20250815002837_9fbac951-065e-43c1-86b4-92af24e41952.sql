-- Fix the unified_ai_logs view to include action column
-- First drop the existing view if it exists
DROP VIEW IF EXISTS unified_ai_logs;

-- Create a proper unified_ai_logs view that combines different AI log tables
CREATE VIEW unified_ai_logs AS
SELECT 
    id,
    created_at,
    'ai_model_logs' as source,
    status,
    COALESCE(request_type, 'unknown') as action,
    event_message,
    provider_id::text,
    model_id as model_ref,
    'ai_model' as provider_name,
    latency_ms,
    'ai' as department,
    metadata,
    cost_usd,
    tokens_used
FROM (
    SELECT 
        id,
        created_at,
        status,
        request_type,
        COALESCE(prompt, response, error_message, 'AI Model Log') as event_message,
        NULL::uuid as provider_id,
        model_id,
        COALESCE(metadata, '{}'::jsonb) as metadata,
        latency_ms,
        cost_usd,
        tokens_used
    FROM ai_model_logs
    WHERE created_at >= now() - interval '30 days'
    
    UNION ALL
    
    SELECT 
        id,
        created_at,
        CASE 
            WHEN success THEN 'success'
            WHEN error_message IS NOT NULL THEN 'error'
            ELSE 'unknown'
        END as status,
        request_type,
        COALESCE(error_message, user_feedback, 'AI Performance Log') as event_message,
        NULL::uuid as provider_id,
        model_id::text,
        COALESCE(metadata, '{}'::jsonb) as metadata,
        execution_time_ms as latency_ms,
        cost_usd,
        tokens_used
    FROM ai_performance_logs
    WHERE created_at >= now() - interval '30 days'
    
    UNION ALL
    
    SELECT 
        id,
        created_at,
        CASE 
            WHEN success THEN 'success'
            WHEN error_message IS NOT NULL THEN 'error'
            ELSE 'unknown'
        END as status,
        request_type,
        COALESCE(error_message, 'AI Processing Log') as event_message,
        NULL::uuid as provider_id,
        model_name as model_id,
        COALESCE(response_data, '{}'::jsonb) as metadata,
        processing_time_ms as latency_ms,
        0::numeric as cost_usd,
        0 as tokens_used
    FROM ai_processing_logs
    WHERE created_at >= now() - interval '30 days'
) unified_logs

UNION ALL

-- Include analytics events related to AI
SELECT 
    id,
    created_at,
    'analytics' as source,
    severity as status,
    event_type as action,
    event_message,
    NULL::text as provider_id,
    module as model_ref,
    COALESCE(module, 'system') as provider_name,
    0 as latency_ms,
    'system' as department,
    COALESCE(metadata, '{}'::jsonb) as metadata,
    0::numeric as cost_usd,
    0 as tokens_used
FROM analytics_events
WHERE module ILIKE '%ai%' OR event_type ILIKE '%ai%'
AND created_at >= now() - interval '30 days';

-- Create an index on the view for better performance (if needed)
-- Note: PostgreSQL doesn't support indexes on views directly, but the underlying tables should have proper indexes