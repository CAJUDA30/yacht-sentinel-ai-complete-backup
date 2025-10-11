-- =============================================
-- PHASE 1: CRITICAL SECURITY & INFRASTRUCTURE
-- Fix RLS Policies and Add Security Tables
-- =============================================

-- Create missing settings tables for centralization
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, key)
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for user_settings
CREATE POLICY "Users can manage their own settings"
ON public.user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create secure RLS policies for system_settings (SuperAdmin only)
CREATE POLICY "SuperAdmins can manage system settings"
ON public.system_settings
FOR ALL
USING (is_superadmin_or_named(auth.uid()))
WITH CHECK (is_superadmin_or_named(auth.uid()));

-- Create security audit table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  user_id UUID REFERENCES auth.users(id),
  action_attempted TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL DEFAULT false,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only SuperAdmins can view security audit logs
CREATE POLICY "SuperAdmins can view security audit logs"
ON public.security_audit_logs
FOR SELECT
USING (is_superadmin_or_named(auth.uid()));

-- System can insert security audit logs
CREATE POLICY "System can create security audit logs"
ON public.security_audit_logs
FOR INSERT
WITH CHECK (true);

-- =============================================
-- FIX EXISTING INSECURE RLS POLICIES
-- =============================================

-- Drop and recreate secure policies for critical tables
DROP POLICY IF EXISTS "Allow all operations on inventory_folders" ON public.inventory_folders;
DROP POLICY IF EXISTS "Allow all operations on inventory_items" ON public.inventory_items;
DROP POLICY IF EXISTS "Allow all operations on crew_members" ON public.crew_members;
DROP POLICY IF EXISTS "Allow all operations on equipment" ON public.equipment;

-- Create user-specific policies for inventory
CREATE POLICY "Users can manage inventory in their yachts"
ON public.inventory_folders
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = inventory_folders.yacht_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = inventory_folders.yacht_id
  )
);

CREATE POLICY "Users can manage inventory items in their yachts"
ON public.inventory_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM inventory_folders f
    JOIN get_user_yacht_access_safe() y ON f.yacht_id = y.yacht_id
    WHERE f.id = inventory_items.folder_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM inventory_folders f
    JOIN get_user_yacht_access_safe() y ON f.yacht_id = y.yacht_id
    WHERE f.id = inventory_items.folder_id
  )
);

-- Create user-specific policies for crew
CREATE POLICY "Users can manage crew in their yachts"
ON public.crew_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = crew_members.yacht_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = crew_members.yacht_id
  )
);

-- Create user-specific policies for equipment
CREATE POLICY "Users can manage equipment in their yachts"
ON public.equipment
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = equipment.yacht_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_yacht_access_safe() 
    WHERE yacht_id = equipment.yacht_id
  )
);

-- =============================================
-- ADD SECURITY TRIGGERS
-- =============================================

-- Trigger to log sensitive table access
CREATE OR REPLACE FUNCTION public.log_sensitive_table_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Add triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_crew_members ON public.crew_members;
CREATE TRIGGER audit_crew_members
  AFTER INSERT OR UPDATE OR DELETE ON public.crew_members
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

DROP TRIGGER IF EXISTS audit_equipment ON public.equipment;
CREATE TRIGGER audit_equipment
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.log_sensitive_table_access();

-- =============================================
-- ADD UPDATED_AT TRIGGERS FOR NEW TABLES
-- =============================================

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =============================================

INSERT INTO public.system_settings (key, value) VALUES
  ('system.maintenance', 'false'),
  ('system.registration', 'true'),
  ('system.maxFileSize', '10'),
  ('system.sessionTimeout', '30'),
  ('ai.defaultProvider', '"openai"'),
  ('ai.maxTokens', '4096'),
  ('ai.temperature', '0.7'),
  ('security.rateLimiting', 'true'),
  ('security.maxLoginAttempts', '5'),
  ('security.requireMFA', 'false')
ON CONFLICT (key) DO NOTHING;