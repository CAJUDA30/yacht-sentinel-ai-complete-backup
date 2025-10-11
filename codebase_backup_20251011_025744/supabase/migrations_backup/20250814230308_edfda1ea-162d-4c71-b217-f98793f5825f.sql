-- PHASE 1 COMPLETION: Final cleanup and missing pieces
-- Ensure all settings tables exist and are properly configured

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, key)
);

-- Enable RLS on user_settings if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'user_settings' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create user_settings policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can manage their own settings') THEN
    CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add user_settings updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at
      BEFORE UPDATE ON public.user_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create index for better performance on user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON public.user_settings(user_id, key);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_event ON public.security_audit_logs(user_id, event_type, created_at);

-- Insert some missing default system settings if they don't exist
INSERT INTO public.system_settings (key, value) VALUES
  ('security.sessionTimeout', '30'),
  ('security.auditLogging', 'true'),
  ('security.inputValidation', 'true'),
  ('security.csrfProtection', 'true')
ON CONFLICT (key) DO NOTHING;