-- FINAL SECURITY HARDENING: Fix Last 2 ERROR-level Vulnerabilities
-- 1. Security Audit Logs Could Help Attackers Plan Attacks
-- 2. Product Database Could Be Scraped by Competitors

-- Fix security_audit_logs table - should be superadmin only
DROP POLICY IF EXISTS "secure_audit_logs_read" ON public.security_audit_logs;
DROP POLICY IF EXISTS "secure_audit_logs_write" ON public.security_audit_logs;
DROP POLICY IF EXISTS "secure_audit_logs_modify" ON public.security_audit_logs;
DROP POLICY IF EXISTS "secure_audit_logs_delete" ON public.security_audit_logs;

-- Create stricter superadmin-only policies for security_audit_logs
CREATE POLICY "security_audit_logs_superadmin_only_read"
ON public.security_audit_logs
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

CREATE POLICY "security_audit_logs_system_write"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true); -- System can write audit logs but users cannot read them

CREATE POLICY "security_audit_logs_superadmin_only_modify"
ON public.security_audit_logs
FOR UPDATE
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

CREATE POLICY "security_audit_logs_superadmin_only_delete"
ON public.security_audit_logs
FOR DELETE
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

-- Fix master_products table - currently has public access (using condition: true)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'master_products') THEN
        -- Enable RLS on master_products
        ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
        
        -- Drop any permissive policies
        DROP POLICY IF EXISTS "Allow all operations on master_products" ON public.master_products;
        DROP POLICY IF EXISTS "Public can read master_products" ON public.master_products;
        DROP POLICY IF EXISTS "Anyone can view master products" ON public.master_products;
        DROP POLICY IF EXISTS "Master products are viewable by everyone" ON public.master_products;
        
        -- Create secure authentication-required policies
        CREATE POLICY "secure_master_products_read"
        ON public.master_products
        FOR SELECT
        USING (auth.uid() IS NOT NULL); -- Require authentication
        
        CREATE POLICY "secure_master_products_write"
        ON public.master_products
        FOR INSERT
        WITH CHECK (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
        
        CREATE POLICY "secure_master_products_modify"
        ON public.master_products
        FOR UPDATE
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
        
        CREATE POLICY "secure_master_products_delete"
        ON public.master_products
        FOR DELETE
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
    END IF;
END $$;

-- Additional security hardening for remaining AI logs
-- Fix ai_action_logs to be more restrictive
DROP POLICY IF EXISTS "secure_ai_action_logs_read" ON public.ai_action_logs;

CREATE POLICY "secure_ai_action_logs_read"
ON public.ai_action_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    is_superadmin_or_named(auth.uid())
  )
);

-- Fix other AI-related logs to be user-specific or superadmin-only
DO $$
BEGIN
    -- Fix ai_model_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_model_logs') THEN
        DROP POLICY IF EXISTS "Authenticated users can view AI model logs" ON public.ai_model_logs;
        DROP POLICY IF EXISTS "Authenticated users view AI model logs" ON public.ai_model_logs;
        DROP POLICY IF EXISTS "secure_ai_model_logs_read" ON public.ai_model_logs;
        
        CREATE POLICY "secure_ai_model_logs_superadmin_read"
        ON public.ai_model_logs
        FOR SELECT
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
    END IF;
    
    -- Fix ai_processing_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_processing_logs') THEN
        DROP POLICY IF EXISTS "Authenticated users can view AI processing logs" ON public.ai_processing_logs;
        DROP POLICY IF EXISTS "Authenticated users view AI processing logs" ON public.ai_processing_logs;
        DROP POLICY IF EXISTS "secure_ai_processing_logs_read" ON public.ai_processing_logs;
        
        CREATE POLICY "secure_ai_processing_logs_superadmin_read"
        ON public.ai_processing_logs
        FOR SELECT
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
    END IF;
    
    -- Fix ai_performance_logs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_performance_logs') THEN
        DROP POLICY IF EXISTS "Authenticated users can view AI performance logs" ON public.ai_performance_logs;
        DROP POLICY IF EXISTS "Authenticated users view AI performance logs" ON public.ai_performance_logs;
        DROP POLICY IF EXISTS "secure_ai_perf_logs_read" ON public.ai_performance_logs;
        
        CREATE POLICY "secure_ai_performance_logs_superadmin_read"
        ON public.ai_performance_logs
        FOR SELECT
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
    END IF;
END $$;