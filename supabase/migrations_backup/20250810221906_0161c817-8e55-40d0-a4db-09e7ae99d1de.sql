-- Enable required extensions for scheduled warmups
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Unschedule existing job if present, then (re)schedule
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'edge-warmup-every-10-min') THEN
    PERFORM cron.unschedule('edge-warmup-every-10-min');
  END IF;
END $$;

-- Schedule a lightweight warmup every 10 minutes
SELECT cron.schedule(
  'edge-warmup-every-10-min',
  '*/10 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/edge-warmup'
  );
  $$
);
