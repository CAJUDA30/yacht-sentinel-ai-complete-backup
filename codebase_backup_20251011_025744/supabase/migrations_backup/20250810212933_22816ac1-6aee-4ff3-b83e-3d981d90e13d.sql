DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'event_bus' AND policyname = 'Allow all operations on event_bus'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow all operations on event_bus" ON public.event_bus AS PERMISSIVE FOR ALL TO PUBLIC USING (true) WITH CHECK (true)';
  END IF;
END $$;