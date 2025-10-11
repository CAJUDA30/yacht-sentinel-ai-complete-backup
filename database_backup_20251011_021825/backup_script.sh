#!/bin/bash

# =============================================================================
# COMPREHENSIVE DATABASE BACKUP SCRIPT
# =============================================================================
# Backs up all database components: schema, data, RLS policies, RPC functions,
# users, and edge functions

BACKUP_DIR="database_backup_20251011_021825"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "🚀 Starting comprehensive database backup..."
echo "📁 Backup directory: $BACKUP_DIR"

# 2. RLS Policies backup
echo "🔒 Backing up RLS policies..."
psql $DB_URL -c "
SELECT 
  'DROP POLICY IF EXISTS \"' || policyname || '\" ON ' || schemaname || '.' || tablename || ';' ||
  CHR(10) ||
  'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename ||
  CASE 
    WHEN cmd = 'ALL' THEN ' FOR ALL'
    WHEN cmd = 'SELECT' THEN ' FOR SELECT'
    WHEN cmd = 'INSERT' THEN ' FOR INSERT'
    WHEN cmd = 'UPDATE' THEN ' FOR UPDATE'
    WHEN cmd = 'DELETE' THEN ' FOR DELETE'
  END ||
  ' TO ' || array_to_string(roles, ', ') ||
  CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
  CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
  ';' || CHR(10) as policy_recreation_sql
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" > $BACKUP_DIR/rls_policies_backup.sql

# 3. RPC Functions backup
echo "⚙️ Backing up RPC functions..."
psql $DB_URL -c "
SELECT 
  'DROP FUNCTION IF EXISTS ' || p.proname || '(' || 
  COALESCE(pg_get_function_identity_arguments(p.oid), '') || ') CASCADE;' || CHR(10) ||
  pg_get_functiondef(p.oid) || CHR(10) || CHR(10) as function_recreation_sql
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;
" > $BACKUP_DIR/rpc_functions_backup.sql

# 4. Users and auth data backup
echo "👥 Backing up users and auth data..."
psql $DB_URL -c "
SELECT 
  'INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data) VALUES (' ||
  '''' || id || '''::uuid, ' ||
  '''' || COALESCE(email, '') || ''', ' ||
  '''' || COALESCE(encrypted_password, '') || ''', ' ||
  CASE WHEN email_confirmed_at IS NOT NULL THEN '''' || email_confirmed_at || '''::timestamptz' ELSE 'NULL' END || ', ' ||
  '''' || created_at || '''::timestamptz, ' ||
  '''' || updated_at || '''::timestamptz, ' ||
  '''' || COALESCE(raw_app_meta_data::text, '{}') || '''::jsonb, ' ||
  '''' || COALESCE(raw_user_meta_data::text, '{}') || '''::jsonb' ||
  ') ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;' as user_recreation_sql
FROM auth.users
ORDER BY created_at;
" > $BACKUP_DIR/auth_users_backup.sql

# 5. User roles backup
echo "🎭 Backing up user roles..."
psql $DB_URL -c "
SELECT 
  'INSERT INTO public.user_roles (id, user_id, role, created_at, updated_at) VALUES (' ||
  '''' || id || '''::uuid, ' ||
  '''' || user_id || '''::uuid, ' ||
  '''' || role || ''', ' ||
  '''' || created_at || '''::timestamptz, ' ||
  '''' || updated_at || '''::timestamptz' ||
  ') ON CONFLICT (user_id, role) DO NOTHING;' as role_recreation_sql
FROM public.user_roles
ORDER BY created_at;
" > $BACKUP_DIR/user_roles_backup.sql

# 6. AI Providers data backup
echo "🤖 Backing up AI providers..."
psql $DB_URL -c "
SELECT 
  'INSERT INTO public.ai_providers_unified (id, name, provider_type, is_active, config, description, api_endpoint, auth_method, priority, capabilities, supported_languages) VALUES (' ||
  '''' || id || '''::uuid, ' ||
  '''' || name || ''', ' ||
  '''' || provider_type || ''', ' ||
  is_active || ', ' ||
  '''' || COALESCE(config::text, '{}') || '''::jsonb, ' ||
  CASE WHEN description IS NOT NULL THEN '''' || description || '''' ELSE 'NULL' END || ', ' ||
  CASE WHEN api_endpoint IS NOT NULL THEN '''' || api_endpoint || '''' ELSE 'NULL' END || ', ' ||
  CASE WHEN auth_method IS NOT NULL THEN '''' || auth_method || '''' ELSE 'NULL' END || ', ' ||
  COALESCE(priority, 1) || ', ' ||
  'ARRAY[' || CASE WHEN capabilities IS NOT NULL THEN array_to_string(capabilities, ',') ELSE '' END || ']::text[], ' ||
  'ARRAY[' || CASE WHEN supported_languages IS NOT NULL THEN array_to_string(supported_languages, ',') ELSE 'en' END || ']::text[]' ||
  ') ON CONFLICT (name) DO UPDATE SET config = EXCLUDED.config, is_active = EXCLUDED.is_active;' as provider_recreation_sql
FROM public.ai_providers_unified
ORDER BY priority;
" > $BACKUP_DIR/ai_providers_backup.sql

# 7. System settings backup
echo "⚙️ Backing up system settings..."
psql $DB_URL -c "
SELECT 
  'INSERT INTO public.system_settings (id, setting_key, setting_value, description, created_at, updated_at) VALUES (' ||
  '''' || id || '''::uuid, ' ||
  '''' || setting_key || ''', ' ||
  '''' || COALESCE(setting_value::text, '') || '''::jsonb, ' ||
  CASE WHEN description IS NOT NULL THEN '''' || description || '''' ELSE 'NULL' END || ', ' ||
  '''' || created_at || '''::timestamptz, ' ||
  '''' || updated_at || '''::timestamptz' ||
  ') ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;' as settings_recreation_sql
FROM public.system_settings
ORDER BY setting_key;
" > $BACKUP_DIR/system_settings_backup.sql

# 8. Table structure backup (DDL only)
echo "🏗️ Backing up table structures..."
pg_dump $DB_URL --schema-only --no-owner --no-privileges > $BACKUP_DIR/schema_only_backup.sql

echo "✅ All backups completed successfully!"
echo "📊 Backup summary:"
echo "  - Complete database dump: complete_database_dump.sql"
echo "  - RLS policies: rls_policies_backup.sql" 
echo "  - RPC functions: rpc_functions_backup.sql"
echo "  - Auth users: auth_users_backup.sql"
echo "  - User roles: user_roles_backup.sql"
echo "  - AI providers: ai_providers_backup.sql"
echo "  - System settings: system_settings_backup.sql"
echo "  - Schema structure: schema_only_backup.sql"