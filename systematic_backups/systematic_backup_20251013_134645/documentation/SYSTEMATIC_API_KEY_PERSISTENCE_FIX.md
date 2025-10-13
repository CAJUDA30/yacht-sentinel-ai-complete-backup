# Systematic API Key Persistence Fix

## Problem Description

Users were experiencing API key persistence issues where:
- A working API key (e.g., `xai-...w82c`) would be saved successfully
- Upon returning to the configuration modal, a completely different key would appear (e.g., `Icyh...yPX4`)
- The substituted key would fail authentication with the provider

## Root Cause Analysis

The issue was caused by **dual storage of API keys**:

1. **ProviderConfigurationModal.tsx** was storing API keys in BOTH:
   - The `configuration` object (as `configuration.api_key`)
   - The top-level `api_key` property (intended for database storage)

2. **Legacy encrypted values** from the previous dual-encryption system remained in the `config` JSONB field

3. When the modal reloaded, it would pick up the **old encrypted value** from the config field instead of the properly decrypted value from the database view

## The Systematic Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                       │
├─────────────────────────────────────────────────────────────┤
│  ProviderConfigurationModal / EnhancedProviderWizard        │
│                                                              │
│  ✅ Pass API key as: updatedProvider.api_key = plainApiKey │
│  ❌ NOT in configuration: configuration.api_key            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Parent Handler (Operations Center)              │
├─────────────────────────────────────────────────────────────┤
│  handleSaveProvider / onProviderCreate                       │
│                                                              │
│  1. Extract: plainApiKey = provider.api_key || config.api_key│
│  2. Clean config: delete config.api_key                     │
│  3. Store separately:                                       │
│     - api_key_encrypted = plainApiKey                       │
│     - config = cleanConfig (NO API KEY)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Database Layer (PostgreSQL)                 │
├─────────────────────────────────────────────────────────────┤
│  ai_providers_unified table                                  │
│                                                              │
│  Columns:                                                    │
│  - api_key_encrypted (text) ← Plain key stored here        │
│  - config (jsonb) ← Clean configuration, NO API KEY         │
│                                                              │
│  Trigger: trigger_auto_encrypt_ai_provider_keys             │
│  → Automatically encrypts api_key_encrypted on INSERT/UPDATE│
│                                                              │
│  View: ai_providers_with_keys                               │
│  → Automatically decrypts and returns as api_key field      │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Single Source of Truth**: API keys stored ONLY in `api_key_encrypted` field
2. **Clean Configuration**: `config` JSONB field contains NO sensitive data
3. **Automatic Encryption**: Database trigger handles encryption transparently
4. **Automatic Decryption**: Database view provides decrypted `api_key` field
5. **Backwards Compatibility**: Handlers check both locations during transition

## Implementation Changes

### 1. ProviderConfigurationModal.tsx

**Before:**
```typescript
const updatedProvider = {
  ...provider,
  ...formData,
  configuration: {
    ...formData.configuration,
    ...(apiKey && { api_key: apiKey }), // ❌ WRONG - stores in config
    last_updated: new Date().toISOString()
  }
};
```

**After:**
```typescript
const updatedProvider = {
  ...provider,
  ...formData,
  // ✅ CORRECT - Pass API key separately
  api_key: apiKey || null,
  configuration: {
    ...formData.configuration,
    // NO api_key here - it goes to api_key_encrypted field
    last_updated: new Date().toISOString()
  }
};
```

### 2. Microsoft365AIOperationsCenter.tsx - handleSaveProvider

**Before:**
```typescript
const configData = updatedProvider.configuration || {};
const plainApiKey = configData.api_key; // Only checked config
```

**After:**
```typescript
const configData = updatedProvider.configuration || {};
// ✅ Check both locations for backwards compatibility
const plainApiKey = updatedProvider.api_key || configData.api_key;

// Clean configuration - remove API key from config JSONB field
const cleanConfig = { ...configData };
delete cleanConfig.api_key;
```

### 3. Microsoft365AIOperationsCenter.tsx - onProviderCreate

**Before:**
```typescript
const plainApiKey = providerData.configuration?.api_key || providerData.api_key;
// Config priority first
```

**After:**
```typescript
// ✅ Check direct property first (new pattern), then config (legacy)
const plainApiKey = providerData.api_key || providerData.configuration?.api_key;
```

### 4. EnhancedProviderWizard.tsx

**Already Correct:**
```typescript
const providerData = {
  // ... other fields ...
  api_key: plainApiKey || null, // ✅ Direct property
  configuration: {
    // ... configuration without api_key ...
    // NOTE: No api_key here - handled by database-level encryption
  }
};
```

## Database Schema

### ai_providers_unified Table

```sql
CREATE TABLE ai_providers_unified (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_endpoint TEXT,
  api_key_encrypted TEXT,  -- Stores encrypted API key
  config JSONB,             -- Clean configuration, NO API keys
  -- ... other fields ...
);
```

### Encryption Trigger

```sql
CREATE TRIGGER trigger_auto_encrypt_ai_provider_keys
  BEFORE INSERT OR UPDATE ON ai_providers_unified
  FOR EACH ROW
  EXECUTE FUNCTION auto_encrypt_provider_api_key();
```

The trigger function:
- Detects plain text API keys in `api_key_encrypted` field
- Encrypts them using AES-256 with pgcrypto
- Stores encrypted value back to `api_key_encrypted`

### Decryption View

```sql
CREATE VIEW ai_providers_with_keys AS
SELECT 
  *,
  -- Decrypt api_key_encrypted and expose as api_key
  pgp_sym_decrypt(
    api_key_encrypted::bytea,
    current_setting('app.encryption_key')
  ) AS api_key
FROM ai_providers_unified;
```

## Benefits

✅ **Persistence**: API keys survive logout/login cycles
✅ **Security**: Automatic AES-256 encryption at database level
✅ **Clean Architecture**: Separation of sensitive and non-sensitive data
✅ **Transparency**: Encryption/decryption happens automatically
✅ **No Dual Encryption**: Single encryption layer in database
✅ **Backwards Compatibility**: Handles both old and new patterns during transition

## Migration Path

For existing providers with API keys in the `config` field:

1. The parent handlers now extract from both locations:
   ```typescript
   const plainApiKey = provider.api_key || config.api_key;
   ```

2. When saved, API key is:
   - Stored in `api_key_encrypted` field
   - Removed from `config` JSONB field
   ```typescript
   const cleanConfig = { ...config };
   delete cleanConfig.api_key;
   ```

3. On next load:
   - View returns decrypted `api_key` from database
   - Modal receives clean configuration
   - No more old encrypted values interfere

## Testing Procedure

1. **Enter Working API Key**: `xai-...w82c`
2. **Test Connection**: Should succeed (e.g., 1451ms)
3. **Save Configuration**: Click save
4. **Close Modal**: Exit the configuration dialog
5. **Reopen Modal**: Open configuration again
6. **Verify**: Should see `xai-...w82c`, NOT `Icyh...yPX4`
7. **Test Again**: Connection should still succeed

## Debug Logging

All operations include comprehensive debug logging:

```typescript
debugConsole.info('PROVIDER_SAVE', 'Using unified database-level encryption approach', {
  has_api_key: !!plainApiKey,
  api_key_source: updatedProvider.api_key ? 'direct_property' : 'config_field_legacy',
  config_has_no_sensitive_data: !cleanConfig.api_key,
  approach: 'database_level_encryption',
  systematic_fix_applied: true
});
```

## Related Documentation

- `UNIFIED_DATABASE_ENCRYPTION_IMPLEMENTATION.md` - Complete encryption architecture
- Database migration files in `supabase/migrations/`
- Encryption utilities in `src/utils/encryption.ts`

## Resolution Status

✅ **RESOLVED** - The systematic fix has been applied to all relevant components:
- ProviderConfigurationModal.tsx
- Microsoft365AIOperationsCenter.tsx (handleSaveProvider)
- Microsoft365AIOperationsCenter.tsx (onProviderCreate)
- EnhancedProviderWizard.tsx (already correct)

API keys are now properly persisted using database-level encryption with no dual storage issues.
