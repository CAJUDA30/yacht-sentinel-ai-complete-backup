-- CORE FIX: Clean API keys from config fields for real providers
-- This ensures your real Grok API key works properly without config interference

DO $$
DECLARE
    provider_record RECORD;
    clean_config JSONB;
    cleaned_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'CORE FIX: Cleaning API keys from config fields for real providers...';
    
    -- Process all real providers (not mock/test data)
    FOR provider_record IN 
        SELECT id, name, config, provider_type
        FROM ai_providers_unified
        WHERE name IS NOT NULL 
        AND name != 'Test Provider'
        AND name NOT LIKE '%test%'
        AND name NOT LIKE '%mock%'
    LOOP
        -- Check if config contains an api_key field
        IF provider_record.config ? 'api_key' THEN
            RAISE NOTICE 'CLEANING: % (%) - removing api_key from config', 
                provider_record.name, provider_record.provider_type;
            
            -- Remove api_key from config
            clean_config := provider_record.config - 'api_key';
            
            -- Update the provider with clean config
            UPDATE ai_providers_unified
            SET 
                config = clean_config,
                updated_at = NOW()
            WHERE id = provider_record.id;
            
            cleaned_count := cleaned_count + 1;
            RAISE NOTICE 'CLEANED: % - config is now clean', provider_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'CORE FIX COMPLETE: % real providers cleaned', cleaned_count;
END $$;

-- Verify the fix
SELECT 
    name,
    provider_type,
    CASE WHEN config ? 'api_key' THEN 'STILL_HAS_API_KEY' ELSE 'CLEAN' END as config_status
FROM ai_providers_unified 
WHERE name IS NOT NULL
ORDER BY name;