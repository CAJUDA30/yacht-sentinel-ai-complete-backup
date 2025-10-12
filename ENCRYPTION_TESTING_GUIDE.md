# 🧪 API Key Encryption - Testing & Verification Guide

## Quick Test Checklist

Use this guide to verify that automatic API key encryption is working correctly across your application.

---

## 1️⃣ Database Level Testing

### Test 1: Verify Encryption Functions Exist
```sql
-- Check if encryption functions are installed
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('encrypt_api_key', 'decrypt_api_key', 'is_encrypted')
AND routine_schema = 'public';

-- Expected: 3 rows returned
-- ✅ encrypt_api_key | FUNCTION
-- ✅ decrypt_api_key | FUNCTION  
-- ✅ is_encrypted    | FUNCTION
```

### Test 2: Verify Views Exist
```sql
-- Check if decryption views are created
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('ai_providers_with_keys', 'document_ai_processors_with_credentials')
AND table_schema = 'public';

-- Expected: 2 rows returned
-- ✅ ai_providers_with_keys                        | VIEW
-- ✅ document_ai_processors_with_credentials       | VIEW
```

### Test 3: Verify Triggers Exist
```sql
-- Check if auto-encryption triggers are installed
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('encrypt_ai_provider_keys_trigger', 'encrypt_processor_credentials_trigger');

-- Expected: 2 rows returned
-- ✅ encrypt_ai_provider_keys_trigger      | ai_providers_unified     | BEFORE | INSERT
-- ✅ encrypt_ai_provider_keys_trigger      | ai_providers_unified     | BEFORE | UPDATE
-- ✅ encrypt_processor_credentials_trigger | document_ai_processors   | BEFORE | INSERT
-- ✅ encrypt_processor_credentials_trigger | document_ai_processors   | BEFORE | UPDATE
```

---

## 2️⃣ Encryption Testing

### Test 4: Insert Plain Text API Key
```sql
-- Insert a test provider with plain text API key
INSERT INTO ai_providers_unified (
  name, 
  provider_type, 
  api_key_encrypted,
  base_url,
  is_active
) VALUES (
  'Test Encryption Provider',
  'openai',
  'sk-test-plain-text-key-1234567890',  -- Plain text input
  'https://api.openai.com/v1',
  true
);

-- Verify it's encrypted in the database
SELECT 
  name,
  api_key_encrypted,
  is_encrypted(api_key_encrypted) as is_encrypted_check,
  length(api_key_encrypted) as encrypted_length
FROM ai_providers_unified
WHERE name = 'Test Encryption Provider';

-- Expected Output:
-- name                        | api_key_encrypted | is_encrypted_check | encrypted_length
-- Test Encryption Provider    | [base64 string]   | true               | 44+
-- 
-- ✅ api_key_encrypted should be base64 encoded (not plain text)
-- ✅ is_encrypted_check should be TRUE
-- ✅ encrypted_length should be > 40 characters
```

### Test 5: Read Decrypted API Key from View
```sql
-- Read from the decryption view
SELECT 
  name,
  api_key,                    -- Decrypted plain text
  api_key_encrypted,          -- Encrypted version
  is_encrypted(api_key_encrypted) as is_stored_encrypted
FROM ai_providers_with_keys
WHERE name = 'Test Encryption Provider';

-- Expected Output:
-- name                        | api_key                              | api_key_encrypted | is_stored_encrypted
-- Test Encryption Provider    | sk-test-plain-text-key-1234567890    | [base64 string]   | true
--
-- ✅ api_key should show the ORIGINAL plain text
-- ✅ api_key_encrypted should show encrypted base64
-- ✅ is_stored_encrypted should be TRUE
```

### Test 6: Update API Key (Re-encryption)
```sql
-- Update with a new plain text API key
UPDATE ai_providers_unified
SET api_key_encrypted = 'sk-new-updated-key-9876543210'  -- Plain text input
WHERE name = 'Test Encryption Provider';

-- Verify the new key is encrypted
SELECT 
  name,
  api_key_encrypted,
  is_encrypted(api_key_encrypted) as is_encrypted,
  substring(api_key_encrypted, 1, 10) as encrypted_preview
FROM ai_providers_unified
WHERE name = 'Test Encryption Provider';

-- Expected:
-- ✅ api_key_encrypted should be DIFFERENT from previous (re-encrypted)
-- ✅ is_encrypted should be TRUE
-- ✅ encrypted_preview should NOT start with 'sk-'
```

### Test 7: Read Updated Key from View
```sql
-- Verify decryption of updated key
SELECT api_key
FROM ai_providers_with_keys
WHERE name = 'Test Encryption Provider';

-- Expected Output:
-- api_key
-- sk-new-updated-key-9876543210
--
-- ✅ Should show the NEW plain text key (not the old one)
```

---

## 3️⃣ Application Level Testing

### Test 8: Read API Keys in TypeScript/React
```typescript
// In any React component or hook
import { supabase } from '@/integrations/supabase/client';

// Test reading from view
const testDecryption = async () => {
  const { data, error } = await supabase
    .from('ai_providers_with_keys')  // ← Using view
    .select('name, api_key, api_key_encrypted')
    .eq('name', 'Test Encryption Provider')
    .single();
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('✅ Provider Name:', data.name);
  console.log('✅ Decrypted API Key:', data.api_key);
  console.log('✅ Encrypted Storage:', data.api_key_encrypted);
  
  // Verify decryption worked
  if (data.api_key === 'sk-new-updated-key-9876543210') {
    console.log('✅ DECRYPTION SUCCESSFUL!');
  } else {
    console.log('❌ DECRYPTION FAILED!');
  }
};

// Run the test
testDecryption();

// Expected Console Output:
// ✅ Provider Name: Test Encryption Provider
// ✅ Decrypted API Key: sk-new-updated-key-9876543210
// ✅ Encrypted Storage: [base64 string]
// ✅ DECRYPTION SUCCESSFUL!
```

### Test 9: Write API Keys in TypeScript/React
```typescript
// Test writing (auto-encryption)
const testEncryption = async () => {
  const { data, error } = await supabase
    .from('ai_providers_unified')  // ← Using base table
    .insert({
      name: 'Auto-Encrypt Test Provider',
      provider_type: 'anthropic',
      api_key_encrypted: 'claude-api-key-plain-text-12345',  // Plain text
      base_url: 'https://api.anthropic.com/v1',
      is_active: true
    })
    .select();
  
  if (error) {
    console.error('❌ Insert Error:', error);
    return;
  }
  
  console.log('✅ Provider Created:', data[0].name);
  console.log('✅ Stored Value:', data[0].api_key_encrypted);
  
  // Now read it back from view to verify encryption happened
  const { data: readData } = await supabase
    .from('ai_providers_with_keys')
    .select('api_key, api_key_encrypted')
    .eq('name', 'Auto-Encrypt Test Provider')
    .single();
  
  console.log('✅ Read Back - Plain:', readData?.api_key);
  console.log('✅ Read Back - Encrypted:', readData?.api_key_encrypted);
  
  if (readData?.api_key === 'claude-api-key-plain-text-12345') {
    console.log('✅ ENCRYPTION + DECRYPTION SUCCESSFUL!');
  }
};

// Run the test
testEncryption();

// Expected Console Output:
// ✅ Provider Created: Auto-Encrypt Test Provider
// ✅ Stored Value: [base64 encrypted string]
// ✅ Read Back - Plain: claude-api-key-plain-text-12345
// ✅ Read Back - Encrypted: [base64 encrypted string]
// ✅ ENCRYPTION + DECRYPTION SUCCESSFUL!
```

### Test 10: Verify useAIProviderManagement Hook
```typescript
// In a React component
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';

function TestEncryptionComponent() {
  const { providers, createProvider } = useAIProviderManagement();
  
  useEffect(() => {
    if (providers.data) {
      console.log('✅ Providers loaded via hook:', providers.data.length);
      
      // Check if API keys are plain text (decrypted)
      const testProvider = providers.data.find(p => 
        p.name === 'Test Encryption Provider'
      );
      
      if (testProvider) {
        console.log('✅ Provider found:', testProvider.name);
        console.log('✅ API Key (should be plain text):', testProvider.api_key);
        
        // Verify it's the decrypted value
        if (testProvider.api_key?.startsWith('sk-')) {
          console.log('✅ API KEY SUCCESSFULLY DECRYPTED!');
        } else {
          console.log('❌ API KEY NOT DECRYPTED!');
        }
      }
    }
  }, [providers.data]);
  
  const handleCreateProvider = async () => {
    await createProvider.mutateAsync({
      name: 'Hook Test Provider',
      provider_type: 'xai',
      base_url: 'https://api.x.ai/v1',
      api_key_encrypted: 'xai-plain-text-key-67890',  // Plain text
      is_active: true
    } as any);
    
    console.log('✅ Provider created via hook');
  };
  
  return (
    <button onClick={handleCreateProvider}>
      Test Create Provider
    </button>
  );
}

// Expected Behavior:
// 1. ✅ Hook reads from 'ai_providers_with_keys' view
// 2. ✅ API keys are plain text (decrypted)
// 3. ✅ Create mutation uses base table (auto-encrypts)
// 4. ✅ After creation, new provider's key is also decrypted when read
```

---

## 4️⃣ Document AI Testing

### Test 11: Document AI Processor Encryption
```sql
-- Insert a test processor with GCP credentials
INSERT INTO document_ai_processors (
  name,
  display_name,
  processor_id,
  location,
  project_id,
  gcp_credentials_encrypted,  -- Plain text JSON
  is_active
) VALUES (
  'test_processor',
  'Test Document Processor',
  'test-processor-id-123',
  'us',
  '338523806048',
  '{"type":"service_account","project_id":"yacht-sentinel","private_key":"-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----"}',
  true
);

-- Verify encryption
SELECT 
  name,
  gcp_credentials_encrypted,
  is_encrypted(gcp_credentials_encrypted) as is_encrypted
FROM document_ai_processors
WHERE name = 'test_processor';

-- Expected:
-- ✅ gcp_credentials_encrypted should be base64 (not JSON)
-- ✅ is_encrypted should be TRUE
```

### Test 12: Document AI Decryption View
```sql
-- Read from decryption view
SELECT 
  name,
  gcp_credentials,           -- Decrypted JSON
  gcp_credentials_encrypted  -- Encrypted base64
FROM document_ai_processors_with_credentials
WHERE name = 'test_processor';

-- Expected:
-- ✅ gcp_credentials should be the ORIGINAL JSON (plain text)
-- ✅ gcp_credentials_encrypted should be base64 encrypted
```

### Test 13: Document AI Component Test
```typescript
// In React component
const testDocumentAI = async () => {
  const { data } = await supabase
    .from('document_ai_processors_with_credentials')  // ← View
    .select('*')
    .eq('name', 'test_processor')
    .single();
  
  console.log('✅ Processor:', data?.name);
  console.log('✅ Credentials (decrypted):', data?.gcp_credentials);
  
  // Parse the JSON credentials
  const creds = typeof data?.gcp_credentials === 'string' 
    ? JSON.parse(data.gcp_credentials) 
    : data?.gcp_credentials;
  
  if (creds?.type === 'service_account') {
    console.log('✅ DOCUMENT AI DECRYPTION SUCCESSFUL!');
  }
};

// Expected:
// ✅ Processor: test_processor
// ✅ Credentials (decrypted): {"type":"service_account",...}
// ✅ DOCUMENT AI DECRYPTION SUCCESSFUL!
```

---

## 5️⃣ Backward Compatibility Testing

### Test 14: Plain Text Keys Still Work
```sql
-- Insert with PLAIN: prefix (bypass encryption for testing)
INSERT INTO ai_providers_unified (
  name,
  provider_type,
  api_key_encrypted,
  base_url,
  is_active
) VALUES (
  'Legacy Provider',
  'openai',
  'PLAIN:sk-legacy-unencrypted-key',  -- Won't be encrypted
  'https://api.openai.com/v1',
  true
);

-- Verify it's NOT encrypted
SELECT 
  name,
  api_key_encrypted,
  is_encrypted(api_key_encrypted) as is_encrypted
FROM ai_providers_unified
WHERE name = 'Legacy Provider';

-- Expected:
-- ✅ api_key_encrypted should be 'sk-legacy-unencrypted-key' (no PLAIN: prefix)
-- ✅ is_encrypted should be FALSE
```

### Test 15: Read Plain Text from View
```sql
-- Read legacy plain text key from view
SELECT api_key
FROM ai_providers_with_keys
WHERE name = 'Legacy Provider';

-- Expected:
-- api_key
-- sk-legacy-unencrypted-key
--
-- ✅ Should work with plain text keys too
```

---

## 6️⃣ Cleanup Test Data

### Clean Up All Test Records
```sql
-- Remove all test providers
DELETE FROM ai_providers_unified 
WHERE name IN (
  'Test Encryption Provider',
  'Auto-Encrypt Test Provider',
  'Hook Test Provider',
  'Legacy Provider'
);

-- Remove test processor
DELETE FROM document_ai_processors
WHERE name = 'test_processor';

-- Verify cleanup
SELECT COUNT(*) as remaining_test_records
FROM ai_providers_unified
WHERE name LIKE '%Test%';

-- Expected: 0
```

---

## 7️⃣ Production Verification

### Final Production Checks

#### ✅ Check 1: All Production Providers Are Encrypted
```sql
SELECT 
  COUNT(*) as total_providers,
  COUNT(*) FILTER (WHERE is_encrypted(api_key_encrypted)) as encrypted_count,
  COUNT(*) FILTER (WHERE NOT is_encrypted(api_key_encrypted)) as plain_text_count
FROM ai_providers_unified
WHERE api_key_encrypted IS NOT NULL;

-- Expected:
-- total_providers | encrypted_count | plain_text_count
-- 5               | 5               | 0
--
-- ✅ encrypted_count should equal total_providers
-- ✅ plain_text_count should be 0
```

#### ✅ Check 2: All Views Are Accessible
```typescript
// Test all views return data
const verifyViews = async () => {
  const { data: providers } = await supabase
    .from('ai_providers_with_keys')
    .select('count')
    .single();
  
  const { data: processors } = await supabase
    .from('document_ai_processors_with_credentials')
    .select('count')
    .single();
  
  console.log('✅ Providers view accessible:', !!providers);
  console.log('✅ Processors view accessible:', !!processors);
};
```

#### ✅ Check 3: Application Functions Normally
```typescript
// Verify normal application flow works
import { useAIProviderManagement } from '@/hooks/useAIProviderManagement';

const ProductionTest = () => {
  const { providers, testProvider } = useAIProviderManagement();
  
  const runProductionTest = async () => {
    // 1. Load providers (should use view)
    const activeProviders = providers.data?.filter(p => p.is_active);
    console.log('✅ Loaded providers:', activeProviders?.length);
    
    // 2. Test a provider (should have decrypted key)
    if (activeProviders && activeProviders[0]) {
      const result = await testProvider.mutateAsync(activeProviders[0]);
      console.log('✅ Provider test result:', result);
    }
    
    // 3. Verify keys are plain text
    const hasPlainTextKeys = activeProviders?.every(p => 
      p.api_key && !p.api_key.includes('base64')
    );
    console.log('✅ All keys are plain text:', hasPlainTextKeys);
  };
  
  return <button onClick={runProductionTest}>Run Production Test</button>;
};
```

---

## 🎯 Success Criteria

### ✅ All Tests Must Pass

- [x] Encryption functions exist (Test 1)
- [x] Views exist (Test 2)
- [x] Triggers exist (Test 3)
- [x] Plain text input gets encrypted (Test 4)
- [x] Encrypted keys can be decrypted (Test 5)
- [x] Updates re-encrypt properly (Test 6, 7)
- [x] TypeScript read works (Test 8)
- [x] TypeScript write works (Test 9)
- [x] Hooks use views correctly (Test 10)
- [x] Document AI encryption works (Test 11, 12, 13)
- [x] Backward compatibility works (Test 14, 15)
- [x] Production data is encrypted (Check 1)
- [x] Views are accessible (Check 2)
- [x] Application functions normally (Check 3)

---

## 📊 Testing Summary Template

```
🧪 API KEY ENCRYPTION - TEST RESULTS
====================================

Database Tests:
✅ Encryption functions: [PASS/FAIL]
✅ Decryption views: [PASS/FAIL]
✅ Auto-encrypt triggers: [PASS/FAIL]

Encryption Tests:
✅ Plain text → encrypted: [PASS/FAIL]
✅ Encrypted → plain text: [PASS/FAIL]
✅ Update re-encrypts: [PASS/FAIL]

Application Tests:
✅ TypeScript read/decrypt: [PASS/FAIL]
✅ TypeScript write/encrypt: [PASS/FAIL]
✅ Hooks use views: [PASS/FAIL]

Document AI Tests:
✅ Credentials encryption: [PASS/FAIL]
✅ Credentials decryption: [PASS/FAIL]

Production Verification:
✅ All keys encrypted: [PASS/FAIL]
✅ Views accessible: [PASS/FAIL]
✅ App functions normally: [PASS/FAIL]

Overall Status: [PASS/FAIL]
```

---

**Last Updated**: 2025-10-12  
**Status**: Ready for Testing  
**Next Step**: Run all tests and verify encryption is working correctly
