-- CRITICAL SECURITY FIX: Eliminate Remaining ERROR-level Vulnerabilities
-- Fix all publicly readable sensitive tables immediately

-- Fix system_logs table (missing from previous migration)
DO $$
BEGIN
    -- Check if system_logs table exists and fix it
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_logs') THEN
        -- Enable RLS if not already enabled
        ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
        
        -- Drop any permissive policies
        DROP POLICY IF EXISTS "Allow all operations on system_logs" ON public.system_logs;
        DROP POLICY IF EXISTS "Public can read system_logs" ON public.system_logs;
        DROP POLICY IF EXISTS "Authenticated users can view system logs" ON public.system_logs;
        DROP POLICY IF EXISTS "Authenticated users view system logs" ON public.system_logs;
        DROP POLICY IF EXISTS "System can create system logs" ON public.system_logs;
        DROP POLICY IF EXISTS "System creates system logs" ON public.system_logs;
        DROP POLICY IF EXISTS "secure_system_logs_read" ON public.system_logs;
        DROP POLICY IF EXISTS "secure_system_logs_write" ON public.system_logs;
        
        -- Create secure superadmin-only policies
        CREATE POLICY "secure_system_logs_superadmin_read"
        ON public.system_logs
        FOR SELECT
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
        
        CREATE POLICY "secure_system_logs_superadmin_write"
        ON public.system_logs
        FOR INSERT
        WITH CHECK (true); -- Allow system to write logs
        
        CREATE POLICY "secure_system_logs_superadmin_modify"
        ON public.system_logs
        FOR UPDATE
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
        
        CREATE POLICY "secure_system_logs_superadmin_delete"
        ON public.system_logs
        FOR DELETE
        USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));
    END IF;
END $$;

-- Fix ai_conversations table - ensure it's properly secured
DROP POLICY IF EXISTS "secure_ai_conversations_read" ON public.ai_conversations;
DROP POLICY IF EXISTS "secure_ai_conversations_write" ON public.ai_conversations;
DROP POLICY IF EXISTS "secure_ai_conversations_modify" ON public.ai_conversations;

-- Recreate ai_conversations policies with explicit authentication checks
CREATE POLICY "secure_ai_conversations_read"
ON public.ai_conversations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()))
);

CREATE POLICY "secure_ai_conversations_write"
ON public.ai_conversations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  user_id = auth.uid()
);

CREATE POLICY "secure_ai_conversations_modify"
ON public.ai_conversations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()))
);

CREATE POLICY "secure_ai_conversations_delete"
ON public.ai_conversations
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  (user_id = auth.uid() OR is_superadmin_or_named(auth.uid()))
);

-- Fix crew_members policies to be more explicit
DROP POLICY IF EXISTS "secure_crew_members_read" ON public.crew_members;
DROP POLICY IF EXISTS "secure_crew_members_write" ON public.crew_members;
DROP POLICY IF EXISTS "secure_crew_members_modify" ON public.crew_members;
DROP POLICY IF EXISTS "secure_crew_members_remove" ON public.crew_members;

CREATE POLICY "secure_crew_members_read"
ON public.crew_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe()) OR
    user_id = auth.uid() OR
    is_superadmin_or_named(auth.uid())
  )
);

CREATE POLICY "secure_crew_members_write"
ON public.crew_members
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

CREATE POLICY "secure_crew_members_modify"
ON public.crew_members
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner') OR
    (user_id = auth.uid() AND position IN ('captain', 'first_officer'))
  )
);

CREATE POLICY "secure_crew_members_delete"
ON public.crew_members
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Fix financial_transactions policies to be more explicit
DROP POLICY IF EXISTS "secure_financial_read" ON public.financial_transactions;
DROP POLICY IF EXISTS "secure_financial_write" ON public.financial_transactions;
DROP POLICY IF EXISTS "secure_financial_modify" ON public.financial_transactions;
DROP POLICY IF EXISTS "secure_financial_remove" ON public.financial_transactions;

CREATE POLICY "secure_financial_read"
ON public.financial_transactions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner') OR
    is_superadmin_or_named(auth.uid())
  )
);

CREATE POLICY "secure_financial_write"
ON public.financial_transactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

CREATE POLICY "secure_financial_modify"
ON public.financial_transactions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

CREATE POLICY "secure_financial_delete"
ON public.financial_transactions
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Fix guest_charters policies to be more explicit
DROP POLICY IF EXISTS "secure_guest_charters_read" ON public.guest_charters;
DROP POLICY IF EXISTS "secure_guest_charters_write" ON public.guest_charters;
DROP POLICY IF EXISTS "secure_guest_charters_modify" ON public.guest_charters;
DROP POLICY IF EXISTS "secure_guest_charters_remove" ON public.guest_charters;

CREATE POLICY "secure_guest_charters_read"
ON public.guest_charters
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe()) OR
    is_superadmin_or_named(auth.uid())
  )
);

CREATE POLICY "secure_guest_charters_write"
ON public.guest_charters
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe())
);

CREATE POLICY "secure_guest_charters_modify"
ON public.guest_charters
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe())
);

CREATE POLICY "secure_guest_charters_delete"
ON public.guest_charters
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Fix security_audit_logs to ensure it's properly secured
DROP POLICY IF EXISTS "secure_audit_logs_superadmin_only" ON public.security_audit_logs;

CREATE POLICY "secure_audit_logs_read"
ON public.security_audit_logs
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_audit_logs_write"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true); -- Allow system to write audit logs

CREATE POLICY "secure_audit_logs_modify"
ON public.security_audit_logs
FOR UPDATE
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

CREATE POLICY "secure_audit_logs_delete"
ON public.security_audit_logs
FOR DELETE
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

-- Ensure all sensitive tables have RLS properly enabled
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;