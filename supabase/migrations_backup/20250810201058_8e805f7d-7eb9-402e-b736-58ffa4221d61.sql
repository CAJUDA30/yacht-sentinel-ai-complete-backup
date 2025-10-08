
-- Enable required extensions (safe if already enabled)
create schema if not exists extensions;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Edge function configuration and health
create table if not exists public.edge_function_settings (
  function_name text primary key,
  enabled boolean not null default true,
  timeout_ms integer not null default 10000,
  warm_schedule text default '*/5 * * * *',
  verify_jwt boolean default false,
  department text default 'Operations',
  feature_flag text,
  updated_at timestamptz not null default now()
);

create table if not exists public.edge_function_health (
  function_name text primary key,
  status text not null default 'unknown',
  last_checked_at timestamptz,
  latency_ms integer,
  region text,
  version text,
  error jsonb,
  metadata jsonb,
  updated_at timestamptz not null default now()
);

-- Feature flags
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  rollout_percent integer not null default 100,
  updated_at timestamptz not null default now()
);

-- Lightweight cache (JSON + TTL)
create table if not exists public.ai_cache (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Event bus for cross-component syncing
create table if not exists public.event_bus (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  payload jsonb not null,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  retries integer not null default 0
);

-- Triggers to keep updated_at fresh
drop trigger if exists set_timestamp_edge_function_settings on public.edge_function_settings;
create trigger set_timestamp_edge_function_settings
before update on public.edge_function_settings
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_timestamp_edge_function_health on public.edge_function_health;
create trigger set_timestamp_edge_function_health
before update on public.edge_function_health
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_timestamp_feature_flags on public.feature_flags;
create trigger set_timestamp_feature_flags
before update on public.feature_flags
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_timestamp_ai_cache on public.ai_cache;
create trigger set_timestamp_ai_cache
before update on public.ai_cache
for each row execute function public.set_current_timestamp_updated_at();

-- Helpful indexes
create index if not exists idx_ai_cache_expires_at on public.ai_cache (expires_at);
create index if not exists idx_event_bus_status_created_at on public.event_bus (status, created_at);

-- RLS: Enable with restrictive defaults
alter table public.edge_function_settings enable row level security;
alter table public.edge_function_health enable row level security;
alter table public.feature_flags enable row level security;
alter table public.ai_cache enable row level security;
alter table public.event_bus enable row level security;

-- Superadmin read access (service role bypasses RLS automatically)
drop policy if exists "Superadmins can read edge_function_settings" on public.edge_function_settings;
create policy "Superadmins can read edge_function_settings"
  on public.edge_function_settings for select
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean, false)
  );

drop policy if exists "Superadmins can read edge_function_health" on public.edge_function_health;
create policy "Superadmins can read edge_function_health"
  on public.edge_function_health for select
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean, false)
  );

drop policy if exists "Superadmins can read feature_flags" on public.feature_flags;
create policy "Superadmins can read feature_flags"
  on public.feature_flags for select
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superadmin')::boolean, false)
    or coalesce((auth.jwt() -> 'user_metadata' ->> 'is_superadmin')::boolean, false)
  );

-- ai_cache and event_bus are service-role only; no public policies
-- (service role used in edge functions bypasses RLS)

-- Seed default settings for known functions (idempotent)
insert into public.edge_function_settings (function_name, verify_jwt, department) values
  ('multi-ai-processor', false, 'AI'),
  ('enhanced-multi-ai-processor', true, 'AI'),
  ('universal-search', false, 'AI'),
  ('system-monitor', false, 'Operations'),
  ('universal-smart-scan', false, 'Vision'),
  ('optimized-ai-processor', false, 'AI'),
  ('ai-admin', true, 'Operations'),
  ('logs-suggest-solution', true, 'Operations'),
  ('voice-processor', false, 'Voice'),
  ('voice-assistant', false, 'Voice'),
  ('equipment-ocr', false, 'Vision'),
  ('equipment-research', false, 'AI'),
  ('internal-process-scan', true, 'Operations'),
  ('iot-maritime-integration', false, 'Operations'),
  ('test-ai-model', true, 'AI'),
  ('discover-ai-models', true, 'AI'),
  ('unified-voice-ai', false, 'Voice'),
  ('gcp-unified-config', true, 'Operations'),
  ('vision-config', false, 'Operations'),
  ('windy-weather', false, 'Operations')
on conflict (function_name) do nothing;

-- Schedule warm-ups via pg_cron (health GET) – only schedule if not already present
do $$
declare
  base_url text := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/';
begin
  if not exists (select 1 from cron.job where jobname = 'warm-multi-ai-processor') then
    perform cron.schedule('warm-multi-ai-processor', '*/5 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/multi-ai-processor'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-enhanced-multi-ai-processor') then
    perform cron.schedule('warm-enhanced-multi-ai-processor', '*/5 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/enhanced-multi-ai-processor'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-universal-search') then
    perform cron.schedule('warm-universal-search', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/universal-search'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-system-monitor') then
    perform cron.schedule('warm-system-monitor', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/system-monitor'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-universal-smart-scan') then
    perform cron.schedule('warm-universal-smart-scan', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/universal-smart-scan'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-optimized-ai-processor') then
    perform cron.schedule('warm-optimized-ai-processor', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/optimized-ai-processor'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-ai-admin') then
    perform cron.schedule('warm-ai-admin', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/ai-admin'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-logs-suggest-solution') then
    perform cron.schedule('warm-logs-suggest-solution', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/logs-suggest-solution'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-voice-processor') then
    perform cron.schedule('warm-voice-processor', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/voice-processor'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-voice-assistant') then
    perform cron.schedule('warm-voice-assistant', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/voice-assistant'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-equipment-ocr') then
    perform cron.schedule('warm-equipment-ocr', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/equipment-ocr'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-equipment-research') then
    perform cron.schedule('warm-equipment-research', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/equipment-research'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-internal-process-scan') then
    perform cron.schedule('warm-internal-process-scan', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/internal-process-scan'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-iot-maritime-integration') then
    perform cron.schedule('warm-iot-maritime-integration', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/iot-maritime-integration'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-test-ai-model') then
    perform cron.schedule('warm-test-ai-model', '*/15 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/test-ai-model'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-discover-ai-models') then
    perform cron.schedule('warm-discover-ai-models', '*/15 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/discover-ai-models'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-unified-voice-ai') then
    perform cron.schedule('warm-unified-voice-ai', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/unified-voice-ai'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-gcp-unified-config') then
    perform cron.schedule('warm-gcp-unified-config', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/gcp-unified-config'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-vision-config') then
    perform cron.schedule('warm-vision-config', '*/10 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/vision-config'); $$);
  end if;
  if not exists (select 1 from cron.job where jobname = 'warm-windy-weather') then
    perform cron.schedule('warm-windy-weather', '*/15 * * * *', $$ select net.http_get(url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/windy-weather'); $$);
  end if;
end $$;

-- Optional triggers to push events when provider/configs change (for sync)
-- (Keep lightweight: functions will consume event_bus)
-- If these tables don't exist in your project, these statements will simply fail.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_providers') then
    drop trigger if exists trg_ai_providers_event on public.ai_providers;
    create or replace function public.fn_emit_ai_providers_event() returns trigger language plpgsql as $f$
    begin
      insert into public.event_bus(topic, payload) values ('ai_providers.updated', jsonb_build_object('op', tg_op, 'row', row_to_json(new)));
      return new;
    end $f$;
    create trigger trg_ai_providers_event
      after insert or update or delete on public.ai_providers
      for each row execute function public.fn_emit_ai_providers_event();
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='ai_configs') then
    drop trigger if exists trg_ai_configs_event on public.ai_configs;
    create or replace function public.fn_emit_ai_configs_event() returns trigger language plpgsql as $f$
    begin
      insert into public.event_bus(topic, payload) values ('ai_configs.updated', jsonb_build_object('op', tg_op, 'row', row_to_json(new)));
      return new;
    end $f$;
    create trigger trg_ai_configs_event
      after insert or update or delete on public.ai_configs
      for each row execute function public.fn_emit_ai_configs_event();
  end if;
end $$;
