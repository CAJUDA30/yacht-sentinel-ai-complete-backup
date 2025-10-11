
-- Phase 1: Providers-first model references, events, realtime, indexing, retention, and edge control-plane tables

-- 0) Ensure extensions used by schedules/webhooks (safe if already present)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 1) Departments taxonomy
do $$
begin
  if not exists (select 1 from pg_type where typname = 'department_type') then
    create type public.department_type as enum (
      'Engineering','Operations','Finance','Security','Marketing','HR','Sales','Compliance','General'
    );
  end if;
end
$$;

-- 2) Event bus for bidirectional syncing and observability
create table if not exists public.event_bus (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  module text,
  department public.department_type,
  source text,
  severity text not null default 'info',
  request_id text,
  payload jsonb not null default '{}'::jsonb
);

alter table public.event_bus enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Allow all operations on event_bus'
      and tablename = 'event_bus'
  ) then
    create policy "Allow all operations on event_bus"
      on public.event_bus for all
      using (true) with check (true);
  end if;
end $$;

create index if not exists event_bus_created_at_idx on public.event_bus (created_at desc);
create index if not exists event_bus_event_type_idx on public.event_bus (event_type);
create index if not exists event_bus_department_idx on public.event_bus (department);
create index if not exists event_bus_payload_gin on public.event_bus using gin (payload);

-- 3) Edge function control-plane tables (used by edge-control)
create table if not exists public.edge_function_settings (
  function_name text primary key,
  enabled boolean not null default true,
  timeout_ms integer not null default 30000,
  warm_schedule text,
  verify_jwt boolean not null default true,
  department public.department_type not null default 'Operations',
  feature_flag text,
  updated_at timestamptz not null default now()
);

create table if not exists public.edge_function_health (
  id uuid primary key default gen_random_uuid(),
  function_name text not null unique,
  status text not null default 'unknown',
  last_checked_at timestamptz,
  latency_ms integer,
  region text,
  version text,
  error jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.edge_function_settings enable row level security;
alter table public.edge_function_health enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Allow all operations on edge_function_settings'
      and tablename = 'edge_function_settings'
  ) then
    create policy "Allow all operations on edge_function_settings"
      on public.edge_function_settings for all
      using (true) with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Allow all operations on edge_function_health'
      and tablename = 'edge_function_health'
  ) then
    create policy "Allow all operations on edge_function_health"
      on public.edge_function_health for all
      using (true) with check (true);
  end if;
end $$;

create index if not exists edge_function_settings_dept_idx on public.edge_function_settings (department);
create index if not exists edge_function_health_status_idx on public.edge_function_health (status);
create index if not exists edge_function_health_updated_at_idx on public.edge_function_health (updated_at desc);

-- 4) Providers-first normalization on logs

-- 4a) Analytics events: add department and search index
alter table public.analytics_events
  add column if not exists department public.department_type;

update public.analytics_events
set department = case
  when lower(coalesce(module,'')) in ('build','deploy','ci','cd','engineering') then 'Engineering'
  when lower(coalesce(module,'')) in ('system','edge','infra','uptime','operations') then 'Operations'
  when lower(coalesce(module,'')) = 'finance' then 'Finance'
  when lower(coalesce(module,'')) = 'security' then 'Security'
  when lower(coalesce(module,'')) = 'marketing' then 'Marketing'
  when lower(coalesce(module,'')) = 'hr' then 'HR'
  when lower(coalesce(module,'')) = 'sales' then 'Sales'
  when lower(coalesce(module,'')) = 'compliance' then 'Compliance'
  else 'General'
end
where department is null;

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_department_idx on public.analytics_events (department);
create index if not exists analytics_events_module_idx on public.analytics_events (module);
create index if not exists analytics_events_message_fts
  on public.analytics_events
  using gin (to_tsvector('simple', coalesce(event_message,'')));

-- 4b) Action logs: add department, indexes
alter table public.ai_action_logs
  add column if not exists department public.department_type;

update public.ai_action_logs
set department = 'General'
where department is null;

create index if not exists ai_action_logs_created_at_idx on public.ai_action_logs (created_at desc);
create index if not exists ai_action_logs_department_idx on public.ai_action_logs (department);
create index if not exists ai_action_logs_metadata_gin on public.ai_action_logs using gin (metadata);

-- 4c) Model logs: add provider_id and department, backfill provider_id from models/providers
alter table public.ai_model_logs
  add column if not exists provider_id uuid,
  add column if not exists department public.department_type;

-- backfill ai_model_logs.provider_id via ai_models -> ai_providers.name
update public.ai_model_logs ml
set provider_id = p.id
from public.ai_models m
join public.ai_providers p on lower(p.name) = lower(m.provider)
where ml.model_id = m.id
  and ml.provider_id is null;

update public.ai_model_logs
set department = 'Operations'
where department is null;

create index if not exists ai_model_logs_created_at_idx on public.ai_model_logs (created_at desc);
create index if not exists ai_model_logs_provider_idx on public.ai_model_logs (provider_id);
create index if not exists ai_model_logs_metadata_gin on public.ai_model_logs using gin (metadata);

-- 4d) Performance logs: add provider_id and department, backfill from provider_name
alter table public.ai_performance_logs
  add column if not exists provider_id uuid,
  add column if not exists department public.department_type;

update public.ai_performance_logs l
set provider_id = p.id
from public.ai_providers p
where l.provider_name is not null
  and lower(p.name) = lower(l.provider_name)
  and l.provider_id is null;

update public.ai_performance_logs
set department = 'Operations'
where department is null;

create index if not exists ai_performance_logs_created_at_idx on public.ai_performance_logs (created_at desc);
create index if not exists ai_performance_logs_provider_idx on public.ai_performance_logs (provider_id);
create index if not exists ai_performance_logs_metadata_gin on public.ai_performance_logs using gin (metadata);

-- 4e) Processing logs: add provider_id, model_ref, department; backfill from model_name
alter table public.ai_processing_logs
  add column if not exists provider_id uuid,
  add column if not exists model_ref uuid,
  add column if not exists department public.department_type;

update public.ai_processing_logs pl
set model_ref = m.id,
    provider_id = p.id
from public.ai_models m
left join public.ai_providers p on lower(p.name) = lower(m.provider)
where pl.model_ref is null
  and pl.model_name is not null
  and lower(m.model_name) = lower(pl.model_name);

update public.ai_processing_logs
set department = 'Operations'
where department is null;

create index if not exists ai_processing_logs_created_at_idx on public.ai_processing_logs (created_at desc);
create index if not exists ai_processing_logs_provider_idx on public.ai_processing_logs (provider_id);

-- 5) Unified view for Logs (providers-first, dedup-friendly)
drop view if exists public.unified_ai_logs cascade;
create view public.unified_ai_logs as
  -- AI model logs
  select
    ml.id,
    ml.created_at,
    'model_logs'::text as source,
    coalesce(ml.status,'') as status,
    null::text as event_message,
    ml.provider_id,
    ml.model_id as model_ref,
    null::text as provider_name,
    null::integer as latency_ms,
    ml.metadata,
    ml.department,
    null::numeric as cost_usd,
    null::integer as tokens_used
  from public.ai_model_logs ml
  union all
  -- AI performance logs
  select
    pl.id,
    pl.created_at,
    'performance_logs'::text as source,
    coalesce(pl.status,'') as status,
    null::text as event_message,
    pl.provider_id,
    pl.model_id as model_ref,
    pl.provider_name,
    pl.execution_time_ms as latency_ms,
    pl.metadata,
    pl.department,
    pl.cost_usd,
    pl.tokens_used
  from public.ai_performance_logs pl
  union all
  -- AI processing logs
  select
    pr.id,
    pr.created_at,
    'processing_logs'::text as source,
    case when pr.success then 'success' else 'error' end as status,
    pr.error_message as event_message,
    pr.provider_id,
    pr.model_ref,
    null::text as provider_name,
    pr.processing_time_ms as latency_ms,
    pr.response_data as metadata,
    pr.department,
    null::numeric as cost_usd,
    null::integer as tokens_used
  from public.ai_processing_logs pr
  union all
  -- App analytics events (for department-wide visibility)
  select
    ae.id,
    ae.created_at,
    'analytics_events'::text as source,
    coalesce(ae.severity,'info') as status,
    ae.event_message,
    null::uuid as provider_id,
    null::uuid as model_ref,
    null::text as provider_name,
    null::integer as latency_ms,
    ae.metadata,
    ae.department,
    null::numeric as cost_usd,
    null::integer as tokens_used
  from public.analytics_events ae;

-- 6) Auto-tagging helpers (analytics_events only for now; others default to Operations via backfill)
create or replace function public.infer_department(
  _module text,
  _provider_name text,
  _endpoint text,
  _default public.department_type
) returns public.department_type
language plpgsql
as $$
begin
  if _module is null then
    return _default;
  end if;

  case lower(_module)
    when 'build','deploy','ci','cd','engineering' then return 'Engineering';
    when 'system','edge','infra','uptime','operations' then return 'Operations';
    when 'finance' then return 'Finance';
    when 'security' then return 'Security';
    when 'marketing' then return 'Marketing';
    when 'hr' then return 'HR';
    when 'sales' then return 'Sales';
    when 'compliance' then return 'Compliance';
    else return _default;
  end case;
end
$$;

create or replace function public.analytics_events_set_department()
returns trigger
language plpgsql
as $$
begin
  if new.department is null then
    new.department := public.infer_department(new.module, null, null, 'General');
  end if;
  return new;
end
$$;

drop trigger if exists trg_analytics_events_set_department on public.analytics_events;
create trigger trg_analytics_events_set_department
before insert or update on public.analytics_events
for each row execute function public.analytics_events_set_department();

-- 7) Provider/model/config change events -> event_bus
create or replace function public.emit_entity_event()
returns trigger
language plpgsql
as $$
declare
  _etype text;
  _payload jsonb;
begin
  if tg_op = 'INSERT' then
    _etype := tg_table_name || '.created';
    _payload := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    _etype := tg_table_name || '.updated';
    _payload := jsonb_build_object('new', to_jsonb(new), 'old', to_jsonb(old));
  elsif tg_op = 'DELETE' then
    _etype := tg_table_name || '.deleted';
    _payload := to_jsonb(old);
  end if;

  insert into public.event_bus (event_type, module, department, source, severity, payload)
  values (_etype, tg_table_name, 'Operations', 'db-trigger', 'info', coalesce(_payload, '{}'::jsonb));

  return coalesce(new, old);
end
$$;

drop trigger if exists trg_emit_ai_providers_event on public.ai_providers;
create trigger trg_emit_ai_providers_event
after insert or update or delete on public.ai_providers
for each row execute function public.emit_entity_event();

drop trigger if exists trg_emit_ai_models_event on public.ai_models;
create trigger trg_emit_ai_models_event
after insert or update or delete on public.ai_models
for each row execute function public.emit_entity_event();

drop trigger if exists trg_emit_ai_configs_event on public.ai_configs;
create trigger trg_emit_ai_configs_event
after insert or update or delete on public.ai_configs
for each row execute function public.emit_entity_event();

-- 8) Realtime publication — add key tables
do $$
declare
  _t text;
begin
  for _t in
    select unnest( array[
      'public.event_bus',
      'public.ai_providers',
      'public.ai_models',
      'public.ai_configs',
      'public.analytics_events',
      'public.ai_model_logs',
      'public.ai_performance_logs',
      'public.ai_processing_logs'
    ])
  loop
    begin
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname || '.' || tablename = _t
      ) then
        execute format('alter publication supabase_realtime add table %s', _t);
      end if;
    exception when others then
      -- ignore if already added or insufficient privileges
      null;
    end;
  end loop;
end
$$;

-- 9) Retention: purge old logs daily (default 90d)
create or replace function public.purge_old_logs(_days int default 90)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.analytics_events where created_at < now() - (_days || ' days')::interval;
  delete from public.ai_model_logs where created_at < now() - (_days || ' days')::interval;
  delete from public.ai_performance_logs where created_at < now() - (_days || ' days')::interval;
  delete from public.ai_processing_logs where created_at < now() - (_days || ' days')::interval;
  insert into public.event_bus(event_type, module, department, source, severity, payload)
  values ('retention.purge', 'logs', 'Operations', 'pg_cron', 'info',
          jsonb_build_object('retention_days', _days, 'timestamp', now()));
end
$$;

-- schedule daily at 03:00 UTC
select
  cron.schedule(
    'purge-old-logs-daily',
    '0 3 * * *',
    $$ select public.purge_old_logs(90); $$
  )
on conflict (jobname) do nothing;

-- 10) Warmups/health pings for public functions (mitigate cold starts)
-- NOTE: These target public (verify_jwt=false) endpoints only.
-- Adjust or extend later via edge_function_settings.
select
  cron.schedule(
    'warm-system-monitor-15m',
    '*/15 * * * *',
    $$
    select net.http_get(
      url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/system-monitor'
    );
    $$
  )
on conflict (jobname) do nothing;

select
  cron.schedule(
    'warm-windy-weather-15m',
    '*/15 * * * *',
    $$
    select net.http_get(
      url := 'https://vdjsfupbjtbkpuvwffbn.supabase.co/functions/v1/windy-weather'
    );
    $$
  )
on conflict (jobname) do nothing;

-- 11) Feature flags table (guards incremental rollout)
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where policyname = 'Allow all operations on feature_flags'
      and tablename = 'feature_flags'
  ) then
    create policy "Allow all operations on feature_flags"
      on public.feature_flags for all
      using (true) with check (true);
  end if;
end $$;

-- Turn on providers-as-source-of-truth (used by UI & edge functions as a gate)
insert into public.feature_flags as ff (key, enabled, payload)
values ('providers_as_source_of_truth', true, '{"notes":"Logs & UI should join on provider_id; models are auxiliary"}'::jsonb)
on conflict (key) do update set enabled = excluded.enabled, payload = excluded.payload, updated_at = now();
