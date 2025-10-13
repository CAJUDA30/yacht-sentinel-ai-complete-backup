-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX DOUBLE ENCRYPTION ISSUE IN API KEY STORAGE
-- ═══════════════════════════════════════════════════════════════════════════════
-- This fixes the issue where API keys get corrupted due to double encryption
-- ═══════════════════════════════════════════════════════════════════════════════

-- Step 1: Fix the encryption trigger to prevent double encryption
CREATE OR REPLACE FUNCTION public.auto_encrypt_ai_provider_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- CORE FIX: Only encrypt plain text API keys, never re-encrypt encrypted ones
    
    -- Priority 1: If api_key_encrypted is being set directly
    IF NEW.api_key_encrypted IS NOT NULL AND NEW.api_key_encrypted != '' THEN
        -- Only encrypt if it looks like a plain text API key (starts with known prefixes)
        -- OR has PLAIN: marker
        IF NEW.api_key_encrypted LIKE 'PLAIN:%' THEN
            -- Remove PLAIN: prefix and encrypt
            NEW.api_key_encrypted := public.encrypt_api_key(substring(NEW.api_key_encrypted from 7));
        ELSIF NEW.api_key_encrypted ~ '^(xai-|sk-|AIza|sk-ant-)' THEN
            -- Looks like a plain text API key - encrypt it
            NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_key_encrypted);
        END IF;
        -- If it doesn't match these patterns, assume it's already encrypted and leave it alone
        
    -- Priority 2: Check if API key is in config.api_key (legacy support)
    ELSIF NEW.config IS NOT NULL AND NEW.config ? 'api_key' THEN
        NEW.api_key_encrypted := public.encrypt_api_key(NEW.config->>'api_key');
        -- Remove plain text key from config after encryption
        NEW.config := NEW.config - 'api_key';
        
    -- Priority 3: Check if API key is in api_secret_name (legacy)
    ELSIF NEW.api_secret_name IS NOT NULL AND NEW.api_secret_name != '' THEN
        NEW.api_key_encrypted := public.encrypt_api_key(NEW.api_secret_name);
        NEW.api_secret_name := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 2: Clean up any corrupted API keys from existing providers
DO $$
DECLARE
    provider_record RECORD;
    cleaned_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Cleaning corrupted API keys from config fields...';
    
    -- Find providers with API keys in config field
    FOR provider_record IN 
        SELECT id, name, config, provider_type
        FROM ai_providers_unified
        WHERE config ? 'api_key'
    LOOP
        RAISE NOTICE 'Cleaning provider: % (%)', provider_record.name, provider_record.provider_type;
        
        -- Remove API key from config
        UPDATE ai_providers_unified
        SET 
            config = config - 'api_key',
            updated_at = NOW()
        WHERE id = provider_record.id;
        
        cleaned_count := cleaned_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Cleaned % providers', cleaned_count;
END $$;

-- Step 3: Verify the fix
DO $$
DECLARE
    total_providers INTEGER;
    providers_with_config_keys INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_providers FROM ai_providers_unified;
    SELECT COUNT(*) INTO providers_with_config_keys 
    FROM ai_providers_unified 
    WHERE config ? 'api_key';
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'DOUBLE ENCRYPTION FIX APPLIED SUCCESSFULLY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'Total providers: %', total_providers;
    RAISE NOTICE 'Providers with API keys in config: %', providers_with_config_keys;
    RAISE NOTICE '';
    IF providers_with_config_keys = 0 THEN
        RAISE NOTICE '✅ All configs are clean - no API keys in config fields';
    ELSE
        RAISE NOTICE '⚠️ Some providers still have API keys in config';
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. In UI, open your Grok provider configuration';
    RAISE NOTICE '2. Enter your real API key: xai-...w82c';
    RAISE NOTICE '3. Save - the fixed trigger will encrypt it properly';
    RAISE NOTICE '4. No more double encryption or corruption!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
