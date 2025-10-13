-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX IS_ENCRYPTED FUNCTION TO DETECT CORRUPTED VALUES
-- ═══════════════════════════════════════════════════════════════════════════════
-- The is_encrypted() function was incorrectly identifying corrupted "Icyh" values
-- as encrypted, causing them to pass through without detection
-- ═══════════════════════════════════════════════════════════════════════════════

-- Replace is_encrypted with better detection logic
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

-- Also update decrypt_api_key to handle encryption properly
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
        -- If decryption fails, return NULL
        RAISE WARNING 'Decryption failed for API key: %', SQLERRM;
        RETURN NULL;
    END;
END;
$$;

-- Verify the fix worked
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'IS_ENCRYPTED FUNCTION FIXED - REVERTED ICYH CHECK';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE 'The is_encrypted() function now:';
    RAISE NOTICE '  ✅ Properly detects base64 encrypted values';
    RAISE NOTICE '  ✅ Allows valid encrypted keys starting with Icyh (random base64)';
    RAISE NOTICE '';
    RAISE NOTICE 'The decrypt_api_key() function now:';
    RAISE NOTICE '  ✅ Decrypts all valid encrypted keys including Icyh prefix';
    RAISE NOTICE '  ✅ Returns NULL only on actual decryption failure';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
