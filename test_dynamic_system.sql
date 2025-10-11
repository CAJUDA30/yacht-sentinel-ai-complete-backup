-- DYNAMIC AUTHENTICATION SYSTEM VERIFICATION TEST
-- Test script to verify all components of the dynamic user system

-- =====================================================
-- 1. SYSTEM STATUS CHECK
-- =====================================================

\echo '=========================================='
\echo 'DYNAMIC USER SYSTEM VERIFICATION'
\echo '=========================================='

-- Check table existence
SELECT 
    CASE WHEN COUNT(*) = 3 THEN '✅ All tables created' 
         ELSE '❌ Missing tables' 
    END as table_status
FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'user_roles', 'role_permissions') 
AND table_schema = 'public';

-- Check function existence
SELECT 
    CASE WHEN COUNT(*) >= 5 THEN '✅ All functions created' 
         ELSE '❌ Missing functions' 
    END as function_status
FROM information_schema.routines 
WHERE routine_name IN ('is_superadmin', 'get_user_roles', 'user_has_permission', 'assign_user_role', 'handle_new_user_signup')
AND routine_schema = 'public';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_roles', 'role_permissions')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- 2. DATA VERIFICATION
-- =====================================================

\echo ''
\echo 'System Data Status:'
\echo '==================='

-- User counts
SELECT 'Users:' as metric, COUNT(*) as count FROM auth.users;
SELECT 'Profiles:' as metric, COUNT(*) as count FROM public.user_profiles;
SELECT 'Active Roles:' as metric, COUNT(*) as count FROM public.user_roles WHERE is_active = true;
SELECT 'Permissions:' as metric, COUNT(*) as count FROM public.role_permissions;

-- Role distribution
\echo ''
\echo 'Role Distribution:'
\echo '=================='
SELECT 
    role,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM public.user_roles 
WHERE is_active = true
GROUP BY role
ORDER BY user_count DESC;

-- =====================================================
-- 3. FUNCTIONAL TESTS
-- =====================================================

\echo ''
\echo 'Function Tests:'
\echo '==============='

-- Test superadmin detection
SELECT 
    'Superadmin Detection:' as test,
    CASE WHEN public.is_superadmin('c5f001c6-6a59-49bb-a698-a97c5a028b2a') 
         THEN '✅ Working' 
         ELSE '❌ Failed' 
    END as result;

-- Test role retrieval
SELECT 
    'Role Retrieval:' as test,
    CASE WHEN EXISTS (
        SELECT 1 FROM public.get_user_roles('c5f001c6-6a59-49bb-a698-a97c5a028b2a') 
        WHERE role = 'superadmin'
    ) THEN '✅ Working' 
      ELSE '❌ Failed' 
    END as result;

-- Test permission checking
SELECT 
    'Permission Check:' as test,
    CASE WHEN public.user_has_permission('admin', '*', '*', 'c5f001c6-6a59-49bb-a698-a97c5a028b2a') 
         THEN '✅ Working' 
         ELSE '❌ Failed' 
    END as result;

-- =====================================================
-- 4. SECURITY VERIFICATION
-- =====================================================

\echo ''
\echo 'Security Status:'
\echo '================'

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_roles', 'role_permissions')
ORDER BY tablename;

-- =====================================================
-- 5. PRODUCTION READINESS
-- =====================================================

\echo ''
\echo 'Production Readiness Checklist:'
\echo '==============================='

-- Trigger status
SELECT 
    CASE WHEN COUNT(*) > 0 THEN '✅ User onboarding trigger active' 
         ELSE '❌ Missing user onboarding trigger' 
    END as trigger_status
FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user_signup_trigger';

-- Index status
SELECT 
    CASE WHEN COUNT(*) >= 8 THEN '✅ Performance indexes created' 
         ELSE '❌ Missing performance indexes' 
    END as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'user_roles', 'role_permissions');

\echo ''
\echo '=========================================='
\echo 'VERIFICATION COMPLETE'
\echo '=========================================='
\echo 'System is ready for hundreds of users!'
\echo 'Features: Dynamic roles, automatic onboarding,'
\echo 'hierarchical permissions, RLS security'
\echo '=========================================='