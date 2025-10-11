#!/bin/bash
# Check for potentially recursive RLS policies

PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres << 'EOF'

\echo '================================'
\echo 'CHECKING FOR RECURSIVE POLICIES'
\echo '================================'
\echo ''

\echo '1. POLICIES THAT QUERY user_roles TABLE (POTENTIAL RECURSION)'
\echo '-------------------------------------------------------------'

SELECT 
    tablename,
    policyname,
    CASE 
        WHEN qual::text LIKE '%user_roles%' THEN '⚠️ USES user_roles'
        ELSE '✅ No user_roles'
    END as recursion_risk,
    qual::text as using_clause
FROM pg_policies 
WHERE schemaname = 'public'
  AND qual::text LIKE '%user_roles%'
ORDER BY tablename, policyname;

\echo ''
\echo '2. TABLES WITH SAFE SUPERADMIN POLICIES (auth.users email check)'
\echo '------------------------------------------------------------------'

SELECT 
    tablename,
    COUNT(*) as policy_count,
    COUNT(CASE WHEN qual::text LIKE '%superadmin@yachtexcel.com%' THEN 1 END) as safe_superadmin_policies,
    COUNT(CASE WHEN qual::text LIKE '%user_roles%' THEN 1 END) as recursive_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY recursive_policies DESC, tablename;

\echo ''
\echo '3. POLICY PATTERN SUMMARY'
\echo '-------------------------'

SELECT 
    CASE 
        WHEN qual::text LIKE '%auth.role() = ''service_role''%' THEN 'Service Role Full Access'
        WHEN qual::text = 'true' AND cmd = 'SELECT' THEN 'Authenticated Read (Open)'
        WHEN qual::text LIKE '%superadmin@yachtexcel.com%' THEN 'Superadmin (Email Check)'
        WHEN qual::text LIKE '%user_roles%' THEN '⚠️ RECURSIVE (user_roles)'
        WHEN qual::text LIKE '%owner_id%' THEN 'Owner-Based Access'
        ELSE 'Other Pattern'
    END as policy_pattern,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY policy_pattern
ORDER BY count DESC;

EOF
