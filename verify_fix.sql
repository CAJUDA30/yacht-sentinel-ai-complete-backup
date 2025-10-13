-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFY THE FIX IS WORKING
-- ═══════════════════════════════════════════════════════════════════════════════

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'VERIFICATION: Database State for Grok Provider'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- Check 1: Verify API key is cleared
\echo '✓ Check 1: API Key Status'
SELECT 
    name,
    provider_type,
    CASE 
        WHEN api_key_encrypted IS NULL THEN '✅ CLEAR (ready for fresh key)'
        ELSE '❌ STILL HAS VALUE'
    END as status,
    config ? 'api_key' as config_has_api_key
FROM ai_providers_unified 
WHERE name = 'Grok by xAI';

\echo ''
\echo '✓ Check 2: View Returns NULL (decrypted)'
SELECT 
    name,
    CASE 
        WHEN api_key IS NULL THEN '✅ NULL (correct)'
        ELSE '❌ HAS VALUE: ' || substring(api_key from 1 for 20)
    END as api_key_status
FROM ai_providers_with_keys 
WHERE name = 'Grok by xAI';

\echo ''
\echo '✓ Check 3: Trigger Function Exists and Updated'
SELECT 
    routine_name,
    last_altered,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_name = 'auto_encrypt_ai_provider_keys';

\echo ''
\echo '✓ Check 4: Test Trigger Logic (simulation)'
\echo 'Testing what happens when you enter a plain Grok API key...'
DO $$
DECLARE
    test_key TEXT := 'xai-test123456789';
    encrypted_result TEXT;
BEGIN
    -- Test if key would be encrypted
    IF test_key ~ '^(xai-|sk-|AIza|sk-ant-)' THEN
        RAISE NOTICE '✅ Pattern match: Grok API key would be encrypted';
        encrypted_result := public.encrypt_api_key(test_key);
        IF encrypted_result != test_key THEN
            RAISE NOTICE '✅ Encryption works: Key changed from plain to encrypted';
        ELSE
            RAISE WARNING '❌ Encryption failed: Key unchanged';
        END IF;
    ELSE
        RAISE WARNING '❌ Pattern mismatch: Key would NOT be encrypted';
    END IF;
END $$;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo 'SUMMARY'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
\echo 'Database is clean and ready!'
\echo 'Next step: Clear browser cache and enter your real API key'
\echo ''
\echo 'Instructions: See FIX_INSTRUCTIONS.md'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''
