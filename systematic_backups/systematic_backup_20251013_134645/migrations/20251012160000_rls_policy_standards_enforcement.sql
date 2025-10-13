-- ============================================================================
-- RLS POLICY STANDARDS ENFORCEMENT - PERMANENT MIGRATION
-- ============================================================================
-- This migration ensures RLS policies follow the unified 3-policy standard
-- and creates enforcement functions to prevent future conflicts
-- Based on: RLS_POLICIES_UNIFICATION_SUMMARY.md patterns

-- ============================================================================
-- 1. CREATE RLS POLICY ENFORCEMENT FUNCTIONS
-- ============================================================================

-- Function to enforce standard RLS policy set for any table
CREATE OR REPLACE FUNCTION public.enforce_standard_rls_policies(
    p_table_name text,
    p_include_owner_access boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_exists boolean;
BEGIN
    -- Validate table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = p_table_name AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Table public.% does not exist', p_table_name;
    END IF;

    -- Enable RLS if not already enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);

    -- Drop any existing conflicting policies (but keep the standard ones)
    PERFORM public.cleanup_conflicting_rls_policies(p_table_name);

    -- 1. Service role full access policy
    SELECT COUNT(*) > 0 INTO policy_exists 
    FROM pg_policies 
    WHERE tablename = p_table_name AND policyname = 'service_role_complete_access';
    
    IF NOT policy_exists THEN
        EXECUTE format('
            CREATE POLICY "service_role_complete_access"
            ON public.%I
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true)
        ', p_table_name);
    END IF;

    -- 2. Authenticated read access
    SELECT COUNT(*) > 0 INTO policy_exists 
    FROM pg_policies 
    WHERE tablename = p_table_name AND policyname = 'authenticated_read_only';
    
    IF NOT policy_exists THEN
        EXECUTE format('
            CREATE POLICY "authenticated_read_only"
            ON public.%I
            FOR SELECT
            TO authenticated
            USING (true)
        ', p_table_name);
    END IF;

    -- 3. Superadmin complete access
    SELECT COUNT(*) > 0 INTO policy_exists 
    FROM pg_policies 
    WHERE tablename = p_table_name AND policyname = 'superadmin_complete_access';
    
    IF NOT policy_exists THEN
        EXECUTE format('
            CREATE POLICY "superadmin_complete_access"
            ON public.%I
            FOR ALL
            TO authenticated
            USING (
                auth.uid() IN (
                    SELECT id FROM auth.users 
                    WHERE email = ''superadmin@yachtexcel.com''
                )
            )
            WITH CHECK (
                auth.uid() IN (
                    SELECT id FROM auth.users 
                    WHERE email = ''superadmin@yachtexcel.com''
                )
            )
        ', p_table_name);
    END IF;

    -- 4. Owner access (optional for tables with owner_id column)
    IF p_include_owner_access THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = p_table_name AND column_name = 'owner_id') THEN
            SELECT COUNT(*) > 0 INTO policy_exists 
            FROM pg_policies 
            WHERE tablename = p_table_name AND policyname = 'owner_full_access';
            
            IF NOT policy_exists THEN
                EXECUTE format('
                    CREATE POLICY "owner_full_access"
                    ON public.%I
                    FOR ALL
                    TO authenticated
                    USING (auth.uid() = owner_id)
                    WITH CHECK (auth.uid() = owner_id)
                ', p_table_name);
            END IF;
        END IF;
    END IF;

    RAISE NOTICE 'Standard RLS policies enforced for table: %', p_table_name;
END;
$$;

-- Function to cleanup conflicting RLS policies
CREATE OR REPLACE FUNCTION public.cleanup_conflicting_rls_policies(
    p_table_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_record record;
    standard_policies text[] := ARRAY[
        'service_role_complete_access',
        'authenticated_read_only', 
        'superadmin_complete_access',
        'owner_full_access'
    ];
BEGIN
    -- Drop all policies that are NOT in our standard list
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = p_table_name 
        AND policyname <> ALL(standard_policies)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%I', policy_record.policyname, p_table_name);
        RAISE NOTICE 'Removed conflicting policy: % from table %', policy_record.policyname, p_table_name;
    END LOOP;
END;
$$;

-- Function to verify RLS policy integrity for a table
CREATE OR REPLACE FUNCTION public.verify_rls_integrity(
    p_table_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_count integer;
    missing_policies text[] := '{}';
    conflicting_policies text[] := '{}';
    result jsonb;
    policy_record record;
    standard_policies text[] := ARRAY[
        'service_role_complete_access',
        'authenticated_read_only', 
        'superadmin_complete_access'
    ];
    policy_name text;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = p_table_name;

    -- Check for missing standard policies
    FOREACH policy_name IN ARRAY standard_policies
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = p_table_name AND policyname = policy_name) THEN
            missing_policies := array_append(missing_policies, policy_name);
        END IF;
    END LOOP;

    -- Check for conflicting policies
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = p_table_name 
        AND policyname <> ALL(standard_policies)
        AND policyname != 'owner_full_access'  -- Allow owner policy
    LOOP
        conflicting_policies := array_append(conflicting_policies, policy_record.policyname);
    END LOOP;

    -- Build result
    result := jsonb_build_object(
        'table_name', p_table_name,
        'total_policies', policy_count,
        'missing_policies', to_jsonb(missing_policies),
        'conflicting_policies', to_jsonb(conflicting_policies),
        'is_compliant', (array_length(missing_policies, 1) IS NULL AND array_length(conflicting_policies, 1) IS NULL),
        'expected_policies', to_jsonb(standard_policies)
    );

    RETURN result;
END;
$$;

-- ============================================================================
-- 2. APPLY STANDARD POLICIES TO CRITICAL TABLES
-- ============================================================================

-- Apply to ai_providers_unified (the problematic table)
SELECT public.enforce_standard_rls_policies('ai_providers_unified');

-- Apply to other critical tables that should follow the standard
SELECT public.enforce_standard_rls_policies('user_roles');
SELECT public.enforce_standard_rls_policies('ai_models_unified');
SELECT public.enforce_standard_rls_policies('system_settings');

-- Apply to tables with owner concept
SELECT public.enforce_standard_rls_policies('yachts', true);
SELECT public.enforce_standard_rls_policies('inventory_items', true);

-- ============================================================================
-- 3. CREATE MONITORING TRIGGER
-- ============================================================================

-- Function to prevent creation of non-standard RLS policies
CREATE OR REPLACE FUNCTION public.prevent_non_standard_rls_policies()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
DECLARE
    obj record;
    policy_name text;
    table_name text;
    standard_policies text[] := ARRAY[
        'service_role_complete_access',
        'authenticated_read_only', 
        'superadmin_complete_access',
        'owner_full_access'
    ];
BEGIN
    -- Only process policy creation events
    FOR obj IN SELECT * FROM pg_event_trigger_ddl_commands() WHERE command_tag = 'CREATE POLICY'
    LOOP
        -- Extract policy and table names from the object
        SELECT 
            split_part(obj.object_identity, ' ON ', 1) as policy,
            split_part(split_part(obj.object_identity, ' ON ', 2), '.', 2) as table_n
        INTO policy_name, table_name;
        
        -- Check if this is a non-standard policy on a critical table
        IF table_name IN ('ai_providers_unified', 'user_roles', 'ai_models_unified') 
           AND policy_name <> ALL(standard_policies) THEN
            RAISE WARNING 'Non-standard RLS policy created: % on table %. Consider using enforce_standard_rls_policies() instead.', 
                policy_name, table_name;
        END IF;
    END LOOP;
END;
$$;

-- Create the event trigger (commented out as it might be too restrictive)
-- CREATE EVENT TRIGGER rls_policy_standards_check 
-- ON ddl_command_end 
-- WHEN TAG IN ('CREATE POLICY')
-- EXECUTE FUNCTION public.prevent_non_standard_rls_policies();

-- ============================================================================
-- 4. DOCUMENTATION AND COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.enforce_standard_rls_policies(text, boolean) IS 
'Enforces the standard 3-policy RLS pattern on any table: service_role_complete_access, authenticated_read_only, superadmin_complete_access. Optionally adds owner_full_access for tables with owner_id column.';

COMMENT ON FUNCTION public.cleanup_conflicting_rls_policies(text) IS 
'Removes all RLS policies that do not follow the standard naming convention to prevent conflicts.';

COMMENT ON FUNCTION public.verify_rls_integrity(text) IS 
'Verifies that a table follows the standard RLS policy pattern and returns a detailed report of compliance status.';

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Verify the migration worked for ai_providers_unified
DO $$
DECLARE
    verification_result jsonb;
BEGIN
    SELECT public.verify_rls_integrity('ai_providers_unified') INTO verification_result;
    
    IF (verification_result->>'is_compliant')::boolean THEN
        RAISE NOTICE '✅ ai_providers_unified RLS policies are now compliant';
        RAISE NOTICE 'Total policies: %', verification_result->>'total_policies';
    ELSE
        RAISE NOTICE '❌ ai_providers_unified still has issues:';
        RAISE NOTICE 'Missing: %', verification_result->>'missing_policies';
        RAISE NOTICE 'Conflicting: %', verification_result->>'conflicting_policies';
    END IF;
END;
$$;

-- Final status report
DO $$
BEGIN
    RAISE NOTICE '🎉 RLS Policy Standards Enforcement migration completed successfully!';
    RAISE NOTICE '📋 Functions created:';
    RAISE NOTICE '   - enforce_standard_rls_policies(table_name, include_owner_access)';
    RAISE NOTICE '   - cleanup_conflicting_rls_policies(table_name)';
    RAISE NOTICE '   - verify_rls_integrity(table_name)';
    RAISE NOTICE '🔒 Standard policies applied to critical tables';
    RAISE NOTICE '📚 Use SELECT public.verify_rls_integrity(''table_name'') to check compliance';
END;
$$;