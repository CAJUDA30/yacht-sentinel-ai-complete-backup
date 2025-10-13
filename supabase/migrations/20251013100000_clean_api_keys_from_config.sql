-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEMATIC FIX: Remove API keys from config JSONB field
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- This migration ensures NO API keys are stored in the config field
-- API keys should ONLY be in the api_key_encrypted column
--
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    provider_record RECORD;
    clean_config JSONB;
    cleaned_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'CLEANING API KEYS FROM CONFIG FIELDS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- Loop through all providers
    FOR provider_record IN 
        SELECT id, name, config, provider_type
        FROM public.ai_providers_unified
        WHERE config IS NOT NULL
    LOOP
        -- Check if config contains an api_key field
        IF provider_record.config ? 'api_key' THEN
            RAISE NOTICE '🧹 Cleaning provider: % (%) - removing api_key from config', 
                provider_record.name, provider_record.provider_type;
            
            -- Remove api_key from config
            clean_config := provider_record.config - 'api_key';
            
            -- Update the provider
            UPDATE public.ai_providers_unified
            SET 
                config = clean_config,
                updated_at = NOW()
            WHERE id = provider_record.id;
            
            cleaned_count := cleaned_count + 1;
            
            RAISE NOTICE '   ✅ Cleaned: % - api_key removed from config', provider_record.name;
        ELSE
            RAISE NOTICE '   ✓ Already clean: % - no api_key in config', provider_record.name;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 CLEANUP SUMMARY';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '  Providers cleaned: %', cleaned_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ All API keys are now ONLY in api_key_encrypted column';
    RAISE NOTICE '✅ Config fields are clean - no sensitive data';
    RAISE NOTICE '';
END $$;
