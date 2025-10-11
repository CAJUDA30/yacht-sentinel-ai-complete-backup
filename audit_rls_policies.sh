#!/bin/bash
# Audit all RLS policies in the database

PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres << 'EOF'

\echo '================================'
\echo 'RLS POLICIES AUDIT REPORT'
\echo '================================'
\echo ''

-- List all tables with RLS status
\echo '1. TABLES WITH RLS ENABLED'
\echo '----------------------------'
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

\echo ''
\echo '2. ALL RLS POLICIES BY TABLE'
\echo '----------------------------'

-- Get all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

\echo ''
\echo '3. TABLES WITHOUT RLS POLICIES'
\echo '----------------------------'

SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true
  AND p.policyname IS NULL
GROUP BY t.tablename
ORDER BY t.tablename;

\echo ''
\echo '4. POLICY COUNT BY TABLE'
\echo '----------------------------'

SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC, tablename;

EOF
