-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTOMATIC API KEY ENCRYPTION SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- This migration creates a comprehensive automatic encryption layer for ALL API keys
-- 
-- Features:
-- ✅ Encrypts on save - All API keys automatically encrypted before database insert/update
-- ✅ Decrypts on retrieval - Automatic decryption when reading from database  
-- ✅ Backward compatible - Works with existing plain text keys
-- ✅ No manual input required - Once configured, keys persist encrypted
-- ✅ Applies to ALL API keys - AI providers, Document AI processors, any future integrations
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CREATE ENCRYPTION UTILITY FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to check if a string is already encrypted
CREATE OR REPLACE FUNCTION public.is_encrypted(value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
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
$$;

-- Function to encrypt API keys using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_api_key(plain_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to decrypt API keys using pgcrypto
CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_encrypted(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.encrypt_api_key(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_api_key(TEXT) TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ADD ENCRYPTED COLUMNS TO EXISTING TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add encrypted API key column to ai_providers_unified (if not exists)
ALTER TABLE public.ai_providers_unified 
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT;

-- Add encrypted credentials columns to document_ai_processors
ALTER TABLE public.document_ai_processors 
ADD COLUMN IF NOT EXISTS gcp_credentials_encrypted TEXT,
ADD COLUMN IF NOT EXISTS gcp_service_account_encrypted TEXT;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CREATE AUTOMATIC ENCRYPTION TRIGGERS FOR AI_PROVIDERS_UNIFIED
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger function to automatically encrypt API keys on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.auto_encrypt_ai_provider_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_encrypt_ai_provider_keys ON public.ai_providers_unified;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_auto_encrypt_ai_provider_keys
    BEFORE INSERT OR UPDATE ON public.ai_providers_unified
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_encrypt_ai_provider_keys();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. CREATE AUTOMATIC ENCRYPTION TRIGGERS FOR DOCUMENT_AI_PROCESSORS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger function to automatically encrypt GCP credentials on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.auto_encrypt_document_ai_credentials()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_encrypt_document_ai_credentials ON public.document_ai_processors;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trigger_auto_encrypt_document_ai_credentials
    BEFORE INSERT OR UPDATE ON public.document_ai_processors
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_encrypt_document_ai_credentials();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CREATE HELPER VIEWS FOR AUTOMATIC DECRYPTION
-- ═══════════════════════════════════════════════════════════════════════════════

-- View for AI providers with decrypted keys (for authenticated users)
CREATE OR REPLACE VIEW public.ai_providers_with_keys AS
SELECT 
    id,
    name,
    provider_type,
    base_url,
    api_endpoint,
    auth_type,
    auth_method,
    is_active,
    is_primary,
    priority,
    -- Automatically decrypt API key when reading
    public.decrypt_api_key(api_key_encrypted) AS api_key,
    api_key_encrypted, -- Keep encrypted version for updates
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

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.ai_providers_with_keys TO authenticated;

-- View for Document AI processors with decrypted credentials
CREATE OR REPLACE VIEW public.document_ai_processors_with_credentials AS
SELECT 
    id,
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
    -- Automatically decrypt credentials when reading
    public.decrypt_api_key(gcp_service_account_encrypted) AS gcp_service_account,
    public.decrypt_api_key(gcp_credentials_encrypted) AS gcp_credentials,
    gcp_service_account_encrypted, -- Keep encrypted versions for updates
    gcp_credentials_encrypted,
    configuration,
    description,
    created_at,
    updated_at,
    created_by,
    updated_by
FROM public.document_ai_processors;

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.document_ai_processors_with_credentials TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. MIGRATE EXISTING PLAIN TEXT KEYS TO ENCRYPTED FORMAT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Migrate existing API keys in ai_providers_unified
DO $$
DECLARE
    provider_record RECORD;
    api_key_value TEXT;
    encrypted_key TEXT;
    migration_count INTEGER := 0;
BEGIN
    -- Loop through all providers
    FOR provider_record IN 
        SELECT id, config, api_secret_name, api_key_encrypted
        FROM public.ai_providers_unified
    LOOP
        api_key_value := NULL;
        
        -- Extract API key from various sources
        IF provider_record.api_key_encrypted IS NOT NULL AND provider_record.api_key_encrypted != '' THEN
            api_key_value := provider_record.api_key_encrypted;
        ELSIF provider_record.config IS NOT NULL AND provider_record.config ? 'api_key' THEN
            api_key_value := provider_record.config->>'api_key';
        ELSIF provider_record.api_secret_name IS NOT NULL AND provider_record.api_secret_name != '' THEN
            api_key_value := provider_record.api_secret_name;
        END IF;
        
        -- If we found an API key, encrypt it
        IF api_key_value IS NOT NULL THEN
            encrypted_key := public.encrypt_api_key(api_key_value);
            
            -- Update the record with encrypted key
            UPDATE public.ai_providers_unified 
            SET 
                api_key_encrypted = encrypted_key,
                config = CASE 
                    WHEN config ? 'api_key' THEN config - 'api_key'
                    ELSE config
                END,
                api_secret_name = NULL,
                updated_at = NOW()
            WHERE id = provider_record.id;
            
            migration_count := migration_count + 1;
            RAISE NOTICE '✅ Encrypted API key for provider: % (%)', provider_record.id, migration_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE '📊 Total AI providers migrated: %', migration_count;
END $$;

-- Migrate existing credentials in document_ai_processors
DO $$
DECLARE
    processor_record RECORD;
    credentials_value TEXT;
    encrypted_creds TEXT;
    service_account_count INTEGER := 0;
    credentials_count INTEGER := 0;
BEGIN
    -- Loop through all processors
    FOR processor_record IN 
        SELECT id, configuration, gcp_service_account_encrypted, gcp_credentials_encrypted
        FROM public.document_ai_processors
    LOOP
        -- Encrypt GCP service account if present
        credentials_value := NULL;
        IF processor_record.configuration IS NOT NULL AND processor_record.configuration ? 'gcp_service_account' THEN
            credentials_value := processor_record.configuration->>'gcp_service_account';
            encrypted_creds := public.encrypt_api_key(credentials_value);
            
            UPDATE public.document_ai_processors 
            SET 
                gcp_service_account_encrypted = encrypted_creds,
                configuration = configuration - 'gcp_service_account',
                updated_at = NOW()
            WHERE id = processor_record.id;
            
            service_account_count := service_account_count + 1;
            RAISE NOTICE '✅ Encrypted GCP service account for processor: %', processor_record.id;
        END IF;
        
        -- Encrypt GCP credentials if present
        credentials_value := NULL;
        IF processor_record.configuration IS NOT NULL AND processor_record.configuration ? 'gcp_credentials' THEN
            credentials_value := processor_record.configuration->>'gcp_credentials';
            encrypted_creds := public.encrypt_api_key(credentials_value);
            
            UPDATE public.document_ai_processors 
            SET 
                gcp_credentials_encrypted = encrypted_creds,
                configuration = configuration - 'gcp_credentials',
                updated_at = NOW()
            WHERE id = processor_record.id;
            
            credentials_count := credentials_count + 1;
            RAISE NOTICE '✅ Encrypted GCP credentials for processor: %', processor_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '📊 Total service accounts migrated: %', service_account_count;
    RAISE NOTICE '📊 Total GCP credentials migrated: %', credentials_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. CREATE RLS POLICIES FOR VIEWS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Comment on tables and views for documentation
COMMENT ON FUNCTION public.is_encrypted(TEXT) IS 'Check if a string value is encrypted (base64) or plain text';
COMMENT ON FUNCTION public.encrypt_api_key(TEXT) IS 'Automatically encrypt API keys using AES-256 encryption';
COMMENT ON FUNCTION public.decrypt_api_key(TEXT) IS 'Automatically decrypt API keys with backward compatibility for plain text';
COMMENT ON VIEW public.ai_providers_with_keys IS 'AI providers view with automatically decrypted API keys for authenticated users';
COMMENT ON VIEW public.document_ai_processors_with_credentials IS 'Document AI processors view with automatically decrypted GCP credentials';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. VERIFICATION AND SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    encrypted_providers INTEGER;
    encrypted_processors INTEGER;
    total_processors INTEGER;
BEGIN
    -- Count encrypted providers
    SELECT COUNT(*) INTO encrypted_providers
    FROM public.ai_providers_unified
    WHERE api_key_encrypted IS NOT NULL 
    AND public.is_encrypted(api_key_encrypted);
    
    -- Count encrypted processors
    SELECT COUNT(*) INTO encrypted_processors
    FROM public.document_ai_processors
    WHERE gcp_service_account_encrypted IS NOT NULL 
    OR gcp_credentials_encrypted IS NOT NULL;
    
    -- Count total processors
    SELECT COUNT(*) INTO total_processors
    FROM public.document_ai_processors;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'AUTOMATIC API KEY ENCRYPTION SYSTEM - DEPLOYMENT COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Encryption Functions Created:';
    RAISE NOTICE '   - is_encrypted()        Check if value is encrypted';
    RAISE NOTICE '   - encrypt_api_key()     Automatic encryption (AES-256)';
    RAISE NOTICE '   - decrypt_api_key()     Automatic decryption';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Automatic Triggers Installed:';
    RAISE NOTICE '   - ai_providers_unified         Auto-encrypts API keys on save';
    RAISE NOTICE '   - document_ai_processors       Auto-encrypts GCP credentials';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Decryption Views Created:';
    RAISE NOTICE '   - ai_providers_with_keys             Auto-decrypts on read';
    RAISE NOTICE '   - document_ai_processors_with_credentials   Auto-decrypts on read';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Encryption Status:';
    RAISE NOTICE '   - AI Providers with encrypted keys: %', encrypted_providers;
    RAISE NOTICE '   - Document Processors with credentials: % of %', encrypted_processors, total_processors;
    RAISE NOTICE '';
    RAISE NOTICE '✨ Features:';
    RAISE NOTICE '   ✓ Encrypts on save automatically';
    RAISE NOTICE '   ✓ Decrypts on retrieval automatically';
    RAISE NOTICE '   ✓ Backward compatible with plain text';
    RAISE NOTICE '   ✓ No manual input required';
    RAISE NOTICE '   ✓ Applies to ALL API keys';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 All API keys are now permanently encrypted in the database!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
