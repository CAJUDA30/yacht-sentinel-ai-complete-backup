DROP FUNCTION IF EXISTS auth.email() CASCADE;
CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$function$



DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
CREATE OR REPLACE FUNCTION auth.jwt()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$function$



DROP FUNCTION IF EXISTS auth.role() CASCADE;
CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$function$



DROP FUNCTION IF EXISTS auth.uid() CASCADE;
CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$



DROP FUNCTION IF EXISTS public.assign_default_user_role() CASCADE;
CREATE OR REPLACE FUNCTION public.assign_default_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Auto-assign role based on email
    IF NEW.email = 'superadmin@yachtexcel.com' THEN
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.id, 'superadmin', NOW(), NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
        VALUES (NEW.id, 'user', NOW(), NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$function$



DROP FUNCTION IF EXISTS public.check_user_permission(permission_name text) CASCADE;
CREATE OR REPLACE FUNCTION public.check_user_permission(permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
    user_email text;
    user_role text;
BEGIN
    -- Get current user email
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = auth.uid();
    
    -- Check if superadmin
    IF user_email = 'superadmin@yachtexcel.com' THEN
        RETURN true;
    END IF;
    
    -- Get user role
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Basic permission checks
    CASE 
        WHEN permission_name = 'read' THEN
            RETURN true; -- All authenticated users can read
        WHEN permission_name = 'write' AND user_role IN ('admin', 'superadmin') THEN
            RETURN true;
        WHEN permission_name = 'delete' AND user_role = 'superadmin' THEN
            RETURN true;
        ELSE
            RETURN false;
    END CASE;
END;
$function$



DROP FUNCTION IF EXISTS public.create_onboarding_workflow(p_workflow_id text, p_crew_member_id text, p_yacht_id uuid, p_assigned_by uuid, p_initial_data jsonb) CASCADE;
CREATE OR REPLACE FUNCTION public.create_onboarding_workflow(p_workflow_id text, p_crew_member_id text, p_yacht_id uuid, p_assigned_by uuid, p_initial_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    workflow_uuid UUID;
BEGIN
    -- Generate UUID for workflow
    workflow_uuid := gen_random_uuid();
    
    -- For now, just return the UUID (table might not exist yet)
    RETURN workflow_uuid;
END;
$function$



DROP FUNCTION IF EXISTS public.ensure_user_role(user_id_param uuid, role_param text) CASCADE;
CREATE OR REPLACE FUNCTION public.ensure_user_role(user_id_param uuid, role_param text DEFAULT 'user'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Insert role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id_param, role_param, NOW(), NOW())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET updated_at = NOW();
END;
$function$



DROP FUNCTION IF EXISTS public.generate_crew_list_data(p_yacht_id uuid, p_port_id text) CASCADE;
CREATE OR REPLACE FUNCTION public.generate_crew_list_data(p_yacht_id uuid, p_port_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Return mock crew data for formalities
    RETURN '{
        "yachtId": "' || p_yacht_id || '",
        "portId": "' || p_port_id || '",
        "crewMembers": [
            {
                "name": "Captain John Smith",
                "position": "Captain",
                "nationality": "US",
                "passportNumber": "US123456789"
            }
        ]
    }'::JSONB;
END;
$function$



DROP FUNCTION IF EXISTS public.get_current_performance_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.get_current_performance_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Return mock performance metrics for now
    RETURN '{
        "uptime": 99.9,
        "activeUsers": 1,
        "resourceUsage": {
            "memory": 45.2,
            "cpu": 12.8,
            "storage": 23.1
        },
        "requestsPerMinute": 150,
        "averageResponseTime": 250,
        "errorRate": 0.1
    }'::JSONB;
END;
$function$



DROP FUNCTION IF EXISTS public.get_user_yacht_access_detailed(p_user_id uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_yacht_access_detailed(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(yacht_id uuid, yacht_name text, yacht_type text, access_level text, permissions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Use current user if no target specified
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    -- For superadmin, return all yachts or mock data
    IF public.is_superadmin() THEN
        RETURN QUERY
        SELECT 
            y.id as yacht_id,
            COALESCE(y.name, 'Yacht ' || y.id::text) as yacht_name,
            COALESCE(y.yacht_type, 'Motor Yacht') as yacht_type,
            'superadmin'::TEXT as access_level,
            '{"read": true, "write": true, "admin": true, "superadmin": true}'::JSONB as permissions
        FROM (SELECT gen_random_uuid() as id, 'Sample Yacht' as name, 'Motor Yacht' as yacht_type LIMIT 1) y;
    ELSE
        -- For regular users, return their own yachts or empty set
        RETURN QUERY
        SELECT 
            NULL::UUID as yacht_id,
            'Access Denied'::TEXT as yacht_name,
            'N/A'::TEXT as yacht_type,
            'none'::TEXT as access_level,
            '{"read": false, "write": false, "admin": false}'::JSONB as permissions
        WHERE FALSE; -- Returns empty set
    END IF;
END;
$function$



DROP FUNCTION IF EXISTS public.get_yacht_comparison_metrics() CASCADE;
CREATE OR REPLACE FUNCTION public.get_yacht_comparison_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Return mock comparison data
    RETURN '[{
        "yachtId": "sample-yacht-1",
        "name": "Sample Yacht 1",
        "metrics": {
            "fuelEfficiency": 8.5,
            "maintenanceCost": 15000,
            "utilizationRate": 75.5
        }
    }]'::JSONB;
END;
$function$



DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$



DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_superadmin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
        AND email = 'superadmin@yachtexcel.com'
    );
$function$



DROP FUNCTION IF EXISTS public.is_superadmin_by_email(user_id uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.is_superadmin_by_email(user_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = COALESCE(user_id, auth.uid())
        AND email = 'superadmin@yachtexcel.com'
    );
$function$



