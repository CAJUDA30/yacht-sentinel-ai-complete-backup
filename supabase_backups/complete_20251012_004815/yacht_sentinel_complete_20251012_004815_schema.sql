

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_default_user_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."assign_default_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_permission"("permission_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_user_permission"("permission_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_onboarding_workflow"("p_workflow_id" "text", "p_crew_member_id" "text", "p_yacht_id" "uuid", "p_assigned_by" "uuid", "p_initial_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    workflow_uuid UUID;
BEGIN
    -- Generate UUID for workflow
    workflow_uuid := gen_random_uuid();
    
    -- For now, just return the UUID (table might not exist yet)
    RETURN workflow_uuid;
END;
$$;


ALTER FUNCTION "public"."create_onboarding_workflow"("p_workflow_id" "text", "p_crew_member_id" "text", "p_yacht_id" "uuid", "p_assigned_by" "uuid", "p_initial_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_user_role"("user_id_param" "uuid", "role_param" "text" DEFAULT 'user'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id_param, role_param, NOW(), NOW())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."ensure_user_role"("user_id_param" "uuid", "role_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_crew_list_data"("p_yacht_id" "uuid", "p_port_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_crew_list_data"("p_yacht_id" "uuid", "p_port_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_performance_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_current_performance_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_yacht_access_detailed"("p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("yacht_id" "uuid", "yacht_name" "text", "yacht_type" "text", "access_level" "text", "permissions" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_yacht_access_detailed"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_yacht_comparison_metrics"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_yacht_comparison_metrics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
        AND email = 'superadmin@yachtexcel.com'
    );
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_superadmin"() IS 'Checks if current user is superadmin (superadmin@yachtexcel.com)';



CREATE OR REPLACE FUNCTION "public"."is_superadmin_by_email"("user_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = COALESCE(user_id, auth.uid())
        AND email = 'superadmin@yachtexcel.com'
    );
$$;


ALTER FUNCTION "public"."is_superadmin_by_email"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_ai_provider_config"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If config is updated, copy to configuration
  IF NEW.config IS DISTINCT FROM OLD.config THEN
    NEW.configuration := NEW.config;
  END IF;
  
  -- If configuration is updated, copy to config
  IF NEW.configuration IS DISTINCT FROM OLD.configuration THEN
    NEW.config := NEW.configuration;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_ai_provider_config"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_health" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "last_checked_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "ai_health_status_check" CHECK (("status" = ANY (ARRAY['connected'::"text", 'error'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."ai_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_models_unified" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "display_name" "text",
    "provider_id" "uuid" NOT NULL,
    "model_type" "text" DEFAULT 'text'::"text",
    "is_active" boolean DEFAULT true,
    "max_tokens" integer,
    "input_cost_per_token" numeric(10,8),
    "output_cost_per_token" numeric(10,8),
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb",
    "priority" integer DEFAULT 0,
    "description" "text"
);


ALTER TABLE "public"."ai_models_unified" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_models_unified" IS 'AI models table with foreign key relationship to ai_providers_unified. Stores model configurations, capabilities, and metadata.';



CREATE TABLE IF NOT EXISTS "public"."ai_provider_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "message" "text",
    "latency_ms" integer,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."ai_provider_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_providers_unified" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "base_url" "text",
    "api_endpoint" "text",
    "auth_type" "text" DEFAULT 'bearer'::"text",
    "auth_header_name" "text" DEFAULT 'Authorization'::"text",
    "api_secret_name" "text",
    "models_endpoint" "text",
    "discovery_url" "text",
    "description" "text",
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "auth_method" "text" DEFAULT 'api_key'::"text",
    "provider_type" "text" DEFAULT 'openai'::"text",
    "priority" integer DEFAULT 1,
    "is_primary" boolean DEFAULT false,
    "rate_limit_per_minute" integer DEFAULT 60,
    "supported_languages" "text"[] DEFAULT ARRAY['en'::"text"],
    "last_health_check" timestamp with time zone,
    "health_status" "text" DEFAULT 'unknown'::"text",
    "error_count" integer DEFAULT 0,
    "success_rate" numeric(5,2) DEFAULT 100.00,
    "configuration" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."ai_providers_unified" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_providers_unified" IS 'Unified AI provider configuration table with complete schema including auth_method, provider_type, priority, and health monitoring fields';



CREATE TABLE IF NOT EXISTS "public"."ai_system_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config_key" "text" NOT NULL,
    "config_value" "jsonb" NOT NULL,
    "description" "text",
    "is_sensitive" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."ai_system_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_system_config" IS 'AI system configuration settings with sensitive data support';



CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "module" "text" NOT NULL,
    "user_id" "uuid",
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "severity" "text" DEFAULT 'info'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "analytics_events_severity_check" CHECK (("severity" = ANY (ARRAY['debug'::"text", 'info'::"text", 'warning'::"text", 'error'::"text", 'critical'::"text"])))
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "workflow_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "schedule_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."audit_workflows" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_workflows" IS 'Audit workflow configurations for automated compliance checks';



CREATE TABLE IF NOT EXISTS "public"."edge_function_health" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "last_checked_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "latency_ms" integer,
    "region" "text" DEFAULT 'unknown'::"text",
    "version" "text" DEFAULT 'unknown'::"text",
    "error" "jsonb" DEFAULT '{}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."edge_function_health" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edge_function_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "function_name" "text" NOT NULL,
    "enabled" boolean DEFAULT true,
    "timeout_ms" integer DEFAULT 10000,
    "warm_schedule" "text" DEFAULT '*/10 * * * *'::"text",
    "verify_jwt" boolean DEFAULT false,
    "department" "text" DEFAULT 'Operations'::"text",
    "feature_flag" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."edge_function_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_bus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "severity" "text" DEFAULT 'info'::"text",
    "module" "text" DEFAULT 'system'::"text",
    "department" "text" DEFAULT 'Operations'::"text",
    "source" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."event_bus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "quantity" integer DEFAULT 0,
    "unit_price" numeric(10,2),
    "total_value" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    "location" "text",
    "yacht_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."inventory_items" IS 'Yacht inventory management - tracks items, quantities, and values';



CREATE TABLE IF NOT EXISTS "public"."llm_provider_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "model_id" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "capabilities" "jsonb" DEFAULT '{}'::"jsonb",
    "fetched_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."llm_provider_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'system'::"text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unified_ai_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."unified_ai_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."unified_ai_configs" IS 'Stores unified AI configuration including Google Cloud Document AI settings. Service-role only access for security.';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'superadmin'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."yacht_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "yacht_id" "uuid",
    "owner_id" "uuid",
    "profile_name" "text" NOT NULL,
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."yacht_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."yacht_profiles" IS 'Yacht profiles with configuration data for multi-profile support';



CREATE TABLE IF NOT EXISTS "public"."yachts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "length_meters" numeric(8,2),
    "year_built" integer,
    "flag_state" "text",
    "owner_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."yachts" OWNER TO "postgres";


COMMENT ON TABLE "public"."yachts" IS 'Core yacht registry - stores yacht information and ownership';



ALTER TABLE ONLY "public"."ai_health"
    ADD CONSTRAINT "ai_health_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_health"
    ADD CONSTRAINT "ai_health_provider_id_key" UNIQUE ("provider_id");



ALTER TABLE ONLY "public"."ai_models_unified"
    ADD CONSTRAINT "ai_models_unified_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ai_models_unified"
    ADD CONSTRAINT "ai_models_unified_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_provider_logs"
    ADD CONSTRAINT "ai_provider_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_providers_unified"
    ADD CONSTRAINT "ai_providers_unified_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ai_providers_unified"
    ADD CONSTRAINT "ai_providers_unified_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_system_config"
    ADD CONSTRAINT "ai_system_config_config_key_key" UNIQUE ("config_key");



ALTER TABLE ONLY "public"."ai_system_config"
    ADD CONSTRAINT "ai_system_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_workflows"
    ADD CONSTRAINT "audit_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_function_health"
    ADD CONSTRAINT "edge_function_health_function_name_key" UNIQUE ("function_name");



ALTER TABLE ONLY "public"."edge_function_health"
    ADD CONSTRAINT "edge_function_health_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edge_function_settings"
    ADD CONSTRAINT "edge_function_settings_function_name_key" UNIQUE ("function_name");



ALTER TABLE ONLY "public"."edge_function_settings"
    ADD CONSTRAINT "edge_function_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_bus"
    ADD CONSTRAINT "event_bus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_provider_models"
    ADD CONSTRAINT "llm_provider_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."llm_provider_models"
    ADD CONSTRAINT "llm_provider_models_provider_id_model_id_key" UNIQUE ("provider_id", "model_id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unified_ai_configs"
    ADD CONSTRAINT "unified_ai_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."yacht_profiles"
    ADD CONSTRAINT "yacht_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."yachts"
    ADD CONSTRAINT "yachts_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_ai_health_provider_id" ON "public"."ai_health" USING "btree" ("provider_id");



CREATE INDEX "idx_ai_health_status" ON "public"."ai_health" USING "btree" ("status");



CREATE INDEX "idx_ai_models_unified_active" ON "public"."ai_models_unified" USING "btree" ("is_active");



CREATE INDEX "idx_ai_models_unified_name" ON "public"."ai_models_unified" USING "btree" ("name");



CREATE INDEX "idx_ai_models_unified_priority" ON "public"."ai_models_unified" USING "btree" ("priority" DESC);



CREATE INDEX "idx_ai_models_unified_provider_id" ON "public"."ai_models_unified" USING "btree" ("provider_id");



CREATE INDEX "idx_ai_provider_logs_created_at" ON "public"."ai_provider_logs" USING "btree" ("created_at");



CREATE INDEX "idx_ai_provider_logs_provider_id" ON "public"."ai_provider_logs" USING "btree" ("provider_id");



CREATE INDEX "idx_ai_providers_unified_active" ON "public"."ai_providers_unified" USING "btree" ("is_active");



CREATE INDEX "idx_ai_providers_unified_health_status" ON "public"."ai_providers_unified" USING "btree" ("health_status");



CREATE INDEX "idx_ai_providers_unified_name" ON "public"."ai_providers_unified" USING "btree" ("name");



CREATE INDEX "idx_ai_providers_unified_primary" ON "public"."ai_providers_unified" USING "btree" ("is_primary");



CREATE INDEX "idx_ai_providers_unified_priority" ON "public"."ai_providers_unified" USING "btree" ("priority");



CREATE INDEX "idx_ai_providers_unified_type" ON "public"."ai_providers_unified" USING "btree" ("provider_type");



CREATE INDEX "idx_ai_system_config_key" ON "public"."ai_system_config" USING "btree" ("config_key");



CREATE INDEX "idx_ai_system_config_sensitive" ON "public"."ai_system_config" USING "btree" ("is_sensitive");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_module" ON "public"."analytics_events" USING "btree" ("module");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_audit_workflows_active" ON "public"."audit_workflows" USING "btree" ("is_active");



CREATE INDEX "idx_audit_workflows_created_at" ON "public"."audit_workflows" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_edge_function_health_function_name" ON "public"."edge_function_health" USING "btree" ("function_name");



CREATE INDEX "idx_edge_function_health_status" ON "public"."edge_function_health" USING "btree" ("status");



CREATE INDEX "idx_edge_function_settings_function_name" ON "public"."edge_function_settings" USING "btree" ("function_name");



CREATE INDEX "idx_event_bus_created_at" ON "public"."event_bus" USING "btree" ("created_at");



CREATE INDEX "idx_event_bus_event_type" ON "public"."event_bus" USING "btree" ("event_type");



CREATE INDEX "idx_inventory_items_category" ON "public"."inventory_items" USING "btree" ("category");



CREATE INDEX "idx_inventory_items_created_at" ON "public"."inventory_items" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inventory_items_yacht_id" ON "public"."inventory_items" USING "btree" ("yacht_id");



CREATE INDEX "idx_llm_provider_models_provider_id" ON "public"."llm_provider_models" USING "btree" ("provider_id");



CREATE INDEX "idx_system_settings_category" ON "public"."system_settings" USING "btree" ("category");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("key");



CREATE INDEX "idx_unified_ai_configs_updated_at" ON "public"."unified_ai_configs" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_user_roles_role" ON "public"."user_roles" USING "btree" ("role");



CREATE INDEX "idx_user_roles_user_id" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_yacht_profiles_active" ON "public"."yacht_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_yacht_profiles_owner_id" ON "public"."yacht_profiles" USING "btree" ("owner_id");



CREATE INDEX "idx_yacht_profiles_yacht_id" ON "public"."yacht_profiles" USING "btree" ("yacht_id");



CREATE INDEX "idx_yachts_created_at" ON "public"."yachts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_yachts_owner_id" ON "public"."yachts" USING "btree" ("owner_id");



CREATE OR REPLACE TRIGGER "sync_config_trigger" BEFORE INSERT OR UPDATE ON "public"."ai_providers_unified" FOR EACH ROW EXECUTE FUNCTION "public"."sync_ai_provider_config"();



CREATE OR REPLACE TRIGGER "trigger_ai_providers_unified_updated_at" BEFORE UPDATE ON "public"."ai_providers_unified" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_ai_system_config_updated_at" BEFORE UPDATE ON "public"."ai_system_config" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_audit_workflows_updated_at" BEFORE UPDATE ON "public"."audit_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_edge_function_settings_updated_at" BEFORE UPDATE ON "public"."edge_function_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_inventory_items_updated_at" BEFORE UPDATE ON "public"."inventory_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_yacht_profiles_updated_at" BEFORE UPDATE ON "public"."yacht_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_yachts_updated_at" BEFORE UPDATE ON "public"."yachts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."ai_health"
    ADD CONSTRAINT "ai_health_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers_unified"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_models_unified"
    ADD CONSTRAINT "ai_models_unified_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers_unified"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_provider_logs"
    ADD CONSTRAINT "ai_provider_logs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers_unified"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_system_config"
    ADD CONSTRAINT "ai_system_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_system_config"
    ADD CONSTRAINT "ai_system_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_workflows"
    ADD CONSTRAINT "audit_workflows_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."audit_workflows"
    ADD CONSTRAINT "audit_workflows_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."llm_provider_models"
    ADD CONSTRAINT "llm_provider_models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."ai_providers_unified"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."yacht_profiles"
    ADD CONSTRAINT "yacht_profiles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."yacht_profiles"
    ADD CONSTRAINT "yacht_profiles_yacht_id_fkey" FOREIGN KEY ("yacht_id") REFERENCES "public"."yachts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."yachts"
    ADD CONSTRAINT "yachts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow authenticated users to read user_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read access" ON "public"."ai_system_config" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read access" ON "public"."analytics_events" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."analytics_events" IS 'All authenticated users can read analytics';



CREATE POLICY "Authenticated read access" ON "public"."audit_workflows" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated read access" ON "public"."edge_function_health" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."edge_function_health" IS 'All authenticated users can read health data';



CREATE POLICY "Authenticated read access" ON "public"."edge_function_settings" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."edge_function_settings" IS 'All authenticated users can read settings';



CREATE POLICY "Authenticated read access" ON "public"."event_bus" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."event_bus" IS 'All authenticated users can read events';



CREATE POLICY "Authenticated read access" ON "public"."llm_provider_models" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."llm_provider_models" IS 'All authenticated users can read models';



CREATE POLICY "Authenticated read access" ON "public"."unified_ai_configs" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "Authenticated read access" ON "public"."unified_ai_configs" IS 'All authenticated users can read configs';



CREATE POLICY "Authenticated update access" ON "public"."ai_system_config" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated update access" ON "public"."audit_workflows" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated update access" ON "public"."inventory_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated update access" ON "public"."system_settings" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated write access" ON "public"."ai_system_config" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated write access" ON "public"."audit_workflows" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated write access" ON "public"."inventory_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated write access" ON "public"."system_settings" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read access for own roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner full access" ON "public"."yacht_profiles" TO "authenticated" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owner full access" ON "public"."yachts" TO "authenticated" USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Service role full access" ON "public"."ai_system_config" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."analytics_events" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."analytics_events" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."audit_workflows" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."edge_function_health" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."edge_function_health" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."edge_function_settings" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."edge_function_settings" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."event_bus" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."event_bus" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."llm_provider_models" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."llm_provider_models" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."unified_ai_configs" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "Service role full access" ON "public"."unified_ai_configs" IS 'Full unrestricted access for service role';



CREATE POLICY "Service role full access" ON "public"."user_roles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Superadmin delete access" ON "public"."ai_system_config" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



CREATE POLICY "Superadmin delete access" ON "public"."audit_workflows" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



CREATE POLICY "Superadmin full access" ON "public"."ai_system_config" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



CREATE POLICY "Superadmin full access" ON "public"."analytics_events" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."analytics_events" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."audit_workflows" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



CREATE POLICY "Superadmin full access" ON "public"."edge_function_health" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."edge_function_health" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."edge_function_settings" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."edge_function_settings" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."event_bus" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."event_bus" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."llm_provider_models" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."llm_provider_models" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."unified_ai_configs" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



COMMENT ON POLICY "Superadmin full access" ON "public"."unified_ai_configs" IS 'Superadmin has full access using direct email check';



CREATE POLICY "Superadmin full access" ON "public"."user_roles" TO "authenticated" USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))) WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text"))));



CREATE POLICY "Superadmin full access to user_roles" ON "public"."user_roles" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ((("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text") OR (("users"."raw_user_meta_data" ->> 'role'::"text") = 'superadmin'::"text") OR (("users"."raw_app_meta_data" ->> 'role'::"text") = 'superadmin'::"text"))))));



CREATE POLICY "Users read own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Yacht owner and superadmin delete access" ON "public"."inventory_items" FOR DELETE TO "authenticated" USING ((("yacht_id" IN ( SELECT "yachts"."id"
   FROM "public"."yachts"
  WHERE ("yachts"."owner_id" = "auth"."uid"()))) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."email")::"text" = 'superadmin@yachtexcel.com'::"text")))));



ALTER TABLE "public"."ai_health" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_models_unified" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_provider_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_providers_unified" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_workflows" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_read_access" ON "public"."ai_health" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."ai_models_unified" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."ai_provider_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."ai_providers_unified" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."inventory_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."system_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."yacht_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access" ON "public"."yachts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_read_access_ai_providers" ON "public"."ai_providers_unified" FOR SELECT TO "authenticated" USING (true);



COMMENT ON POLICY "authenticated_read_access_ai_providers" ON "public"."ai_providers_unified" IS 'All authenticated users can read ai_providers_unified records';



ALTER TABLE "public"."edge_function_health" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edge_function_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_bus" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."llm_provider_models" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_full_access" ON "public"."ai_health" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."ai_models_unified" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."ai_provider_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."ai_providers_unified" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."inventory_items" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."system_settings" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."user_roles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."yacht_profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."yachts" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_full_access_ai_providers" ON "public"."ai_providers_unified" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_full_access_ai_providers" ON "public"."ai_providers_unified" IS 'Service role has unrestricted access to ai_providers_unified table';



CREATE POLICY "superadmin_all_access" ON "public"."ai_providers_unified" TO "authenticated" USING (("auth"."email"() = 'superadmin@yachtexcel.com'::"text"));



CREATE POLICY "superadmin_full_access" ON "public"."ai_health" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."ai_models_unified" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."ai_provider_logs" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."inventory_items" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."system_settings" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."user_roles" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."yacht_profiles" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_full_access" ON "public"."yachts" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unified_ai_configs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profile_access" ON "public"."yacht_profiles" TO "authenticated" USING (("public"."is_superadmin"() OR ("yacht_id" IN ( SELECT "yachts"."id"
   FROM "public"."yachts"
  WHERE ("yachts"."owner_id" = "auth"."uid"()))))) WITH CHECK (("public"."is_superadmin"() OR ("yacht_id" IN ( SELECT "yachts"."id"
   FROM "public"."yachts"
  WHERE ("yachts"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_yacht_access" ON "public"."yachts" TO "authenticated" USING ((("auth"."uid"() = "owner_id") OR "public"."is_superadmin"())) WITH CHECK ((("auth"."uid"() = "owner_id") OR "public"."is_superadmin"()));



CREATE POLICY "users_own_roles" ON "public"."user_roles" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_read_own_roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."yacht_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."yachts" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_default_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_permission"("permission_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_permission"("permission_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_permission"("permission_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_onboarding_workflow"("p_workflow_id" "text", "p_crew_member_id" "text", "p_yacht_id" "uuid", "p_assigned_by" "uuid", "p_initial_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_onboarding_workflow"("p_workflow_id" "text", "p_crew_member_id" "text", "p_yacht_id" "uuid", "p_assigned_by" "uuid", "p_initial_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_onboarding_workflow"("p_workflow_id" "text", "p_crew_member_id" "text", "p_yacht_id" "uuid", "p_assigned_by" "uuid", "p_initial_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_user_role"("user_id_param" "uuid", "role_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_user_role"("user_id_param" "uuid", "role_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_user_role"("user_id_param" "uuid", "role_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_crew_list_data"("p_yacht_id" "uuid", "p_port_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_crew_list_data"("p_yacht_id" "uuid", "p_port_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_crew_list_data"("p_yacht_id" "uuid", "p_port_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_performance_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_performance_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_performance_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_yacht_access_detailed"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_yacht_access_detailed"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_yacht_access_detailed"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_yacht_comparison_metrics"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_yacht_comparison_metrics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_yacht_comparison_metrics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin_by_email"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin_by_email"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin_by_email"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_ai_provider_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_ai_provider_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_ai_provider_config"() TO "service_role";


















GRANT ALL ON TABLE "public"."ai_health" TO "anon";
GRANT ALL ON TABLE "public"."ai_health" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_health" TO "service_role";



GRANT ALL ON TABLE "public"."ai_models_unified" TO "anon";
GRANT ALL ON TABLE "public"."ai_models_unified" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_models_unified" TO "service_role";



GRANT ALL ON TABLE "public"."ai_provider_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_provider_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_provider_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_providers_unified" TO "anon";
GRANT ALL ON TABLE "public"."ai_providers_unified" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_providers_unified" TO "service_role";



GRANT ALL ON TABLE "public"."ai_system_config" TO "anon";
GRANT ALL ON TABLE "public"."ai_system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_system_config" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."audit_workflows" TO "anon";
GRANT ALL ON TABLE "public"."audit_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."edge_function_health" TO "anon";
GRANT ALL ON TABLE "public"."edge_function_health" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_function_health" TO "service_role";



GRANT ALL ON TABLE "public"."edge_function_settings" TO "anon";
GRANT ALL ON TABLE "public"."edge_function_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."edge_function_settings" TO "service_role";



GRANT ALL ON TABLE "public"."event_bus" TO "anon";
GRANT ALL ON TABLE "public"."event_bus" TO "authenticated";
GRANT ALL ON TABLE "public"."event_bus" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."llm_provider_models" TO "anon";
GRANT ALL ON TABLE "public"."llm_provider_models" TO "authenticated";
GRANT ALL ON TABLE "public"."llm_provider_models" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."unified_ai_configs" TO "anon";
GRANT ALL ON TABLE "public"."unified_ai_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."unified_ai_configs" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."yacht_profiles" TO "anon";
GRANT ALL ON TABLE "public"."yacht_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."yacht_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."yachts" TO "anon";
GRANT ALL ON TABLE "public"."yachts" TO "authenticated";
GRANT ALL ON TABLE "public"."yachts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
