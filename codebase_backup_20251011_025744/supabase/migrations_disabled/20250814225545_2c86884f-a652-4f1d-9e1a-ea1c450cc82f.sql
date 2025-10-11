-- =============================================
-- PHASE 1C: CLEAN MIGRATION WITH EXISTENCE CHECKS
-- Create settings tables and fix policies properly
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

-- Enable RLS on new tables only if they don't have RLS already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'user_settings' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'system_settings' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can manage their own settings') THEN
    CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'SuperAdmins can manage system settings') THEN
    CREATE POLICY "SuperAdmins can manage system settings"
    ON public.system_settings
    FOR ALL
    USING (is_superadmin_or_named(auth.uid()))
    WITH CHECK (is_superadmin_or_named(auth.uid()));
  END IF;
END $$;

-- Create security audit table
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'security_audit_logs' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create security audit policies only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'SuperAdmins can view security audit logs') THEN
    CREATE POLICY "SuperAdmins can view security audit logs"
    ON public.security_audit_logs
    FOR SELECT
    USING (is_superadmin_or_named(auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_logs' AND policyname = 'System can create security audit logs') THEN
    CREATE POLICY "System can create security audit logs"
    ON public.security_audit_logs
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Add triggers only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at
      BEFORE UPDATE ON public.user_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON public.system_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert default system settings
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