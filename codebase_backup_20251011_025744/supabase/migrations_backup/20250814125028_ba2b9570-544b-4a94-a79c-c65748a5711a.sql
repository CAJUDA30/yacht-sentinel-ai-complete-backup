-- Comprehensive Security Fix: Eliminate All Critical Vulnerabilities
-- Phase 1: Fix Authentication Guards on Existing Tables
-- Phase 2: Create Missing Sensitive Tables with Secure RLS
-- Phase 3: Add Comprehensive Audit Logging

-- Phase 1: Fix crew_members table - Employee Personal Data Security
DROP POLICY IF EXISTS "crew_members_select_policy" ON public.crew_members;
DROP POLICY IF EXISTS "crew_members_insert_policy" ON public.crew_members;
DROP POLICY IF EXISTS "crew_members_update_policy" ON public.crew_members;
DROP POLICY IF EXISTS "crew_members_delete_policy" ON public.crew_members;

-- Create secure crew_members policies with authentication-first approach
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

CREATE POLICY "secure_crew_members_remove" 
ON public.crew_members 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Phase 2: Create financial_transactions table - Financial Records Security
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID,
  transaction_type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_supplier TEXT,
  invoice_number TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  accessed_at TIMESTAMPTZ,
  accessed_by UUID
);

-- Enable RLS on financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create secure financial_transactions policies
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
  created_by = auth.uid() AND
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

CREATE POLICY "secure_financial_modify" 
ON public.financial_transactions 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

CREATE POLICY "secure_financial_remove" 
ON public.financial_transactions 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Create guest_charters table - Guest Information Security
CREATE TABLE IF NOT EXISTS public.guest_charters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yacht_id UUID,
  charter_number TEXT UNIQUE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_address JSONB,
  emergency_contact JSONB,
  charter_start_date DATE NOT NULL,
  charter_end_date DATE NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  special_requests TEXT,
  dietary_requirements TEXT,
  charter_price DECIMAL(12,2),
  deposit_amount DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  
  -- Audit fields
  accessed_at TIMESTAMPTZ,
  accessed_by UUID,
  
  -- Privacy fields
  privacy_consent BOOLEAN DEFAULT false,
  data_retention_until DATE
);

-- Enable RLS on guest_charters
ALTER TABLE public.guest_charters ENABLE ROW LEVEL SECURITY;

-- Create secure guest_charters policies
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
  created_by = auth.uid() AND
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe())
);

CREATE POLICY "secure_guest_charters_modify" 
ON public.guest_charters 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe())
);

CREATE POLICY "secure_guest_charters_remove" 
ON public.guest_charters 
FOR DELETE 
USING (
  auth.uid() IS NOT NULL AND 
  yacht_id IN (SELECT yacht_id FROM get_user_yacht_access_safe() WHERE access_level = 'owner')
);

-- Phase 3: Fix AI-related tables with proper authentication guards
-- Fix ai_conversations policies
DROP POLICY IF EXISTS "Users access their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can create their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can update their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users can view their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users create their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "Users update their AI conversations" ON public.ai_conversations;
DROP POLICY IF EXISTS "secure_ai_conversations_user_access" ON public.ai_conversations;

CREATE POLICY "secure_ai_conversations_read"
ON public.ai_conversations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    is_superadmin_or_named(auth.uid())
  )
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
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    is_superadmin_or_named(auth.uid())
  )
);

-- Fix ai_action_logs policies
DROP POLICY IF EXISTS "Users can view their AI action logs" ON public.ai_action_logs;
DROP POLICY IF EXISTS "Users view their AI action logs" ON public.ai_action_logs;
DROP POLICY IF EXISTS "secure_ai_action_logs_user_access" ON public.ai_action_logs;

CREATE POLICY "secure_ai_action_logs_read"
ON public.ai_action_logs
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    user_id IS NULL OR 
    is_superadmin_or_named(auth.uid())
  )
);

-- Phase 4: Add Comprehensive Audit Logging

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  action_attempted TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on security_audit_logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can access security audit logs
CREATE POLICY "secure_audit_logs_superadmin_only"
ON public.security_audit_logs
FOR ALL
USING (auth.uid() IS NOT NULL AND is_superadmin_or_named(auth.uid()));

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_table_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type,
    table_name,
    record_id,
    user_id,
    action_attempted,
    access_granted,
    risk_level,
    details
  ) VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP || ' on ' || TG_TABLE_NAME,
    true,
    CASE 
      WHEN TG_TABLE_NAME IN ('financial_transactions', 'guest_charters', 'crew_members') THEN 'high'
      WHEN TG_TABLE_NAME LIKE 'ai_%' THEN 'medium'
      ELSE 'low'
    END,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_crew_members ON public.crew_members;
CREATE TRIGGER audit_crew_members
  AFTER INSERT OR UPDATE OR DELETE ON public.crew_members
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

DROP TRIGGER IF EXISTS audit_financial_transactions ON public.financial_transactions;
CREATE TRIGGER audit_financial_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

DROP TRIGGER IF EXISTS audit_guest_charters ON public.guest_charters;
CREATE TRIGGER audit_guest_charters
  AFTER INSERT OR UPDATE OR DELETE ON public.guest_charters
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

-- Create access tracking triggers for sensitive data
CREATE OR REPLACE FUNCTION public.track_sensitive_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.accessed_at = now();
  NEW.accessed_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add access tracking to financial and guest tables
DROP TRIGGER IF EXISTS track_financial_access ON public.financial_transactions;
CREATE TRIGGER track_financial_access
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.track_sensitive_access();

DROP TRIGGER IF EXISTS track_guest_access ON public.guest_charters;
CREATE TRIGGER track_guest_access
  BEFORE UPDATE ON public.guest_charters
  FOR EACH ROW EXECUTE FUNCTION public.track_sensitive_access();

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_financial_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_guest_updated_at ON public.guest_charters;
CREATE TRIGGER update_guest_updated_at
  BEFORE UPDATE ON public.guest_charters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();