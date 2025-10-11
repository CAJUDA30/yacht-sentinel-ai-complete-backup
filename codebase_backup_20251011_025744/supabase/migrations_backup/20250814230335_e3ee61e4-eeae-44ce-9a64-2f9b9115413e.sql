-- PHASE 1 COMPLETION: Fix system_settings table structure
-- The table exists but may not have the correct columns

-- Check and fix system_settings table structure
DO $$
BEGIN
  -- Add key column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN key TEXT NOT NULL DEFAULT '';
    -- Make it unique after adding
    ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_key_unique UNIQUE (key);
  END IF;

  -- Add value column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'value' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN value JSONB NOT NULL DEFAULT '{}';
  END IF;

  -- Add updated_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'system_settings' AND column_name = 'updated_by' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Now create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, key)
);

-- Enable RLS and create policies
DO $$
BEGIN
  -- RLS for user_settings
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'user_settings' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Policies for user_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can manage their own settings') THEN
    CREATE POLICY "Users can manage their own settings"
    ON public.user_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Trigger for user_settings
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_settings_updated_at') THEN
    CREATE TRIGGER update_user_settings_updated_at
      BEFORE UPDATE ON public.user_settings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON public.user_settings(user_id, key);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_event ON public.security_audit_logs(user_id, event_type, created_at);