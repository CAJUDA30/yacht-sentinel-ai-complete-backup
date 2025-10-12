# 🔐 API Key Encryption - Quick Reference Card

## 🚀 Quick Start

### Reading API Keys (Auto-Decrypted)

```typescript
// ✅ Use decryption views
const { data } = await supabase
  .from('ai_providers_with_keys')  // ← View, not table
  .select('*');

console.log(data[0].api_key);  // Plain text, ready to use
```

### Saving API Keys (Auto-Encrypted)

```typescript
// ✅ Just save plain text
await supabase
  .from('ai_providers_unified')  // ← Direct table
  .insert({
    name: 'OpenAI',
    api_key_encrypted: 'sk-your-plain-key'  // ← Auto-encrypted
  });
```

---

## 📋 View Names (Use These for SELECT)

| Table (Direct) | View (Auto-Decrypt) |
|----------------|---------------------|
| `ai_providers_unified` | `ai_providers_with_keys` ✅ |
| `document_ai_processors` | `document_ai_processors_with_credentials` ✅ |

---

## ⚡ Common Operations

### AI Provider CRUD

```typescript
// CREATE (auto-encrypts)
await supabase.from('ai_providers_unified').insert({
  name: 'OpenAI',
  provider_type: 'openai',
  api_key_encrypted: 'sk-plain-key',  // ← Will be encrypted
  is_active: true
});

// READ (auto-decrypts)
const { data } = await supabase
  .from('ai_providers_with_keys')  // ← Use view
  .select('id, name, api_key, is_active');

// UPDATE (auto-encrypts)
await supabase
  .from('ai_providers_unified')
  .update({ api_key_encrypted: 'sk-new-key' })  // ← Will be encrypted
  .eq('id', providerId);

// DELETE
await supabase
  .from('ai_providers_unified')
  .delete()
  .eq('id', providerId);
```

### Document AI Processor CRUD

```typescript
// CREATE (auto-encrypts)
await supabase.from('document_ai_processors').insert({
  name: 'processor-name',
  processor_id: '8708cd1d9cd87cc1',
  gcp_service_account_encrypted: JSON.stringify(creds),  // ← Encrypted
  is_active: true
});

// READ (auto-decrypts)
const { data } = await supabase
  .from('document_ai_processors_with_credentials')  // ← Use view
  .select('id, name, gcp_service_account, gcp_credentials');

// UPDATE (auto-encrypts)
await supabase
  .from('document_ai_processors')
  .update({ gcp_service_account_encrypted: newCreds })  // ← Encrypted
  .eq('id', processorId);
```

---

## 🔍 Verification Commands

### Check Encryption Status

```sql
-- See encrypted vs plain text keys
SELECT 
  name,
  CASE WHEN is_encrypted(api_key_encrypted) THEN '🔒 Encrypted' ELSE '🔓 Plain' END AS status,
  LENGTH(api_key_encrypted) AS key_length
FROM ai_providers_unified
WHERE api_key_encrypted IS NOT NULL;
```

### Test Encryption/Decryption

```sql
-- Quick test
SELECT 
  encrypt_api_key('sk-test') AS encrypted,
  decrypt_api_key(encrypt_api_key('sk-test')) AS decrypted;
```

### Verify Triggers Active

```sql
-- Check triggers are working
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'trigger_auto_encrypt%';
```

---

## ⚠️ Common Mistakes

### ❌ DON'T

```typescript
// ❌ Don't read from base table expecting plain text
const { data } = await supabase
  .from('ai_providers_unified')  // Wrong!
  .select('api_key_encrypted');
// Returns encrypted base64

// ❌ Don't manually encrypt
const encrypted = await encryptApiKey(key);
await supabase.insert({ api_key_encrypted: encrypted });
// Double encryption!

// ❌ Don't log plain keys
console.log(provider.api_key);  // Security risk!
```

### ✅ DO

```typescript
// ✅ Use decryption views
const { data } = await supabase
  .from('ai_providers_with_keys')  // Correct!
  .select('api_key');
// Returns plain text

// ✅ Save plain text (auto-encrypted)
await supabase.insert({ 
  api_key_encrypted: 'sk-plain-key' 
});

// ✅ Mask keys when logging
console.log(maskApiKey(provider.api_key));
// Output: "sk-12••••••34"
```

---

## 🔧 Debugging

### Issue: Getting encrypted data instead of plain text

**Solution**: Use the view, not the table
```typescript
// Change from:
.from('ai_providers_unified')

// To:
.from('ai_providers_with_keys')
```

### Issue: Decryption warnings in logs

**Solution**: Normal for legacy plain text keys. System handles it safely.

### Issue: Column doesn't exist

**Solution**: Check view name:
- `ai_providers_with_keys` has `api_key` column ✅
- `ai_providers_unified` has `api_key_encrypted` column

---

## 📊 System Status

```sql
-- Quick health check
SELECT 
  '✅ Functions' AS component, 
  COUNT(*)::TEXT AS count
FROM pg_proc 
WHERE proname IN ('encrypt_api_key', 'decrypt_api_key', 'is_encrypted')
UNION ALL
SELECT '✅ Triggers', COUNT(*)::TEXT
FROM pg_trigger 
WHERE tgname LIKE 'trigger_auto_encrypt%'
UNION ALL
SELECT '✅ Views', COUNT(*)::TEXT
FROM pg_views 
WHERE viewname LIKE '%_with_%';
```

---

## 📚 Full Documentation

- **Complete Guide**: `/AUTOMATIC_API_KEY_ENCRYPTION_GUIDE.md`
- **Implementation**: `/ENCRYPTION_IMPLEMENTATION_SUMMARY.md`
- **Migration**: `/supabase/migrations/20251012110000_automatic_api_key_encryption.sql`

---

**Remember**: 
- ✅ Use **views** for reading (auto-decrypt)
- ✅ Use **tables** for writing (auto-encrypt)
- ✅ Save **plain text** keys (triggers encrypt)
- ✅ **Zero manual encryption** needed!
