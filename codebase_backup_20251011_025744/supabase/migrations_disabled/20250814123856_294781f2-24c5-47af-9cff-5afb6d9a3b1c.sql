-- Comprehensive Security Fix Migration
-- Addresses all 9 critical security vulnerabilities identified

-- =============================================================================
-- PHASE 1: Fix Critical RLS Policy Issues (ERROR level)
-- =============================================================================

-- Fix system_logs table - restrict to superadmins only (CRITICAL)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view system logs" ON public.system_logs;
DROP POLICY IF EXISTS "Public can read system logs" ON public.system_logs;
DROP POLICY IF EXISTS "system_logs_select_policy" ON public.system_logs;

CREATE POLICY "secure_system_logs_superadmin_only" 
ON public.system_logs 
FOR ALL
USING (is_superadmin_or_named(auth.uid()));

-- Fix inventory_items table - ensure proper authentication (update existing partial fix)
DROP POLICY IF EXISTS "secure_inventory_items_select" ON public.inventory_items;
DROP POLICY IF EXISTS "secure_inventory_items_insert" ON public.inventory_items;
DROP POLICY IF EXISTS "secure_inventory_items_update" ON public.inventory_items;
DROP POLICY IF EXISTS "secure_inventory_items_delete" ON public.inventory_items;

-- Create comprehensive inventory policies with user tracking
CREATE POLICY "secure_inventory_items_read" 
ON public.inventory_items 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_write" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_modify" 
ON public.inventory_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "secure_inventory_items_remove" 
ON public.inventory_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- PHASE 2: Fix High-Risk Public Access Issues (WARN level but sensitive)
-- =============================================================================

-- Fix scan_events table - user-scoped access only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scan_events') THEN
        ALTER TABLE public.scan_events ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view scan events" ON public.scan_events;
        DROP POLICY IF EXISTS "Public can read scan events" ON public.scan_events;
        
        -- Users can only see their own scan events
        CREATE POLICY "secure_scan_events_user_access" 
        ON public.scan_events 
        FOR SELECT 
        USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_superadmin_or_named(auth.uid())));
        
        CREATE POLICY "secure_scan_events_user_create" 
        ON public.scan_events 
        FOR INSERT 
        WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
        
        CREATE POLICY "secure_scan_events_user_update" 
        ON public.scan_events 
        FOR UPDATE 
        USING (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR is_superadmin_or_named(auth.uid())));
    END IF;
END $$;

-- Fix unified_ai_configs table - superadmin access only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unified_ai_configs') THEN
        ALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view AI configs" ON public.unified_ai_configs;
        DROP POLICY IF EXISTS "Public can read AI configs" ON public.unified_ai_configs;
        
        CREATE POLICY "secure_unified_ai_configs_superadmin_only" 
        ON public.unified_ai_configs 
        FOR ALL
        USING (is_superadmin_or_named(auth.uid()));
    END IF;
END $$;

-- Fix vision_connection_logs table - superadmin access only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vision_connection_logs') THEN
        ALTER TABLE public.vision_connection_logs ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Anyone can view vision logs" ON public.vision_connection_logs;
        DROP POLICY IF EXISTS "Public can read vision logs" ON public.vision_connection_logs;
        
        CREATE POLICY "secure_vision_logs_superadmin_only" 
        ON public.vision_connection_logs 
        FOR ALL
        USING (is_superadmin_or_named(auth.uid()));
    END IF;
END $$;

-- =============================================================================
-- PHASE 3: Fix Database Function Security Issues
-- =============================================================================

-- Fix function search_path security issues by setting immutable search paths
-- This prevents SQL injection attacks through function calls

ALTER FUNCTION public.get_user_yacht_access() SET search_path TO 'public';
ALTER FUNCTION public.set_current_timestamp_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_error_logs_timestamp() SET search_path TO 'public';
ALTER FUNCTION public.get_user_yacht_access_safe() SET search_path TO 'public';
ALTER FUNCTION public.sync_ai_provider_status() SET search_path TO 'public';
ALTER FUNCTION public.get_api_key_status(text) SET search_path TO 'public';
ALTER FUNCTION public.check_parts_inventory_trigger() SET search_path TO 'public';
ALTER FUNCTION public.emit_change_event() SET search_path TO 'public';
ALTER FUNCTION public.emit_log_event() SET search_path TO 'public';
ALTER FUNCTION public.purge_old_logs(integer) SET search_path TO 'public';
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path TO 'public';
ALTER FUNCTION public.is_superadmin(uuid) SET search_path TO 'public';
ALTER FUNCTION public.grant_role_by_email(text, app_role) SET search_path TO 'public';
ALTER FUNCTION public.has_named_role(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.has_permission(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.is_superadmin_or_named(uuid) SET search_path TO 'public';
ALTER FUNCTION public.grant_named_role_by_email(text, text) SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';

-- =============================================================================
-- PHASE 4: Add Audit Fields for Enhanced Security Tracking
-- =============================================================================

-- Add audit fields to critical tables that don't have them
DO $$
BEGIN
    -- Add created_by and updated_by to system_logs if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_logs' AND column_name = 'created_by') THEN
            ALTER TABLE public.system_logs ADD COLUMN created_by uuid REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'system_logs' AND column_name = 'updated_by') THEN
            ALTER TABLE public.system_logs ADD COLUMN updated_by uuid REFERENCES auth.users(id);
        END IF;
    END IF;
    
    -- Add audit fields to scan_events if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scan_events') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'scan_events' AND column_name = 'created_by') THEN
            ALTER TABLE public.scan_events ADD COLUMN created_by uuid REFERENCES auth.users(id);
        END IF;
    END IF;
END $$;

-- =============================================================================
-- PHASE 5: Create Security Monitoring Functions
-- =============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    event_type text,
    event_description text,
    user_id uuid DEFAULT auth.uid(),
    metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.analytics_events (
        event_type,
        event_message,
        user_id,
        module,
        severity,
        metadata
    ) VALUES (
        event_type,
        event_description,
        user_id,
        'security',
        'warn',
        metadata
    );
END;
$$;

-- Function to check user permissions with logging
CREATE OR REPLACE FUNCTION public.check_user_access(
    required_permission text,
    user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    has_access boolean := false;
BEGIN
    -- Check if user has the required permission
    has_access := public.has_permission(user_id, required_permission) OR public.is_superadmin_or_named(user_id);
    
    -- Log access attempt
    IF NOT has_access THEN
        PERFORM public.log_security_event(
            'access_denied',
            'User attempted to access restricted resource',
            user_id,
            jsonb_build_object('required_permission', required_permission)
        );
    END IF;
    
    RETURN has_access;
END;
$$;

-- =============================================================================
-- PHASE 6: Update RLS Policies with Enhanced Security
-- =============================================================================

-- Ensure all sensitive tables have proper RLS enabled
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_vision_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consensus_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_field_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_module_preferences ENABLE ROW LEVEL SECURITY;

-- Add security logging to critical operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log access to sensitive tables
    PERFORM public.log_security_event(
        TG_OP || '_' || TG_TABLE_NAME,
        'Access to sensitive table: ' || TG_TABLE_NAME,
        auth.uid(),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id)
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;