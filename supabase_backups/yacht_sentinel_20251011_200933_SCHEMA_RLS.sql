--
-- PostgreSQL database dump
--

\restrict VhYhbI4Jnj6jDvoQu4RN0P9knoDaln7jnJsSW0iN6t6BGMRhUpIBH3ivWp76BMy

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: assign_default_user_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_default_user_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: check_user_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_user_permission(permission_name text) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY DEFINER
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


--
-- Name: create_onboarding_workflow(text, text, uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_onboarding_workflow(p_workflow_id text, p_crew_member_id text, p_yacht_id uuid, p_assigned_by uuid, p_initial_data jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: ensure_user_role(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_user_role(user_id_param uuid, role_param text DEFAULT 'user'::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Insert role if it doesn't exist
    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)
    VALUES (user_id_param, role_param, NOW(), NOW())
    ON CONFLICT (user_id, role) 
    DO UPDATE SET updated_at = NOW();
END;
$$;


--
-- Name: generate_crew_list_data(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_crew_list_data(p_yacht_id uuid, p_port_id text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_current_performance_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_performance_metrics() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_user_yacht_access_detailed(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_yacht_access_detailed(p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(yacht_id uuid, yacht_name text, yacht_type text, access_level text, permissions jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: get_yacht_comparison_metrics(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_yacht_comparison_metrics() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: is_superadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid()
        AND email = 'superadmin@yachtexcel.com'
    );
$$;


--
-- Name: FUNCTION is_superadmin(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_superadmin() IS 'Checks if current user is superadmin (superadmin@yachtexcel.com)';


--
-- Name: is_superadmin_by_email(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin_by_email(user_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = COALESCE(user_id, auth.uid())
        AND email = 'superadmin@yachtexcel.com'
    );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: ai_health; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_health (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    status text NOT NULL,
    last_checked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT ai_health_status_check CHECK ((status = ANY (ARRAY['connected'::text, 'error'::text, 'unknown'::text])))
);


--
-- Name: ai_models_unified; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_models_unified (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    display_name text,
    provider_id uuid NOT NULL,
    model_type text DEFAULT 'text'::text,
    is_active boolean DEFAULT true,
    max_tokens integer,
    input_cost_per_token numeric(10,8),
    output_cost_per_token numeric(10,8),
    config jsonb DEFAULT '{}'::jsonb,
    capabilities jsonb DEFAULT '{}'::jsonb,
    priority integer DEFAULT 0,
    description text
);


--
-- Name: TABLE ai_models_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_models_unified IS 'AI models table with foreign key relationship to ai_providers_unified. Stores model configurations, capabilities, and metadata.';


--
-- Name: ai_provider_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_provider_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    status text NOT NULL,
    message text,
    latency_ms integer,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: ai_providers_unified; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_providers_unified (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    base_url text,
    api_endpoint text,
    auth_type text DEFAULT 'bearer'::text,
    auth_header_name text DEFAULT 'Authorization'::text,
    api_secret_name text,
    models_endpoint text,
    discovery_url text,
    description text,
    capabilities jsonb DEFAULT '{}'::jsonb,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    auth_method text DEFAULT 'api_key'::text,
    provider_type text DEFAULT 'openai'::text,
    priority integer DEFAULT 1,
    is_primary boolean DEFAULT false,
    rate_limit_per_minute integer DEFAULT 60,
    supported_languages text[] DEFAULT ARRAY['en'::text],
    last_health_check timestamp with time zone,
    health_status text DEFAULT 'unknown'::text,
    error_count integer DEFAULT 0,
    success_rate numeric(5,2) DEFAULT 100.00
);


--
-- Name: TABLE ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_providers_unified IS 'Unified AI provider configuration table with complete schema including auth_method, provider_type, priority, and health monitoring fields';


--
-- Name: ai_system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_system_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_key text NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    is_sensitive boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE ai_system_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_system_config IS 'AI system configuration settings with sensitive data support';


--
-- Name: analytics_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    module text NOT NULL,
    user_id uuid,
    event_data jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    severity text DEFAULT 'info'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT analytics_events_severity_check CHECK ((severity = ANY (ARRAY['debug'::text, 'info'::text, 'warning'::text, 'error'::text, 'critical'::text])))
);


--
-- Name: audit_workflows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    workflow_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    schedule_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE audit_workflows; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.audit_workflows IS 'Audit workflow configurations for automated compliance checks';


--
-- Name: edge_function_health; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.edge_function_health (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    function_name text NOT NULL,
    status text NOT NULL,
    last_checked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    latency_ms integer,
    region text DEFAULT 'unknown'::text,
    version text DEFAULT 'unknown'::text,
    error jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: edge_function_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.edge_function_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    function_name text NOT NULL,
    enabled boolean DEFAULT true,
    timeout_ms integer DEFAULT 10000,
    warm_schedule text DEFAULT '*/10 * * * *'::text,
    verify_jwt boolean DEFAULT false,
    department text DEFAULT 'Operations'::text,
    feature_flag text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: event_bus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_bus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    severity text DEFAULT 'info'::text,
    module text DEFAULT 'system'::text,
    department text DEFAULT 'Operations'::text,
    source text DEFAULT 'system'::text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    quantity integer DEFAULT 0,
    unit_price numeric(10,2),
    total_value numeric(10,2) GENERATED ALWAYS AS (((quantity)::numeric * unit_price)) STORED,
    location text,
    yacht_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);


--
-- Name: TABLE inventory_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.inventory_items IS 'Yacht inventory management - tracks items, quantities, and values';


--
-- Name: llm_provider_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_provider_models (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    model_id text NOT NULL,
    model_name text NOT NULL,
    capabilities jsonb DEFAULT '{}'::jsonb,
    fetched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    category text DEFAULT 'system'::text,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: unified_ai_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_ai_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE unified_ai_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.unified_ai_configs IS 'Stores unified AI configuration including Google Cloud Document AI settings. Service-role only access for security.';


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'superadmin'::text])))
);


--
-- Name: yacht_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yacht_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    yacht_id uuid,
    owner_id uuid,
    profile_name text NOT NULL,
    profile_data jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE yacht_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.yacht_profiles IS 'Yacht profiles with configuration data for multi-profile support';


--
-- Name: yachts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.yachts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text,
    length_meters numeric(8,2),
    year_built integer,
    flag_state text,
    owner_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE yachts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.yachts IS 'Core yacht registry - stores yacht information and ownership';


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ai_health ai_health_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_health
    ADD CONSTRAINT ai_health_pkey PRIMARY KEY (id);


--
-- Name: ai_health ai_health_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_health
    ADD CONSTRAINT ai_health_provider_id_key UNIQUE (provider_id);


--
-- Name: ai_models_unified ai_models_unified_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models_unified
    ADD CONSTRAINT ai_models_unified_name_key UNIQUE (name);


--
-- Name: ai_models_unified ai_models_unified_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models_unified
    ADD CONSTRAINT ai_models_unified_pkey PRIMARY KEY (id);


--
-- Name: ai_provider_logs ai_provider_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_provider_logs
    ADD CONSTRAINT ai_provider_logs_pkey PRIMARY KEY (id);


--
-- Name: ai_providers_unified ai_providers_unified_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_providers_unified
    ADD CONSTRAINT ai_providers_unified_name_key UNIQUE (name);


--
-- Name: ai_providers_unified ai_providers_unified_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_providers_unified
    ADD CONSTRAINT ai_providers_unified_pkey PRIMARY KEY (id);


--
-- Name: ai_system_config ai_system_config_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_system_config
    ADD CONSTRAINT ai_system_config_config_key_key UNIQUE (config_key);


--
-- Name: ai_system_config ai_system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_system_config
    ADD CONSTRAINT ai_system_config_pkey PRIMARY KEY (id);


--
-- Name: analytics_events analytics_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);


--
-- Name: audit_workflows audit_workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_workflows
    ADD CONSTRAINT audit_workflows_pkey PRIMARY KEY (id);


--
-- Name: edge_function_health edge_function_health_function_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edge_function_health
    ADD CONSTRAINT edge_function_health_function_name_key UNIQUE (function_name);


--
-- Name: edge_function_health edge_function_health_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edge_function_health
    ADD CONSTRAINT edge_function_health_pkey PRIMARY KEY (id);


--
-- Name: edge_function_settings edge_function_settings_function_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edge_function_settings
    ADD CONSTRAINT edge_function_settings_function_name_key UNIQUE (function_name);


--
-- Name: edge_function_settings edge_function_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edge_function_settings
    ADD CONSTRAINT edge_function_settings_pkey PRIMARY KEY (id);


--
-- Name: event_bus event_bus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_bus
    ADD CONSTRAINT event_bus_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: llm_provider_models llm_provider_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_models
    ADD CONSTRAINT llm_provider_models_pkey PRIMARY KEY (id);


--
-- Name: llm_provider_models llm_provider_models_provider_id_model_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_models
    ADD CONSTRAINT llm_provider_models_provider_id_model_id_key UNIQUE (provider_id, model_id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: unified_ai_configs unified_ai_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_ai_configs
    ADD CONSTRAINT unified_ai_configs_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: yacht_profiles yacht_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yacht_profiles
    ADD CONSTRAINT yacht_profiles_pkey PRIMARY KEY (id);


--
-- Name: yachts yachts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yachts
    ADD CONSTRAINT yachts_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_ai_health_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_health_provider_id ON public.ai_health USING btree (provider_id);


--
-- Name: idx_ai_health_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_health_status ON public.ai_health USING btree (status);


--
-- Name: idx_ai_models_unified_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_unified_active ON public.ai_models_unified USING btree (is_active);


--
-- Name: idx_ai_models_unified_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_unified_name ON public.ai_models_unified USING btree (name);


--
-- Name: idx_ai_models_unified_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_unified_priority ON public.ai_models_unified USING btree (priority DESC);


--
-- Name: idx_ai_models_unified_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_models_unified_provider_id ON public.ai_models_unified USING btree (provider_id);


--
-- Name: idx_ai_provider_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_provider_logs_created_at ON public.ai_provider_logs USING btree (created_at);


--
-- Name: idx_ai_provider_logs_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_provider_logs_provider_id ON public.ai_provider_logs USING btree (provider_id);


--
-- Name: idx_ai_providers_unified_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_active ON public.ai_providers_unified USING btree (is_active);


--
-- Name: idx_ai_providers_unified_health_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_health_status ON public.ai_providers_unified USING btree (health_status);


--
-- Name: idx_ai_providers_unified_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_name ON public.ai_providers_unified USING btree (name);


--
-- Name: idx_ai_providers_unified_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_primary ON public.ai_providers_unified USING btree (is_primary);


--
-- Name: idx_ai_providers_unified_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_priority ON public.ai_providers_unified USING btree (priority);


--
-- Name: idx_ai_providers_unified_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_providers_unified_type ON public.ai_providers_unified USING btree (provider_type);


--
-- Name: idx_ai_system_config_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_system_config_key ON public.ai_system_config USING btree (config_key);


--
-- Name: idx_ai_system_config_sensitive; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_system_config_sensitive ON public.ai_system_config USING btree (is_sensitive);


--
-- Name: idx_analytics_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_created_at ON public.analytics_events USING btree (created_at);


--
-- Name: idx_analytics_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_event_type ON public.analytics_events USING btree (event_type);


--
-- Name: idx_analytics_events_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_module ON public.analytics_events USING btree (module);


--
-- Name: idx_analytics_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_events_user_id ON public.analytics_events USING btree (user_id);


--
-- Name: idx_audit_workflows_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_workflows_active ON public.audit_workflows USING btree (is_active);


--
-- Name: idx_audit_workflows_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_workflows_created_at ON public.audit_workflows USING btree (created_at DESC);


--
-- Name: idx_edge_function_health_function_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edge_function_health_function_name ON public.edge_function_health USING btree (function_name);


--
-- Name: idx_edge_function_health_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edge_function_health_status ON public.edge_function_health USING btree (status);


--
-- Name: idx_edge_function_settings_function_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edge_function_settings_function_name ON public.edge_function_settings USING btree (function_name);


--
-- Name: idx_event_bus_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_bus_created_at ON public.event_bus USING btree (created_at);


--
-- Name: idx_event_bus_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_event_bus_event_type ON public.event_bus USING btree (event_type);


--
-- Name: idx_inventory_items_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_items_category ON public.inventory_items USING btree (category);


--
-- Name: idx_inventory_items_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_items_created_at ON public.inventory_items USING btree (created_at DESC);


--
-- Name: idx_inventory_items_yacht_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_items_yacht_id ON public.inventory_items USING btree (yacht_id);


--
-- Name: idx_llm_provider_models_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_provider_models_provider_id ON public.llm_provider_models USING btree (provider_id);


--
-- Name: idx_system_settings_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);


--
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (key);


--
-- Name: idx_unified_ai_configs_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_ai_configs_updated_at ON public.unified_ai_configs USING btree (updated_at DESC);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_yacht_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yacht_profiles_active ON public.yacht_profiles USING btree (is_active);


--
-- Name: idx_yacht_profiles_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yacht_profiles_owner_id ON public.yacht_profiles USING btree (owner_id);


--
-- Name: idx_yacht_profiles_yacht_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yacht_profiles_yacht_id ON public.yacht_profiles USING btree (yacht_id);


--
-- Name: idx_yachts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yachts_created_at ON public.yachts USING btree (created_at DESC);


--
-- Name: idx_yachts_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_yachts_owner_id ON public.yachts USING btree (owner_id);


--
-- Name: users assign_default_user_role_trigger; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER assign_default_user_role_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_user_role();


--
-- Name: ai_providers_unified trigger_ai_providers_unified_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ai_providers_unified_updated_at BEFORE UPDATE ON public.ai_providers_unified FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: ai_system_config trigger_ai_system_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_ai_system_config_updated_at BEFORE UPDATE ON public.ai_system_config FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: audit_workflows trigger_audit_workflows_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_audit_workflows_updated_at BEFORE UPDATE ON public.audit_workflows FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: edge_function_settings trigger_edge_function_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_edge_function_settings_updated_at BEFORE UPDATE ON public.edge_function_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: inventory_items trigger_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: system_settings trigger_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: user_roles trigger_user_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: yacht_profiles trigger_yacht_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_yacht_profiles_updated_at BEFORE UPDATE ON public.yacht_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: yachts trigger_yachts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_yachts_updated_at BEFORE UPDATE ON public.yachts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: ai_health ai_health_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_health
    ADD CONSTRAINT ai_health_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE;


--
-- Name: ai_models_unified ai_models_unified_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models_unified
    ADD CONSTRAINT ai_models_unified_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE;


--
-- Name: ai_provider_logs ai_provider_logs_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_provider_logs
    ADD CONSTRAINT ai_provider_logs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE;


--
-- Name: ai_system_config ai_system_config_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_system_config
    ADD CONSTRAINT ai_system_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ai_system_config ai_system_config_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_system_config
    ADD CONSTRAINT ai_system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: analytics_events analytics_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: audit_workflows audit_workflows_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_workflows
    ADD CONSTRAINT audit_workflows_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: audit_workflows audit_workflows_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_workflows
    ADD CONSTRAINT audit_workflows_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: inventory_items inventory_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: inventory_items inventory_items_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: llm_provider_models llm_provider_models_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_provider_models
    ADD CONSTRAINT llm_provider_models_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE;


--
-- Name: yacht_profiles yacht_profiles_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yacht_profiles
    ADD CONSTRAINT yacht_profiles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);


--
-- Name: yacht_profiles yacht_profiles_yacht_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yacht_profiles
    ADD CONSTRAINT yacht_profiles_yacht_id_fkey FOREIGN KEY (yacht_id) REFERENCES public.yachts(id) ON DELETE CASCADE;


--
-- Name: yachts yachts_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.yachts
    ADD CONSTRAINT yachts_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles Allow authenticated users to read user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users to read user_roles" ON public.user_roles FOR SELECT TO authenticated USING (true);


--
-- Name: ai_system_config Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.ai_system_config FOR SELECT TO authenticated USING (true);


--
-- Name: analytics_events Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.analytics_events FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON analytics_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.analytics_events IS 'All authenticated users can read analytics';


--
-- Name: audit_workflows Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.audit_workflows FOR SELECT TO authenticated USING (true);


--
-- Name: edge_function_health Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.edge_function_health FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON edge_function_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.edge_function_health IS 'All authenticated users can read health data';


--
-- Name: edge_function_settings Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.edge_function_settings FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON edge_function_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.edge_function_settings IS 'All authenticated users can read settings';


--
-- Name: event_bus Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.event_bus FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON event_bus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.event_bus IS 'All authenticated users can read events';


--
-- Name: llm_provider_models Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.llm_provider_models FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON llm_provider_models; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.llm_provider_models IS 'All authenticated users can read models';


--
-- Name: unified_ai_configs Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.unified_ai_configs FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON unified_ai_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.unified_ai_configs IS 'All authenticated users can read configs';


--
-- Name: ai_system_config Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.ai_system_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: audit_workflows Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.audit_workflows FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: inventory_items Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.inventory_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: system_settings Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.system_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: ai_system_config Authenticated write access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated write access" ON public.ai_system_config FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: audit_workflows Authenticated write access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated write access" ON public.audit_workflows FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: inventory_items Authenticated write access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated write access" ON public.inventory_items FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: system_settings Authenticated write access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated write access" ON public.system_settings FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: user_roles Enable read access for own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: yacht_profiles Owner full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner full access" ON public.yacht_profiles TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: yachts Owner full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner full access" ON public.yachts TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: ai_system_config Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.ai_system_config TO service_role USING (true) WITH CHECK (true);


--
-- Name: analytics_events Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.analytics_events TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON analytics_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.analytics_events IS 'Full unrestricted access for service role';


--
-- Name: audit_workflows Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.audit_workflows TO service_role USING (true) WITH CHECK (true);


--
-- Name: edge_function_health Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.edge_function_health TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON edge_function_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.edge_function_health IS 'Full unrestricted access for service role';


--
-- Name: edge_function_settings Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.edge_function_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON edge_function_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.edge_function_settings IS 'Full unrestricted access for service role';


--
-- Name: event_bus Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.event_bus TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON event_bus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.event_bus IS 'Full unrestricted access for service role';


--
-- Name: llm_provider_models Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.llm_provider_models TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON llm_provider_models; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.llm_provider_models IS 'Full unrestricted access for service role';


--
-- Name: unified_ai_configs Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.unified_ai_configs TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON unified_ai_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.unified_ai_configs IS 'Full unrestricted access for service role';


--
-- Name: user_roles Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.user_roles TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_system_config Superadmin delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin delete access" ON public.ai_system_config FOR DELETE TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: audit_workflows Superadmin delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin delete access" ON public.audit_workflows FOR DELETE TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: ai_system_config Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.ai_system_config TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: analytics_events Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.analytics_events TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON analytics_events; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.analytics_events IS 'Superadmin has full access using direct email check';


--
-- Name: audit_workflows Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.audit_workflows TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: edge_function_health Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.edge_function_health TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON edge_function_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.edge_function_health IS 'Superadmin has full access using direct email check';


--
-- Name: edge_function_settings Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.edge_function_settings TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON edge_function_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.edge_function_settings IS 'Superadmin has full access using direct email check';


--
-- Name: event_bus Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.event_bus TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON event_bus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.event_bus IS 'Superadmin has full access using direct email check';


--
-- Name: llm_provider_models Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.llm_provider_models TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON llm_provider_models; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.llm_provider_models IS 'Superadmin has full access using direct email check';


--
-- Name: unified_ai_configs Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.unified_ai_configs TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON unified_ai_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.unified_ai_configs IS 'Superadmin has full access using direct email check';


--
-- Name: user_roles Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.user_roles TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: user_roles Superadmin full access to user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access to user_roles" ON public.user_roles TO authenticated USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.email)::text = 'superadmin@yachtexcel.com'::text) OR ((users.raw_user_meta_data ->> 'role'::text) = 'superadmin'::text) OR ((users.raw_app_meta_data ->> 'role'::text) = 'superadmin'::text))))));


--
-- Name: user_roles Users read own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: inventory_items Yacht owner and superadmin delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Yacht owner and superadmin delete access" ON public.inventory_items FOR DELETE TO authenticated USING (((yacht_id IN ( SELECT yachts.id
   FROM public.yachts
  WHERE (yachts.owner_id = auth.uid()))) OR (auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))));


--
-- Name: ai_health; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_models_unified; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_provider_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_providers_unified; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_system_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_workflows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_health authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.ai_health FOR SELECT TO authenticated USING (true);


--
-- Name: ai_models_unified authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.ai_models_unified FOR SELECT TO authenticated USING (true);


--
-- Name: ai_provider_logs authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.ai_provider_logs FOR SELECT TO authenticated USING (true);


--
-- Name: ai_providers_unified authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.ai_providers_unified FOR SELECT TO authenticated USING (true);


--
-- Name: inventory_items authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.inventory_items FOR SELECT TO authenticated USING (true);


--
-- Name: system_settings authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.system_settings FOR SELECT TO authenticated USING (true);


--
-- Name: yacht_profiles authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.yacht_profiles FOR SELECT TO authenticated USING (true);


--
-- Name: yachts authenticated_read_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access ON public.yachts FOR SELECT TO authenticated USING (true);


--
-- Name: ai_providers_unified authenticated_read_access_ai_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_access_ai_providers ON public.ai_providers_unified FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY authenticated_read_access_ai_providers ON ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY authenticated_read_access_ai_providers ON public.ai_providers_unified IS 'All authenticated users can read ai_providers_unified records';


--
-- Name: edge_function_health; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.edge_function_health ENABLE ROW LEVEL SECURITY;

--
-- Name: edge_function_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.edge_function_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: event_bus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

--
-- Name: llm_provider_models; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.llm_provider_models ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_health service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.ai_health TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_models_unified service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.ai_models_unified TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_provider_logs service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.ai_provider_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_providers_unified service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.ai_providers_unified TO service_role USING (true) WITH CHECK (true);


--
-- Name: inventory_items service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.inventory_items TO service_role USING (true) WITH CHECK (true);


--
-- Name: system_settings service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.system_settings TO service_role USING (true) WITH CHECK (true);


--
-- Name: user_roles service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.user_roles TO service_role USING (true) WITH CHECK (true);


--
-- Name: yacht_profiles service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.yacht_profiles TO service_role USING (true) WITH CHECK (true);


--
-- Name: yachts service_role_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access ON public.yachts TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_providers_unified service_role_full_access_ai_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY service_role_full_access_ai_providers ON public.ai_providers_unified TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY service_role_full_access_ai_providers ON ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY service_role_full_access_ai_providers ON public.ai_providers_unified IS 'Service role has unrestricted access to ai_providers_unified table';


--
-- Name: ai_providers_unified superadmin_all_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_all_access ON public.ai_providers_unified TO authenticated USING ((auth.email() = 'superadmin@yachtexcel.com'::text));


--
-- Name: ai_health superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.ai_health TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: ai_models_unified superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.ai_models_unified TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: ai_provider_logs superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.ai_provider_logs TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: inventory_items superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.inventory_items TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: system_settings superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.system_settings TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: user_roles superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.user_roles TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: yacht_profiles superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.yacht_profiles TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: yachts superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.yachts TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());


--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: unified_ai_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: yacht_profiles user_profile_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_profile_access ON public.yacht_profiles TO authenticated USING ((public.is_superadmin() OR (yacht_id IN ( SELECT yachts.id
   FROM public.yachts
  WHERE (yachts.owner_id = auth.uid()))))) WITH CHECK ((public.is_superadmin() OR (yacht_id IN ( SELECT yachts.id
   FROM public.yachts
  WHERE (yachts.owner_id = auth.uid())))));


--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: yachts user_yacht_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_yacht_access ON public.yachts TO authenticated USING (((auth.uid() = owner_id) OR public.is_superadmin())) WITH CHECK (((auth.uid() = owner_id) OR public.is_superadmin()));


--
-- Name: user_roles users_own_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_own_roles ON public.user_roles TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_roles users_read_own_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY users_read_own_roles ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: yacht_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: yachts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict VhYhbI4Jnj6jDvoQu4RN0P9knoDaln7jnJsSW0iN6t6BGMRhUpIBH3ivWp76BMy

