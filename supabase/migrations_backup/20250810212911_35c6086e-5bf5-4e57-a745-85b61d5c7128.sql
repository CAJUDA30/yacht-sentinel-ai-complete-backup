-- Ensure event_bus exists before managing policies
CREATE TABLE IF NOT EXISTS public.event_bus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  module TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID
);

ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_bus' AND policyname = 'Allow all operations on event_bus'
  ) THEN
    EXECUTE $$CREATE POLICY "Allow all operations on event_bus" ON public.event_bus AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)$$;
  END IF;
END $$;