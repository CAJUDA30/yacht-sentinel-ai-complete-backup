-- ============================================================================
-- COMPREHENSIVE RLS POLICIES BACKUP
-- ============================================================================
-- Generated: 2025-10-11 01:13:00 UTC
-- Purpose: Complete backup of all RLS policies and security configurations
-- Status: PRODUCTION BACKUP - ALL POLICIES INCLUDED
-- ============================================================================

-- Export all RLS policies
\echo '=== EXPORTING ALL RLS POLICIES ==='

-- Generate RLS policies backup for all tables
SELECT 
    '-- Table: ' || schemaname || '.' || tablename || E'\n' ||
    'ALTER TABLE ' || schemaname || '.' || tablename || ' ENABLE ROW LEVEL SECURITY;' || E'\n' ||
    string_agg(
        'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || 
        ' FOR ' || cmd || 
        ' TO ' || CASE 
            WHEN roles = '{0}' THEN 'PUBLIC'
            WHEN roles = '{16442}' THEN 'authenticated'  
            WHEN roles = '{16443}' THEN 'service_role'
            ELSE array_to_string(roles, ',')
        END ||
        CASE 
            WHEN qual IS NOT NULL THEN E'\n  USING (' || qual::text || ')'
            ELSE ''
        END ||
        CASE 
            WHEN with_check IS NOT NULL THEN E'\n  WITH CHECK (' || with_check::text || ')'
            ELSE ''
        END || ';',
        E'\n'
    ) || E'\n'
as policy_definitions
FROM pg_policies 
WHERE schemaname IN ('public', 'auth')
  AND tablename NOT LIKE 'pg_%'
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;