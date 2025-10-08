-- PHASE 1: Enterprise RBAC foundation (non-disruptive, feature-flag friendly)
-- Creates flexible roles/permissions alongside existing is_superadmin() function
-- Secure by default: only superadmins can manage RBAC data

-- 1) Tables
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- e.g., 'providers:manage', 'logs:read', 'permissions:manage'
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

-- 2) RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;

-- Helper policy function: we'll use the existing is_superadmin(auth.uid()) in policies
-- Policies: Only superadmins can manage RBAC data; users can read their own assignments

-- Roles
drop policy if exists "roles_superadmin_all" on public.roles;
create policy "roles_superadmin_all"
  on public.roles
  for all
  to authenticated
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- Permissions
drop policy if exists "permissions_superadmin_all" on public.permissions;
create policy "permissions_superadmin_all"
  on public.permissions
  for all
  to authenticated
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- Role permissions
drop policy if exists "role_permissions_superadmin_all" on public.role_permissions;
create policy "role_permissions_superadmin_all"
  on public.role_permissions
  for all
  to authenticated
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- User role assignments
drop policy if exists "ura_superadmin_all" on public.user_role_assignments;
create policy "ura_superadmin_all"
  on public.user_role_assignments
  for all
  to authenticated
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- Allow users to read their own assignments
drop policy if exists "ura_read_own" on public.user_role_assignments;
create policy "ura_read_own"
  on public.user_role_assignments
  for select
  to authenticated
  using (user_id = auth.uid());

-- 3) Helper functions (SECURITY DEFINER) for flexible RBAC
create or replace function public.has_named_role(_user_id uuid, _role_name text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.roles r on r.id = ura.role_id
    where ura.user_id = _user_id
      and r.name = _role_name
  );
$$;

create or replace function public.has_permission(_user_id uuid, _permission_key text)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1
    from public.user_role_assignments ura
    join public.role_permissions rp on rp.role_id = ura.role_id
    join public.permissions p on p.id = rp.permission_id
    where ura.user_id = _user_id
      and p.key = _permission_key
  );
$$;

-- Compatibility: superadmin check that also honors the new roles table if needed
-- We keep existing is_superadmin() untouched, but add an alias that ORs both systems.
create or replace function public.is_superadmin_or_named(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(public.is_superadmin(_user_id), false)
         or coalesce(public.has_named_role(_user_id, 'superadmin'), false);
$$;

-- Grant role to user by email for named roles
create or replace function public.grant_named_role_by_email(_email text, _role_name text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  _uid uuid;
  _rid uuid;
begin
  select id into _uid
  from auth.users
  where lower(email) = lower(_email)
  limit 1;

  if _uid is null then
    return false; -- user not found yet
  end if;

  select id into _rid
  from public.roles
  where name = _role_name
  limit 1;

  if _rid is null then
    raise exception 'Role % does not exist', _role_name;
  end if;

  insert into public.user_role_assignments(user_id, role_id)
  values (_uid, _rid)
  on conflict (user_id, role_id) do nothing;

  return true;
end;
$$;

-- 4) Seeds (idempotent)
-- Core roles
insert into public.roles(name, description)
values
  ('superadmin', 'Full access to all features and settings'),
  ('admin', 'Administrative access to configurations'),
  ('dept_head', 'Department head with scoped access'),
  ('user', 'Standard user access')
on conflict (name) do nothing;

-- Core permissions
insert into public.permissions(key, description) values
  ('permissions:manage', 'Manage users, roles, and permissions'),
  ('providers:read', 'View AI providers'),
  ('providers:manage', 'Create/update/delete AI providers'),
  ('models:read', 'View AI models'),
  ('models:manage', 'Create/update/delete AI models'),
  ('logs:read', 'Read logs across departments'),
  ('logs:manage', 'Manage logs settings and retention'),
  ('edge:invoke', 'Invoke edge functions'),
  ('edge:manage', 'Manage edge functions & settings'),
  ('ai-admin:read', 'View AI admin controls'),
  ('ai-admin:manage', 'Manage AI admin controls'),
  ('unified-config:read', 'View unified AI config'),
  ('unified-config:manage', 'Manage unified AI config')
on conflict (key) do nothing;

-- Department-scope read permissions (initial set)
insert into public.permissions(key, description) values
  ('logs:dept:engineering', 'Access Engineering logs'),
  ('logs:dept:operations', 'Access Operations logs'),
  ('logs:dept:finance', 'Access Finance logs'),
  ('logs:dept:security', 'Access Security logs'),
  ('logs:dept:marketing', 'Access Marketing logs'),
  ('logs:dept:hr', 'Access HR logs'),
  ('logs:dept:sales', 'Access Sales logs'),
  ('logs:dept:compliance', 'Access Compliance logs')
on conflict (key) do nothing;

-- Grant all permissions to superadmin role
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on true
where r.name = 'superadmin'
on conflict do nothing;

-- Bootstrap: Map any legacy superadmins into the new named role assignments
-- (If user_roles table with enum already granted 'superadmin', reflect it here)
insert into public.user_role_assignments(user_id, role_id)
select ur.user_id, r.id
from public.user_roles ur
join public.roles r on r.name = 'superadmin'
where ur.role::text = 'superadmin'
on conflict (user_id, role_id) do nothing;
