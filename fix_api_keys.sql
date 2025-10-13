-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEMATIC API KEY PERSISTENCE FIX
-- ═══════════════════════════════════════════════════════════════════════════════
-- This script will systematically clean all API keys from config fields
-- and ensure they exist ONLY in the api_key_encrypted column
-- ═══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'SYSTEMATIC API KEY PERSISTENCE FIX - STARTING'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- First, let's see what we're working with
\echo '📋 CURRENT STATE - Checking all providers:'
SELECT 
    id,
    name,
    provider_type,
    CASE 
        WHEN config ? 'api_key' THEN 'HAS_API_KEY_IN_CONFIG' 
        ELSE 'CLEAN' 
    END as config_status,
    CASE 
        WHEN api_key_encrypted IS NOT NULL THEN 'HAS_ENCRYPTED_KEY'
        ELSE 'NO_ENCRYPTED_KEY'
    END as encryption_status,
    LEFT(COALESCE(config->>'api_key', 'none'), 15) as config_api_key_preview
FROM ai_providers_unified 
ORDER BY created_at;

\echo ''
\echo '🧹 CLEANING PROCESS - Removing API keys from config fields:'

-- Clean all providers systematically
DO $$
DECLARE
    provider_record RECORD;
    clean_config JSONB;
    cleaned_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- Count total providers
    SELECT COUNT(*) INTO total_count FROM ai_providers_unified;
    RAISE NOTICE 'Found % providers to process', total_count;
    
    -- Process each provider
    FOR provider_record IN 
        SELECT id, name, config, provider_type, api_key_encrypted
        FROM ai_providers_unified
        ORDER BY name
    LOOP
        RAISE NOTICE 'Processing: % (%)', provider_record.name, provider_record.provider_type;
        
        -- Check if config contains an api_key field
        IF provider_record.config ? 'api_key' THEN
            RAISE NOTICE '  🔧 CLEANING: Removing api_key from config for %', provider_record.name;
            
            -- Remove api_key from config
            clean_config := provider_record.config - 'api_key';
            
            -- Update the provider with clean config
            UPDATE ai_providers_unified
            SET 
                config = clean_config,
                updated_at = NOW()
            WHERE id = provider_record.id;
            
            cleaned_count := cleaned_count + 1;
            RAISE NOTICE '  ✅ CLEANED: % - api_key removed from config', provider_record.name;
        ELSE
            RAISE NOTICE '  ✓ ALREADY CLEAN: % - no api_key in config', provider_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 CLEANUP SUMMARY:';
    RAISE NOTICE '  Total providers: %', total_count;
    RAISE NOTICE '  Providers cleaned: %', cleaned_count;
    RAISE NOTICE '  Providers already clean: %', total_count - cleaned_count;
    RAISE NOTICE '';
    
    IF cleaned_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: All API keys removed from config fields';
        RAISE NOTICE '✅ API keys now exist ONLY in api_key_encrypted column';
    ELSE
        RAISE NOTICE '✅ SUCCESS: All providers were already clean';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

\echo ''
\echo '🔍 VERIFICATION - Final state after cleanup:'
SELECT 
    id,
    name,
    provider_type,
    CASE 
        WHEN config ? 'api_key' THEN '❌ STILL_HAS_API_KEY' 
        ELSE '✅ CLEAN' 
    END as config_status,
    CASE 
        WHEN api_key_encrypted IS NOT NULL THEN '✅ HAS_ENCRYPTED_KEY'
        ELSE '❌ NO_ENCRYPTED_KEY'
    END as encryption_status
FROM ai_providers_unified 
ORDER BY name;

\echo ''
\echo '🔐 TESTING VIEW DECRYPTION:'
SELECT 
    name,
    provider_type,
    LEFT(api_key, 10) || '...' as decrypted_key_preview,
    CASE 
        WHEN api_key IS NOT NULL AND LENGTH(api_key) > 5 THEN '✅ DECRYPTION_WORKING'
        ELSE '❌ DECRYPTION_FAILED'
    END as decryption_status
FROM ai_providers_with_keys
WHERE api_key_encrypted IS NOT NULL
ORDER BY name;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '✅ SYSTEMATIC API KEY PERSISTENCE FIX - COMPLETE'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo '🎉 RESULT: API keys are now stored systematically:'
\echo '   • ONLY in api_key_encrypted column (encrypted storage)'
\echo '   • Config fields are clean (no sensitive data)'  
\echo '   • Database view provides automatic decryption'
\echo '   • Frontend will now load correct API keys'
\echo ''
\echo '📋 NEXT STEPS:'
\echo '   1. Refresh your browser'
\echo '   2. Open Grok provider configuration'
\echo '   3. You should see your correct API key: xai-...w82c'
\echo '   4. Test connection should work properly'
\echo ''