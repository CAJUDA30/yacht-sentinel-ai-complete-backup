# API Key Flow - Before and After Fix

## BEFORE THE FIX ❌

```
┌──────────────────────────────────────────────────────────┐
│ User enters: xai-...w82c                                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ ProviderConfigurationModal                               │
│                                                          │
│ Stores in configuration object:                         │
│   configuration: {                                       │
│     api_key: "xai-...w82c" ← WRONG! Stored in config   │
│   }                                                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ handleSaveProvider                                       │
│                                                          │
│ Extracts from config:                                    │
│   plainApiKey = config.api_key = "xai-...w82c"         │
│                                                          │
│ Tries to clean config:                                   │
│   delete cleanConfig.api_key                            │
│                                                          │
│ BUT old encrypted value "Icyh...yPX4" still in config!  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Database                                                 │
│                                                          │
│ Stores:                                                  │
│   api_key_encrypted: "xai-...w82c" (encrypted)          │
│   config: { api_key: "Icyh...yPX4" } ← OLD VALUE!      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ On Reload                                                │
│                                                          │
│ View decrypts: api_key = "xai-...w82c" (correct)       │
│ BUT Modal loads from config.api_key = "Icyh...yPX4"    │
│                                                          │
│ ❌ USER SEES WRONG KEY!                                 │
└──────────────────────────────────────────────────────────┘
```

## AFTER THE FIX ✅

```
┌──────────────────────────────────────────────────────────┐
│ User enters: xai-...w82c                                 │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ ProviderConfigurationModal                               │
│                                                          │
│ Stores as DIRECT PROPERTY:                               │
│   {                                                      │
│     api_key: "xai-...w82c", ← CORRECT! Not in config   │
│     configuration: {                                     │
│       // NO api_key here                                 │
│     }                                                    │
│   }                                                      │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ handleSaveProvider                                       │
│                                                          │
│ Extracts from BOTH sources (backwards compatible):       │
│   plainApiKey = provider.api_key || config.api_key      │
│             = "xai-...w82c"                             │
│                                                          │
│ Cleans config completely:                                │
│   cleanConfig = { ...config }                           │
│   delete cleanConfig.api_key                            │
│                                                          │
│ ✅ Config is CLEAN, no API key at all                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Database                                                 │
│                                                          │
│ Stores:                                                  │
│   api_key_encrypted: "xai-...w82c" (then encrypted)     │
│   config: { /* clean, NO api_key */ } ← CLEAN!         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Database Trigger (Automatic)                             │
│                                                          │
│ Detects plain text in api_key_encrypted                 │
│ Encrypts with AES-256:                                   │
│   "xai-...w82c" → [ENCRYPTED_BINARY]                   │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ On Reload                                                │
│                                                          │
│ View auto-decrypts:                                      │
│   [ENCRYPTED_BINARY] → api_key = "xai-...w82c"         │
│                                                          │
│ Modal receives:                                          │
│   provider.api_key = "xai-...w82c"                      │
│   config.api_key = undefined (clean!)                   │
│                                                          │
│ ✅ USER SEES CORRECT KEY: xai-...w82c                   │
└──────────────────────────────────────────────────────────┘
```

## Key Differences

| Aspect | Before ❌ | After ✅ |
|--------|-----------|----------|
| **Modal Storage** | `configuration.api_key` | `api_key` (direct property) |
| **Config Field** | Contains API key | Clean, NO API key |
| **Database Column** | `api_key_encrypted` + `config.api_key` | `api_key_encrypted` ONLY |
| **On Reload** | Loads wrong key from config | Loads correct decrypted key |
| **Encryption** | Dual (frontend + database) | Single (database only) |

## Data Flow Comparison

### Before (Dual Storage) ❌
```
Input: xai-...w82c
  ↓
Modal: configuration.api_key = "xai-...w82c"
  ↓
Database: 
  - api_key_encrypted = [ENCRYPTED: xai-...w82c]
  - config.api_key = "Icyh...yPX4" (old value!)
  ↓
Reload: Loads "Icyh...yPX4" from config ❌
```

### After (Single Storage) ✅
```
Input: xai-...w82c
  ↓
Modal: api_key = "xai-...w82c" (NOT in configuration)
  ↓
Handler: Extracts and cleans config
  ↓
Database:
  - api_key_encrypted = [ENCRYPTED: xai-...w82c]
  - config = { /* clean */ } (NO api_key)
  ↓
Reload: View decrypts → "xai-...w82c" ✅
```

## Migration Path for Legacy Data

For providers with API keys already in the config field:

```
┌──────────────────────────────────────────────────────────┐
│ Legacy Provider (has config.api_key)                     │
│                                                          │
│ config: {                                                │
│   api_key: "old_encrypted_value"                         │
│ }                                                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ First Edit After Fix                                     │
│                                                          │
│ Handler checks BOTH:                                     │
│   plainApiKey = provider.api_key || config.api_key      │
│                                                          │
│ Finds in config, extracts it                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Handler Cleans Config                                    │
│                                                          │
│ delete cleanConfig.api_key                              │
│                                                          │
│ Stores:                                                  │
│   api_key_encrypted = extracted value                    │
│   config = clean (no api_key)                           │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Next Load                                                │
│                                                          │
│ ✅ Clean config, decrypted api_key from view            │
│ ✅ No more conflicts!                                    │
└──────────────────────────────────────────────────────────┘
```

## Benefits of the Fix

1. **Single Source of Truth**
   - API key stored ONLY in `api_key_encrypted` column
   - No confusion about which value is correct

2. **Clean Configuration**
   - `config` JSONB field contains only non-sensitive data
   - No risk of exposing API keys in config exports

3. **Automatic Encryption**
   - Database trigger handles encryption transparently
   - No frontend encryption complexity

4. **Proper Decryption**
   - View automatically decrypts on every read
   - Application receives plain text for use

5. **No More Substitution**
   - User's entered key is preserved exactly
   - No mysterious key changes!

## Summary

**The Problem**: API keys stored in two places causing conflicts
**The Solution**: Store ONLY in `api_key_encrypted`, keep config clean
**The Result**: User's API keys persist correctly, no more substitution!

✅ Fixed systematically across all provider management flows
✅ Backwards compatible with legacy data
✅ Enhanced debugging and logging
✅ Complete documentation provided
