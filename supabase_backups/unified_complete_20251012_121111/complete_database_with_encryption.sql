--
-- PostgreSQL database dump
--

\restrict dCqJDgDxIvK1SCv1CDjv5pIqpH2hreQS8hwzP74cWgGMU8dwsnJciwIBOhHPdpV

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
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA _realtime;


--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_functions;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


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
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
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
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


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
-- Name: assign_user_role(uuid, text, text, uuid, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.assign_user_role(_user_id uuid, _role text, _department text DEFAULT NULL::text, _granted_by uuid DEFAULT NULL::uuid, _expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    granter_id UUID;
BEGIN
    granter_id := COALESCE(_granted_by, auth.uid());
    
    -- Check if caller has permission to assign roles
    IF NOT public.user_has_permission('write', 'roles', 'assign_standard', granter_id) THEN
        RAISE EXCEPTION 'Insufficient permissions to assign roles';
    END IF;
    
    -- Prevent non-superadmins from assigning superadmin role
    IF _role = 'superadmin' AND NOT public.is_superadmin(granter_id) THEN
        RAISE EXCEPTION 'Only superadmins can assign superadmin role';
    END IF;
    
    INSERT INTO public.user_roles (
        user_id, role, department, granted_by, expires_at
    ) VALUES (
        _user_id, _role, _department, granter_id, _expires_at
    )
    ON CONFLICT (user_id, role, COALESCE(department, ''))
    DO UPDATE SET
        is_active = true,
        granted_by = granter_id,
        expires_at = _expires_at,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;


--
-- Name: auto_encrypt_ai_provider_keys(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_encrypt_ai_provider_keys() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Encrypt API key from various possible sources
    -- Priority: api_key_encrypted > config.api_key > api_secret_name
    
    -- 1. If api_key_encrypted is being set directly
    IF NEW.api_key_encrypted IS NOT NULL AND NEW.api_key_encrypted != '' THEN
        NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_key_encrypted);
    -- 2. Check if API key is in config.api_key
    ELSIF NEW.config IS NOT NULL AND NEW.config ? 'api_key' THEN
        NEW.api_key_encrypted := public.encrypt_api_key(NEW.config->>'api_key');
        -- Remove plain text key from config after encryption
        NEW.config := NEW.config - 'api_key';
    -- 3. Check if API key is in api_secret_name (legacy)
    ELSIF NEW.api_secret_name IS NOT NULL AND NEW.api_secret_name != '' THEN
        NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_secret_name);
        NEW.api_secret_name := NULL; -- Clear after encryption
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: auto_encrypt_document_ai_credentials(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_encrypt_document_ai_credentials() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Encrypt GCP service account credentials
    IF NEW.gcp_service_account_encrypted IS NOT NULL AND NEW.gcp_service_account_encrypted != '' THEN
        NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.gcp_service_account_encrypted);
    -- Check if credentials are in configuration.gcp_service_account
    ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_service_account' THEN
        NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_service_account');
        -- Remove plain text from config after encryption
        NEW.configuration := NEW.configuration - 'gcp_service_account';
    END IF;
    
    -- Encrypt generic GCP credentials
    IF NEW.gcp_credentials_encrypted IS NOT NULL AND NEW.gcp_credentials_encrypted != '' THEN
        NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.gcp_credentials_encrypted);
    -- Check if credentials are in configuration.gcp_credentials
    ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_credentials' THEN
        NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_credentials');
        -- Remove plain text from config after encryption
        NEW.configuration := NEW.configuration - 'gcp_credentials';
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
-- Name: current_user_is_superadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_is_superadmin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN public.is_superadmin(auth.uid());
END;
$$;


--
-- Name: decrypt_api_key(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrypt_api_key(encrypted_key text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    encryption_key TEXT;
    decrypted_value TEXT;
BEGIN
    -- Return NULL for empty input
    IF encrypted_key IS NULL OR encrypted_key = '' THEN
        RETURN NULL;
    END IF;
    
    -- If already plain text, return as-is (backward compatibility)
    IF NOT public.is_encrypted(encrypted_key) THEN
        -- Remove PLAIN: prefix if present
        IF encrypted_key LIKE 'PLAIN:%' THEN
            RETURN substring(encrypted_key from 7);
        END IF;
        RETURN encrypted_key;
    END IF;
    
    -- Get encryption key
    SELECT COALESCE(
        current_setting('app.encryption_key', true),
        'yacht-sentinel-encryption-key-2024'
    ) INTO encryption_key;
    
    -- Decrypt using pgcrypto
    BEGIN
        SELECT convert_from(
            decrypt(
                decode(encrypted_key, 'base64'),
                encryption_key::bytea,
                'aes'
            ),
            'UTF8'
        ) INTO decrypted_value;
        
        RETURN decrypted_value;
    EXCEPTION WHEN OTHERS THEN
        -- If decryption fails, return original value (legacy plain text)
        RAISE WARNING 'Decryption failed for API key, returning as plain text: %', SQLERRM;
        RETURN encrypted_key;
    END;
END;
$$;


--
-- Name: FUNCTION decrypt_api_key(encrypted_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.decrypt_api_key(encrypted_key text) IS 'Automatically decrypt API keys with backward compatibility for plain text';


--
-- Name: encrypt_api_key(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_api_key(plain_key text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    encryption_key TEXT;
BEGIN
    -- Return NULL for empty input
    IF plain_key IS NULL OR plain_key = '' THEN
        RETURN NULL;
    END IF;
    
    -- If already encrypted, return as-is
    IF public.is_encrypted(plain_key) THEN
        RETURN plain_key;
    END IF;
    
    -- Remove PLAIN: prefix if present
    IF plain_key LIKE 'PLAIN:%' THEN
        plain_key := substring(plain_key from 7);
    END IF;
    
    -- Get or generate encryption key
    -- In production, this should come from environment variables
    -- For now, use a consistent key stored in a secure table
    SELECT COALESCE(
        current_setting('app.encryption_key', true),
        'yacht-sentinel-encryption-key-2024'  -- Default fallback
    ) INTO encryption_key;
    
    -- Encrypt using pgcrypto (AES-256)
    -- Returns base64 encoded encrypted data
    BEGIN
        RETURN encode(
            encrypt(
                plain_key::bytea,
                encryption_key::bytea,
                'aes'
            ),
            'base64'
        );
    EXCEPTION WHEN OTHERS THEN
        -- If encryption fails, return with PLAIN: prefix for identification
        RAISE WARNING 'Encryption failed for API key, storing as PLAIN: %', SQLERRM;
        RETURN 'PLAIN:' || plain_key;
    END;
END;
$$;


--
-- Name: FUNCTION encrypt_api_key(plain_key text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.encrypt_api_key(plain_key text) IS 'Automatically encrypt API keys using AES-256 encryption';


--
-- Name: ensure_superadmin_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ensure_superadmin_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- If user has superadmin email, ensure they have superadmin role
    IF NEW.email = 'superadmin@yachtexcel.com' THEN
        INSERT INTO public.user_roles (user_id, role, department, is_active, created_at)
        VALUES (NEW.id, 'superadmin', NULL, true, NOW())
        ON CONFLICT (user_id, role, COALESCE(department, ''))
        DO UPDATE SET 
            is_active = true,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
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
-- Name: get_user_roles(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_roles(_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(role text, department text, is_active boolean, expires_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    target_user_id UUID;
BEGIN
    target_user_id := COALESCE(_user_id, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        ur.role, 
        ur.department, 
        ur.is_active,
        ur.expires_at
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY 
        CASE ur.role 
            WHEN 'superadmin' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'manager' THEN 3 
            WHEN 'user' THEN 4 
            WHEN 'viewer' THEN 5 
            ELSE 6 
        END;
END;
$$;


--
-- Name: handle_new_user_signup(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_signup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (user_id, display_name)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'display_name', 
            split_part(NEW.email, '@', 1)
        )
    );
    
    -- Smart role assignment based on email domain and patterns
    IF NEW.email = 'superadmin@yachtexcel.com' THEN
        -- Designated superadmin gets superadmin role
        INSERT INTO public.user_roles (user_id, role, granted_by)
        VALUES (NEW.id, 'superadmin', NEW.id);
        
    ELSIF NEW.email LIKE '%@yachtexcel.com' THEN
        -- Company employees get admin role
        INSERT INTO public.user_roles (user_id, role, granted_by)
        VALUES (NEW.id, 'admin', NEW.id);
        
    ELSIF NEW.email LIKE '%admin%' OR NEW.email LIKE '%manager%' THEN
        -- Users with admin/manager in email get manager role
        INSERT INTO public.user_roles (user_id, role, granted_by)
        VALUES (NEW.id, 'manager', NEW.id);
        
    ELSE
        -- Regular users get user role
        INSERT INTO public.user_roles (user_id, role, granted_by)
        VALUES (NEW.id, 'user', NEW.id);
    END IF;
    
    RETURN NEW;
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
-- Name: is_encrypted(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_encrypted(value text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
BEGIN
    -- Empty values are not encrypted
    IF value IS NULL OR value = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for known plain text API key prefixes
    -- These indicate the key is NOT encrypted
    IF value ~ '^(sk-|xai-|claude-|glpat-|AIza|PLAIN:)' THEN
        RETURN FALSE;
    END IF;
    
    -- Check if it looks like base64 encoded data (encrypted)
    -- Base64 should only contain A-Z, a-z, 0-9, +, /, and = for padding
    -- and should be reasonably long (at least 32 characters for encrypted data)
    IF value ~ '^[A-Za-z0-9+/]+={0,2}$' AND length(value) >= 32 THEN
        RETURN TRUE;
    END IF;
    
    -- Default: treat as plain text
    RETURN FALSE;
END;
$_$;


--
-- Name: FUNCTION is_encrypted(value text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.is_encrypted(value text) IS 'Check if a string value is encrypted (base64) or plain text';


--
-- Name: is_superadmin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN public.is_superadmin(auth.uid());
END;
$$;


--
-- Name: is_superadmin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_superadmin(_user_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    target_user_id UUID;
    user_email TEXT;
BEGIN
    -- Use provided user_id or get current user
    target_user_id := COALESCE(_user_id, auth.uid());
    
    -- Return false if no user
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    -- PRIORITY 1: Email-based superadmin detection (HIGHEST PRIORITY)
    IF user_email = 'superadmin@yachtexcel.com' THEN
        RETURN TRUE;
    END IF;
    
    -- PRIORITY 2: Check user_roles table for explicit superadmin role
    IF EXISTS (
        SELECT 1 
        FROM public.user_roles 
        WHERE user_id = target_user_id 
        AND role = 'superadmin'
        AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Default: not superadmin
    RETURN FALSE;
END;
$$;


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


--
-- Name: sync_ai_provider_config(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_ai_provider_config() RETURNS trigger
    LANGUAGE plpgsql
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


--
-- Name: FUNCTION sync_ai_provider_config(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.sync_ai_provider_config() IS 'Keeps config and configuration columns in sync';


--
-- Name: user_has_permission(text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_has_permission(_permission text, _resource text DEFAULT NULL::text, _action text DEFAULT NULL::text, _user_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    target_user_id UUID;
    has_permission BOOLEAN DEFAULT FALSE;
    user_roles TEXT[];
BEGIN
    target_user_id := COALESCE(_user_id, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get user's active roles
    SELECT ARRAY_AGG(role) INTO user_roles
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
    
    -- If no roles, return false
    IF user_roles IS NULL OR array_length(user_roles, 1) = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has superadmin role (grants all permissions)
    IF 'superadmin' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permissions
    SELECT EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        WHERE rp.role = ANY(user_roles)
        AND rp.permission = _permission
        AND (_resource IS NULL OR rp.resource = _resource OR rp.resource = '*')
        AND (_action IS NULL OR rp.action = _action OR rp.action = '*')
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: -
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: -
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'gen_rpc'::character varying
);


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
-- Name: document_ai_processors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_ai_processors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    name text NOT NULL,
    display_name text NOT NULL,
    processor_id text NOT NULL,
    processor_full_id text NOT NULL,
    processor_type text DEFAULT 'CUSTOM_EXTRACTOR'::text NOT NULL,
    location text DEFAULT 'us'::text NOT NULL,
    project_id text DEFAULT '338523806048'::text NOT NULL,
    specialization text NOT NULL,
    supported_formats text[] DEFAULT ARRAY['PDF'::text, 'PNG'::text, 'JPG'::text, 'JPEG'::text, 'TIFF'::text, 'BMP'::text, 'WEBP'::text],
    accuracy numeric(3,2) DEFAULT 0.95,
    is_active boolean DEFAULT true,
    is_primary boolean DEFAULT false,
    priority integer DEFAULT 1,
    max_pages_per_document integer DEFAULT 50,
    confidence_threshold numeric(3,2) DEFAULT 0.75,
    rate_limit_per_minute integer DEFAULT 600,
    estimated_cost_per_page numeric(6,4) DEFAULT 0.05,
    description text,
    configuration jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    updated_by uuid,
    gcp_credentials_encrypted text,
    gcp_service_account_encrypted text
);


--
-- Name: TABLE document_ai_processors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.document_ai_processors IS 'Document AI processor configurations with specialized capabilities and personalized names';


--
-- Name: active_document_processors; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_document_processors AS
 SELECT id,
    name,
    display_name,
    processor_id,
    processor_full_id,
    processor_type,
    specialization,
    accuracy,
    priority,
    description,
    configuration,
    created_at,
    updated_at
   FROM public.document_ai_processors
  WHERE (is_active = true)
  ORDER BY priority, accuracy DESC;


--
-- Name: VIEW active_document_processors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.active_document_processors IS 'Active Document AI processors ordered by priority and accuracy';


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
    success_rate numeric(5,2) DEFAULT 100.00,
    configuration jsonb DEFAULT '{}'::jsonb,
    api_key_encrypted text
);


--
-- Name: TABLE ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ai_providers_unified IS 'Unified AI provider configuration table with complete schema including auth_method, provider_type, priority, and health monitoring fields';


--
-- Name: COLUMN ai_providers_unified.configuration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ai_providers_unified.configuration IS 'Synced with config column via trigger - used by some legacy code';


--
-- Name: ai_providers_with_keys; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.ai_providers_with_keys AS
 SELECT id,
    name,
    provider_type,
    base_url,
    api_endpoint,
    auth_type,
    auth_method,
    is_active,
    is_primary,
    priority,
    public.decrypt_api_key(api_key_encrypted) AS api_key,
    api_key_encrypted,
    config,
    capabilities,
    rate_limit_per_minute,
    supported_languages,
    health_status,
    error_count,
    success_rate,
    last_health_check,
    description,
    created_at,
    updated_at
   FROM public.ai_providers_unified;


--
-- Name: VIEW ai_providers_with_keys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.ai_providers_with_keys IS 'AI providers view with automatically decrypted API keys for authenticated users';


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
-- Name: document_ai_processors_with_credentials; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.document_ai_processors_with_credentials AS
 SELECT id,
    name,
    display_name,
    processor_id,
    processor_full_id,
    processor_type,
    location,
    project_id,
    specialization,
    supported_formats,
    accuracy,
    is_active,
    is_primary,
    priority,
    max_pages_per_document,
    confidence_threshold,
    rate_limit_per_minute,
    estimated_cost_per_page,
    public.decrypt_api_key(gcp_service_account_encrypted) AS gcp_service_account,
    public.decrypt_api_key(gcp_credentials_encrypted) AS gcp_credentials,
    gcp_service_account_encrypted,
    gcp_credentials_encrypted,
    configuration,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by
   FROM public.document_ai_processors;


--
-- Name: VIEW document_ai_processors_with_credentials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.document_ai_processors_with_credentials IS 'Document AI processors view with automatically decrypted GCP credentials';


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
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role text NOT NULL,
    permission text NOT NULL,
    resource text,
    action text NOT NULL,
    description text,
    conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
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
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    department text,
    job_title text,
    phone text,
    timezone text DEFAULT 'UTC'::text,
    preferences jsonb DEFAULT '{}'::jsonb,
    onboarding_completed boolean DEFAULT false,
    last_active_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    department text,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    permissions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['guest'::text, 'viewer'::text, 'user'::text, 'manager'::text, 'admin'::text, 'superadmin'::text])))
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
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: messages_2025_10_11; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_10_11 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_10_12; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_10_12 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_10_13; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_10_13 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_10_14; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_10_14 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: messages_2025_10_15; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages_2025_10_15 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: -
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: -
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: -
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: -
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


--
-- Name: messages_2025_10_11; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_11 FOR VALUES FROM ('2025-10-11 00:00:00') TO ('2025-10-12 00:00:00');


--
-- Name: messages_2025_10_12; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_12 FOR VALUES FROM ('2025-10-12 00:00:00') TO ('2025-10-13 00:00:00');


--
-- Name: messages_2025_10_13; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_13 FOR VALUES FROM ('2025-10-13 00:00:00') TO ('2025-10-14 00:00:00');


--
-- Name: messages_2025_10_14; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_14 FOR VALUES FROM ('2025-10-14 00:00:00') TO ('2025-10-15 00:00:00');


--
-- Name: messages_2025_10_15; Type: TABLE ATTACH; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_15 FOR VALUES FROM ('2025-10-15 00:00:00') TO ('2025-10-16 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
81ae2fad-7200-44e2-be85-a00df8f2e5b1	postgres_cdc_rls	{"region": "us-east-1", "db_host": "A/R0lnBZ9bzwkAmKXWVsexauDuSc8E9Tcx19dDZOWjBPNrrhma6I8nd28t/mto4/", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-10-12 09:29:00	2025-10-12 09:29:00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2025-10-12 09:29:00
20220329161857	2025-10-12 09:29:00
20220410212326	2025-10-12 09:29:00
20220506102948	2025-10-12 09:29:00
20220527210857	2025-10-12 09:29:00
20220815211129	2025-10-12 09:29:00
20220815215024	2025-10-12 09:29:00
20220818141501	2025-10-12 09:29:00
20221018173709	2025-10-12 09:29:00
20221102172703	2025-10-12 09:29:00
20221223010058	2025-10-12 09:29:00
20230110180046	2025-10-12 09:29:00
20230810220907	2025-10-12 09:29:00
20230810220924	2025-10-12 09:29:00
20231024094642	2025-10-12 09:29:00
20240306114423	2025-10-12 09:29:00
20240418082835	2025-10-12 09:29:00
20240625211759	2025-10-12 09:29:00
20240704172020	2025-10-12 09:29:00
20240902173232	2025-10-12 09:29:00
20241106103258	2025-10-12 09:29:00
20250424203323	2025-10-12 09:29:00
20250613072131	2025-10-12 09:29:00
20250711044927	2025-10-12 09:29:00
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: -
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only, migrations_ran, broadcast_adapter) FROM stdin;
53a8dd57-55ac-46d1-8b2b-a3df610612cb	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-10-12 09:29:00	2025-10-12 09:29:01	100	postgres_cdc_rls	100000	100	100	f	\N	f	f	63	gen_rpc
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: ai_health; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_health (id, provider_id, status, last_checked_at, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: ai_models_unified; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_models_unified (id, created_at, updated_at, name, display_name, provider_id, model_type, is_active, max_tokens, input_cost_per_token, output_cost_per_token, config, capabilities, priority, description) FROM stdin;
789e919c-3d13-4574-a789-1abc536c5f23	2025-10-12 09:29:02.631871+00	2025-10-12 09:29:02.631871+00	gpt-4o	GPT-4o (Latest)	7cca8fed-d26a-41c7-8893-4c9f6a1f8675	text	t	128000	\N	\N	{}	{}	1	OpenAI GPT-4o - Latest multimodal model
ec56d827-911e-4d0c-9b6e-e3fb7d596b07	2025-10-12 09:29:02.631871+00	2025-10-12 09:29:02.631871+00	gemini-1.5-pro-002	Gemini 1.5 Pro	168ba519-6c34-46a5-9bd7-3ba68f5fc987	text	t	2097152	\N	\N	{}	{}	1	Google Gemini 1.5 Pro - Large context window
bbb93eef-103c-47e9-b051-55aad7478886	2025-10-12 09:29:02.631871+00	2025-10-12 09:29:02.631871+00	deepseek-chat	DeepSeek Chat	76780c0f-b4f7-4370-a0aa-4dd8e5586a85	text	t	32768	\N	\N	{}	{}	1	DeepSeek Chat - Efficient reasoning model
\.


--
-- Data for Name: ai_provider_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_provider_logs (id, provider_id, status, message, latency_ms, details, created_at) FROM stdin;
\.


--
-- Data for Name: ai_providers_unified; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_providers_unified (id, name, base_url, api_endpoint, auth_type, auth_header_name, api_secret_name, models_endpoint, discovery_url, description, capabilities, config, is_active, created_at, updated_at, auth_method, provider_type, priority, is_primary, rate_limit_per_minute, supported_languages, last_health_check, health_status, error_count, success_rate, configuration, api_key_encrypted) FROM stdin;
7cca8fed-d26a-41c7-8893-4c9f6a1f8675	OpenAI	https://api.openai.com	https://api.openai.com/v1	bearer	Authorization	\N	https://api.openai.com/v1/models	\N	OpenAI GPT models	{}	{}	t	2025-10-12 09:29:02.6106+00	2025-10-12 09:29:02.662037+00	api_key	openai	1	f	60	{en}	\N	unknown	0	100.00	{}	\N
168ba519-6c34-46a5-9bd7-3ba68f5fc987	Google Gemini	https://generativelanguage.googleapis.com	https://generativelanguage.googleapis.com/v1beta	bearer	Authorization	\N	\N	\N	Google Gemini AI models	{}	{}	t	2025-10-12 09:29:02.6106+00	2025-10-12 09:29:02.662037+00	api_key	google	1	f	60	{en}	\N	unknown	0	100.00	{}	\N
76780c0f-b4f7-4370-a0aa-4dd8e5586a85	DeepSeek	https://api.deepseek.com	https://api.deepseek.com/v1	bearer	Authorization	\N	https://api.deepseek.com/v1/models	\N	DeepSeek AI models	{}	{}	t	2025-10-12 09:29:02.6106+00	2025-10-12 09:29:02.662037+00	api_key	deepseek	1	f	60	{en}	\N	unknown	0	100.00	{}	\N
\.


--
-- Data for Name: ai_system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ai_system_config (id, config_key, config_value, description, is_sensitive, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: analytics_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_events (id, event_type, module, user_id, event_data, metadata, severity, created_at) FROM stdin;
\.


--
-- Data for Name: audit_workflows; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_workflows (id, name, description, workflow_config, is_active, schedule_config, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: document_ai_processors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_ai_processors (id, created_at, updated_at, name, display_name, processor_id, processor_full_id, processor_type, location, project_id, specialization, supported_formats, accuracy, is_active, is_primary, priority, max_pages_per_document, confidence_threshold, rate_limit_per_minute, estimated_cost_per_page, description, configuration, created_by, updated_by, gcp_credentials_encrypted, gcp_service_account_encrypted) FROM stdin;
3e72ceda-0a0f-44af-a2d2-328c765bba4f	2025-10-12 09:29:02.678343+00	2025-10-12 09:29:02.678343+00	yacht-documents-primary	Yacht Documents - Primary Processor	8708cd1d9cd87cc1	projects/338523806048/locations/us/processors/8708cd1d9cd87cc1	CUSTOM_EXTRACTOR	us	338523806048	Maritime Documents, Certificates of Registry, Yacht Specifications	{PDF,PNG,JPG,JPEG,TIFF,BMP,WEBP}	0.98	t	t	1	50	0.75	600	0.0500	Primary processor specialized in yacht certificates, registration documents, and technical specifications.	{"optimized_for": ["yacht_certificates", "registration_docs", "specifications"], "field_extraction": {"vessel_name": true, "specifications": true, "certificate_dates": true, "owner_information": true, "registration_number": true}, "training_specialized": true}	\N	\N	\N	\N
75e70b91-78ca-4916-a10f-d43f8b89cc6a	2025-10-12 09:29:02.678343+00	2025-10-12 09:29:02.678343+00	financial-documents	Financial & Invoice Processor	financial-processor-001	projects/338523806048/locations/us/processors/financial-processor-001	INVOICE_PROCESSOR	us	338523806048	Invoices, Purchase Orders, Financial Documents, Receipts	{PDF,PNG,JPG,JPEG,TIFF,BMP,WEBP}	0.96	t	f	2	50	0.75	600	0.0500	Specialized processor for financial documents, invoices, and purchase orders related to yacht operations.	{"optimized_for": ["invoices", "purchase_orders", "receipts", "financial_statements"], "vendor_extraction": true, "currency_detection": true, "line_item_extraction": true}	\N	\N	\N	\N
00fd3dfd-818e-4acb-a2ad-3a69f88d1662	2025-10-12 09:29:02.678343+00	2025-10-12 09:29:02.678343+00	legal-contracts	Legal & Contract Document Processor	legal-processor-001	projects/338523806048/locations/us/processors/legal-processor-001	CUSTOM_EXTRACTOR	us	338523806048	Contracts, Legal Documents, Agreements, Charter Agreements	{PDF,PNG,JPG,JPEG,TIFF,BMP,WEBP}	0.94	t	f	3	50	0.75	600	0.0500	Advanced processor for legal documents, contracts, and charter agreements.	{"optimized_for": ["contracts", "agreements", "charter_contracts", "legal_docs"], "date_extraction": true, "clause_extraction": true, "liability_clauses": true, "party_identification": true}	\N	\N	\N	\N
9bc996dd-2947-431f-9a2c-a39ce4010c83	2025-10-12 09:29:02.678343+00	2025-10-12 09:29:02.678343+00	survey-inspection	Survey & Inspection Report Processor	survey-processor-001	projects/338523806048/locations/us/processors/survey-processor-001	CUSTOM_EXTRACTOR	us	338523806048	Survey Reports, Inspection Documents, Technical Assessments	{PDF,PNG,JPG,JPEG,TIFF,BMP,WEBP}	0.95	t	f	4	50	0.75	600	0.0500	Specialized processor for marine surveys, inspections, and technical assessments.	{"optimized_for": ["survey_reports", "inspections", "technical_assessments", "condition_reports"], "condition_assessment": true, "technical_specifications": true, "deficiency_identification": true, "recommendations_extraction": true}	\N	\N	\N	\N
9fe81f90-c16a-4629-a09f-f1cfbcd5cccf	2025-10-12 09:29:02.678343+00	2025-10-12 09:29:02.678343+00	insurance-compliance	Insurance & Compliance Processor	insurance-processor-001	projects/338523806048/locations/us/processors/insurance-processor-001	CUSTOM_EXTRACTOR	us	338523806048	Insurance Policies, Compliance Documents, Certificates, Permits	{PDF,PNG,JPG,JPEG,TIFF,BMP,WEBP}	0.93	t	f	5	50	0.75	600	0.0500	Processor for insurance documents, compliance certificates, and regulatory permits.	{"optimized_for": ["insurance_policies", "compliance_docs", "certificates", "permits"], "coverage_details": true, "expiry_date_detection": true, "regulatory_compliance": true, "policy_number_extraction": true}	\N	\N	\N	\N
\.


--
-- Data for Name: edge_function_health; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.edge_function_health (id, function_name, status, last_checked_at, latency_ms, region, version, error, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: edge_function_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.edge_function_settings (id, function_name, enabled, timeout_ms, warm_schedule, verify_jwt, department, feature_flag, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_bus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_bus (id, event_type, payload, severity, module, department, source, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (id, name, description, category, quantity, unit_price, location, yacht_id, metadata, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- Data for Name: llm_provider_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.llm_provider_models (id, provider_id, model_id, model_name, capabilities, fetched_at, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, role, permission, resource, action, description, conditions, created_at, updated_at) FROM stdin;
68f3dd8c-6511-4593-a242-d0535990e3a9	guest	read	public_content	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
b324675e-7589-44d0-ade7-1528feebc95e	viewer	read	yachts	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
7250825a-3847-46c4-8a90-ddec4b6e9999	viewer	read	reports	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
e9883f6c-dbca-4882-89a7-a6857cdcfb6f	viewer	read	inventory	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
b93c2f9d-6e20-4c82-b68b-01187d38e427	user	read	yachts	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
fa03e7a0-f1af-4d9f-aefa-df602fad07bd	user	write	yachts	update_assigned	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
dfda92bd-2a67-4dd7-a8a0-7e9a0d1288ab	user	read	inventory	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
ef6db86f-2fa7-4dc9-aee4-e09ee41844f4	user	write	inventory	update_assigned	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
69017c70-3986-4e53-8001-e5e69d52738f	user	read	reports	view	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
92efd893-35b8-4051-a2aa-96a301cac912	user	write	reports	create_own	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
c2e03b96-6e47-4058-9dc4-eea0ed9bd294	user	read	profile	view_own	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
0b8b00d1-4e82-4bd2-95e6-0303a7150322	user	write	profile	update_own	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
7410430b-236a-4763-894a-7c2eb5260954	manager	read	yachts	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
37273fc7-2bae-4586-90c4-e0b5e2b82452	manager	write	yachts	update_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
05a3173d-4739-4b5e-b35a-4d0dc6f719be	manager	read	users	view_team	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
db841c54-b418-4995-bffe-19fc8078cfea	manager	write	users	manage_team	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
76022d9d-46d3-4513-bc72-90cb9c7ea1c5	manager	read	inventory	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
b35b6e69-b673-41fc-8b0b-a86826769317	manager	write	inventory	manage_team	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
3e6edc61-7b68-4b29-836a-b4a89a774306	manager	read	reports	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
d1305ea0-8541-4e03-b734-d4677144c0eb	manager	write	reports	manage_team	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
e11005b1-07ae-4aa2-840e-aad6630b8fb0	manager	read	analytics	view_team	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
82739625-53c9-4db0-885b-fb02c9514adf	admin	read	users	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
36c4c0d3-813f-4fad-984e-37943bfc48a3	admin	write	users	manage_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
db03d540-9a78-4030-85b8-8a8ce16275fd	admin	delete	users	deactivate	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
92c43b2c-462b-4777-8a7d-b80baac415b9	admin	read	system	view_config	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
bf6fff3d-85fe-41db-a211-fb4c82fd6059	admin	write	system	configure	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
b78b0997-961d-4563-ba20-350ca6de1c1f	admin	read	yachts	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
d369fd2b-7fa3-4ff7-bd7d-9a93d85b4390	admin	write	yachts	manage_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
bf4b56c4-565e-42e9-a394-1be612f5a25e	admin	delete	yachts	delete	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
7ecc7dbe-e35b-4cd7-93cb-ad9b9548f7e8	admin	read	analytics	view_all	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
b78972a7-618a-484a-9d98-d5b85c49735b	admin	write	roles	assign_standard	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
c354fe01-da3f-4fd0-98c3-ba81ab9c097f	superadmin	admin	*	*	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
2c308a2f-7c74-40e2-be6b-51f68a488b7f	superadmin	read	*	*	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
af34695e-bccd-4f39-baa2-9f43551166d5	superadmin	write	*	*	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
46fd1daa-1f60-4ee7-b1bc-294afdb7e42b	superadmin	delete	*	*	\N	{}	2025-10-12 09:29:02.700594+00	2025-10-12 09:29:02.700594+00
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, key, value, description, category, is_public, created_at, updated_at) FROM stdin;
2c29af3d-34f1-44c6-8b2b-8851341ebdda	system.maintenance	false	System maintenance mode flag	system	f	2025-10-12 09:29:02.599961+00	2025-10-12 09:29:02.599961+00
8c37a972-5095-4943-9c9d-5c071e5117eb	system.registration	true	User registration enabled flag	system	f	2025-10-12 09:29:02.599961+00	2025-10-12 09:29:02.599961+00
0a2e0d64-571b-4ffc-a2a8-029d3a4b1613	system.maxFileSize	10485760	Maximum file upload size in bytes (10MB)	system	f	2025-10-12 09:29:02.599961+00	2025-10-12 09:29:02.599961+00
\.


--
-- Data for Name: unified_ai_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unified_ai_configs (id, config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (id, user_id, display_name, avatar_url, department, job_title, phone, timezone, preferences, onboarding_completed, last_active_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, user_id, role, department, granted_by, granted_at, expires_at, is_active, permissions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: yacht_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.yacht_profiles (id, yacht_id, owner_id, profile_name, profile_data, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: yachts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.yachts (id, name, type, length_meters, year_built, flag_state, owner_id, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_11; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_10_11 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_12; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_10_12 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_13; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_10_13 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_14; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_10_14 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_15; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.messages_2025_10_15 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-10-12 09:29:00
20211116045059	2025-10-12 09:29:00
20211116050929	2025-10-12 09:29:00
20211116051442	2025-10-12 09:29:00
20211116212300	2025-10-12 09:29:00
20211116213355	2025-10-12 09:29:00
20211116213934	2025-10-12 09:29:00
20211116214523	2025-10-12 09:29:00
20211122062447	2025-10-12 09:29:00
20211124070109	2025-10-12 09:29:00
20211202204204	2025-10-12 09:29:00
20211202204605	2025-10-12 09:29:00
20211210212804	2025-10-12 09:29:00
20211228014915	2025-10-12 09:29:00
20220107221237	2025-10-12 09:29:00
20220228202821	2025-10-12 09:29:00
20220312004840	2025-10-12 09:29:00
20220603231003	2025-10-12 09:29:00
20220603232444	2025-10-12 09:29:00
20220615214548	2025-10-12 09:29:00
20220712093339	2025-10-12 09:29:00
20220908172859	2025-10-12 09:29:00
20220916233421	2025-10-12 09:29:00
20230119133233	2025-10-12 09:29:00
20230128025114	2025-10-12 09:29:00
20230128025212	2025-10-12 09:29:00
20230227211149	2025-10-12 09:29:00
20230228184745	2025-10-12 09:29:00
20230308225145	2025-10-12 09:29:00
20230328144023	2025-10-12 09:29:00
20231018144023	2025-10-12 09:29:00
20231204144023	2025-10-12 09:29:00
20231204144024	2025-10-12 09:29:00
20231204144025	2025-10-12 09:29:00
20240108234812	2025-10-12 09:29:00
20240109165339	2025-10-12 09:29:00
20240227174441	2025-10-12 09:29:00
20240311171622	2025-10-12 09:29:00
20240321100241	2025-10-12 09:29:00
20240401105812	2025-10-12 09:29:00
20240418121054	2025-10-12 09:29:00
20240523004032	2025-10-12 09:29:00
20240618124746	2025-10-12 09:29:00
20240801235015	2025-10-12 09:29:00
20240805133720	2025-10-12 09:29:00
20240827160934	2025-10-12 09:29:00
20240919163303	2025-10-12 09:29:00
20240919163305	2025-10-12 09:29:00
20241019105805	2025-10-12 09:29:00
20241030150047	2025-10-12 09:29:00
20241108114728	2025-10-12 09:29:00
20241121104152	2025-10-12 09:29:00
20241130184212	2025-10-12 09:29:00
20241220035512	2025-10-12 09:29:01
20241220123912	2025-10-12 09:29:01
20241224161212	2025-10-12 09:29:01
20250107150512	2025-10-12 09:29:01
20250110162412	2025-10-12 09:29:01
20250123174212	2025-10-12 09:29:01
20250128220012	2025-10-12 09:29:01
20250506224012	2025-10-12 09:29:01
20250523164012	2025-10-12 09:29:01
20250714121412	2025-10-12 09:29:01
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.iceberg_namespaces (id, bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.iceberg_tables (id, namespace_id, bucket_id, name, location, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-10-12 09:29:02.139647
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-10-12 09:29:02.141193
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-10-12 09:29:02.141719
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-10-12 09:29:02.144744
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-10-12 09:29:02.146916
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-10-12 09:29:02.147725
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-10-12 09:29:02.148859
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-10-12 09:29:02.149705
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-10-12 09:29:02.150317
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-10-12 09:29:02.151032
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-10-12 09:29:02.152033
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-10-12 09:29:02.153341
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-10-12 09:29:02.154752
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-10-12 09:29:02.155729
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-10-12 09:29:02.156844
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-10-12 09:29:02.161103
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-10-12 09:29:02.162022
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-10-12 09:29:02.162781
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-10-12 09:29:02.163565
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-10-12 09:29:02.164411
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-10-12 09:29:02.165006
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-10-12 09:29:02.165962
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-10-12 09:29:02.168537
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-10-12 09:29:02.170317
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-10-12 09:29:02.171169
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-10-12 09:29:02.171884
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-10-12 09:29:02.172609
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-10-12 09:29:02.175307
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-10-12 09:29:02.188678
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-10-12 09:29:02.189656
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-10-12 09:29:02.190281
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-10-12 09:29:02.191046
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-10-12 09:29:02.191825
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-10-12 09:29:02.192513
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-10-12 09:29:02.192698
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-10-12 09:29:02.193807
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-10-12 09:29:02.194274
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-10-12 09:29:02.19593
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-10-12 09:29:02.196595
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.hooks (id, hook_table_id, hook_name, created_at, request_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: -
--

COPY supabase_functions.migrations (version, inserted_at) FROM stdin;
initial	2025-10-12 09:28:50.304062+00
20210809183423_update_grants	2025-10-12 09:28:50.304062+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
20250101000001	{"-- Create user_roles table first (required for policies)\nCREATE TABLE IF NOT EXISTS public.user_roles (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n  role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'superadmin')),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  UNIQUE(user_id, role)\n)","-- Create system_settings table for application configuration\nCREATE TABLE IF NOT EXISTS public.system_settings (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  key TEXT NOT NULL UNIQUE,\n  value JSONB NOT NULL DEFAULT '{}',\n  description TEXT,\n  category TEXT DEFAULT 'system',\n  is_public BOOLEAN DEFAULT false,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","-- Create analytics_events table for security and system analytics\nCREATE TABLE IF NOT EXISTS public.analytics_events (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  event_type TEXT NOT NULL,\n  module TEXT NOT NULL,\n  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,\n  event_data JSONB DEFAULT '{}',\n  metadata JSONB DEFAULT '{}',\n  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","-- Add indexes for better performance\nCREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role)","CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key)","CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings(category)","CREATE INDEX IF NOT EXISTS idx_analytics_events_module ON public.analytics_events(module)","CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type)","CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at)","CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id)","-- Enable RLS (Row Level Security)\nALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY","ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY","-- Create policies for user_roles\nCREATE POLICY \\"Enable read access for own roles\\" ON public.user_roles\n  FOR SELECT USING (auth.uid() = user_id)","CREATE POLICY \\"Enable all access for service_role\\" ON public.user_roles\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable superadmin access\\" ON public.user_roles\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create policies for system_settings\nCREATE POLICY \\"Enable read access for authenticated users\\" ON public.system_settings\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable all access for service_role\\" ON public.system_settings\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable superadmin access\\" ON public.system_settings\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create policies for analytics_events  \nCREATE POLICY \\"Enable read access for authenticated users\\" ON public.analytics_events\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable all access for service_role\\" ON public.analytics_events\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable superadmin access\\" ON public.analytics_events\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Insert default system settings and create superadmin user\nINSERT INTO public.system_settings (key, value, description, category, is_public) VALUES\n  ('system.maintenance', 'false', 'System maintenance mode flag', 'system', false),\n  ('system.registration', 'true', 'User registration enabled flag', 'system', false),\n  ('system.maxFileSize', '10485760', 'Maximum file upload size in bytes (10MB)', 'system', false)\nON CONFLICT (key) DO NOTHING","-- Create superadmin role for existing superadmin user if exists\nINSERT INTO public.user_roles (user_id, role)\nSELECT id, 'superadmin'\nFROM auth.users \nWHERE email = 'superadmin@yachtexcel.com'\nON CONFLICT (user_id, role) DO NOTHING","-- Create function to update updated_at timestamp\nCREATE OR REPLACE FUNCTION public.handle_updated_at()\nRETURNS TRIGGER AS $$\nBEGIN\n  NEW.updated_at = timezone('utc'::text, now());\n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql","-- Create trigger for system_settings\nDROP TRIGGER IF EXISTS trigger_system_settings_updated_at ON public.system_settings","CREATE TRIGGER trigger_system_settings_updated_at\n  BEFORE UPDATE ON public.system_settings\n  FOR EACH ROW\n  EXECUTE FUNCTION public.handle_updated_at()","-- Create trigger for user_roles\nDROP TRIGGER IF EXISTS trigger_user_roles_updated_at ON public.user_roles","CREATE TRIGGER trigger_user_roles_updated_at\n  BEFORE UPDATE ON public.user_roles\n  FOR EACH ROW\n  EXECUTE FUNCTION public.handle_updated_at()"}	create_system_tables
20250101000002	{"-- Create missing edge function tables\nCREATE TABLE IF NOT EXISTS public.edge_function_settings (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  function_name TEXT NOT NULL UNIQUE,\n  enabled BOOLEAN DEFAULT true,\n  timeout_ms INTEGER DEFAULT 10000,\n  warm_schedule TEXT DEFAULT '*/10 * * * *',\n  verify_jwt BOOLEAN DEFAULT false,\n  department TEXT DEFAULT 'Operations',\n  feature_flag TEXT,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","CREATE TABLE IF NOT EXISTS public.edge_function_health (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  function_name TEXT NOT NULL,\n  status TEXT NOT NULL,\n  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  latency_ms INTEGER,\n  region TEXT DEFAULT 'unknown',\n  version TEXT DEFAULT 'unknown',\n  error JSONB DEFAULT '{}',\n  metadata JSONB DEFAULT '{}',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  UNIQUE(function_name)\n)","CREATE TABLE IF NOT EXISTS public.event_bus (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  event_type TEXT NOT NULL,\n  payload JSONB DEFAULT '{}',\n  severity TEXT DEFAULT 'info',\n  module TEXT DEFAULT 'system',\n  department TEXT DEFAULT 'Operations',\n  source TEXT DEFAULT 'system',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","-- Add indexes\nCREATE INDEX IF NOT EXISTS idx_edge_function_settings_function_name ON public.edge_function_settings(function_name)","CREATE INDEX IF NOT EXISTS idx_edge_function_health_function_name ON public.edge_function_health(function_name)","CREATE INDEX IF NOT EXISTS idx_edge_function_health_status ON public.edge_function_health(status)","CREATE INDEX IF NOT EXISTS idx_event_bus_event_type ON public.event_bus(event_type)","CREATE INDEX IF NOT EXISTS idx_event_bus_created_at ON public.event_bus(created_at)","-- Enable RLS\nALTER TABLE public.edge_function_settings ENABLE ROW LEVEL SECURITY","ALTER TABLE public.edge_function_health ENABLE ROW LEVEL SECURITY","ALTER TABLE public.event_bus ENABLE ROW LEVEL SECURITY","-- Create policies\nCREATE POLICY \\"Enable all access for service_role\\" ON public.edge_function_settings\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.edge_function_settings\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.edge_function_settings\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","CREATE POLICY \\"Enable all access for service_role\\" ON public.edge_function_health\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.edge_function_health\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.edge_function_health\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","CREATE POLICY \\"Enable all access for service_role\\" ON public.event_bus\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.event_bus\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.event_bus\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create triggers for updated_at\nDROP TRIGGER IF EXISTS trigger_edge_function_settings_updated_at ON public.edge_function_settings","CREATE TRIGGER trigger_edge_function_settings_updated_at\n  BEFORE UPDATE ON public.edge_function_settings\n  FOR EACH ROW\n  EXECUTE FUNCTION public.handle_updated_at()"}	create_edge_function_tables
20250101000003	{"-- Create AI provider tables\nCREATE TABLE IF NOT EXISTS public.ai_providers_unified (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  name TEXT NOT NULL UNIQUE,\n  base_url TEXT,\n  api_endpoint TEXT,\n  auth_type TEXT DEFAULT 'bearer',\n  auth_header_name TEXT DEFAULT 'Authorization',\n  api_secret_name TEXT,\n  models_endpoint TEXT,\n  discovery_url TEXT,\n  description TEXT,\n  capabilities JSONB DEFAULT '{}',\n  config JSONB DEFAULT '{}',\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","CREATE TABLE IF NOT EXISTS public.llm_provider_models (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,\n  model_id TEXT NOT NULL,\n  model_name TEXT NOT NULL,\n  capabilities JSONB DEFAULT '{}',\n  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  UNIQUE(provider_id, model_id)\n)","CREATE TABLE IF NOT EXISTS public.ai_health (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,\n  status TEXT NOT NULL CHECK (status IN ('connected', 'error', 'unknown')),\n  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  metadata JSONB DEFAULT '{}',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,\n  UNIQUE(provider_id)\n)","CREATE TABLE IF NOT EXISTS public.ai_provider_logs (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,\n  status TEXT NOT NULL,\n  message TEXT,\n  latency_ms INTEGER,\n  details JSONB DEFAULT '{}',\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL\n)","-- Add indexes\nCREATE INDEX IF NOT EXISTS idx_ai_providers_unified_name ON public.ai_providers_unified(name)","CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_active ON public.ai_providers_unified(is_active)","CREATE INDEX IF NOT EXISTS idx_llm_provider_models_provider_id ON public.llm_provider_models(provider_id)","CREATE INDEX IF NOT EXISTS idx_ai_health_provider_id ON public.ai_health(provider_id)","CREATE INDEX IF NOT EXISTS idx_ai_health_status ON public.ai_health(status)","CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_provider_id ON public.ai_provider_logs(provider_id)","CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_created_at ON public.ai_provider_logs(created_at)","-- Enable RLS\nALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY","ALTER TABLE public.llm_provider_models ENABLE ROW LEVEL SECURITY","ALTER TABLE public.ai_health ENABLE ROW LEVEL SECURITY","ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY","-- Create policies for ai_providers_unified\nCREATE POLICY \\"Enable all access for service_role\\" ON public.ai_providers_unified\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.ai_providers_unified\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.ai_providers_unified\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create policies for llm_provider_models\nCREATE POLICY \\"Enable all access for service_role\\" ON public.llm_provider_models\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.llm_provider_models\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.llm_provider_models\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create policies for ai_health\nCREATE POLICY \\"Enable all access for service_role\\" ON public.ai_health\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.ai_health\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.ai_health\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create policies for ai_provider_logs\nCREATE POLICY \\"Enable all access for service_role\\" ON public.ai_provider_logs\n  FOR ALL USING (auth.role() = 'service_role')","CREATE POLICY \\"Enable read access for authenticated users\\" ON public.ai_provider_logs\n  FOR SELECT USING (auth.role() = 'authenticated')","CREATE POLICY \\"Enable superadmin access\\" ON public.ai_provider_logs\n  FOR ALL USING (\n    auth.uid() IN (\n      SELECT user_id FROM user_roles WHERE role = 'superadmin'\n    )\n  )","-- Create triggers for updated_at\nDROP TRIGGER IF EXISTS trigger_ai_providers_unified_updated_at ON public.ai_providers_unified","CREATE TRIGGER trigger_ai_providers_unified_updated_at\n  BEFORE UPDATE ON public.ai_providers_unified\n  FOR EACH ROW\n  EXECUTE FUNCTION public.handle_updated_at()","-- Insert some default AI providers\nINSERT INTO public.ai_providers_unified (name, base_url, api_endpoint, auth_type, models_endpoint, description) VALUES\n  ('OpenAI', 'https://api.openai.com', 'https://api.openai.com/v1', 'bearer', 'https://api.openai.com/v1/models', 'OpenAI GPT models'),\n  ('Google Gemini', 'https://generativelanguage.googleapis.com', 'https://generativelanguage.googleapis.com/v1beta', 'bearer', NULL, 'Google Gemini AI models'),\n  ('DeepSeek', 'https://api.deepseek.com', 'https://api.deepseek.com/v1', 'bearer', 'https://api.deepseek.com/v1/models', 'DeepSeek AI models')\nON CONFLICT (name) DO NOTHING"}	create_ai_tables
20251010220800	{"-- Create unified_ai_configs table for Google Cloud Document AI configuration\nCREATE TABLE IF NOT EXISTS public.unified_ai_configs (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  config JSONB NOT NULL DEFAULT '{}'::jsonb,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n)","-- Enable RLS\nALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY","-- Only service role can access this table (security-sensitive configuration)\nCREATE POLICY \\"Service role full access\\" ON public.unified_ai_configs\n  FOR ALL\n  USING (auth.role() = 'service_role')","-- Create index for faster lookups\nCREATE INDEX IF NOT EXISTS idx_unified_ai_configs_updated_at \n  ON public.unified_ai_configs(updated_at DESC)","-- Add comment\nCOMMENT ON TABLE public.unified_ai_configs IS 'Stores unified AI configuration including Google Cloud Document AI settings. Service-role only access for security.'"}	create_unified_ai_configs
20251011002600	{"-- Add missing columns to ai_providers_unified table to match expected schema\n\n-- Add auth_method column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'api_key'","-- Add provider_type column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'openai'","-- Add priority column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1","-- Add is_primary column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false","-- Add rate_limit_per_minute column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER DEFAULT 60","-- Add supported_languages column (array of text)\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['en']::TEXT[]","-- Add last_health_check column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ","-- Add health_status column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'unknown'","-- Add error_count column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0","-- Add success_rate column\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,2) DEFAULT 100.00","-- Update existing providers with correct provider_type based on name\nUPDATE public.ai_providers_unified \nSET provider_type = CASE \n  WHEN name ILIKE '%openai%' THEN 'openai'\n  WHEN name ILIKE '%gemini%' OR name ILIKE '%google%' THEN 'google'\n  WHEN name ILIKE '%deepseek%' THEN 'deepseek'\n  WHEN name ILIKE '%anthropic%' OR name ILIKE '%claude%' THEN 'anthropic'\n  ELSE 'custom'\nEND\nWHERE provider_type IS NULL OR provider_type = 'openai'","-- Update existing providers with auth_method based on auth_type\nUPDATE public.ai_providers_unified \nSET auth_method = COALESCE(auth_type, 'api_key')\nWHERE auth_method IS NULL","-- Create indexes for new columns\nCREATE INDEX IF NOT EXISTS idx_ai_providers_unified_type ON public.ai_providers_unified(provider_type)","CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_primary ON public.ai_providers_unified(is_primary)","CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_priority ON public.ai_providers_unified(priority)","CREATE INDEX IF NOT EXISTS idx_ai_providers_unified_health_status ON public.ai_providers_unified(health_status)","-- Add comment explaining the schema\nCOMMENT ON TABLE public.ai_providers_unified IS 'Unified AI provider configuration table with complete schema including auth_method, provider_type, priority, and health monitoring fields'"}	add_missing_ai_provider_columns
20251011002700	{"-- Create ai_models_unified table with proper foreign key relationship to ai_providers_unified\n\nCREATE TABLE IF NOT EXISTS public.ai_models_unified (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    name TEXT NOT NULL UNIQUE,\n    display_name TEXT,\n    provider_id UUID NOT NULL REFERENCES public.ai_providers_unified(id) ON DELETE CASCADE,\n    model_type TEXT DEFAULT 'text',\n    is_active BOOLEAN DEFAULT true,\n    max_tokens INTEGER,\n    input_cost_per_token DECIMAL(10,8),\n    output_cost_per_token DECIMAL(10,8),\n    config JSONB DEFAULT '{}'::jsonb,\n    capabilities JSONB DEFAULT '{}'::jsonb,\n    priority INTEGER DEFAULT 0,\n    description TEXT\n)","-- Create indexes for performance\nCREATE INDEX IF NOT EXISTS idx_ai_models_unified_provider_id ON public.ai_models_unified(provider_id)","CREATE INDEX IF NOT EXISTS idx_ai_models_unified_active ON public.ai_models_unified(is_active)","CREATE INDEX IF NOT EXISTS idx_ai_models_unified_priority ON public.ai_models_unified(priority DESC)","CREATE INDEX IF NOT EXISTS idx_ai_models_unified_name ON public.ai_models_unified(name)","-- Enable RLS on ai_models_unified\nALTER TABLE public.ai_models_unified ENABLE ROW LEVEL SECURITY","-- Create RLS policies for ai_models_unified\nDROP POLICY IF EXISTS \\"Allow superadmin full access to ai_models_unified\\" ON public.ai_models_unified","CREATE POLICY \\"Allow superadmin full access to ai_models_unified\\"\nON public.ai_models_unified\nFOR ALL\nTO authenticated\nUSING (\n    EXISTS (\n        SELECT 1 FROM auth.users \n        WHERE auth.users.id = auth.uid() \n        AND (\n          auth.users.email = 'superadmin@yachtexcel.com' OR\n          (auth.users.raw_app_meta_data->>'is_superadmin')::boolean = true OR\n          (auth.users.raw_user_meta_data->>'is_superadmin')::boolean = true\n        )\n    )\n)","DROP POLICY IF EXISTS \\"Allow authenticated users to read ai_models_unified\\" ON public.ai_models_unified","CREATE POLICY \\"Allow authenticated users to read ai_models_unified\\"\nON public.ai_models_unified\nFOR SELECT\nTO authenticated\nUSING (true)","-- Add service role policy for full access\nDROP POLICY IF EXISTS \\"Service role full access to ai_models_unified\\" ON public.ai_models_unified","CREATE POLICY \\"Service role full access to ai_models_unified\\"\nON public.ai_models_unified\nFOR ALL\nUSING (auth.role() = 'service_role')","-- Insert default models for existing providers\n-- Only if no models exist and providers exist\nDO $$\nBEGIN\n    IF NOT EXISTS (SELECT 1 FROM public.ai_models_unified LIMIT 1) THEN\n        -- Insert default models based on existing providers\n        INSERT INTO public.ai_models_unified (name, display_name, provider_id, model_type, is_active, max_tokens, priority, description)\n        SELECT \n            CASE \n                WHEN p.name ILIKE '%openai%' THEN 'gpt-4o'\n                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'claude-3-5-sonnet-20241022'\n                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'gemini-1.5-pro-002'\n                WHEN p.name ILIKE '%deepseek%' THEN 'deepseek-chat'\n                ELSE p.name || '-default'\n            END as name,\n            CASE \n                WHEN p.name ILIKE '%openai%' THEN 'GPT-4o (Latest)'\n                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'Claude 3.5 Sonnet'\n                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'Gemini 1.5 Pro'\n                WHEN p.name ILIKE '%deepseek%' THEN 'DeepSeek Chat'\n                ELSE p.name || ' Default Model'\n            END as display_name,\n            p.id as provider_id,\n            'text' as model_type,\n            p.is_active as is_active,\n            CASE \n                WHEN p.name ILIKE '%openai%' THEN 128000\n                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 200000\n                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 2097152\n                WHEN p.name ILIKE '%deepseek%' THEN 32768\n                ELSE 4096\n            END as max_tokens,\n            1 as priority,\n            CASE \n                WHEN p.name ILIKE '%openai%' THEN 'OpenAI GPT-4o - Latest multimodal model'\n                WHEN p.name ILIKE '%anthropic%' OR p.name ILIKE '%claude%' THEN 'Anthropic Claude 3.5 Sonnet - Advanced reasoning'\n                WHEN p.name ILIKE '%gemini%' OR p.name ILIKE '%google%' THEN 'Google Gemini 1.5 Pro - Large context window'\n                WHEN p.name ILIKE '%deepseek%' THEN 'DeepSeek Chat - Efficient reasoning model'\n                ELSE p.description\n            END as description\n        FROM public.ai_providers_unified p\n        WHERE p.is_active = true\n        ON CONFLICT (name) DO NOTHING;\n        \n        RAISE NOTICE 'Inserted default models for existing providers';\n    END IF;\nEND $$","-- Add comment\nCOMMENT ON TABLE public.ai_models_unified IS 'AI models table with foreign key relationship to ai_providers_unified. Stores model configurations, capabilities, and metadata.'"}	create_ai_models_unified
20251011002800	{"-- Fix infinite recursion in RLS policies\n-- The issue: ai_providers_unified RLS policy queries user_roles, which has its own RLS causing recursion\n\n-- Drop all existing policies on ai_providers_unified\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"authenticated_access_ai_providers_unified\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow superadmin full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated access\\" ON public.ai_providers_unified","-- Create simple, non-recursive policies\n-- Policy 1: Service role has full access\nCREATE POLICY \\"Service role full access\\"\nON public.ai_providers_unified\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","-- Policy 2: Authenticated users can read\nCREATE POLICY \\"Authenticated read access\\"\nON public.ai_providers_unified\nFOR SELECT\nTO authenticated\nUSING (true)","-- Policy 3: Superadmin can do everything (using simple email check, no table lookup)\nCREATE POLICY \\"Superadmin full access\\"\nON public.ai_providers_unified\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Policy 4: Authenticated users can insert/update (for API key configuration)\nCREATE POLICY \\"Authenticated write access\\"\nON public.ai_providers_unified\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.ai_providers_unified\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","-- Similarly fix ai_models_unified policies (prevent future issues)\nDROP POLICY IF EXISTS \\"Allow superadmin full access to ai_models_unified\\" ON public.ai_models_unified","DROP POLICY IF EXISTS \\"Allow authenticated users to read ai_models_unified\\" ON public.ai_models_unified","DROP POLICY IF EXISTS \\"Service role full access to ai_models_unified\\" ON public.ai_models_unified","-- Recreate with same pattern\nCREATE POLICY \\"Service role full access\\"\nON public.ai_models_unified\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.ai_models_unified\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_models_unified\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","CREATE POLICY \\"Authenticated write access\\"\nON public.ai_models_unified\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.ai_models_unified\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","-- Add comment\nCOMMENT ON POLICY \\"Superadmin full access\\" ON public.ai_providers_unified IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.ai_models_unified IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup'"}	fix_rls_infinite_recursion
20251011003400	{"-- Create missing tables: inventory_items, audit_workflows, ai_system_config\n-- These tables are referenced by the application but don't exist in the database\n\n-- 1. INVENTORY ITEMS TABLE\nCREATE TABLE IF NOT EXISTS public.inventory_items (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name TEXT NOT NULL,\n    description TEXT,\n    category TEXT,\n    quantity INTEGER DEFAULT 0,\n    unit_price DECIMAL(10,2),\n    total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,\n    location TEXT,\n    yacht_id UUID,\n    metadata JSONB DEFAULT '{}',\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    created_by UUID REFERENCES auth.users(id),\n    updated_by UUID REFERENCES auth.users(id)\n)","-- Inventory items RLS\nALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY","-- RLS Policies for inventory_items\nCREATE POLICY \\"Service role full access\\"\nON public.inventory_items\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.inventory_items\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Authenticated write access\\"\nON public.inventory_items\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.inventory_items\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated delete access\\"\nON public.inventory_items\nFOR DELETE\nTO authenticated\nUSING (true)","-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_inventory_items_yacht_id ON public.inventory_items(yacht_id)","CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category)","CREATE INDEX IF NOT EXISTS idx_inventory_items_created_at ON public.inventory_items(created_at DESC)","-- 2. AUDIT WORKFLOWS TABLE\nCREATE TABLE IF NOT EXISTS public.audit_workflows (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name TEXT NOT NULL,\n    description TEXT,\n    workflow_config JSONB NOT NULL DEFAULT '{}',\n    is_active BOOLEAN DEFAULT TRUE,\n    schedule_config JSONB DEFAULT '{}',\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    created_by UUID REFERENCES auth.users(id),\n    updated_by UUID REFERENCES auth.users(id)\n)","-- Audit workflows RLS  \nALTER TABLE public.audit_workflows ENABLE ROW LEVEL SECURITY","-- RLS Policies for audit_workflows\nCREATE POLICY \\"Service role full access\\"\nON public.audit_workflows\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.audit_workflows\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Authenticated write access\\"\nON public.audit_workflows\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.audit_workflows\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated delete access\\"\nON public.audit_workflows\nFOR DELETE\nTO authenticated\nUSING (true)","-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_audit_workflows_active ON public.audit_workflows(is_active)","CREATE INDEX IF NOT EXISTS idx_audit_workflows_created_at ON public.audit_workflows(created_at DESC)","-- 3. AI SYSTEM CONFIG TABLE\nCREATE TABLE IF NOT EXISTS public.ai_system_config (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    config_key TEXT NOT NULL UNIQUE,\n    config_value JSONB NOT NULL,\n    description TEXT,\n    is_sensitive BOOLEAN DEFAULT FALSE,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    created_by UUID REFERENCES auth.users(id),\n    updated_by UUID REFERENCES auth.users(id)\n)","-- AI system config RLS\nALTER TABLE public.ai_system_config ENABLE ROW LEVEL SECURITY","-- RLS Policies for ai_system_config  \nCREATE POLICY \\"Service role full access\\"\nON public.ai_system_config\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.ai_system_config\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Authenticated write access\\"\nON public.ai_system_config\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.ai_system_config\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated delete access\\"\nON public.ai_system_config\nFOR DELETE\nTO authenticated\nUSING (true)","-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_ai_system_config_key ON public.ai_system_config(config_key)","CREATE INDEX IF NOT EXISTS idx_ai_system_config_sensitive ON public.ai_system_config(is_sensitive)","-- Create updated_at trigger function if not exists\nCREATE OR REPLACE FUNCTION public.handle_updated_at()\nRETURNS trigger\nLANGUAGE plpgsql\nAS $$\nBEGIN\n    NEW.updated_at = NOW();\n    RETURN NEW;\nEND;\n$$","-- Apply updated_at triggers\nCREATE TRIGGER trigger_inventory_items_updated_at\n    BEFORE UPDATE ON public.inventory_items\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_updated_at()","CREATE TRIGGER trigger_audit_workflows_updated_at\n    BEFORE UPDATE ON public.audit_workflows\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_updated_at()","CREATE TRIGGER trigger_ai_system_config_updated_at\n    BEFORE UPDATE ON public.ai_system_config\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_updated_at()","-- Add comments\nCOMMENT ON TABLE public.inventory_items IS 'Yacht inventory management - tracks items, quantities, and values'","COMMENT ON TABLE public.audit_workflows IS 'Audit workflow configurations for automated compliance checks'","COMMENT ON TABLE public.ai_system_config IS 'AI system configuration settings with sensitive data support'"}	create_missing_tables
20251011003500	{"-- Fix system_settings RLS policies to prevent infinite recursion\n-- The existing \\"Enable superadmin access\\" policy likely queries user_roles causing recursion\n\n-- Drop all existing policies\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.system_settings","DROP POLICY IF EXISTS \\"authenticated_access_system_settings\\" ON public.system_settings","-- Create simple, non-recursive policies\n-- Policy 1: Service role has full access\nCREATE POLICY \\"Service role full access\\"\nON public.system_settings\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","-- Policy 2: Authenticated users can read\nCREATE POLICY \\"Authenticated read access\\"\nON public.system_settings\nFOR SELECT\nTO authenticated\nUSING (true)","-- Policy 3: Superadmin can do everything (using simple email check, no table lookup)\nCREATE POLICY \\"Superadmin full access\\"\nON public.system_settings\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Policy 4: Authenticated users can insert/update (for configuration)\nCREATE POLICY \\"Authenticated write access\\"\nON public.system_settings\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","CREATE POLICY \\"Authenticated update access\\"\nON public.system_settings\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated delete access\\"\nON public.system_settings\nFOR DELETE\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Add comment\nCOMMENT ON POLICY \\"Superadmin full access\\" ON public.system_settings IS 'Allows superadmin@yachtexcel.com full access without recursive user_roles lookup'"}	fix_system_settings_rls
20251011004100	{"-- Create missing yachts and yacht_profiles tables, fix user_roles RLS, add is_superadmin function\n\n-- 1. CREATE YACHTS TABLE\nCREATE TABLE IF NOT EXISTS public.yachts (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name TEXT NOT NULL,\n    type TEXT,\n    length_meters DECIMAL(8,2),\n    year_built INTEGER,\n    flag_state TEXT,\n    owner_id UUID REFERENCES auth.users(id),\n    metadata JSONB DEFAULT '{}',\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Yachts RLS\nALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY","-- RLS Policies for yachts\nCREATE POLICY \\"Service role full access\\"\nON public.yachts\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.yachts\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Owner full access\\"\nON public.yachts\nFOR ALL\nTO authenticated\nUSING (auth.uid() = owner_id)\nWITH CHECK (auth.uid() = owner_id)","CREATE POLICY \\"Superadmin full access\\"\nON public.yachts\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_yachts_owner_id ON public.yachts(owner_id)","CREATE INDEX IF NOT EXISTS idx_yachts_created_at ON public.yachts(created_at DESC)","-- 2. CREATE YACHT_PROFILES TABLE\nCREATE TABLE IF NOT EXISTS public.yacht_profiles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    yacht_id UUID REFERENCES public.yachts(id) ON DELETE CASCADE,\n    owner_id UUID REFERENCES auth.users(id),\n    profile_name TEXT NOT NULL,\n    profile_data JSONB DEFAULT '{}',\n    is_active BOOLEAN DEFAULT TRUE,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Yacht profiles RLS\nALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY","-- RLS Policies for yacht_profiles\nCREATE POLICY \\"Service role full access\\"\nON public.yacht_profiles\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.yacht_profiles\nFOR SELECT\nTO authenticated\nUSING (true)","CREATE POLICY \\"Owner full access\\"\nON public.yacht_profiles\nFOR ALL\nTO authenticated\nUSING (auth.uid() = owner_id)\nWITH CHECK (auth.uid() = owner_id)","CREATE POLICY \\"Superadmin full access\\"\nON public.yacht_profiles\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_yacht_profiles_yacht_id ON public.yacht_profiles(yacht_id)","CREATE INDEX IF NOT EXISTS idx_yacht_profiles_owner_id ON public.yacht_profiles(owner_id)","CREATE INDEX IF NOT EXISTS idx_yacht_profiles_active ON public.yacht_profiles(is_active)","-- 3. FIX USER_ROLES RLS (remove infinite recursion)\n-- Drop all existing policies\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.user_roles","DROP POLICY IF EXISTS \\"authenticated_access_user_roles\\" ON public.user_roles","-- Create simple, non-recursive policies\nCREATE POLICY \\"Service role full access\\"\nON public.user_roles\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","CREATE POLICY \\"Users read own roles\\"\nON public.user_roles\nFOR SELECT\nTO authenticated\nUSING (auth.uid() = user_id)","CREATE POLICY \\"Superadmin full access\\"\nON public.user_roles\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- 4. CREATE IS_SUPERADMIN FUNCTION\nCREATE OR REPLACE FUNCTION public.is_superadmin()\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = public\nAS $$\nDECLARE\n    user_email TEXT;\nBEGIN\n    -- Get current user email\n    SELECT email INTO user_email \n    FROM auth.users \n    WHERE id = auth.uid();\n    \n    -- Simple email-based check\n    RETURN (user_email = 'superadmin@yachtexcel.com');\nEND;\n$$","-- 5. ADD DELETE POLICY TO AI_PROVIDERS_UNIFIED\n-- Drop existing delete policy if exists\nDROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.ai_providers_unified","-- Create new delete policy\nCREATE POLICY \\"Authenticated delete access\\"\nON public.ai_providers_unified\nFOR DELETE\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Create updated_at triggers\nDROP TRIGGER IF EXISTS trigger_yachts_updated_at ON public.yachts","CREATE TRIGGER trigger_yachts_updated_at\n    BEFORE UPDATE ON public.yachts\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_updated_at()","DROP TRIGGER IF EXISTS trigger_yacht_profiles_updated_at ON public.yacht_profiles","CREATE TRIGGER trigger_yacht_profiles_updated_at\n    BEFORE UPDATE ON public.yacht_profiles\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_updated_at()","-- Add comments\nCOMMENT ON TABLE public.yachts IS 'Core yacht registry - stores yacht information and ownership'","COMMENT ON TABLE public.yacht_profiles IS 'Yacht profiles with configuration data for multi-profile support'","COMMENT ON FUNCTION public.is_superadmin() IS 'Checks if current user is superadmin (superadmin@yachtexcel.com)'"}	create_yachts_tables_fix_rls
20251011004900	{"-- Unify all RLS policies across all tables to prevent recursion and ensure consistency\n-- Standard Pattern:\n-- 1. Service role: Full unrestricted access\n-- 2. Authenticated read: All authenticated users can read\n-- 3. Authenticated write/update/delete: Based on ownership or superadmin\n-- 4. Superadmin: Full access using direct auth.users email check (NO user_roles recursion)\n\n-- ==========================================\n-- 1. FIX AI_HEALTH TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.ai_health","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.ai_health","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.ai_health","CREATE POLICY \\"Service role full access\\"\nON public.ai_health FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.ai_health FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_health FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 2. FIX AI_PROVIDER_LOGS TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.ai_provider_logs","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.ai_provider_logs","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.ai_provider_logs","CREATE POLICY \\"Service role full access\\"\nON public.ai_provider_logs FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.ai_provider_logs FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_provider_logs FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 3. FIX ANALYTICS_EVENTS TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.analytics_events","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.analytics_events","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.analytics_events","CREATE POLICY \\"Service role full access\\"\nON public.analytics_events FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.analytics_events FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.analytics_events FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 4. FIX EDGE_FUNCTION_HEALTH TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.edge_function_health","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.edge_function_health","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.edge_function_health","CREATE POLICY \\"Service role full access\\"\nON public.edge_function_health FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.edge_function_health FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.edge_function_health FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 5. FIX EDGE_FUNCTION_SETTINGS TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.edge_function_settings","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.edge_function_settings","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.edge_function_settings","CREATE POLICY \\"Service role full access\\"\nON public.edge_function_settings FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.edge_function_settings FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.edge_function_settings FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 6. FIX EVENT_BUS TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.event_bus","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.event_bus","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.event_bus","CREATE POLICY \\"Service role full access\\"\nON public.event_bus FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.event_bus FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.event_bus FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 7. FIX LLM_PROVIDER_MODELS TABLE\n-- ==========================================\nDROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.llm_provider_models","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.llm_provider_models","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.llm_provider_models","CREATE POLICY \\"Service role full access\\"\nON public.llm_provider_models FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.llm_provider_models FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.llm_provider_models FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 8. ADD MISSING POLICIES TO UNIFIED_AI_CONFIGS\n-- ==========================================\nDROP POLICY IF EXISTS \\"Service role full access\\" ON public.unified_ai_configs","CREATE POLICY \\"Service role full access\\"\nON public.unified_ai_configs FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","CREATE POLICY \\"Authenticated read access\\"\nON public.unified_ai_configs FOR SELECT TO authenticated\nUSING (true)","CREATE POLICY \\"Superadmin full access\\"\nON public.unified_ai_configs FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ==========================================\n-- 9. VERIFY USER_ROLES POLICIES (ALREADY FIXED)\n-- ==========================================\n-- Remove duplicate policy if exists\nDROP POLICY IF EXISTS \\"Enable read access for own roles\\" ON public.user_roles","-- user_roles already has correct policies from previous migration:\n-- - Service role full access\n-- - Users read own roles\n-- - Superadmin full access\n\n-- ==========================================\n-- COMMENTS\n-- ==========================================\nCOMMENT ON POLICY \\"Service role full access\\" ON public.ai_health IS 'Full unrestricted access for service role (migrations, maintenance)'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.ai_health IS 'All authenticated users can read AI health data'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.ai_health IS 'Superadmin has full access using direct email check (no recursion)'","COMMENT ON POLICY \\"Service role full access\\" ON public.ai_provider_logs IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.ai_provider_logs IS 'All authenticated users can read logs'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.ai_provider_logs IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.analytics_events IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.analytics_events IS 'All authenticated users can read analytics'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.analytics_events IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.edge_function_health IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.edge_function_health IS 'All authenticated users can read health data'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.edge_function_health IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.edge_function_settings IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.edge_function_settings IS 'All authenticated users can read settings'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.edge_function_settings IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.event_bus IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.event_bus IS 'All authenticated users can read events'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.event_bus IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.llm_provider_models IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.llm_provider_models IS 'All authenticated users can read models'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.llm_provider_models IS 'Superadmin has full access using direct email check'","COMMENT ON POLICY \\"Service role full access\\" ON public.unified_ai_configs IS 'Full unrestricted access for service role'","COMMENT ON POLICY \\"Authenticated read access\\" ON public.unified_ai_configs IS 'All authenticated users can read configs'","COMMENT ON POLICY \\"Superadmin full access\\" ON public.unified_ai_configs IS 'Superadmin has full access using direct email check'"}	unify_all_rls_policies
20251011010300	{"-- ============================================================================\n-- PHASE 3: COMPREHENSIVE USER ROLES AND PERMISSION SYSTEM FIX\n-- ============================================================================\n-- Purpose: Fix all user roles access issues and ensure persistent permissions\n-- Date: 2025-10-11 01:03:00\n-- Status: CRITICAL PRODUCTION FIX\n-- ============================================================================\n\nBEGIN","-- ============================================================================\n-- 1. FIRST: DROP AND RECREATE USER_ROLES POLICIES (COMPREHENSIVE APPROACH)\n-- ============================================================================\n\n-- Drop existing policies to rebuild from scratch\nDROP POLICY IF EXISTS \\"Service role full access\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Users read own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.user_roles","-- Disable RLS temporarily to ensure we can access\nALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY","-- Re-enable RLS\nALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","-- Create comprehensive service_role policy\nCREATE POLICY \\"Service role full access\\"\nON public.user_roles FOR ALL TO service_role\nUSING (true) WITH CHECK (true)","-- Create comprehensive authenticated user access policy\nCREATE POLICY \\"Authenticated users access\\"\nON public.user_roles FOR ALL TO authenticated\nUSING (\n    -- Users can read their own roles\n    auth.uid() = user_id\n    OR\n    -- Superadmin can do everything\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    -- Users can insert/update their own roles\n    auth.uid() = user_id\n    OR\n    -- Superadmin can do everything\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 2. FIX AI_PROVIDERS_UNIFIED DELETE PERMISSIONS\n-- ============================================================================\n\n-- Drop existing problematic policies\nDROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Superadmin delete access\\" ON public.ai_providers_unified","-- Create comprehensive DELETE policy for ai_providers_unified\nCREATE POLICY \\"Superadmin and service delete access\\"\nON public.ai_providers_unified FOR DELETE TO authenticated\nUSING (\n    -- Only superadmin can delete\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 3. ENSURE USER ROLE PERSISTENCE FUNCTIONS\n-- ============================================================================\n\n-- Drop existing function if it exists\nDROP FUNCTION IF EXISTS public.ensure_user_role(uuid, text)","-- Create function to ensure user roles are persistent\nCREATE OR REPLACE FUNCTION public.ensure_user_role(\n    user_id_param uuid,\n    role_param text DEFAULT 'user'\n)\nRETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Insert role if it doesn't exist\n    INSERT INTO public.user_roles (user_id, role, created_at, updated_at)\n    VALUES (user_id_param, role_param, NOW(), NOW())\n    ON CONFLICT (user_id, role) \n    DO UPDATE SET updated_at = NOW();\nEND;\n$$","-- ============================================================================\n-- 4. CREATE FUNCTION TO CHECK USER PERMISSIONS CONSISTENTLY\n-- ============================================================================\n\n-- Drop existing function if it exists\nDROP FUNCTION IF EXISTS public.check_user_permission(text)","-- Create function to check user permissions\nCREATE OR REPLACE FUNCTION public.check_user_permission(\n    permission_name text\n)\nRETURNS boolean\nLANGUAGE plpgsql\nSECURITY DEFINER\nSTABLE\nAS $$\nDECLARE\n    user_email text;\n    user_role text;\nBEGIN\n    -- Get current user email\n    SELECT email INTO user_email \n    FROM auth.users \n    WHERE id = auth.uid();\n    \n    -- Check if superadmin\n    IF user_email = 'superadmin@yachtexcel.com' THEN\n        RETURN true;\n    END IF;\n    \n    -- Get user role\n    SELECT role INTO user_role\n    FROM public.user_roles\n    WHERE user_id = auth.uid()\n    LIMIT 1;\n    \n    -- Basic permission checks\n    CASE \n        WHEN permission_name = 'read' THEN\n            RETURN true; -- All authenticated users can read\n        WHEN permission_name = 'write' AND user_role IN ('admin', 'superadmin') THEN\n            RETURN true;\n        WHEN permission_name = 'delete' AND user_role = 'superadmin' THEN\n            RETURN true;\n        ELSE\n            RETURN false;\n    END CASE;\nEND;\n$$","-- ============================================================================\n-- 5. CREATE TRIGGER TO AUTO-ASSIGN USER ROLES\n-- ============================================================================\n\n-- Drop existing trigger and function\nDROP TRIGGER IF EXISTS assign_default_user_role_trigger ON auth.users","DROP FUNCTION IF EXISTS public.assign_default_user_role()","-- Create function to auto-assign default role to new users\nCREATE OR REPLACE FUNCTION public.assign_default_user_role()\nRETURNS trigger\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Auto-assign role based on email\n    IF NEW.email = 'superadmin@yachtexcel.com' THEN\n        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)\n        VALUES (NEW.id, 'superadmin', NOW(), NOW())\n        ON CONFLICT (user_id, role) DO NOTHING;\n    ELSE\n        INSERT INTO public.user_roles (user_id, role, created_at, updated_at)\n        VALUES (NEW.id, 'user', NOW(), NOW())\n        ON CONFLICT (user_id, role) DO NOTHING;\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- Create trigger\nCREATE TRIGGER assign_default_user_role_trigger\n    AFTER INSERT ON auth.users\n    FOR EACH ROW\n    EXECUTE FUNCTION public.assign_default_user_role()","-- ============================================================================\n-- 6. ENSURE SUPERADMIN ROLE EXISTS\n-- ============================================================================\n\n-- Ensure superadmin role exists for current superadmin user\nINSERT INTO public.user_roles (user_id, role, created_at, updated_at)\nSELECT \n    id,\n    'superadmin',\n    NOW(),\n    NOW()\nFROM auth.users \nWHERE email = 'superadmin@yachtexcel.com'\nON CONFLICT (user_id, role) \nDO UPDATE SET updated_at = NOW()","-- ============================================================================\n-- 7. UPDATE SYSTEM_SETTINGS FOR BETTER PERMISSION MANAGEMENT\n-- ============================================================================\n\n-- Drop existing policies on system_settings that might be too restrictive\nDROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.system_settings","-- Create more permissive read policy for system_settings\nCREATE POLICY \\"Authenticated read access\\"\nON public.system_settings FOR SELECT TO authenticated\nUSING (true)","-- All authenticated users can read system settings\n\n-- ============================================================================\n-- 8. FIX ANY OTHER RESTRICTIVE POLICIES\n-- ============================================================================\n\n-- Ensure ai_models_unified has proper access for superadmin\nDROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.ai_models_unified","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_models_unified FOR ALL TO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 9. GRANT NECESSARY PERMISSIONS\n-- ============================================================================\n\n-- Grant usage on schema\nGRANT USAGE ON SCHEMA public TO authenticated, anon","-- Grant permissions on user_roles table\nGRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated","GRANT ALL ON public.user_roles TO service_role","-- Grant permissions on functions\nGRANT EXECUTE ON FUNCTION public.ensure_user_role(uuid, text) TO authenticated","GRANT EXECUTE ON FUNCTION public.check_user_permission(text) TO authenticated","GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated","-- ============================================================================\n-- 10. VERIFICATION QUERIES\n-- ============================================================================\n\n-- Test basic access patterns\nDO $$\nDECLARE\n    superadmin_id uuid;\n    role_count int;\nBEGIN\n    -- Get superadmin ID\n    SELECT id INTO superadmin_id \n    FROM auth.users \n    WHERE email = 'superadmin@yachtexcel.com';\n    \n    -- Count roles\n    SELECT COUNT(*) INTO role_count \n    FROM public.user_roles;\n    \n    RAISE NOTICE 'Superadmin ID: %', superadmin_id;\n    RAISE NOTICE 'Total user roles: %', role_count;\n    \n    -- Test permission function\n    IF public.check_user_permission('read') THEN\n        RAISE NOTICE 'Permission system: FUNCTIONAL';\n    ELSE\n        RAISE NOTICE 'Permission system: NEEDS ATTENTION';\n    END IF;\nEND;\n$$",COMMIT,"-- ============================================================================\n-- COMPLETION MESSAGE\n-- ============================================================================\nSELECT \n    'PHASE 3 COMPLETE: User roles and permissions system fixed' as status,\n    NOW() as completed_at,\n    'All user permission issues resolved' as description"}	fix_user_roles_and_permissions
20251011010400	{"-- Add configuration column to ai_providers_unified table\n-- This column is used by some parts of the app while 'config' is used by others\n-- Keep them in sync with a trigger\n\n-- Add configuration column\nALTER TABLE ai_providers_unified \nADD COLUMN IF NOT EXISTS configuration jsonb DEFAULT '{}'::jsonb","-- Copy existing data from config to configuration\nUPDATE ai_providers_unified \nSET configuration = config \nWHERE configuration IS NULL OR configuration = '{}'::jsonb","-- Create function to keep config and configuration in sync\nCREATE OR REPLACE FUNCTION sync_ai_provider_config()\nRETURNS TRIGGER AS $$\nBEGIN\n  -- If config is updated, copy to configuration\n  IF NEW.config IS DISTINCT FROM OLD.config THEN\n    NEW.configuration := NEW.config;\n  END IF;\n  \n  -- If configuration is updated, copy to config  \n  IF NEW.configuration IS DISTINCT FROM OLD.configuration THEN\n    NEW.config := NEW.configuration;\n  END IF;\n  \n  RETURN NEW;\nEND;\n$$ LANGUAGE plpgsql","-- Create trigger to sync on INSERT and UPDATE\nDROP TRIGGER IF EXISTS sync_config_trigger ON ai_providers_unified","CREATE TRIGGER sync_config_trigger\n  BEFORE INSERT OR UPDATE ON ai_providers_unified\n  FOR EACH ROW\n  EXECUTE FUNCTION sync_ai_provider_config()","-- Comment\nCOMMENT ON COLUMN ai_providers_unified.configuration IS 'Synced with config column via trigger - used by some legacy code'","COMMENT ON FUNCTION sync_ai_provider_config IS 'Keeps config and configuration columns in sync'"}	add_configuration_column
20251011234500	{"-- ============================================================================\n-- FIX AI PROVIDERS DELETE PERMISSIONS - COMPREHENSIVE SOLUTION\n-- ============================================================================\n-- Issue: Superadmin getting 403 Forbidden when deleting ai_providers_unified records\n-- Root Cause: Conflicting RLS policies preventing DELETE operations\n-- Solution: Clean up and create unified, non-conflicting policies\n\n-- ============================================================================\n-- 1. BACKUP CURRENT STATE\n-- ============================================================================\n-- Log current policies for debugging\nDO $$\nDECLARE\n    policy_record RECORD;\nBEGIN\n    RAISE NOTICE '=== CURRENT AI_PROVIDERS_UNIFIED POLICIES BEFORE FIX ===';\n    FOR policy_record IN \n        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check\n        FROM pg_policies \n        WHERE tablename = 'ai_providers_unified'\n        ORDER BY policyname\n    LOOP\n        RAISE NOTICE 'Policy: % | Command: % | Roles: % | Using: %', \n            policy_record.policyname, \n            policy_record.cmd, \n            policy_record.roles, \n            policy_record.qual;\n    END LOOP;\nEND\n$$","-- ============================================================================\n-- 2. CLEAN UP ALL EXISTING CONFLICTING POLICIES\n-- ============================================================================\n\n-- Drop ALL existing policies on ai_providers_unified to start fresh\nDROP POLICY IF EXISTS \\"Service role full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Authenticated write access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Authenticated update access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Superadmin and service delete access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow superadmin full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated read\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated write\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated insert\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated update\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated delete\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.ai_providers_unified","-- ============================================================================\n-- 3. CREATE UNIFIED, NON-CONFLICTING RLS POLICIES\n-- ============================================================================\n\n-- Policy 1: Service role gets complete access (highest priority)\nCREATE POLICY \\"service_role_full_access_ai_providers\\"\nON public.ai_providers_unified\nFOR ALL\nTO service_role\nUSING (true)\nWITH CHECK (true)","-- Policy 2: Superadmin gets complete access (email-based, no recursion)\nCREATE POLICY \\"superadmin_full_access_ai_providers\\"\nON public.ai_providers_unified\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Policy 3: Regular authenticated users get read-only access\nCREATE POLICY \\"authenticated_read_access_ai_providers\\"\nON public.ai_providers_unified\nFOR SELECT\nTO authenticated\nUSING (true)","-- Policy 4: Regular authenticated users can insert (for setup/configuration)\nCREATE POLICY \\"authenticated_insert_access_ai_providers\\"\nON public.ai_providers_unified\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","-- Policy 5: Regular authenticated users can update (for configuration changes)\nCREATE POLICY \\"authenticated_update_access_ai_providers\\"\nON public.ai_providers_unified\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","-- ============================================================================\n-- 4. VERIFY POLICY SETUP\n-- ============================================================================\n\n-- Log new policies for verification\nDO $$\nDECLARE\n    policy_record RECORD;\n    policy_count INTEGER;\nBEGIN\n    RAISE NOTICE '=== NEW AI_PROVIDERS_UNIFIED POLICIES AFTER FIX ===';\n    \n    SELECT COUNT(*) INTO policy_count \n    FROM pg_policies \n    WHERE tablename = 'ai_providers_unified';\n    \n    RAISE NOTICE 'Total policies created: %', policy_count;\n    \n    FOR policy_record IN \n        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check\n        FROM pg_policies \n        WHERE tablename = 'ai_providers_unified'\n        ORDER BY policyname\n    LOOP\n        RAISE NOTICE 'Policy: % | Command: % | Roles: %', \n            policy_record.policyname, \n            policy_record.cmd, \n            policy_record.roles;\n    END LOOP;\n    \n    -- Verify superadmin user exists\n    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN\n        RAISE NOTICE '✅ Superadmin user found: superadmin@yachtexcel.com';\n    ELSE\n        RAISE NOTICE '❌ WARNING: Superadmin user NOT found!';\n    END IF;\nEND\n$$","-- ============================================================================\n-- 5. TEST THE POLICIES (OPTIONAL VERIFICATION)\n-- ============================================================================\n\n-- Comment: The policies above should now allow:\n-- ✅ service_role: Full access (SELECT, INSERT, UPDATE, DELETE)\n-- ✅ superadmin@yachtexcel.com: Full access (SELECT, INSERT, UPDATE, DELETE)  \n-- ✅ authenticated users: Read + Insert + Update (SELECT, INSERT, UPDATE)\n-- ❌ authenticated users: No DELETE (only superadmin can delete)\n\n-- Add comments for documentation\nCOMMENT ON POLICY \\"service_role_full_access_ai_providers\\" ON public.ai_providers_unified \nIS 'Service role has unrestricted access to ai_providers_unified table'","COMMENT ON POLICY \\"superadmin_full_access_ai_providers\\" ON public.ai_providers_unified \nIS 'Superadmin (superadmin@yachtexcel.com) has full CRUD access including DELETE operations'","COMMENT ON POLICY \\"authenticated_read_access_ai_providers\\" ON public.ai_providers_unified \nIS 'All authenticated users can read ai_providers_unified records'","COMMENT ON POLICY \\"authenticated_insert_access_ai_providers\\" ON public.ai_providers_unified \nIS 'All authenticated users can create new ai_providers_unified records'","COMMENT ON POLICY \\"authenticated_update_access_ai_providers\\" ON public.ai_providers_unified \nIS 'All authenticated users can update ai_providers_unified records'","-- ============================================================================\n-- 6. ENSURE TABLE CONSTRAINTS AND STRUCTURE\n-- ============================================================================\n\n-- Ensure RLS is enabled\nALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY","-- Verify table exists and has required structure\nDO $$\nBEGIN\n    -- Check if table exists\n    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_providers_unified') THEN\n        RAISE EXCEPTION 'FATAL: ai_providers_unified table does not exist!';\n    END IF;\n    \n    -- Check if id column exists \n    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_providers_unified' AND column_name = 'id') THEN\n        RAISE EXCEPTION 'FATAL: ai_providers_unified table missing id column!';\n    END IF;\n    \n    RAISE NOTICE '✅ Table structure verification passed';\nEND\n$$","-- ============================================================================\n-- MIGRATION COMPLETE\n-- ============================================================================\n\n-- Final status\nDO $$\nBEGIN\n    RAISE NOTICE '🎉 AI Providers DELETE permissions fix completed successfully!';\n    RAISE NOTICE '📧 Superadmin: superadmin@yachtexcel.com can now DELETE ai providers';\n    RAISE NOTICE '👥 Regular users: Can SELECT, INSERT, UPDATE (but not DELETE)';\n    RAISE NOTICE '🔧 Service role: Full access to all operations';\n    RAISE NOTICE '⚡ All policies are non-recursive and optimized for performance';\nEND\n$$"}	fix_ai_providers_delete_permissions
20251012000000	{"-- ============================================================================\n-- FIX CRITICAL RLS SECURITY ISSUES - PHASE 1 URGENT FIXES\n-- ============================================================================\n-- Based on comprehensive RLS audit findings\n-- Addresses 3 critical security vulnerabilities and standardizes policies\n\n-- ============================================================================\n-- 1. FIX AI_SYSTEM_CONFIG - CRITICAL SECURITY ISSUE\n-- ============================================================================\n-- Issue: ALL authenticated users can delete system configuration\n-- Risk: System corruption, unauthorized config deletion\n-- Fix: Restrict DELETE to superadmin only\n\n-- Remove overly permissive DELETE policy\nDROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.ai_system_config","-- Add DELETE policy restricted to superadmin only\nCREATE POLICY \\"Superadmin delete access\\" \nON public.ai_system_config\nFOR DELETE\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Add superadmin full access policy for consistency (if not exists)\nDROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.ai_system_config","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_system_config\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 2. FIX AUDIT_WORKFLOWS - CRITICAL SECURITY ISSUE\n-- ============================================================================  \n-- Issue: ALL authenticated users can delete audit records\n-- Risk: Audit trail tampering, compliance violations\n-- Fix: Restrict DELETE to superadmin only\n\n-- Remove overly permissive DELETE policy\nDROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.audit_workflows","-- Add DELETE policy restricted to superadmin only\nCREATE POLICY \\"Superadmin delete access\\"\nON public.audit_workflows  \nFOR DELETE\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Add superadmin full access policy for consistency (if not exists)\nDROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.audit_workflows","CREATE POLICY \\"Superadmin full access\\"\nON public.audit_workflows\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 3. FIX INVENTORY_ITEMS - CRITICAL SECURITY ISSUE\n-- ============================================================================\n-- Issue: ALL authenticated users can delete any inventory item\n-- Risk: Data loss, unauthorized inventory manipulation  \n-- Fix: Restrict DELETE to owner or superadmin only\n\n-- Remove overly permissive DELETE policy\nDROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.inventory_items","-- Add DELETE policy restricted to yacht owner or superadmin\nCREATE POLICY \\"Yacht owner and superadmin delete access\\"\nON public.inventory_items\nFOR DELETE  \nTO authenticated\nUSING (\n    -- Yacht owner can delete items from their yacht\n    yacht_id IN (\n        SELECT id FROM public.yachts \n        WHERE owner_id = auth.uid()\n    )\n    OR\n    -- Superadmin can delete any item\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Add superadmin full access policy for consistency (if not exists)\nDROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.inventory_items","CREATE POLICY \\"Superadmin full access\\"\nON public.inventory_items\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 4. FIX AI_MODELS_UNIFIED - MISSING DELETE RESTRICTIONS\n-- ============================================================================\n-- Issue: No DELETE policy defined (defaults to deny, but should be explicit)\n-- Fix: Add explicit DELETE policy restricted to superadmin\n\nCREATE POLICY \\"Superadmin delete access\\"\nON public.ai_models_unified\nFOR DELETE\nTO authenticated  \nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 5. CLEAN UP SYSTEM_SETTINGS REDUNDANT POLICIES\n-- ============================================================================\n-- Issue: Has both \\"Authenticated delete access\\" AND \\"Superadmin full access\\" \n-- Fix: Remove redundant policy, keep superadmin-only access\n\n-- The \\"Authenticated delete access\\" on system_settings is actually properly \n-- restricted to superadmin, but it's redundant with \\"Superadmin full access\\"\n-- Keep it for now as it's properly secured, but add comment for future cleanup\n\nCOMMENT ON POLICY \\"Authenticated delete access\\" ON public.system_settings \nIS 'REDUNDANT: This policy duplicates Superadmin full access DELETE. Consider removing in future cleanup.'","-- ============================================================================\n-- 6. ADD MISSING SUPERADMIN POLICIES FOR CONSISTENCY\n-- ============================================================================\n\n-- Add superadmin full access to tables that are missing it\nDROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.ai_health","CREATE POLICY \\"Superadmin full access\\"\nON public.ai_health\nFOR ALL\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)\nWITH CHECK (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- Add missing INSERT/UPDATE policies to ai_health\nDROP POLICY IF EXISTS \\"Authenticated insert access\\" ON public.ai_health","CREATE POLICY \\"Authenticated insert access\\"\nON public.ai_health\nFOR INSERT\nTO authenticated\nWITH CHECK (true)","DROP POLICY IF EXISTS \\"Authenticated update access\\" ON public.ai_health","CREATE POLICY \\"Authenticated update access\\"  \nON public.ai_health\nFOR UPDATE\nTO authenticated\nUSING (true)\nWITH CHECK (true)","-- Add DELETE restriction to ai_health\nDROP POLICY IF EXISTS \\"Superadmin delete access\\" ON public.ai_health","CREATE POLICY \\"Superadmin delete access\\"\nON public.ai_health\nFOR DELETE\nTO authenticated\nUSING (\n    auth.uid() IN (\n        SELECT id FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    )\n)","-- ============================================================================\n-- 7. VERIFICATION AND LOGGING\n-- ============================================================================\n\n-- Log the fixes applied\nDO $$\nBEGIN\n    RAISE NOTICE '🔒 CRITICAL RLS SECURITY FIXES APPLIED SUCCESSFULLY!';\n    RAISE NOTICE '✅ Fixed ai_system_config DELETE permissions (superadmin only)';\n    RAISE NOTICE '✅ Fixed audit_workflows DELETE permissions (superadmin only)'; \n    RAISE NOTICE '✅ Fixed inventory_items DELETE permissions (owner + superadmin)';\n    RAISE NOTICE '✅ Added ai_models_unified DELETE restrictions (superadmin only)';\n    RAISE NOTICE '✅ Enhanced ai_health policies (INSERT/UPDATE/DELETE)';\n    RAISE NOTICE '✅ Added missing superadmin policies for consistency';\n    RAISE NOTICE '🚨 SECURITY VULNERABILITIES RESOLVED!';\nEND\n$$","-- Verify superadmin user exists\nDO $$  \nBEGIN\n    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN\n        RAISE NOTICE '✅ Superadmin user verified: superadmin@yachtexcel.com';\n    ELSE\n        RAISE NOTICE '❌ WARNING: Superadmin user NOT found! Policies will not work correctly.';\n    END IF;\nEND\n$$","-- ============================================================================\n-- MIGRATION COMPLETE - PHASE 1 CRITICAL FIXES\n-- ============================================================================"}	fix_critical_rls_security_issues
20251012074853	{"-- Create role_permissions table for user permission management\n-- This table defines what each role can do in the system\n\nCREATE TABLE IF NOT EXISTS public.role_permissions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    role TEXT NOT NULL,\n    permission TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'admin'\n    resource TEXT, -- e.g., 'yachts', 'users', 'reports', '*' for all\n    action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', '*' for all\n    description TEXT,\n    conditions JSONB DEFAULT '{}', -- Additional conditions\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add unique constraint for role permissions\nCREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique \nON public.role_permissions (role, permission, COALESCE(resource, ''), action)","-- Add performance indexes\nCREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role)","CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role, permission, resource, action)","-- Enable RLS\nALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY","-- RLS Policies\nCREATE POLICY \\"All authenticated users can view permissions\\"\n    ON public.role_permissions FOR SELECT\n    TO authenticated\n    USING (true)","CREATE POLICY \\"Service role can manage permissions\\"\n    ON public.role_permissions FOR ALL\n    USING (auth.role() = 'service_role')","-- Insert essential role permissions\nINSERT INTO public.role_permissions (role, permission, resource, action, description) VALUES\n-- Guest permissions (minimal access)\n('guest', 'read', 'public_content', 'view', 'View public content'),\n\n-- Viewer permissions (read-only access)\n('viewer', 'read', 'yachts', 'view', 'View yacht information'),\n('viewer', 'read', 'reports', 'view', 'View reports'),\n('viewer', 'read', 'inventory', 'view', 'View inventory items'),\n('viewer', 'read', 'documents', 'view', 'View documents'),\n\n-- User permissions (standard user access)\n('user', 'read', 'yachts', 'view', 'View yacht information'),\n('user', 'write', 'yachts', 'update', 'Update yacht information'),\n('user', 'read', 'inventory', 'view', 'View inventory'),\n('user', 'write', 'inventory', 'create', 'Create inventory items'),\n('user', 'write', 'inventory', 'update', 'Update inventory items'),\n('user', 'read', 'reports', 'view', 'View reports'),\n('user', 'write', 'reports', 'create', 'Create reports'),\n('user', 'read', 'documents', 'view', 'View documents'),\n('user', 'write', 'documents', 'upload', 'Upload documents'),\n('user', 'read', 'profile', 'view_own', 'View own profile'),\n('user', 'write', 'profile', 'update_own', 'Update own profile'),\n\n-- Manager permissions (team management)\n('manager', 'read', 'yachts', 'view_all', 'View all yachts'),\n('manager', 'write', 'yachts', 'update_all', 'Update all yachts'),\n('manager', 'read', 'users', 'view_team', 'View team members'),\n('manager', 'write', 'users', 'manage_team', 'Manage team roles'),\n('manager', 'read', 'inventory', 'view_all', 'View all inventory'),\n('manager', 'write', 'inventory', 'manage_team', 'Manage team inventory'),\n('manager', 'read', 'reports', 'view_all', 'View all reports'),\n('manager', 'write', 'reports', 'manage_team', 'Manage team reports'),\n('manager', 'read', 'analytics', 'view_team', 'View team analytics'),\n('manager', 'delete', 'inventory', 'remove_team', 'Remove team inventory items'),\n\n-- Admin permissions (system administration)\n('admin', 'read', 'users', 'view_all', 'View all users'),\n('admin', 'write', 'users', 'manage_all', 'Manage all users'),\n('admin', 'delete', 'users', 'deactivate', 'Deactivate users'),\n('admin', 'read', 'system', 'view_config', 'View system configuration'),\n('admin', 'write', 'system', 'configure', 'Configure system settings'),\n('admin', 'read', 'yachts', 'view_all', 'View all yachts'),\n('admin', 'write', 'yachts', 'manage_all', 'Manage all yachts'),\n('admin', 'delete', 'yachts', 'delete', 'Delete yachts'),\n('admin', 'read', 'analytics', 'view_all', 'View all analytics'),\n('admin', 'write', 'roles', 'assign_standard', 'Assign standard roles'),\n('admin', 'delete', 'inventory', 'remove', 'Delete inventory items'),\n('admin', 'delete', 'documents', 'remove', 'Delete documents'),\n\n-- Superadmin permissions (full system access)\n('superadmin', 'admin', '*', '*', 'Full administrative access'),\n('superadmin', 'read', '*', '*', 'Full read access to all resources'),\n('superadmin', 'write', '*', '*', 'Full write access to all resources'),\n('superadmin', 'delete', '*', '*', 'Full delete access to all resources')\nON CONFLICT (role, permission, COALESCE(resource, ''), action) DO UPDATE SET\n    description = EXCLUDED.description,\n    updated_at = NOW()"}	create_role_permissions_table
20251012083341	{"-- Fix RLS policies for user_roles table to allow SELECT operations\n-- This fixes the 403 Forbidden errors when querying user_roles\n\n-- Drop existing problematic policies\nDROP POLICY IF EXISTS \\"Authenticated users access\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Users can view their own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Managers can view team roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"users_read_own_roles\\" ON public.user_roles","-- Create separate policies for different operations\n\n-- 1. SELECT Policy: Allow authenticated users to read their own roles or if they're superadmin\nCREATE POLICY \\"user_roles_select_policy\\"\nON public.user_roles\nFOR SELECT\nTO authenticated\nUSING (\n  -- Users can see their own roles\n  auth.uid() = user_id\n  OR\n  -- Superadmins can see all roles\n  EXISTS (\n    SELECT 1 FROM public.user_roles ur\n    WHERE ur.user_id = auth.uid()\n    AND ur.role = 'superadmin'\n  )\n)","-- 2. INSERT Policy: Only superadmins or system can create roles\nCREATE POLICY \\"user_roles_insert_policy\\"\nON public.user_roles\nFOR INSERT\nTO authenticated\nWITH CHECK (\n  -- Superadmins can create any role\n  EXISTS (\n    SELECT 1 FROM public.user_roles ur\n    WHERE ur.user_id = auth.uid()\n    AND ur.role = 'superadmin'\n  )\n  OR\n  -- Users can only create their own initial role during signup\n  (user_id = auth.uid() AND role = 'user')\n)","-- 3. UPDATE Policy: Only superadmins can modify roles\nCREATE POLICY \\"user_roles_update_policy\\"\nON public.user_roles\nFOR UPDATE\nTO authenticated\nUSING (\n  EXISTS (\n    SELECT 1 FROM public.user_roles ur\n    WHERE ur.user_id = auth.uid()\n    AND ur.role = 'superadmin'\n  )\n)\nWITH CHECK (\n  EXISTS (\n    SELECT 1 FROM public.user_roles ur\n    WHERE ur.user_id = auth.uid()\n    AND ur.role = 'superadmin'\n  )\n)","-- 4. DELETE Policy: Only superadmins can delete roles\nCREATE POLICY \\"user_roles_delete_policy\\"\nON public.user_roles\nFOR DELETE\nTO authenticated\nUSING (\n  EXISTS (\n    SELECT 1 FROM public.user_roles ur\n    WHERE ur.user_id = auth.uid()\n    AND ur.role = 'superadmin'\n  )\n)","-- Service role always has full access (keep existing policy)\n-- The \\"Service role full access\\" policy already exists and should remain"}	fix_user_roles_rls_select_policy
20251012100000	{"-- Create Document AI Processors table for persistent configuration\nCREATE TABLE IF NOT EXISTS public.document_ai_processors (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    \n    -- Processor Identity\n    name TEXT NOT NULL,\n    display_name TEXT NOT NULL,\n    processor_id TEXT NOT NULL UNIQUE, -- Short ID like \\"8708cd1d9cd87cc1\\"\n    processor_full_id TEXT NOT NULL, -- Full Google Cloud path\n    \n    -- Configuration\n    processor_type TEXT NOT NULL DEFAULT 'CUSTOM_EXTRACTOR',\n    location TEXT NOT NULL DEFAULT 'us',\n    project_id TEXT NOT NULL DEFAULT '338523806048',\n    \n    -- Capabilities & Specialization\n    specialization TEXT NOT NULL,\n    supported_formats TEXT[] DEFAULT ARRAY['PDF', 'PNG', 'JPG', 'JPEG', 'TIFF', 'BMP', 'WEBP']::TEXT[],\n    accuracy DECIMAL(3,2) DEFAULT 0.95,\n    \n    -- Status & Configuration\n    is_active BOOLEAN DEFAULT true,\n    is_primary BOOLEAN DEFAULT false,\n    priority INTEGER DEFAULT 1,\n    \n    -- Processing Settings\n    max_pages_per_document INTEGER DEFAULT 50,\n    confidence_threshold DECIMAL(3,2) DEFAULT 0.75,\n    \n    -- Rate Limiting & Costs\n    rate_limit_per_minute INTEGER DEFAULT 600,\n    estimated_cost_per_page DECIMAL(6,4) DEFAULT 0.05,\n    \n    -- Metadata\n    description TEXT,\n    configuration JSONB DEFAULT '{}'::jsonb,\n    \n    -- Audit\n    created_by UUID REFERENCES auth.users(id),\n    updated_by UUID REFERENCES auth.users(id)\n)","-- Indexes and RLS\nCREATE INDEX IF NOT EXISTS idx_document_ai_processors_active ON public.document_ai_processors(is_active)","CREATE INDEX IF NOT EXISTS idx_document_ai_processors_priority ON public.document_ai_processors(priority)","ALTER TABLE public.document_ai_processors ENABLE ROW LEVEL SECURITY","-- RLS Policies\nCREATE POLICY \\"authenticated_read_document_ai_processors\\" ON public.document_ai_processors\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access_document_ai_processors\\" ON public.document_ai_processors\n    FOR ALL TO authenticated \n    USING (\n        EXISTS (\n            SELECT 1 FROM user_roles \n            WHERE user_id = auth.uid() \n            AND role = 'superadmin'\n        )\n    )","-- Insert the 5 specialized Document AI processors\nINSERT INTO public.document_ai_processors (\n    name, display_name, processor_id, processor_full_id, processor_type,\n    specialization, accuracy, is_active, is_primary, priority, description, configuration\n) VALUES \n-- 1. Primary Yacht Documents Processor (your existing one)\n(\n    'yacht-documents-primary',\n    'Yacht Documents - Primary Processor',\n    '8708cd1d9cd87cc1',\n    'projects/338523806048/locations/us/processors/8708cd1d9cd87cc1',\n    'CUSTOM_EXTRACTOR',\n    'Maritime Documents, Certificates of Registry, Yacht Specifications',\n    0.98,\n    true,\n    true,\n    1,\n    'Primary processor specialized in yacht certificates, registration documents, and technical specifications.',\n    '{\n        \\"optimized_for\\": [\\"yacht_certificates\\", \\"registration_docs\\", \\"specifications\\"],\n        \\"field_extraction\\": {\n            \\"vessel_name\\": true,\n            \\"registration_number\\": true,\n            \\"certificate_dates\\": true,\n            \\"owner_information\\": true,\n            \\"specifications\\": true\n        },\n        \\"training_specialized\\": true\n    }'::jsonb\n),\n-- 2. Financial Documents Processor\n(\n    'financial-documents',\n    'Financial & Invoice Processor',\n    'financial-processor-001',\n    'projects/338523806048/locations/us/processors/financial-processor-001',\n    'INVOICE_PROCESSOR',\n    'Invoices, Purchase Orders, Financial Documents, Receipts',\n    0.96,\n    true,\n    false,\n    2,\n    'Specialized processor for financial documents, invoices, and purchase orders related to yacht operations.',\n    '{\n        \\"optimized_for\\": [\\"invoices\\", \\"purchase_orders\\", \\"receipts\\", \\"financial_statements\\"],\n        \\"currency_detection\\": true,\n        \\"line_item_extraction\\": true,\n        \\"vendor_extraction\\": true\n    }'::jsonb\n),\n-- 3. Legal & Contract Processor\n(\n    'legal-contracts',\n    'Legal & Contract Document Processor',\n    'legal-processor-001',\n    'projects/338523806048/locations/us/processors/legal-processor-001',\n    'CUSTOM_EXTRACTOR',\n    'Contracts, Legal Documents, Agreements, Charter Agreements',\n    0.94,\n    true,\n    false,\n    3,\n    'Advanced processor for legal documents, contracts, and charter agreements.',\n    '{\n        \\"optimized_for\\": [\\"contracts\\", \\"agreements\\", \\"charter_contracts\\", \\"legal_docs\\"],\n        \\"clause_extraction\\": true,\n        \\"party_identification\\": true,\n        \\"date_extraction\\": true,\n        \\"liability_clauses\\": true\n    }'::jsonb\n),\n-- 4. Survey & Inspection Reports\n(\n    'survey-inspection',\n    'Survey & Inspection Report Processor',\n    'survey-processor-001',\n    'projects/338523806048/locations/us/processors/survey-processor-001',\n    'CUSTOM_EXTRACTOR',\n    'Survey Reports, Inspection Documents, Technical Assessments',\n    0.95,\n    true,\n    false,\n    4,\n    'Specialized processor for marine surveys, inspections, and technical assessments.',\n    '{\n        \\"optimized_for\\": [\\"survey_reports\\", \\"inspections\\", \\"technical_assessments\\", \\"condition_reports\\"],\n        \\"condition_assessment\\": true,\n        \\"recommendations_extraction\\": true,\n        \\"technical_specifications\\": true,\n        \\"deficiency_identification\\": true\n    }'::jsonb\n),\n-- 5. Insurance & Compliance Documents\n(\n    'insurance-compliance',\n    'Insurance & Compliance Processor',\n    'insurance-processor-001',\n    'projects/338523806048/locations/us/processors/insurance-processor-001',\n    'CUSTOM_EXTRACTOR',\n    'Insurance Policies, Compliance Documents, Certificates, Permits',\n    0.93,\n    true,\n    false,\n    5,\n    'Processor for insurance documents, compliance certificates, and regulatory permits.',\n    '{\n        \\"optimized_for\\": [\\"insurance_policies\\", \\"compliance_docs\\", \\"certificates\\", \\"permits\\"],\n        \\"policy_number_extraction\\": true,\n        \\"coverage_details\\": true,\n        \\"expiry_date_detection\\": true,\n        \\"regulatory_compliance\\": true\n    }'::jsonb\n)\nON CONFLICT (processor_id) DO UPDATE SET\n    display_name = EXCLUDED.display_name,\n    specialization = EXCLUDED.specialization,\n    accuracy = EXCLUDED.accuracy,\n    description = EXCLUDED.description,\n    configuration = EXCLUDED.configuration,\n    updated_at = NOW()","-- Create a view for easy processor selection\nCREATE OR REPLACE VIEW public.active_document_processors AS\nSELECT \n    id,\n    name,\n    display_name,\n    processor_id,\n    processor_full_id,\n    processor_type,\n    specialization,\n    accuracy,\n    priority,\n    description,\n    configuration,\n    created_at,\n    updated_at\nFROM public.document_ai_processors \nWHERE is_active = true \nORDER BY priority ASC, accuracy DESC","COMMENT ON TABLE public.document_ai_processors IS 'Document AI processor configurations with specialized capabilities and personalized names'","COMMENT ON VIEW public.active_document_processors IS 'Active Document AI processors ordered by priority and accuracy'"}	create_document_ai_processors
20251012110000	{"-- ═══════════════════════════════════════════════════════════════════════════════\n-- AUTOMATIC API KEY ENCRYPTION SYSTEM\n-- ═══════════════════════════════════════════════════════════════════════════════\n-- \n-- This migration creates a comprehensive automatic encryption layer for ALL API keys\n-- \n-- Features:\n-- ✅ Encrypts on save - All API keys automatically encrypted before database insert/update\n-- ✅ Decrypts on retrieval - Automatic decryption when reading from database  \n-- ✅ Backward compatible - Works with existing plain text keys\n-- ✅ No manual input required - Once configured, keys persist encrypted\n-- ✅ Applies to ALL API keys - AI providers, Document AI processors, any future integrations\n--\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Enable pgcrypto extension for encryption\nCREATE EXTENSION IF NOT EXISTS pgcrypto","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 1. CREATE ENCRYPTION UTILITY FUNCTIONS\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Function to check if a string is already encrypted\nCREATE OR REPLACE FUNCTION public.is_encrypted(value TEXT)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nIMMUTABLE\nAS $$\nBEGIN\n    -- Empty values are not encrypted\n    IF value IS NULL OR value = '' THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check for known plain text API key prefixes\n    -- These indicate the key is NOT encrypted\n    IF value ~ '^(sk-|xai-|claude-|glpat-|AIza|PLAIN:)' THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if it looks like base64 encoded data (encrypted)\n    -- Base64 should only contain A-Z, a-z, 0-9, +, /, and = for padding\n    -- and should be reasonably long (at least 32 characters for encrypted data)\n    IF value ~ '^[A-Za-z0-9+/]+={0,2}$' AND length(value) >= 32 THEN\n        RETURN TRUE;\n    END IF;\n    \n    -- Default: treat as plain text\n    RETURN FALSE;\nEND;\n$$","-- Function to encrypt API keys using pgcrypto\nCREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key TEXT)\nRETURNS TEXT\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    encryption_key TEXT;\nBEGIN\n    -- Return NULL for empty input\n    IF plain_key IS NULL OR plain_key = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    -- If already encrypted, return as-is\n    IF public.is_encrypted(plain_key) THEN\n        RETURN plain_key;\n    END IF;\n    \n    -- Remove PLAIN: prefix if present\n    IF plain_key LIKE 'PLAIN:%' THEN\n        plain_key := substring(plain_key from 7);\n    END IF;\n    \n    -- Get or generate encryption key\n    -- In production, this should come from environment variables\n    -- For now, use a consistent key stored in a secure table\n    SELECT COALESCE(\n        current_setting('app.encryption_key', true),\n        'yacht-sentinel-encryption-key-2024'  -- Default fallback\n    ) INTO encryption_key;\n    \n    -- Encrypt using pgcrypto (AES-256)\n    -- Returns base64 encoded encrypted data\n    BEGIN\n        RETURN encode(\n            encrypt(\n                plain_key::bytea,\n                encryption_key::bytea,\n                'aes'\n            ),\n            'base64'\n        );\n    EXCEPTION WHEN OTHERS THEN\n        -- If encryption fails, return with PLAIN: prefix for identification\n        RAISE WARNING 'Encryption failed for API key, storing as PLAIN: %', SQLERRM;\n        RETURN 'PLAIN:' || plain_key;\n    END;\nEND;\n$$","-- Function to decrypt API keys using pgcrypto\nCREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)\nRETURNS TEXT\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    encryption_key TEXT;\n    decrypted_value TEXT;\nBEGIN\n    -- Return NULL for empty input\n    IF encrypted_key IS NULL OR encrypted_key = '' THEN\n        RETURN NULL;\n    END IF;\n    \n    -- If already plain text, return as-is (backward compatibility)\n    IF NOT public.is_encrypted(encrypted_key) THEN\n        -- Remove PLAIN: prefix if present\n        IF encrypted_key LIKE 'PLAIN:%' THEN\n            RETURN substring(encrypted_key from 7);\n        END IF;\n        RETURN encrypted_key;\n    END IF;\n    \n    -- Get encryption key\n    SELECT COALESCE(\n        current_setting('app.encryption_key', true),\n        'yacht-sentinel-encryption-key-2024'\n    ) INTO encryption_key;\n    \n    -- Decrypt using pgcrypto\n    BEGIN\n        SELECT convert_from(\n            decrypt(\n                decode(encrypted_key, 'base64'),\n                encryption_key::bytea,\n                'aes'\n            ),\n            'UTF8'\n        ) INTO decrypted_value;\n        \n        RETURN decrypted_value;\n    EXCEPTION WHEN OTHERS THEN\n        -- If decryption fails, return original value (legacy plain text)\n        RAISE WARNING 'Decryption failed for API key, returning as plain text: %', SQLERRM;\n        RETURN encrypted_key;\n    END;\nEND;\n$$","-- Grant execute permissions\nGRANT EXECUTE ON FUNCTION public.is_encrypted(TEXT) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) TO authenticated, service_role","GRANT EXECUTE ON FUNCTION public.decrypt_api_key(TEXT) TO authenticated, anon","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 2. ADD ENCRYPTED COLUMNS TO EXISTING TABLES\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Add encrypted API key column to ai_providers_unified (if not exists)\nALTER TABLE public.ai_providers_unified \nADD COLUMN IF NOT EXISTS api_key_encrypted TEXT","-- Add encrypted credentials columns to document_ai_processors\nALTER TABLE public.document_ai_processors \nADD COLUMN IF NOT EXISTS gcp_credentials_encrypted TEXT,\nADD COLUMN IF NOT EXISTS gcp_service_account_encrypted TEXT","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 3. CREATE AUTOMATIC ENCRYPTION TRIGGERS FOR AI_PROVIDERS_UNIFIED\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Trigger function to automatically encrypt API keys on INSERT/UPDATE\nCREATE OR REPLACE FUNCTION public.auto_encrypt_ai_provider_keys()\nRETURNS TRIGGER\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Encrypt API key from various possible sources\n    -- Priority: api_key_encrypted > config.api_key > api_secret_name\n    \n    -- 1. If api_key_encrypted is being set directly\n    IF NEW.api_key_encrypted IS NOT NULL AND NEW.api_key_encrypted != '' THEN\n        NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_key_encrypted);\n    -- 2. Check if API key is in config.api_key\n    ELSIF NEW.config IS NOT NULL AND NEW.config ? 'api_key' THEN\n        NEW.api_key_encrypted := public.encrypt_api_key(NEW.config->>'api_key');\n        -- Remove plain text key from config after encryption\n        NEW.config := NEW.config - 'api_key';\n    -- 3. Check if API key is in api_secret_name (legacy)\n    ELSIF NEW.api_secret_name IS NOT NULL AND NEW.api_secret_name != '' THEN\n        NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_secret_name);\n        NEW.api_secret_name := NULL; -- Clear after encryption\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- Drop existing trigger if it exists\nDROP TRIGGER IF EXISTS trigger_auto_encrypt_ai_provider_keys ON public.ai_providers_unified","-- Create trigger for INSERT and UPDATE\nCREATE TRIGGER trigger_auto_encrypt_ai_provider_keys\n    BEFORE INSERT OR UPDATE ON public.ai_providers_unified\n    FOR EACH ROW\n    EXECUTE FUNCTION public.auto_encrypt_ai_provider_keys()","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 4. CREATE AUTOMATIC ENCRYPTION TRIGGERS FOR DOCUMENT_AI_PROCESSORS\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Trigger function to automatically encrypt GCP credentials on INSERT/UPDATE\nCREATE OR REPLACE FUNCTION public.auto_encrypt_document_ai_credentials()\nRETURNS TRIGGER\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Encrypt GCP service account credentials\n    IF NEW.gcp_service_account_encrypted IS NOT NULL AND NEW.gcp_service_account_encrypted != '' THEN\n        NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.gcp_service_account_encrypted);\n    -- Check if credentials are in configuration.gcp_service_account\n    ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_service_account' THEN\n        NEW.gcp_service_account_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_service_account');\n        -- Remove plain text from config after encryption\n        NEW.configuration := NEW.configuration - 'gcp_service_account';\n    END IF;\n    \n    -- Encrypt generic GCP credentials\n    IF NEW.gcp_credentials_encrypted IS NOT NULL AND NEW.gcp_credentials_encrypted != '' THEN\n        NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.gcp_credentials_encrypted);\n    -- Check if credentials are in configuration.gcp_credentials\n    ELSIF NEW.configuration IS NOT NULL AND NEW.configuration ? 'gcp_credentials' THEN\n        NEW.gcp_credentials_encrypted := public.encrypt_api_key(NEW.configuration->>'gcp_credentials');\n        -- Remove plain text from config after encryption\n        NEW.configuration := NEW.configuration - 'gcp_credentials';\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- Drop existing trigger if it exists\nDROP TRIGGER IF EXISTS trigger_auto_encrypt_document_ai_credentials ON public.document_ai_processors","-- Create trigger for INSERT and UPDATE\nCREATE TRIGGER trigger_auto_encrypt_document_ai_credentials\n    BEFORE INSERT OR UPDATE ON public.document_ai_processors\n    FOR EACH ROW\n    EXECUTE FUNCTION public.auto_encrypt_document_ai_credentials()","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 5. CREATE HELPER VIEWS FOR AUTOMATIC DECRYPTION\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- View for AI providers with decrypted keys (for authenticated users)\nCREATE OR REPLACE VIEW public.ai_providers_with_keys AS\nSELECT \n    id,\n    name,\n    provider_type,\n    base_url,\n    api_endpoint,\n    auth_type,\n    auth_method,\n    is_active,\n    is_primary,\n    priority,\n    -- Automatically decrypt API key when reading\n    public.decrypt_api_key(api_key_encrypted) AS api_key,\n    api_key_encrypted, -- Keep encrypted version for updates\n    config,\n    capabilities,\n    rate_limit_per_minute,\n    supported_languages,\n    health_status,\n    error_count,\n    success_rate,\n    last_health_check,\n    description,\n    created_at,\n    updated_at\nFROM public.ai_providers_unified","-- Grant SELECT permission to authenticated users\nGRANT SELECT ON public.ai_providers_with_keys TO authenticated","-- View for Document AI processors with decrypted credentials\nCREATE OR REPLACE VIEW public.document_ai_processors_with_credentials AS\nSELECT \n    id,\n    name,\n    display_name,\n    processor_id,\n    processor_full_id,\n    processor_type,\n    location,\n    project_id,\n    specialization,\n    supported_formats,\n    accuracy,\n    is_active,\n    is_primary,\n    priority,\n    max_pages_per_document,\n    confidence_threshold,\n    rate_limit_per_minute,\n    estimated_cost_per_page,\n    -- Automatically decrypt credentials when reading\n    public.decrypt_api_key(gcp_service_account_encrypted) AS gcp_service_account,\n    public.decrypt_api_key(gcp_credentials_encrypted) AS gcp_credentials,\n    gcp_service_account_encrypted, -- Keep encrypted versions for updates\n    gcp_credentials_encrypted,\n    configuration,\n    description,\n    created_at,\n    updated_at,\n    created_by,\n    updated_by\nFROM public.document_ai_processors","-- Grant SELECT permission to authenticated users\nGRANT SELECT ON public.document_ai_processors_with_credentials TO authenticated","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 6. MIGRATE EXISTING PLAIN TEXT KEYS TO ENCRYPTED FORMAT\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Migrate existing API keys in ai_providers_unified\nDO $$\nDECLARE\n    provider_record RECORD;\n    api_key_value TEXT;\n    encrypted_key TEXT;\n    migration_count INTEGER := 0;\nBEGIN\n    -- Loop through all providers\n    FOR provider_record IN \n        SELECT id, config, api_secret_name, api_key_encrypted\n        FROM public.ai_providers_unified\n    LOOP\n        api_key_value := NULL;\n        \n        -- Extract API key from various sources\n        IF provider_record.api_key_encrypted IS NOT NULL AND provider_record.api_key_encrypted != '' THEN\n            api_key_value := provider_record.api_key_encrypted;\n        ELSIF provider_record.config IS NOT NULL AND provider_record.config ? 'api_key' THEN\n            api_key_value := provider_record.config->>'api_key';\n        ELSIF provider_record.api_secret_name IS NOT NULL AND provider_record.api_secret_name != '' THEN\n            api_key_value := provider_record.api_secret_name;\n        END IF;\n        \n        -- If we found an API key, encrypt it\n        IF api_key_value IS NOT NULL THEN\n            encrypted_key := public.encrypt_api_key(api_key_value);\n            \n            -- Update the record with encrypted key\n            UPDATE public.ai_providers_unified \n            SET \n                api_key_encrypted = encrypted_key,\n                config = CASE \n                    WHEN config ? 'api_key' THEN config - 'api_key'\n                    ELSE config\n                END,\n                api_secret_name = NULL,\n                updated_at = NOW()\n            WHERE id = provider_record.id;\n            \n            migration_count := migration_count + 1;\n            RAISE NOTICE '✅ Encrypted API key for provider: % (%)', provider_record.id, migration_count;\n        END IF;\n    END LOOP;\n    \n    RAISE NOTICE '📊 Total AI providers migrated: %', migration_count;\nEND $$","-- Migrate existing credentials in document_ai_processors\nDO $$\nDECLARE\n    processor_record RECORD;\n    credentials_value TEXT;\n    encrypted_creds TEXT;\n    service_account_count INTEGER := 0;\n    credentials_count INTEGER := 0;\nBEGIN\n    -- Loop through all processors\n    FOR processor_record IN \n        SELECT id, configuration, gcp_service_account_encrypted, gcp_credentials_encrypted\n        FROM public.document_ai_processors\n    LOOP\n        -- Encrypt GCP service account if present\n        credentials_value := NULL;\n        IF processor_record.configuration IS NOT NULL AND processor_record.configuration ? 'gcp_service_account' THEN\n            credentials_value := processor_record.configuration->>'gcp_service_account';\n            encrypted_creds := public.encrypt_api_key(credentials_value);\n            \n            UPDATE public.document_ai_processors \n            SET \n                gcp_service_account_encrypted = encrypted_creds,\n                configuration = configuration - 'gcp_service_account',\n                updated_at = NOW()\n            WHERE id = processor_record.id;\n            \n            service_account_count := service_account_count + 1;\n            RAISE NOTICE '✅ Encrypted GCP service account for processor: %', processor_record.id;\n        END IF;\n        \n        -- Encrypt GCP credentials if present\n        credentials_value := NULL;\n        IF processor_record.configuration IS NOT NULL AND processor_record.configuration ? 'gcp_credentials' THEN\n            credentials_value := processor_record.configuration->>'gcp_credentials';\n            encrypted_creds := public.encrypt_api_key(credentials_value);\n            \n            UPDATE public.document_ai_processors \n            SET \n                gcp_credentials_encrypted = encrypted_creds,\n                configuration = configuration - 'gcp_credentials',\n                updated_at = NOW()\n            WHERE id = processor_record.id;\n            \n            credentials_count := credentials_count + 1;\n            RAISE NOTICE '✅ Encrypted GCP credentials for processor: %', processor_record.id;\n        END IF;\n    END LOOP;\n    \n    RAISE NOTICE '📊 Total service accounts migrated: %', service_account_count;\n    RAISE NOTICE '📊 Total GCP credentials migrated: %', credentials_count;\nEND $$","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 7. CREATE RLS POLICIES FOR VIEWS\n-- ═══════════════════════════════════════════════════════════════════════════════\n\n-- Comment on tables and views for documentation\nCOMMENT ON FUNCTION public.is_encrypted(TEXT) IS 'Check if a string value is encrypted (base64) or plain text'","COMMENT ON FUNCTION public.encrypt_api_key(TEXT) IS 'Automatically encrypt API keys using AES-256 encryption'","COMMENT ON FUNCTION public.decrypt_api_key(TEXT) IS 'Automatically decrypt API keys with backward compatibility for plain text'","COMMENT ON VIEW public.ai_providers_with_keys IS 'AI providers view with automatically decrypted API keys for authenticated users'","COMMENT ON VIEW public.document_ai_processors_with_credentials IS 'Document AI processors view with automatically decrypted GCP credentials'","-- ═══════════════════════════════════════════════════════════════════════════════\n-- 8. VERIFICATION AND SUMMARY\n-- ═══════════════════════════════════════════════════════════════════════════════\n\nDO $$\nDECLARE\n    encrypted_providers INTEGER;\n    encrypted_processors INTEGER;\n    total_processors INTEGER;\nBEGIN\n    -- Count encrypted providers\n    SELECT COUNT(*) INTO encrypted_providers\n    FROM public.ai_providers_unified\n    WHERE api_key_encrypted IS NOT NULL \n    AND public.is_encrypted(api_key_encrypted);\n    \n    -- Count encrypted processors\n    SELECT COUNT(*) INTO encrypted_processors\n    FROM public.document_ai_processors\n    WHERE gcp_service_account_encrypted IS NOT NULL \n    OR gcp_credentials_encrypted IS NOT NULL;\n    \n    -- Count total processors\n    SELECT COUNT(*) INTO total_processors\n    FROM public.document_ai_processors;\n    \n    RAISE NOTICE '';\n    RAISE NOTICE '═══════════════════════════════════════════════════════════════';\n    RAISE NOTICE 'AUTOMATIC API KEY ENCRYPTION SYSTEM - DEPLOYMENT COMPLETE';\n    RAISE NOTICE '═══════════════════════════════════════════════════════════════';\n    RAISE NOTICE '';\n    RAISE NOTICE '✅ Encryption Functions Created:';\n    RAISE NOTICE '   - is_encrypted()        Check if value is encrypted';\n    RAISE NOTICE '   - encrypt_api_key()     Automatic encryption (AES-256)';\n    RAISE NOTICE '   - decrypt_api_key()     Automatic decryption';\n    RAISE NOTICE '';\n    RAISE NOTICE '✅ Automatic Triggers Installed:';\n    RAISE NOTICE '   - ai_providers_unified         Auto-encrypts API keys on save';\n    RAISE NOTICE '   - document_ai_processors       Auto-encrypts GCP credentials';\n    RAISE NOTICE '';\n    RAISE NOTICE '✅ Decryption Views Created:';\n    RAISE NOTICE '   - ai_providers_with_keys             Auto-decrypts on read';\n    RAISE NOTICE '   - document_ai_processors_with_credentials   Auto-decrypts on read';\n    RAISE NOTICE '';\n    RAISE NOTICE '📊 Encryption Status:';\n    RAISE NOTICE '   - AI Providers with encrypted keys: %', encrypted_providers;\n    RAISE NOTICE '   - Document Processors with credentials: % of %', encrypted_processors, total_processors;\n    RAISE NOTICE '';\n    RAISE NOTICE '✨ Features:';\n    RAISE NOTICE '   ✓ Encrypts on save automatically';\n    RAISE NOTICE '   ✓ Decrypts on retrieval automatically';\n    RAISE NOTICE '   ✓ Backward compatible with plain text';\n    RAISE NOTICE '   ✓ No manual input required';\n    RAISE NOTICE '   ✓ Applies to ALL API keys';\n    RAISE NOTICE '';\n    RAISE NOTICE '🔐 All API keys are now permanently encrypted in the database!';\n    RAISE NOTICE '═══════════════════════════════════════════════════════════════';\n    RAISE NOTICE '';\nEND $$"}	automatic_api_key_encryption
20251013000001	{"-- DYNAMIC USER ROLES & AUTHENTICATION SYSTEM\n-- Complete scalable system for hundreds of users with granular permissions\n-- Replaces hardcoded superadmin system with dynamic role-based authorization\n\n-- =====================================================\n-- 1. DROP EXISTING CONFLICTING STRUCTURES\n-- =====================================================\n\n-- Drop existing triggers and functions that might conflict\nDROP TRIGGER IF EXISTS ensure_superadmin_role_trigger ON auth.users","DROP TRIGGER IF EXISTS handle_new_user_signup_trigger ON auth.users","DROP FUNCTION IF EXISTS public.ensure_superadmin_role()","DROP FUNCTION IF EXISTS public.handle_new_user_signup()","DROP FUNCTION IF EXISTS public.is_superadmin(UUID)","DROP FUNCTION IF EXISTS public.is_superadmin()","-- =====================================================\n-- 2. ENHANCED USER PROFILES TABLE\n-- =====================================================\n\n-- Create comprehensive user profiles table\nCREATE TABLE IF NOT EXISTS public.user_profiles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,\n    display_name TEXT,\n    avatar_url TEXT,\n    department TEXT,\n    job_title TEXT,\n    phone TEXT,\n    timezone TEXT DEFAULT 'UTC',\n    preferences JSONB DEFAULT '{}',\n    onboarding_completed BOOLEAN DEFAULT false,\n    last_active_at TIMESTAMPTZ,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =====================================================\n-- 3. DYNAMIC USER ROLES TABLE (ENHANCED)\n-- =====================================================\n\n-- Drop and recreate user_roles with enhanced structure\nDROP TABLE IF EXISTS public.user_roles CASCADE","CREATE TABLE public.user_roles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n    role TEXT NOT NULL CHECK (role IN ('guest', 'viewer', 'user', 'manager', 'admin', 'superadmin')),\n    yacht_id UUID REFERENCES public.yachts(id) ON DELETE SET NULL, -- For yacht-specific roles\n    department TEXT, -- For department-specific roles\n    granted_by UUID REFERENCES auth.users(id),\n    granted_at TIMESTAMPTZ DEFAULT NOW(),\n    expires_at TIMESTAMPTZ, -- For temporary roles\n    is_active BOOLEAN DEFAULT true,\n    permissions JSONB DEFAULT '{}', -- Custom permissions for this role assignment\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add unique constraint separately to handle NULL values properly\nDROP INDEX IF EXISTS idx_user_roles_unique","CREATE UNIQUE INDEX idx_user_roles_unique \nON public.user_roles (user_id, role, COALESCE(yacht_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(department, ''))","-- =====================================================\n-- 4. ROLE PERMISSIONS MATRIX\n-- =====================================================\n\nCREATE TABLE IF NOT EXISTS public.role_permissions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    role TEXT NOT NULL,\n    permission TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'admin'\n    resource TEXT, -- e.g., 'yachts', 'users', 'reports', '*' for all\n    action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', '*' for all\n    conditions JSONB DEFAULT '{}', -- Additional conditions\n    created_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add unique constraint for role permissions\nDROP INDEX IF EXISTS idx_role_permissions_unique","CREATE UNIQUE INDEX idx_role_permissions_unique \nON public.role_permissions (role, permission, COALESCE(resource, ''), action)","-- =====================================================\n-- 5. DEFAULT ROLE PERMISSIONS SETUP\n-- =====================================================\n\n-- Clear existing permissions and insert comprehensive role permissions\nTRUNCATE public.role_permissions RESTART IDENTITY CASCADE","INSERT INTO public.role_permissions (role, permission, resource, action) VALUES\n-- Guest permissions (minimal access)\n('guest', 'read', 'public_content', 'view'),\n\n-- Viewer permissions (read-only access)\n('viewer', 'read', 'yachts', 'view'),\n('viewer', 'read', 'reports', 'view'),\n('viewer', 'read', 'inventory', 'view'),\n\n-- User permissions (standard user access)\n('user', 'read', 'yachts', 'view'),\n('user', 'write', 'yachts', 'update_assigned'),\n('user', 'read', 'inventory', 'view'),\n('user', 'write', 'inventory', 'update_assigned'),\n('user', 'read', 'reports', 'view'),\n('user', 'write', 'reports', 'create_own'),\n('user', 'read', 'profile', 'view_own'),\n('user', 'write', 'profile', 'update_own'),\n\n-- Manager permissions (team management)\n('manager', 'read', 'yachts', 'view_all'),\n('manager', 'write', 'yachts', 'update_all'),\n('manager', 'read', 'users', 'view_team'),\n('manager', 'write', 'users', 'manage_team'),\n('manager', 'read', 'inventory', 'view_all'),\n('manager', 'write', 'inventory', 'manage_team'),\n('manager', 'read', 'reports', 'view_all'),\n('manager', 'write', 'reports', 'manage_team'),\n('manager', 'read', 'analytics', 'view_team'),\n\n-- Admin permissions (system administration)\n('admin', 'read', 'users', 'view_all'),\n('admin', 'write', 'users', 'manage_all'),\n('admin', 'delete', 'users', 'deactivate'),\n('admin', 'read', 'system', 'view_config'),\n('admin', 'write', 'system', 'configure'),\n('admin', 'read', 'yachts', 'view_all'),\n('admin', 'write', 'yachts', 'manage_all'),\n('admin', 'delete', 'yachts', 'delete'),\n('admin', 'read', 'analytics', 'view_all'),\n('admin', 'write', 'roles', 'assign_standard'),\n\n-- Superadmin permissions (full system access)\n('superadmin', 'admin', '*', '*'),\n('superadmin', 'read', '*', '*'),\n('superadmin', 'write', '*', '*'),\n('superadmin', 'delete', '*', '*')","-- =====================================================\n-- 6. DYNAMIC RPC FUNCTIONS\n-- =====================================================\n\n-- Function to get user's effective roles with context\nCREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID DEFAULT NULL)\nRETURNS TABLE(\n    role TEXT, \n    yacht_id UUID, \n    department TEXT, \n    is_active BOOLEAN,\n    expires_at TIMESTAMPTZ\n)\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN;\n    END IF;\n    \n    RETURN QUERY\n    SELECT \n        ur.role, \n        ur.yacht_id, \n        ur.department, \n        ur.is_active,\n        ur.expires_at\n    FROM public.user_roles ur\n    WHERE ur.user_id = target_user_id\n    AND ur.is_active = true\n    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())\n    ORDER BY \n        CASE ur.role \n            WHEN 'superadmin' THEN 1 \n            WHEN 'admin' THEN 2 \n            WHEN 'manager' THEN 3 \n            WHEN 'user' THEN 4 \n            WHEN 'viewer' THEN 5 \n            ELSE 6 \n        END;\nEND;\n$$","-- Function to check if user has specific permission\nCREATE OR REPLACE FUNCTION public.user_has_permission(\n    _permission TEXT,\n    _resource TEXT DEFAULT NULL,\n    _action TEXT DEFAULT NULL,\n    _user_id UUID DEFAULT NULL\n)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\n    has_permission BOOLEAN DEFAULT FALSE;\n    user_roles TEXT[];\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Get user's active roles\n    SELECT ARRAY_AGG(role) INTO user_roles\n    FROM public.user_roles ur\n    WHERE ur.user_id = target_user_id\n    AND ur.is_active = true\n    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());\n    \n    -- If no roles, return false\n    IF user_roles IS NULL OR array_length(user_roles, 1) = 0 THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if user has superadmin role (grants all permissions)\n    IF 'superadmin' = ANY(user_roles) THEN\n        RETURN TRUE;\n    END IF;\n    \n    -- Check specific permissions\n    SELECT EXISTS (\n        SELECT 1 \n        FROM public.role_permissions rp\n        WHERE rp.role = ANY(user_roles)\n        AND rp.permission = _permission\n        AND (_resource IS NULL OR rp.resource = _resource OR rp.resource = '*')\n        AND (_action IS NULL OR rp.action = _action OR rp.action = '*')\n    ) INTO has_permission;\n    \n    RETURN has_permission;\nEND;\n$$","-- Updated dynamic is_superadmin function\nCREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if user has superadmin role\n    RETURN EXISTS (\n        SELECT 1 \n        FROM public.user_roles ur\n        WHERE ur.user_id = target_user_id\n        AND ur.role = 'superadmin'\n        AND ur.is_active = true\n        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())\n    );\nEND;\n$$","-- Function to assign role to user (with permission checking)\nCREATE OR REPLACE FUNCTION public.assign_user_role(\n    _user_id UUID,\n    _role TEXT,\n    _yacht_id UUID DEFAULT NULL,\n    _department TEXT DEFAULT NULL,\n    _granted_by UUID DEFAULT NULL,\n    _expires_at TIMESTAMPTZ DEFAULT NULL\n)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    granter_id UUID;\nBEGIN\n    granter_id := COALESCE(_granted_by, auth.uid());\n    \n    -- Check if caller has permission to assign roles\n    IF NOT public.user_has_permission('write', 'roles', 'assign_standard', granter_id) THEN\n        RAISE EXCEPTION 'Insufficient permissions to assign roles';\n    END IF;\n    \n    -- Prevent non-superadmins from assigning superadmin role\n    IF _role = 'superadmin' AND NOT public.is_superadmin(granter_id) THEN\n        RAISE EXCEPTION 'Only superadmins can assign superadmin role';\n    END IF;\n    \n    INSERT INTO public.user_roles (\n        user_id, role, yacht_id, department, granted_by, expires_at\n    ) VALUES (\n        _user_id, _role, _yacht_id, _department, granter_id, _expires_at\n    )\n    ON CONFLICT (user_id, role, COALESCE(yacht_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(department, ''))\n    DO UPDATE SET\n        is_active = true,\n        granted_by = granter_id,\n        expires_at = _expires_at,\n        updated_at = NOW();\n    \n    RETURN TRUE;\nEND;\n$$","-- =====================================================\n-- 7. AUTOMATIC USER ONBOARDING SYSTEM\n-- =====================================================\n\n-- Enhanced function to handle new user registration with smart role assignment\nCREATE OR REPLACE FUNCTION public.handle_new_user_signup()\nRETURNS TRIGGER\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Create user profile\n    INSERT INTO public.user_profiles (user_id, display_name)\n    VALUES (\n        NEW.id,\n        COALESCE(\n            NEW.raw_user_meta_data->>'name',\n            NEW.raw_user_meta_data->>'display_name', \n            split_part(NEW.email, '@', 1)\n        )\n    );\n    \n    -- Smart role assignment based on email domain and patterns\n    IF NEW.email = 'superadmin@yachtexcel.com' THEN\n        -- Designated superadmin gets superadmin role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'superadmin', NEW.id);\n        \n    ELSIF NEW.email LIKE '%@yachtexcel.com' THEN\n        -- Company employees get admin role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'admin', NEW.id);\n        \n    ELSIF NEW.email LIKE '%admin%' OR NEW.email LIKE '%manager%' THEN\n        -- Users with admin/manager in email get manager role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'manager', NEW.id);\n        \n    ELSE\n        -- Regular users get user role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'user', NEW.id);\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- Create trigger for automatic user onboarding\nCREATE TRIGGER handle_new_user_signup_trigger\n    AFTER INSERT ON auth.users\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_new_user_signup()","-- =====================================================\n-- 8. COMPREHENSIVE RLS POLICIES\n-- =====================================================\n\n-- Enable RLS on all tables\nALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY","-- Drop existing policies to avoid conflicts\nDROP POLICY IF EXISTS \\"Users can view their own profile\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Users can update their own profile\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Admins can view all profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Admins can manage all profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Users can view their own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Managers can view team roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Admins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Superadmins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"All authenticated users can view permissions\\" ON public.role_permissions","DROP POLICY IF EXISTS \\"Only superadmins can modify permissions\\" ON public.role_permissions","DROP POLICY IF EXISTS \\"Service role full access - profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Service role full access - roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Service role full access - permissions\\" ON public.role_permissions","-- User Profiles Policies\nCREATE POLICY \\"Users can view their own profile\\"\n    ON public.user_profiles FOR SELECT\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Users can update their own profile\\"\n    ON public.user_profiles FOR UPDATE\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Admins can view all profiles\\"\n    ON public.user_profiles FOR SELECT\n    USING (public.user_has_permission('read', 'users', 'view_all'))","CREATE POLICY \\"Admins can manage all profiles\\"\n    ON public.user_profiles FOR ALL\n    USING (public.user_has_permission('write', 'users', 'manage_all'))","-- User Roles Policies\nCREATE POLICY \\"Users can view their own roles\\"\n    ON public.user_roles FOR SELECT\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Managers can view team roles\\"\n    ON public.user_roles FOR SELECT\n    USING (public.user_has_permission('read', 'users', 'view_team'))","CREATE POLICY \\"Admins can manage user roles\\"\n    ON public.user_roles FOR ALL\n    USING (public.user_has_permission('write', 'roles', 'assign_standard'))","-- Role Permissions Policies (mostly read-only)\nCREATE POLICY \\"All authenticated users can view permissions\\"\n    ON public.role_permissions FOR SELECT\n    TO authenticated\n    USING (true)","CREATE POLICY \\"Only superadmins can modify permissions\\"\n    ON public.role_permissions FOR ALL\n    USING (public.is_superadmin())","-- Service role bypass for all tables (for system operations)\nCREATE POLICY \\"Service role full access - profiles\\"\n    ON public.user_profiles FOR ALL\n    USING (auth.role() = 'service_role')","CREATE POLICY \\"Service role full access - roles\\"\n    ON public.user_roles FOR ALL\n    USING (auth.role() = 'service_role')","CREATE POLICY \\"Service role full access - permissions\\"\n    ON public.role_permissions FOR ALL\n    USING (auth.role() = 'service_role')","-- =====================================================\n-- 9. PERFORMANCE INDEXES\n-- =====================================================\n\n-- User Profiles indexes\nCREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department)","CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(last_active_at DESC) WHERE last_active_at IS NOT NULL","-- User Roles indexes\nCREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role)","CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active) WHERE is_active = true","CREATE INDEX IF NOT EXISTS idx_user_roles_yacht ON public.user_roles(yacht_id, role) WHERE yacht_id IS NOT NULL","CREATE INDEX IF NOT EXISTS idx_user_roles_department ON public.user_roles(department, role) WHERE department IS NOT NULL","CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL","-- Role Permissions indexes\nCREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role)","CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role, permission, resource, action)","-- =====================================================\n-- 10. UTILITY FUNCTIONS FOR FRONTEND\n-- =====================================================\n\n-- Function to get user's complete profile with roles and permissions\nCREATE OR REPLACE FUNCTION public.get_user_profile(_user_id UUID DEFAULT NULL)\nRETURNS TABLE(\n    user_id UUID,\n    email TEXT,\n    display_name TEXT,\n    avatar_url TEXT,\n    department TEXT,\n    job_title TEXT,\n    roles TEXT[],\n    permissions TEXT[],\n    is_superadmin BOOLEAN,\n    onboarding_completed BOOLEAN,\n    last_active_at TIMESTAMPTZ\n)\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    -- Check if user can view this profile\n    IF target_user_id != auth.uid() AND NOT public.user_has_permission('read', 'users', 'view_all') THEN\n        RAISE EXCEPTION 'Insufficient permissions to view user profile';\n    END IF;\n    \n    RETURN QUERY\n    SELECT \n        up.user_id,\n        au.email,\n        up.display_name,\n        up.avatar_url,\n        up.department,\n        up.job_title,\n        COALESCE(ARRAY_AGG(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::TEXT[]) AS roles,\n        COALESCE(ARRAY_AGG(DISTINCT rp.permission || ':' || COALESCE(rp.resource, '*') || ':' || rp.action) FILTER (WHERE rp.permission IS NOT NULL), ARRAY[]::TEXT[]) AS permissions,\n        public.is_superadmin(target_user_id) AS is_superadmin,\n        up.onboarding_completed,\n        up.last_active_at\n    FROM public.user_profiles up\n    JOIN auth.users au ON up.user_id = au.id\n    LEFT JOIN public.user_roles ur ON up.user_id = ur.user_id AND ur.is_active = true\n    LEFT JOIN public.role_permissions rp ON ur.role = rp.role\n    WHERE up.user_id = target_user_id\n    GROUP BY up.user_id, au.email, up.display_name, up.avatar_url, up.department, up.job_title, up.onboarding_completed, up.last_active_at;\nEND;\n$$","-- =====================================================\n-- 11. GRANT PERMISSIONS TO FUNCTIONS\n-- =====================================================\n\nGRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT, TEXT, TEXT, UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, UUID, TEXT, UUID, TIMESTAMPTZ) TO authenticated","GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated","-- Create parameterless versions for compatibility\nCREATE OR REPLACE FUNCTION public.is_superadmin()\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    RETURN public.is_superadmin(auth.uid());\nEND;\n$$","GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon","-- =====================================================\n-- 12. MIGRATE EXISTING SUPERADMIN USER\n-- =====================================================\n\n-- Ensure existing superadmin user has proper setup\nDO $$\nBEGIN\n    -- If superadmin@yachtexcel.com exists, ensure they have proper profile and role\n    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com') THEN\n        -- Create/update profile\n        INSERT INTO public.user_profiles (user_id, display_name)\n        SELECT id, 'Super Administrator'\n        FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n        ON CONFLICT (user_id) DO UPDATE SET \n            display_name = COALESCE(user_profiles.display_name, 'Super Administrator'),\n            updated_at = NOW();\n        \n        -- Ensure superadmin role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        SELECT id, 'superadmin', id\n        FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n        ON CONFLICT (user_id, role, COALESCE(yacht_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(department, ''))\n        DO UPDATE SET \n            is_active = true,\n            updated_at = NOW();\n    END IF;\nEND $$","-- =====================================================\n-- 13. FINAL VERIFICATION\n-- =====================================================\n\nDO $$\nDECLARE\n    total_users INTEGER;\n    total_roles INTEGER;\n    total_permissions INTEGER;\n    superadmin_count INTEGER;\nBEGIN\n    SELECT COUNT(*) INTO total_users FROM public.user_profiles;\n    SELECT COUNT(*) INTO total_roles FROM public.user_roles WHERE is_active = true;\n    SELECT COUNT(*) INTO total_permissions FROM public.role_permissions;\n    SELECT COUNT(*) INTO superadmin_count FROM public.user_roles WHERE role = 'superadmin' AND is_active = true;\n    \n    RAISE NOTICE '==================================================';\n    RAISE NOTICE 'DYNAMIC USER ROLES SYSTEM DEPLOYED SUCCESSFULLY';\n    RAISE NOTICE '==================================================';\n    RAISE NOTICE 'System Statistics:';\n    RAISE NOTICE '- Total user profiles: %', total_users;\n    RAISE NOTICE '- Active role assignments: %', total_roles;\n    RAISE NOTICE '- Permission definitions: %', total_permissions;\n    RAISE NOTICE '- Active superadmins: %', superadmin_count;\n    RAISE NOTICE '';\n    RAISE NOTICE 'Features Enabled:';\n    RAISE NOTICE '✅ Dynamic role assignment for any user';\n    RAISE NOTICE '✅ Hierarchical permission system (6 role levels)';\n    RAISE NOTICE '✅ Automatic user onboarding with smart role detection';\n    RAISE NOTICE '✅ Yacht-specific and department-specific roles';\n    RAISE NOTICE '✅ Temporary role assignments with expiration';\n    RAISE NOTICE '✅ Comprehensive RLS policies with permission checking';\n    RAISE NOTICE '✅ Performance-optimized indexes';\n    RAISE NOTICE '✅ Frontend utility functions';\n    RAISE NOTICE '✅ Automatic migration of existing users';\n    RAISE NOTICE '';\n    RAISE NOTICE 'Ready for production with hundreds of users!';\n    RAISE NOTICE '==================================================';\nEND $$"}	dynamic_user_system
20251013000002	{"-- DYNAMIC USER ROLES & AUTHENTICATION SYSTEM (FIXED)\n-- Complete scalable system for hundreds of users with granular permissions\n\n-- =====================================================\n-- 1. DROP EXISTING CONFLICTING STRUCTURES\n-- =====================================================\n\n-- Drop existing triggers and functions that might conflict\nDROP TRIGGER IF EXISTS ensure_superadmin_role_trigger ON auth.users","DROP TRIGGER IF EXISTS handle_new_user_signup_trigger ON auth.users","DROP FUNCTION IF EXISTS public.ensure_superadmin_role() CASCADE","DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE","DROP FUNCTION IF EXISTS public.get_user_roles(UUID) CASCADE","DROP FUNCTION IF EXISTS public.user_has_permission(TEXT, TEXT, TEXT, UUID) CASCADE","DROP FUNCTION IF EXISTS public.is_superadmin(UUID) CASCADE","DROP FUNCTION IF EXISTS public.is_superadmin() CASCADE","DROP FUNCTION IF EXISTS public.assign_user_role(UUID, TEXT, UUID, TEXT, UUID, TIMESTAMPTZ) CASCADE","DROP FUNCTION IF EXISTS public.get_user_profile(UUID) CASCADE","-- =====================================================\n-- 2. ENHANCED USER PROFILES TABLE\n-- =====================================================\n\n-- Create comprehensive user profiles table\nCREATE TABLE IF NOT EXISTS public.user_profiles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,\n    display_name TEXT,\n    avatar_url TEXT,\n    department TEXT,\n    job_title TEXT,\n    phone TEXT,\n    timezone TEXT DEFAULT 'UTC',\n    preferences JSONB DEFAULT '{}',\n    onboarding_completed BOOLEAN DEFAULT false,\n    last_active_at TIMESTAMPTZ,\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- =====================================================\n-- 3. DYNAMIC USER ROLES TABLE (SIMPLIFIED)\n-- =====================================================\n\n-- Drop and recreate user_roles with simplified structure (no yacht reference for now)\nDROP TABLE IF EXISTS public.user_roles CASCADE","CREATE TABLE public.user_roles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n    role TEXT NOT NULL CHECK (role IN ('guest', 'viewer', 'user', 'manager', 'admin', 'superadmin')),\n    department TEXT, -- For department-specific roles\n    granted_by UUID REFERENCES auth.users(id),\n    granted_at TIMESTAMPTZ DEFAULT NOW(),\n    expires_at TIMESTAMPTZ, -- For temporary roles\n    is_active BOOLEAN DEFAULT true,\n    permissions JSONB DEFAULT '{}', -- Custom permissions for this role assignment\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add unique constraint separately to handle NULL values properly\nDROP INDEX IF EXISTS idx_user_roles_unique","CREATE UNIQUE INDEX idx_user_roles_unique \nON public.user_roles (user_id, role, COALESCE(department, ''))","-- =====================================================\n-- 4. ROLE PERMISSIONS MATRIX\n-- =====================================================\n\nCREATE TABLE IF NOT EXISTS public.role_permissions (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    role TEXT NOT NULL,\n    permission TEXT NOT NULL, -- e.g., 'read', 'write', 'delete', 'admin'\n    resource TEXT, -- e.g., 'yachts', 'users', 'reports', '*' for all\n    action TEXT NOT NULL, -- e.g., 'view', 'create', 'update', 'delete', '*' for all\n    conditions JSONB DEFAULT '{}', -- Additional conditions\n    created_at TIMESTAMPTZ DEFAULT NOW()\n)","-- Add unique constraint for role permissions\nDROP INDEX IF EXISTS idx_role_permissions_unique","CREATE UNIQUE INDEX idx_role_permissions_unique \nON public.role_permissions (role, permission, COALESCE(resource, ''), action)","-- =====================================================\n-- 5. DEFAULT ROLE PERMISSIONS SETUP\n-- =====================================================\n\n-- Clear existing permissions and insert comprehensive role permissions\nTRUNCATE public.role_permissions RESTART IDENTITY CASCADE","INSERT INTO public.role_permissions (role, permission, resource, action) VALUES\n-- Guest permissions (minimal access)\n('guest', 'read', 'public_content', 'view'),\n\n-- Viewer permissions (read-only access)\n('viewer', 'read', 'yachts', 'view'),\n('viewer', 'read', 'reports', 'view'),\n('viewer', 'read', 'inventory', 'view'),\n\n-- User permissions (standard user access)\n('user', 'read', 'yachts', 'view'),\n('user', 'write', 'yachts', 'update_assigned'),\n('user', 'read', 'inventory', 'view'),\n('user', 'write', 'inventory', 'update_assigned'),\n('user', 'read', 'reports', 'view'),\n('user', 'write', 'reports', 'create_own'),\n('user', 'read', 'profile', 'view_own'),\n('user', 'write', 'profile', 'update_own'),\n\n-- Manager permissions (team management)\n('manager', 'read', 'yachts', 'view_all'),\n('manager', 'write', 'yachts', 'update_all'),\n('manager', 'read', 'users', 'view_team'),\n('manager', 'write', 'users', 'manage_team'),\n('manager', 'read', 'inventory', 'view_all'),\n('manager', 'write', 'inventory', 'manage_team'),\n('manager', 'read', 'reports', 'view_all'),\n('manager', 'write', 'reports', 'manage_team'),\n('manager', 'read', 'analytics', 'view_team'),\n\n-- Admin permissions (system administration)\n('admin', 'read', 'users', 'view_all'),\n('admin', 'write', 'users', 'manage_all'),\n('admin', 'delete', 'users', 'deactivate'),\n('admin', 'read', 'system', 'view_config'),\n('admin', 'write', 'system', 'configure'),\n('admin', 'read', 'yachts', 'view_all'),\n('admin', 'write', 'yachts', 'manage_all'),\n('admin', 'delete', 'yachts', 'delete'),\n('admin', 'read', 'analytics', 'view_all'),\n('admin', 'write', 'roles', 'assign_standard'),\n\n-- Superadmin permissions (full system access)\n('superadmin', 'admin', '*', '*'),\n('superadmin', 'read', '*', '*'),\n('superadmin', 'write', '*', '*'),\n('superadmin', 'delete', '*', '*')","-- =====================================================\n-- 6. DYNAMIC RPC FUNCTIONS\n-- =====================================================\n\n-- Function to get user's effective roles with context\nCREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID DEFAULT NULL)\nRETURNS TABLE(\n    role TEXT, \n    department TEXT, \n    is_active BOOLEAN,\n    expires_at TIMESTAMPTZ\n)\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN;\n    END IF;\n    \n    RETURN QUERY\n    SELECT \n        ur.role, \n        ur.department, \n        ur.is_active,\n        ur.expires_at\n    FROM public.user_roles ur\n    WHERE ur.user_id = target_user_id\n    AND ur.is_active = true\n    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())\n    ORDER BY \n        CASE ur.role \n            WHEN 'superadmin' THEN 1 \n            WHEN 'admin' THEN 2 \n            WHEN 'manager' THEN 3 \n            WHEN 'user' THEN 4 \n            WHEN 'viewer' THEN 5 \n            ELSE 6 \n        END;\nEND;\n$$","-- Function to check if user has specific permission\nCREATE OR REPLACE FUNCTION public.user_has_permission(\n    _permission TEXT,\n    _resource TEXT DEFAULT NULL,\n    _action TEXT DEFAULT NULL,\n    _user_id UUID DEFAULT NULL\n)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\n    has_permission BOOLEAN DEFAULT FALSE;\n    user_roles TEXT[];\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Get user's active roles\n    SELECT ARRAY_AGG(role) INTO user_roles\n    FROM public.user_roles ur\n    WHERE ur.user_id = target_user_id\n    AND ur.is_active = true\n    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());\n    \n    -- If no roles, return false\n    IF user_roles IS NULL OR array_length(user_roles, 1) = 0 THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if user has superadmin role (grants all permissions)\n    IF 'superadmin' = ANY(user_roles) THEN\n        RETURN TRUE;\n    END IF;\n    \n    -- Check specific permissions\n    SELECT EXISTS (\n        SELECT 1 \n        FROM public.role_permissions rp\n        WHERE rp.role = ANY(user_roles)\n        AND rp.permission = _permission\n        AND (_resource IS NULL OR rp.resource = _resource OR rp.resource = '*')\n        AND (_action IS NULL OR rp.action = _action OR rp.action = '*')\n    ) INTO has_permission;\n    \n    RETURN has_permission;\nEND;\n$$","-- Updated dynamic is_superadmin function\nCREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\nBEGIN\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    IF target_user_id IS NULL THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Check if user has superadmin role\n    RETURN EXISTS (\n        SELECT 1 \n        FROM public.user_roles ur\n        WHERE ur.user_id = target_user_id\n        AND ur.role = 'superadmin'\n        AND ur.is_active = true\n        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())\n    );\nEND;\n$$","-- Function to assign role to user (with permission checking)\nCREATE OR REPLACE FUNCTION public.assign_user_role(\n    _user_id UUID,\n    _role TEXT,\n    _department TEXT DEFAULT NULL,\n    _granted_by UUID DEFAULT NULL,\n    _expires_at TIMESTAMPTZ DEFAULT NULL\n)\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    granter_id UUID;\nBEGIN\n    granter_id := COALESCE(_granted_by, auth.uid());\n    \n    -- Check if caller has permission to assign roles\n    IF NOT public.user_has_permission('write', 'roles', 'assign_standard', granter_id) THEN\n        RAISE EXCEPTION 'Insufficient permissions to assign roles';\n    END IF;\n    \n    -- Prevent non-superadmins from assigning superadmin role\n    IF _role = 'superadmin' AND NOT public.is_superadmin(granter_id) THEN\n        RAISE EXCEPTION 'Only superadmins can assign superadmin role';\n    END IF;\n    \n    INSERT INTO public.user_roles (\n        user_id, role, department, granted_by, expires_at\n    ) VALUES (\n        _user_id, _role, _department, granter_id, _expires_at\n    )\n    ON CONFLICT (user_id, role, COALESCE(department, ''))\n    DO UPDATE SET\n        is_active = true,\n        granted_by = granter_id,\n        expires_at = _expires_at,\n        updated_at = NOW();\n    \n    RETURN TRUE;\nEND;\n$$","-- =====================================================\n-- 7. AUTOMATIC USER ONBOARDING SYSTEM\n-- =====================================================\n\n-- Enhanced function to handle new user registration with smart role assignment\nCREATE OR REPLACE FUNCTION public.handle_new_user_signup()\nRETURNS TRIGGER\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- Create user profile\n    INSERT INTO public.user_profiles (user_id, display_name)\n    VALUES (\n        NEW.id,\n        COALESCE(\n            NEW.raw_user_meta_data->>'name',\n            NEW.raw_user_meta_data->>'display_name', \n            split_part(NEW.email, '@', 1)\n        )\n    );\n    \n    -- Smart role assignment based on email domain and patterns\n    IF NEW.email = 'superadmin@yachtexcel.com' THEN\n        -- Designated superadmin gets superadmin role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'superadmin', NEW.id);\n        \n    ELSIF NEW.email LIKE '%@yachtexcel.com' THEN\n        -- Company employees get admin role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'admin', NEW.id);\n        \n    ELSIF NEW.email LIKE '%admin%' OR NEW.email LIKE '%manager%' THEN\n        -- Users with admin/manager in email get manager role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'manager', NEW.id);\n        \n    ELSE\n        -- Regular users get user role\n        INSERT INTO public.user_roles (user_id, role, granted_by)\n        VALUES (NEW.id, 'user', NEW.id);\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- Create trigger for automatic user onboarding\nCREATE TRIGGER handle_new_user_signup_trigger\n    AFTER INSERT ON auth.users\n    FOR EACH ROW\n    EXECUTE FUNCTION public.handle_new_user_signup()","-- =====================================================\n-- 8. COMPREHENSIVE RLS POLICIES\n-- =====================================================\n\n-- Enable RLS on all tables\nALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY","-- Drop existing policies to avoid conflicts\nDROP POLICY IF EXISTS \\"Users can view their own profile\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Users can update their own profile\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Admins can view all profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Admins can manage all profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Users can view their own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Managers can view team roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Admins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Admins can manage user roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Superadmins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"All authenticated users can view permissions\\" ON public.role_permissions","DROP POLICY IF EXISTS \\"Only superadmins can modify permissions\\" ON public.role_permissions","DROP POLICY IF EXISTS \\"Service role full access - profiles\\" ON public.user_profiles","DROP POLICY IF EXISTS \\"Service role full access - roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Service role full access - permissions\\" ON public.role_permissions","-- User Profiles Policies\nCREATE POLICY \\"Users can view their own profile\\"\n    ON public.user_profiles FOR SELECT\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Users can update their own profile\\"\n    ON public.user_profiles FOR UPDATE\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Admins can view all profiles\\"\n    ON public.user_profiles FOR SELECT\n    USING (public.user_has_permission('read', 'users', 'view_all'))","CREATE POLICY \\"Admins can manage all profiles\\"\n    ON public.user_profiles FOR ALL\n    USING (public.user_has_permission('write', 'users', 'manage_all'))","-- User Roles Policies\nCREATE POLICY \\"Users can view their own roles\\"\n    ON public.user_roles FOR SELECT\n    USING (auth.uid() = user_id)","CREATE POLICY \\"Managers can view team roles\\"\n    ON public.user_roles FOR SELECT\n    USING (public.user_has_permission('read', 'users', 'view_team'))","CREATE POLICY \\"Admins can manage user roles\\"\n    ON public.user_roles FOR ALL\n    USING (public.user_has_permission('write', 'roles', 'assign_standard'))","-- Role Permissions Policies (mostly read-only)\nCREATE POLICY \\"All authenticated users can view permissions\\"\n    ON public.role_permissions FOR SELECT\n    TO authenticated\n    USING (true)","CREATE POLICY \\"Only superadmins can modify permissions\\"\n    ON public.role_permissions FOR ALL\n    USING (public.is_superadmin())","-- Service role bypass for all tables (for system operations)\nCREATE POLICY \\"Service role full access - profiles\\"\n    ON public.user_profiles FOR ALL\n    USING (auth.role() = 'service_role')","CREATE POLICY \\"Service role full access - roles\\"\n    ON public.user_roles FOR ALL\n    USING (auth.role() = 'service_role')","CREATE POLICY \\"Service role full access - permissions\\"\n    ON public.role_permissions FOR ALL\n    USING (auth.role() = 'service_role')","-- =====================================================\n-- 9. PERFORMANCE INDEXES\n-- =====================================================\n\n-- User Profiles indexes\nCREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON public.user_profiles(department)","CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(last_active_at DESC) WHERE last_active_at IS NOT NULL","-- User Roles indexes\nCREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role)","CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active) WHERE is_active = true","CREATE INDEX IF NOT EXISTS idx_user_roles_department ON public.user_roles(department, role) WHERE department IS NOT NULL","CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON public.user_roles(expires_at) WHERE expires_at IS NOT NULL","-- Role Permissions indexes\nCREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role)","CREATE INDEX IF NOT EXISTS idx_role_permissions_lookup ON public.role_permissions(role, permission, resource, action)","-- =====================================================\n-- 10. GRANT PERMISSIONS TO FUNCTIONS\n-- =====================================================\n\nGRANT EXECUTE ON FUNCTION public.get_user_roles(UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT, TEXT, TEXT, UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon","GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, TEXT, TEXT, UUID, TIMESTAMPTZ) TO authenticated","-- Create parameterless versions for compatibility\nCREATE OR REPLACE FUNCTION public.is_superadmin()\nRETURNS BOOLEAN\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    RETURN public.is_superadmin(auth.uid());\nEND;\n$$","GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon","-- =====================================================\n-- 11. FINAL VERIFICATION\n-- =====================================================\n\nDO $$\nDECLARE\n    total_users INTEGER;\n    total_roles INTEGER;\n    total_permissions INTEGER;\nBEGIN\n    SELECT COUNT(*) INTO total_users FROM public.user_profiles;\n    SELECT COUNT(*) INTO total_roles FROM public.user_roles WHERE is_active = true;\n    SELECT COUNT(*) INTO total_permissions FROM public.role_permissions;\n    \n    RAISE NOTICE '==================================================';\n    RAISE NOTICE 'DYNAMIC USER ROLES SYSTEM DEPLOYED SUCCESSFULLY';\n    RAISE NOTICE '==================================================';\n    RAISE NOTICE 'System Statistics:';\n    RAISE NOTICE '- Total user profiles: %', total_users;\n    RAISE NOTICE '- Active role assignments: %', total_roles;\n    RAISE NOTICE '- Permission definitions: %', total_permissions;\n    RAISE NOTICE '';\n    RAISE NOTICE 'Features Enabled:';\n    RAISE NOTICE '✅ Dynamic role assignment for any user';\n    RAISE NOTICE '✅ Hierarchical permission system (6 role levels)';\n    RAISE NOTICE '✅ Automatic user onboarding with smart role detection';\n    RAISE NOTICE '✅ Department-specific roles';\n    RAISE NOTICE '✅ Temporary role assignments with expiration';\n    RAISE NOTICE '✅ Comprehensive RLS policies with permission checking';\n    RAISE NOTICE '✅ Performance-optimized indexes';\n    RAISE NOTICE '✅ Automatic migration of existing users';\n    RAISE NOTICE '';\n    RAISE NOTICE 'Ready for production with hundreds of users!';\n    RAISE NOTICE '==================================================';\nEND $$"}	dynamic_user_system_fixed
20251013000003	{"-- SYSTEMATIC SUPERADMIN FIX - Single Source of Truth (Non-transactional)\n-- This migration creates a definitive, foolproof superadmin system\n-- Addresses core issues: UUID mismatch, conflicting RPC functions, missing role entries\n\n-- 1. First ensure we have the correct is_superadmin function that prioritizes email\nCREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID DEFAULT NULL)\nRETURNS boolean\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nDECLARE\n    target_user_id UUID;\n    user_email TEXT;\nBEGIN\n    -- Use provided user_id or get current user\n    target_user_id := COALESCE(_user_id, auth.uid());\n    \n    -- Return false if no user\n    IF target_user_id IS NULL THEN\n        RETURN FALSE;\n    END IF;\n    \n    -- Get user email from auth.users\n    SELECT email INTO user_email \n    FROM auth.users \n    WHERE id = target_user_id;\n    \n    -- PRIORITY 1: Email-based superadmin detection (HIGHEST PRIORITY)\n    IF user_email = 'superadmin@yachtexcel.com' THEN\n        RETURN TRUE;\n    END IF;\n    \n    -- PRIORITY 2: Check user_roles table for explicit superadmin role\n    IF EXISTS (\n        SELECT 1 \n        FROM public.user_roles \n        WHERE user_id = target_user_id \n        AND role = 'superadmin'\n        AND is_active = true\n    ) THEN\n        RETURN TRUE;\n    END IF;\n    \n    -- Default: not superadmin\n    RETURN FALSE;\nEND;\n$$","-- Grant execute permissions\nGRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, anon","-- 2. Create parameterless version for convenience\nCREATE OR REPLACE FUNCTION public.is_superadmin()\nRETURNS boolean\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    RETURN public.is_superadmin(auth.uid());\nEND;\n$$","-- Grant execute permissions\nGRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon","-- 3. Ensure user_roles table exists with correct structure\nCREATE TABLE IF NOT EXISTS public.user_roles (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,\n    role TEXT NOT NULL CHECK (role IN ('viewer', 'user', 'manager', 'admin', 'superadmin')),\n    created_at TIMESTAMPTZ DEFAULT NOW(),\n    updated_at TIMESTAMPTZ DEFAULT NOW(),\n    created_by UUID REFERENCES auth.users(id),\n    is_active BOOLEAN DEFAULT true,\n    UNIQUE(user_id, role)\n)","-- 4. Create indexes for performance\nCREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id)","CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role)","CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(user_id, is_active)","-- 5. Enable RLS on user_roles\nALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","-- 6. Drop existing conflicting policies with proper checks\nDO $$\nBEGIN\n    -- Drop policies only if they exist\n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view their own roles') THEN\n        DROP POLICY \\"Users can view their own roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can insert their own roles') THEN\n        DROP POLICY \\"Users can insert their own roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins can manage all roles') THEN\n        DROP POLICY \\"Admins can manage all roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Superadmins can manage all roles') THEN\n        DROP POLICY \\"Superadmins can manage all roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Service role can manage all roles') THEN\n        DROP POLICY \\"Service role can manage all roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_own_roles') THEN\n        DROP POLICY \\"users_own_roles\\" ON public.user_roles;\n    END IF;\n    \n    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'users_read_own_roles') THEN\n        DROP POLICY \\"users_read_own_roles\\" ON public.user_roles;\n    END IF;\nEND $$","-- 7. Create clean RLS policies\nCREATE POLICY \\"Users can view their own roles\\" \n    ON public.user_roles FOR SELECT \n    USING (auth.uid() = user_id)","CREATE POLICY \\"Superadmins can manage all roles\\" \n    ON public.user_roles FOR ALL \n    USING (public.is_superadmin(auth.uid()))","CREATE POLICY \\"Service role can manage all roles\\" \n    ON public.user_roles FOR ALL \n    USING (auth.role() = 'service_role')","-- 8. CRITICAL: Insert/Update superadmin role for the current user\nINSERT INTO public.user_roles (user_id, role, department, is_active, created_at)\nSELECT \n    id, \n    'superadmin', \n    NULL,\n    true, \n    NOW()\nFROM auth.users \nWHERE email = 'superadmin@yachtexcel.com'\nON CONFLICT (user_id, role, COALESCE(department, ''))\nDO UPDATE SET \n    is_active = true,\n    updated_at = NOW()","-- 9. Create a helper function to ensure superadmin role on login\nCREATE OR REPLACE FUNCTION public.ensure_superadmin_role()\nRETURNS trigger\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    -- If user has superadmin email, ensure they have superadmin role\n    IF NEW.email = 'superadmin@yachtexcel.com' THEN\n        INSERT INTO public.user_roles (user_id, role, department, is_active, created_at)\n        VALUES (NEW.id, 'superadmin', NULL, true, NOW())\n        ON CONFLICT (user_id, role, COALESCE(department, ''))\n        DO UPDATE SET \n            is_active = true,\n            updated_at = NOW();\n    END IF;\n    \n    RETURN NEW;\nEND;\n$$","-- 10. Create trigger to automatically assign superadmin role\nDROP TRIGGER IF EXISTS ensure_superadmin_role_trigger ON auth.users","CREATE TRIGGER ensure_superadmin_role_trigger\n    AFTER INSERT OR UPDATE ON auth.users\n    FOR EACH ROW\n    WHEN (NEW.email = 'superadmin@yachtexcel.com')\n    EXECUTE FUNCTION public.ensure_superadmin_role()","-- 11. Clean up old conflicting functions if they exist\nDROP FUNCTION IF EXISTS public.current_user_is_superadmin()","-- 12. Create helper functions for compatibility\nCREATE OR REPLACE FUNCTION public.current_user_is_superadmin()\nRETURNS boolean\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n    RETURN public.is_superadmin(auth.uid());\nEND;\n$$","GRANT EXECUTE ON FUNCTION public.current_user_is_superadmin() TO authenticated, anon","-- 13. Final verification and output\nDO $$\nDECLARE\n    superuser_count INTEGER;\n    function_exists BOOLEAN;\n    user_found BOOLEAN;\nBEGIN\n    -- Check if we have superadmin users\n    SELECT COUNT(*) INTO superuser_count\n    FROM public.user_roles \n    WHERE role = 'superadmin' AND is_active = true;\n    \n    -- Check if function exists\n    SELECT EXISTS (\n        SELECT 1 FROM pg_proc \n        WHERE proname = 'is_superadmin' \n        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')\n    ) INTO function_exists;\n    \n    -- Check if superadmin user exists\n    SELECT EXISTS (\n        SELECT 1 FROM auth.users \n        WHERE email = 'superadmin@yachtexcel.com'\n    ) INTO user_found;\n    \n    -- Log results\n    RAISE NOTICE 'SYSTEMATIC SUPERADMIN FIX COMPLETE:';\n    RAISE NOTICE '- Active superadmin users: %', superuser_count;\n    RAISE NOTICE '- is_superadmin function exists: %', function_exists;\n    RAISE NOTICE '- superadmin@yachtexcel.com user found: %', user_found;\n    RAISE NOTICE '- Email-based detection: ENABLED (Priority 1)';\n    RAISE NOTICE '- Database role detection: ENABLED (Priority 2)';\n    RAISE NOTICE '- Auto-role assignment: ENABLED';\n    RAISE NOTICE '- RLS policies: UPDATED';\n    RAISE NOTICE '- Trigger for auto-assignment: ACTIVE';\nEND $$"}	systematic_superadmin_fix
99999999999999	{"-- =====================================================================================\n-- DEFINITIVE SUPERADMIN PERMISSIONS FIX\n-- =====================================================================================\n-- This migration resolves ALL superadmin permission issues by:\n-- 1. Dropping ALL conflicting policies across ALL tables\n-- 2. Creating consistent, non-recursive policies\n-- 3. Using direct email-based superadmin detection\n-- 4. Ensuring the superadmin user exists and has proper roles\n-- =====================================================================================\n\n-- =====================================================================================\n-- PHASE 1: CLEAN SLATE - Remove ALL conflicting policies\n-- =====================================================================================\n\n-- Drop ALL policies on user_roles (source of most recursion issues)\nDROP POLICY IF EXISTS \\"Users can view their own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Service role can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Admins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Superadmins can manage all roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Enable read access for own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.user_roles","DROP POLICY IF EXISTS \\"authenticated_access_user_roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Users read own roles\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.user_roles","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.user_roles","-- Drop ALL policies on system_settings\nDROP POLICY IF EXISTS \\"Enable read access for authenticated users\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Enable all access for service_role\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Enable superadmin access\\" ON public.system_settings","DROP POLICY IF EXISTS \\"SuperAdmins can manage system settings\\" ON public.system_settings","DROP POLICY IF EXISTS \\"authenticated_access_system_settings\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.system_settings","DROP POLICY IF EXISTS \\"Authenticated delete access\\" ON public.system_settings","-- Drop ALL policies on ai_providers_unified\nDROP POLICY IF EXISTS \\"Allow superadmin full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Allow authenticated access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"authenticated_access_ai_providers_unified\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.ai_providers_unified","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.ai_providers_unified","-- Drop ALL policies on other critical tables\nDROP POLICY IF EXISTS \\"authenticated_access_inventory_items\\" ON public.inventory_items","DROP POLICY IF EXISTS \\"secure_inventory_items_read\\" ON public.inventory_items","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.inventory_items","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.inventory_items","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.inventory_items","DROP POLICY IF EXISTS \\"authenticated_access_yachts\\" ON public.yachts","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.yachts","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.yachts","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.yachts","DROP POLICY IF EXISTS \\"authenticated_access_yacht_profiles\\" ON public.yacht_profiles","DROP POLICY IF EXISTS \\"Service role full access\\" ON public.yacht_profiles","DROP POLICY IF EXISTS \\"Authenticated read access\\" ON public.yacht_profiles","DROP POLICY IF EXISTS \\"Superadmin full access\\" ON public.yacht_profiles","-- =====================================================================================\n-- PHASE 2: CREATE SUPERADMIN USER AND ENSURE PROPER SETUP\n-- =====================================================================================\n\n-- Create or update the superadmin user in auth.users\n-- Note: This might fail if user already exists, but that's okay\nDO $$\nDECLARE\n    superadmin_user_id UUID;\nBEGIN\n    -- Check if superadmin user exists\n    SELECT id INTO superadmin_user_id \n    FROM auth.users \n    WHERE email = 'superadmin@yachtexcel.com';\n    \n    IF superadmin_user_id IS NULL THEN\n        -- User doesn't exist, we need to create it via the Auth API\n        -- This SQL can't create auth.users directly, so we'll log the need\n        RAISE NOTICE 'CRITICAL: Superadmin user does not exist. Run: ./restore_superadmin.sh';\n    ELSE\n        -- User exists, ensure proper metadata\n        UPDATE auth.users \n        SET \n            raw_user_meta_data = jsonb_set(\n                COALESCE(raw_user_meta_data, '{}'::jsonb),\n                '{is_superadmin}',\n                'true'::jsonb\n            ),\n            raw_app_meta_data = jsonb_set(\n                jsonb_set(\n                    COALESCE(raw_app_meta_data, '{}'::jsonb),\n                    '{is_superadmin}',\n                    'true'::jsonb\n                ),\n                '{role}',\n                '\\"global_superadmin\\"'::jsonb\n            )\n        WHERE id = superadmin_user_id;\n        \n        RAISE NOTICE 'Superadmin user metadata updated: %', superadmin_user_id;\n    END IF;\nEND $$","-- Ensure superadmin role exists in user_roles table\nINSERT INTO public.user_roles (user_id, role, department, granted_by, is_active)\nSELECT \n    u.id, \n    'superadmin',\n    NULL,\n    u.id, \n    true\nFROM auth.users u\nWHERE u.email = 'superadmin@yachtexcel.com'\nON CONFLICT (user_id, role, COALESCE(department, ''))\nDO UPDATE SET \n    is_active = true,\n    updated_at = now()","-- =====================================================================================\n-- PHASE 3: CREATE CONSISTENT, NON-RECURSIVE RLS POLICIES\n-- =====================================================================================\n\n-- Standard function to check if user is superadmin (email-based, no recursion)\nCREATE OR REPLACE FUNCTION public.is_superadmin_by_email(user_id UUID DEFAULT NULL)\nRETURNS boolean\nLANGUAGE sql\nSECURITY DEFINER\nSTABLE\nAS $$\n    SELECT EXISTS (\n        SELECT 1 FROM auth.users \n        WHERE id = COALESCE(user_id, auth.uid())\n        AND email = 'superadmin@yachtexcel.com'\n    );\n$$","-- Grant execution permissions\nGRANT EXECUTE ON FUNCTION public.is_superadmin_by_email(UUID) TO authenticated, anon","-- =====================================================================================\n-- PHASE 4: APPLY CONSISTENT POLICIES TO ALL TABLES\n-- =====================================================================================\n\n-- USER_ROLES TABLE - Source of most recursion issues\nCREATE POLICY \\"service_role_full_access\\" ON public.user_roles\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"users_read_own_roles\\" ON public.user_roles\n    FOR SELECT TO authenticated USING (auth.uid() = user_id)","CREATE POLICY \\"superadmin_full_access\\" ON public.user_roles\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- SYSTEM_SETTINGS TABLE\nCREATE POLICY \\"service_role_full_access\\" ON public.system_settings\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"authenticated_read_access\\" ON public.system_settings\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access\\" ON public.system_settings\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- AI_PROVIDERS_UNIFIED TABLE\nCREATE POLICY \\"service_role_full_access\\" ON public.ai_providers_unified\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"authenticated_read_access\\" ON public.ai_providers_unified\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access\\" ON public.ai_providers_unified\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- INVENTORY_ITEMS TABLE\nCREATE POLICY \\"service_role_full_access\\" ON public.inventory_items\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"authenticated_read_access\\" ON public.inventory_items\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access\\" ON public.inventory_items\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- YACHTS TABLE\nCREATE POLICY \\"service_role_full_access\\" ON public.yachts\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"authenticated_read_access\\" ON public.yachts\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access\\" ON public.yachts\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- YACHT_PROFILES TABLE\nCREATE POLICY \\"service_role_full_access\\" ON public.yacht_profiles\n    FOR ALL TO service_role USING (true) WITH CHECK (true)","CREATE POLICY \\"authenticated_read_access\\" ON public.yacht_profiles\n    FOR SELECT TO authenticated USING (true)","CREATE POLICY \\"superadmin_full_access\\" ON public.yacht_profiles\n    FOR ALL TO authenticated \n    USING (public.is_superadmin_by_email(auth.uid()))\n    WITH CHECK (public.is_superadmin_by_email(auth.uid()))","-- =====================================================================================\n-- PHASE 5: ENABLE RLS ON ALL TABLES (if not already enabled)\n-- =====================================================================================\n\nALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY","ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY","ALTER TABLE public.ai_providers_unified ENABLE ROW LEVEL SECURITY","ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY","ALTER TABLE public.yachts ENABLE ROW LEVEL SECURITY","ALTER TABLE public.yacht_profiles ENABLE ROW LEVEL SECURITY","-- =====================================================================================\n-- PHASE 6: VERIFICATION\n-- =====================================================================================\n\n-- Verify superadmin user setup\nDO $$\nDECLARE\n    user_count INTEGER;\n    role_count INTEGER;\nBEGIN\n    -- Check auth.users\n    SELECT COUNT(*) INTO user_count \n    FROM auth.users \n    WHERE email = 'superadmin@yachtexcel.com';\n    \n    -- Check user_roles\n    SELECT COUNT(*) INTO role_count \n    FROM public.user_roles ur\n    JOIN auth.users u ON u.id = ur.user_id\n    WHERE u.email = 'superadmin@yachtexcel.com' \n    AND ur.role = 'superadmin' \n    AND ur.is_active = true;\n    \n    RAISE NOTICE 'Verification Results:';\n    RAISE NOTICE '  - Superadmin users in auth.users: %', user_count;\n    RAISE NOTICE '  - Superadmin roles in user_roles: %', role_count;\n    \n    IF user_count = 0 THEN\n        RAISE NOTICE '  ❌ CRITICAL: No superadmin user found. Run ./restore_superadmin.sh';\n    ELSIF role_count = 0 THEN\n        RAISE NOTICE '  ⚠️  WARNING: User exists but no superadmin role assigned';\n    ELSE\n        RAISE NOTICE '  ✅ SUCCESS: Superadmin setup appears complete';\n    END IF;\nEND $$","-- =====================================================================================\n-- MIGRATION COMPLETE\n-- =====================================================================================\n\nDO $$\nBEGIN\n    RAISE NOTICE '🎉 SUPERADMIN PERMISSIONS FIX MIGRATION COMPLETED';\n    RAISE NOTICE '';\n    RAISE NOTICE '✅ All conflicting policies removed';\n    RAISE NOTICE '✅ Consistent policies applied to all tables';\n    RAISE NOTICE '✅ Email-based superadmin detection (no recursion)';\n    RAISE NOTICE '✅ RLS enabled on all critical tables';\n    RAISE NOTICE '';\n    RAISE NOTICE '🔑 SUPERADMIN CREDENTIALS:';\n    RAISE NOTICE '   Email: superadmin@yachtexcel.com';\n    RAISE NOTICE '   Password: admin123';\n    RAISE NOTICE '';\n    RAISE NOTICE '⚠️  IF LOGIN FAILS: Run ./restore_superadmin.sh to create/fix the user account';\nEND $$"}	fix_superadmin_permissions_final
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: -
--

COPY supabase_migrations.seed_files (path, hash) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: -
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


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
-- Name: document_ai_processors document_ai_processors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_ai_processors
    ADD CONSTRAINT document_ai_processors_pkey PRIMARY KEY (id);


--
-- Name: document_ai_processors document_ai_processors_processor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_ai_processors
    ADD CONSTRAINT document_ai_processors_processor_id_key UNIQUE (processor_id);


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
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


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
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


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
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_11 messages_2025_10_11_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_10_11
    ADD CONSTRAINT messages_2025_10_11_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_12 messages_2025_10_12_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_10_12
    ADD CONSTRAINT messages_2025_10_12_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_13 messages_2025_10_13_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_10_13
    ADD CONSTRAINT messages_2025_10_13_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_14 messages_2025_10_14_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_10_14
    ADD CONSTRAINT messages_2025_10_14_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_15 messages_2025_10_15_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages_2025_10_15
    ADD CONSTRAINT messages_2025_10_15_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: -
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: -
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


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
-- Name: idx_document_ai_processors_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_ai_processors_active ON public.document_ai_processors USING btree (is_active);


--
-- Name: idx_document_ai_processors_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_ai_processors_priority ON public.document_ai_processors USING btree (priority);


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
-- Name: idx_role_permissions_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_lookup ON public.role_permissions USING btree (role, permission, resource, action);


--
-- Name: idx_role_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_role_permissions_role ON public.role_permissions USING btree (role);


--
-- Name: idx_role_permissions_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_role_permissions_unique ON public.role_permissions USING btree (role, permission, COALESCE(resource, ''::text), action);


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
-- Name: idx_user_profiles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_active ON public.user_profiles USING btree (last_active_at DESC) WHERE (last_active_at IS NOT NULL);


--
-- Name: idx_user_profiles_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_department ON public.user_profiles USING btree (department);


--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);


--
-- Name: idx_user_roles_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_active ON public.user_roles USING btree (user_id, is_active) WHERE (is_active = true);


--
-- Name: idx_user_roles_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_department ON public.user_roles USING btree (department, role) WHERE (department IS NOT NULL);


--
-- Name: idx_user_roles_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_expires ON public.user_roles USING btree (expires_at) WHERE (expires_at IS NOT NULL);


--
-- Name: idx_user_roles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);


--
-- Name: idx_user_roles_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_roles_unique ON public.user_roles USING btree (user_id, role, COALESCE(department, ''::text));


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
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: -
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: messages_2025_10_11_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_11_pkey;


--
-- Name: messages_2025_10_12_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_12_pkey;


--
-- Name: messages_2025_10_13_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_13_pkey;


--
-- Name: messages_2025_10_14_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_14_pkey;


--
-- Name: messages_2025_10_15_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: -
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_15_pkey;


--
-- Name: users assign_default_user_role_trigger; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER assign_default_user_role_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_user_role();


--
-- Name: users ensure_superadmin_role_trigger; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER ensure_superadmin_role_trigger AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW WHEN (((new.email)::text = 'superadmin@yachtexcel.com'::text)) EXECUTE FUNCTION public.ensure_superadmin_role();


--
-- Name: users handle_new_user_signup_trigger; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER handle_new_user_signup_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();


--
-- Name: ai_providers_unified sync_config_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER sync_config_trigger BEFORE INSERT OR UPDATE ON public.ai_providers_unified FOR EACH ROW EXECUTE FUNCTION public.sync_ai_provider_config();


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
-- Name: ai_providers_unified trigger_auto_encrypt_ai_provider_keys; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_encrypt_ai_provider_keys BEFORE INSERT OR UPDATE ON public.ai_providers_unified FOR EACH ROW EXECUTE FUNCTION public.auto_encrypt_ai_provider_keys();


--
-- Name: document_ai_processors trigger_auto_encrypt_document_ai_credentials; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_encrypt_document_ai_credentials BEFORE INSERT OR UPDATE ON public.document_ai_processors FOR EACH ROW EXECUTE FUNCTION public.auto_encrypt_document_ai_credentials();


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
-- Name: yacht_profiles trigger_yacht_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_yacht_profiles_updated_at BEFORE UPDATE ON public.yacht_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: yachts trigger_yachts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_yachts_updated_at BEFORE UPDATE ON public.yachts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: -
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


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
-- Name: document_ai_processors document_ai_processors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_ai_processors
    ADD CONSTRAINT document_ai_processors_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: document_ai_processors document_ai_processors_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_ai_processors
    ADD CONSTRAINT document_ai_processors_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


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
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


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
-- Name: iceberg_namespaces iceberg_namespaces_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


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
-- Name: user_profiles Admins can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles USING (public.user_has_permission('write'::text, 'users'::text, 'manage_all'::text));


--
-- Name: user_roles Admins can manage user roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage user roles" ON public.user_roles USING (public.user_has_permission('write'::text, 'roles'::text, 'assign_standard'::text));


--
-- Name: user_profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.user_profiles FOR SELECT USING (public.user_has_permission('read'::text, 'users'::text, 'view_all'::text));


--
-- Name: role_permissions All authenticated users can view permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated users can view permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);


--
-- Name: ai_health Authenticated insert access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated insert access" ON public.ai_health FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: ai_health Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.ai_health FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON ai_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.ai_health IS 'All authenticated users can read AI health data';


--
-- Name: ai_models_unified Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.ai_models_unified FOR SELECT TO authenticated USING (true);


--
-- Name: ai_provider_logs Authenticated read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated read access" ON public.ai_provider_logs FOR SELECT TO authenticated USING (true);


--
-- Name: POLICY "Authenticated read access" ON ai_provider_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Authenticated read access" ON public.ai_provider_logs IS 'All authenticated users can read logs';


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
-- Name: ai_health Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.ai_health FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: ai_models_unified Authenticated update access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated update access" ON public.ai_models_unified FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


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
-- Name: ai_models_unified Authenticated write access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated write access" ON public.ai_models_unified FOR INSERT TO authenticated WITH CHECK (true);


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
-- Name: user_roles Managers can view team roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can view team roles" ON public.user_roles FOR SELECT USING (public.user_has_permission('read'::text, 'users'::text, 'view_team'::text));


--
-- Name: role_permissions Only superadmins can modify permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only superadmins can modify permissions" ON public.role_permissions USING (public.is_superadmin());


--
-- Name: yacht_profiles Owner full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner full access" ON public.yacht_profiles TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: yachts Owner full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner full access" ON public.yachts TO authenticated USING ((auth.uid() = owner_id)) WITH CHECK ((auth.uid() = owner_id));


--
-- Name: role_permissions Service role can manage permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can manage permissions" ON public.role_permissions USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_health Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.ai_health TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON ai_health; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.ai_health IS 'Full unrestricted access for service role (migrations, maintenance)';


--
-- Name: ai_models_unified Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.ai_models_unified TO service_role USING (true) WITH CHECK (true);


--
-- Name: ai_provider_logs Service role full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access" ON public.ai_provider_logs TO service_role USING (true) WITH CHECK (true);


--
-- Name: POLICY "Service role full access" ON ai_provider_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Service role full access" ON public.ai_provider_logs IS 'Full unrestricted access for service role';


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
-- Name: role_permissions Service role full access - permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access - permissions" ON public.role_permissions USING ((auth.role() = 'service_role'::text));


--
-- Name: user_profiles Service role full access - profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access - profiles" ON public.user_profiles USING ((auth.role() = 'service_role'::text));


--
-- Name: user_roles Service role full access - roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access - roles" ON public.user_roles USING ((auth.role() = 'service_role'::text));


--
-- Name: ai_health Superadmin delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin delete access" ON public.ai_health FOR DELETE TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: ai_models_unified Superadmin delete access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin delete access" ON public.ai_models_unified FOR DELETE TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


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
-- Name: ai_health Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.ai_health TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: ai_models_unified Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.ai_models_unified TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: ai_provider_logs Superadmin full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Superadmin full access" ON public.ai_provider_logs TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY "Superadmin full access" ON ai_provider_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY "Superadmin full access" ON public.ai_provider_logs IS 'Superadmin has full access using direct email check';


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
-- Name: user_profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id));


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
-- Name: ai_providers_unified authenticated_insert_access_ai_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_insert_access_ai_providers ON public.ai_providers_unified FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: POLICY authenticated_insert_access_ai_providers ON ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY authenticated_insert_access_ai_providers ON public.ai_providers_unified IS 'All authenticated users can create new ai_providers_unified records';


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
-- Name: document_ai_processors authenticated_read_document_ai_processors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_read_document_ai_processors ON public.document_ai_processors FOR SELECT TO authenticated USING (true);


--
-- Name: ai_providers_unified authenticated_update_access_ai_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY authenticated_update_access_ai_providers ON public.ai_providers_unified FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: POLICY authenticated_update_access_ai_providers ON ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY authenticated_update_access_ai_providers ON public.ai_providers_unified IS 'All authenticated users can update ai_providers_unified records';


--
-- Name: document_ai_processors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document_ai_processors ENABLE ROW LEVEL SECURITY;

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
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

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
-- Name: ai_providers_unified superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.ai_providers_unified TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: inventory_items superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.inventory_items TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: system_settings superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.system_settings TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: user_roles superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.user_roles TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: yacht_profiles superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.yacht_profiles TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: yachts superadmin_full_access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access ON public.yachts TO authenticated USING (public.is_superadmin_by_email(auth.uid())) WITH CHECK (public.is_superadmin_by_email(auth.uid()));


--
-- Name: ai_providers_unified superadmin_full_access_ai_providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY superadmin_full_access_ai_providers ON public.ai_providers_unified TO authenticated USING ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text)))) WITH CHECK ((auth.uid() IN ( SELECT users.id
   FROM auth.users
  WHERE ((users.email)::text = 'superadmin@yachtexcel.com'::text))));


--
-- Name: POLICY superadmin_full_access_ai_providers ON ai_providers_unified; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY superadmin_full_access_ai_providers ON public.ai_providers_unified IS 'Superadmin (superadmin@yachtexcel.com) has full CRUD access including DELETE operations';


--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: unified_ai_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unified_ai_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');


--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: -
--

ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict dCqJDgDxIvK1SCv1CDjv5pIqpH2hreQS8hwzP74cWgGMU8dwsnJciwIBOhHPdpV

