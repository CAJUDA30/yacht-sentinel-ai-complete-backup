-- Phase 1: Critical DB & Security Fixes (minimal, safe)
-- 1) Harden unified_ai_logs with RLS and add expected provider column

-- Add provider column if missing
ALTER TABLE public.unified_ai_logs
  ADD COLUMN IF NOT EXISTS provider text;

-- Ensure indexes for performance
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_unified_ai_logs_created_at'
  ) THEN
    CREATE INDEX idx_unified_ai_logs_created_at ON public.unified_ai_logs (created_at);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.unified_ai_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent safety)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='unified_ai_logs' AND policyname='secure_unified_ai_logs_superadmin_read'
  ) THEN
    DROP POLICY "secure_unified_ai_logs_superadmin_read" ON public.unified_ai_logs;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='unified_ai_logs' AND policyname='system_can_insert_unified_ai_logs'
  ) THEN
    DROP POLICY "system_can_insert_unified_ai_logs" ON public.unified_ai_logs;
  END IF;
END $$;

-- Read access restricted to superadmins
CREATE POLICY "secure_unified_ai_logs_superadmin_read"
ON public.unified_ai_logs
FOR SELECT
USING (is_superadmin_or_named(auth.uid()));

-- Allow system/edge functions to write (SECURITY DEFINER functions or service role)
CREATE POLICY "system_can_insert_unified_ai_logs"
ON public.unified_ai_logs
FOR INSERT
WITH CHECK (true);

-- (Optional hardening) Disallow UPDATE/DELETE by default via absence of policies