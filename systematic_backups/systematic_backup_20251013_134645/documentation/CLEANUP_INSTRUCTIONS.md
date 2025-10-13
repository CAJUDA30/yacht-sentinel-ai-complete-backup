# API Key Cleanup Instructions

## Problem

Your Grok provider was created **before** the systematic fix was applied. It has the old encrypted API key stored in the `config` field, which is interfering with the new unified database-level encryption system.

**Symptoms:**
- You enter working key: `xai-...w82c`
- After reload, wrong key appears: `Icyh...yPX4`
- Connection test fails with "Incorrect API key provided"

## Why This Happens

The old encrypted value `Icyh...yPX4` is still in the `config.api_key` field. When the application loads the provider, it's getting confused between:
- The properly decrypted value from `api_key` field (from database view)
- The old encrypted value from `config.api_key` field (legacy data)

## Solution Options

### Option 1: Quick Fix - Edit and Re-save the Provider (RECOMMENDED)

1. Open your Grok provider configuration modal
2. Enter your correct API key: `xai-...w82c`
3. Click "Save"
4. The new save handler will:
   - Extract the API key
   - Store it in `api_key_encrypted` field
   - **Clean the config field** (remove old encrypted value)
5. Close and reopen the modal
6. You should now see your correct key!

### Option 2: Run Cleanup Utility (For All Providers)

Open your browser's developer console and run:

```javascript
// Import the cleanup utility
const { cleanAllProviderApiKeys } = await import('/src/utils/cleanProviderApiKeys.ts');

// Run cleanup on all providers
const result = await cleanAllProviderApiKeys();

// Check the results
console.log('Cleanup Results:', result);
console.log('Providers cleaned:', result.providersCleaned);
console.log('Details:', result.details);
```

This will:
- Check ALL providers in your system
- Remove any `api_key` fields from `config` objects
- Keep API keys only in `api_key_encrypted` field
- Show you a detailed report

### Option 3: Clean Specific Provider

If you only want to clean the Grok provider:

```javascript
// Import the cleanup utility
const { cleanProviderApiKey } = await import('/src/utils/cleanProviderApiKeys.ts');

// Get your provider ID (from the Grok provider card)
const grokProviderId = 'your-provider-id-here';

// Clean just this provider
const result = await cleanProviderApiKey(grokProviderId);

// Check result
console.log('Cleanup Result:', result);
```

### Option 4: Verify Provider Status

To check if a provider is clean:

```javascript
const { verifyProviderApiKey } = await import('/src/utils/cleanProviderApiKeys.ts');

const verification = await verifyProviderApiKey('your-provider-id');

console.log('Is Clean:', verification.isClean);
console.log('Has API key in config:', verification.hasApiKeyInConfig);
console.log('Details:', verification.details);
```

## What Gets Cleaned

The cleanup process:
- ✅ Removes `api_key` from `config` JSONB field
- ✅ Keeps `api_key_encrypted` field intact (your actual key)
- ✅ Preserves all other configuration data
- ✅ Updates `updated_at` timestamp

**Before:**
```json
{
  "config": {
    "api_key": "Icyh...yPX4",  // ❌ Old encrypted value
    "selected_models": [...],
    "rate_limit": 10000
  },
  "api_key_encrypted": "[ENCRYPTED xai-...w82c]"  // ✅ Your actual key
}
```

**After:**
```json
{
  "config": {
    // ✅ No api_key here!
    "selected_models": [...],
    "rate_limit": 10000
  },
  "api_key_encrypted": "[ENCRYPTED xai-...w82c]"  // ✅ Your actual key
}
```

## Verification

After cleanup, verify it worked:

1. Refresh the providers list
2. Open Grok provider configuration
3. You should see: `xai-...w82c` (your correct key!)
4. Test connection - should succeed ✅

## Why Option 1 is Recommended

The "Edit and Re-save" approach is best because:
- ✅ Uses the same code path as normal saves
- ✅ Validates the API key works
- ✅ Tests the connection
- ✅ Ensures the systematic fix is working correctly
- ✅ No console commands needed

## Future Prevention

All NEW providers created after the systematic fix will:
- ✅ Store API keys ONLY in `api_key_encrypted` field
- ✅ Keep `config` field clean (no API keys)
- ✅ Never have this problem!

The fix ensures this issue won't happen again for:
- New provider creation (EnhancedProviderWizard)
- Provider editing (ProviderConfigurationModal)
- Provider updates (handleSaveProvider)

## Need Help?

If the cleanup doesn't work:
1. Check browser console for detailed logs
2. Look for errors with `[PROVIDER_CREATE]` or `[PROVIDER_SAVE]` tags
3. Verify the database view exists: `ai_providers_with_keys`
4. Check the encryption trigger: `trigger_auto_encrypt_ai_provider_keys`

The systematic fix includes comprehensive debugging that will show you exactly what's happening at each step.
