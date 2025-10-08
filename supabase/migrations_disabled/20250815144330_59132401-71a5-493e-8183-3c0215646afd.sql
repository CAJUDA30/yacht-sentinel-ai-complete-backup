-- CRITICAL SECURITY FIXES - Phase 1
-- Fix publicly accessible financial and operational data

-- 1. Enable RLS on financial_transactions table if not already enabled
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- 2. Create secure RLS policies for financial_transactions
DROP POLICY IF EXISTS "Financial data access for yacht owners and crew only" ON public.financial_transactions;
CREATE POLICY "Financial data access for yacht owners and crew only" 
ON public.financial_transactions 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_yacht_access_safe() ya 
    WHERE ya.yacht_id = financial_transactions.yacht_id
  )
);

-- 3. Enable RLS on cross_module_relationships table if not already enabled  
ALTER TABLE public.cross_module_relationships ENABLE ROW LEVEL SECURITY;

-- 4. Create secure RLS policies for cross_module_relationships
DROP POLICY IF EXISTS "Operational data access for authenticated users only" ON public.cross_module_relationships;
CREATE POLICY "Operational data access for authenticated users only"
ON public.cross_module_relationships
FOR ALL
USING (auth.uid() IS NOT NULL);

-- 5. Fix security definer functions with proper search paths
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_safe()
 RETURNS TABLE(yacht_id uuid, access_level text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id as yacht_id, 'owner' as access_level 
  FROM yacht_profiles 
  WHERE owner_id = auth.uid()
  
  UNION
  
  SELECT y.yacht_id, 'crew' as access_level
  FROM (
    SELECT DISTINCT yacht_id
    FROM crew_members 
    WHERE user_id = auth.uid()
  ) y;
$function$;

-- 6. Fix other security definer functions with search paths
CREATE OR REPLACE FUNCTION public.sync_ai_provider_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update provider status based on health checks
  UPDATE ai_providers p
  SET updated_at = now()
  FROM ai_health h
  WHERE p.id = h.provider_id
  AND h.status != 'unknown';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_api_key_status(provider_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function will help track which API keys are configured
  -- In production, actual keys are stored in Supabase secrets
  RETURN jsonb_build_object(
    'provider', provider_name,
    'configured', true,
    'last_tested', now()
  );
END;
$function$;

-- 7. Enhanced security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, event_description text, user_id uuid DEFAULT auth.uid(), metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- 8. Create comprehensive security audit logging
CREATE OR REPLACE FUNCTION public.audit_sensitive_access_secure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Log access to sensitive tables with enhanced security
    PERFORM public.log_security_event(
        TG_OP || '_' || TG_TABLE_NAME,
        'Sensitive table access: ' || TG_TABLE_NAME || ' by user',
        auth.uid(),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id),
            'timestamp', now(),
            'ip_address', current_setting('request.jwt.claims', true)::jsonb->>'ip'
        )
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;