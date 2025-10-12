# Google Gemini API Key Decryption Fix

## Problem Description

Google Gemini providers are experiencing systematic API key decryption failures with multiple error patterns:

```
[22:19:06] ERROR: Model embedding-gecko-001: API key decryption failed
[22:19:06] ERROR: Model embedding-gecko-001: Test error
{
  "error": "API key not available or could not be decrypted",
  "stack": "Error: API key not available or could not be decrypted\n    at testIndividualModel"
}

[22:19:31] ERROR: API key decryption failed
{
  "hasStoredKey": true
}

[22:19:31] ERROR: Health check error
{
  "error": "API key could not be decrypted",
  "stack": "Error: API key could not be decrypted\n    at checkProviderHealth"
}
```

### Root Cause Analysis

The error logs show that:
1. ✅ **API keys exist in database** (`hasStoredKey: true`)
2. ❌ **Decryption process fails** - `getProviderApiKey()` returns empty string
3. ❌ **Multiple failure points** - Both model testing and health checks fail
4. 🤔 **Google Gemini specific** - Other providers may work fine

## Solution Applied

### ✅ **Enhanced API Key Retrieval Logic**

**Problem**: The `getProviderApiKey()` function was only checking `provider.configuration.api_key`, but providers might store API keys in different locations (`provider.config.api_key`, `provider.api_key`).

**Fix**: Enhanced the function to check multiple possible API key locations with fallback priority:

```typescript
// Priority 1: Check configuration.api_key (primary location)
if (provider?.configuration?.api_key) {
  apiKey = provider.configuration.api_key;
  keySource = 'configuration.api_key';
}
// Priority 2: Check config.api_key (backup location) 
else if (provider?.config?.api_key) {
  apiKey = provider.config.api_key;
  keySource = 'config.api_key';
}
// Priority 3: Check root level api_key (legacy support)
else if (provider?.api_key) {
  apiKey = provider.api_key;
  keySource = 'provider.api_key';
}
```

### ✅ **Enhanced API Key Decryption Logic**

**Problem**: Google Gemini API keys start with "AIza" and are 39 characters long, but the decryption logic might not be handling them properly.

**Fix**: Enhanced `decryptApiKey()` with:
- ✅ **Google Gemini API key validation** - Special length check for "AIza" keys (should be 39 chars)
- ✅ **Better plain text detection** - Array-based prefix matching for cleaner code
- ✅ **Enhanced base64 validation** - More robust encrypted data detection
- ✅ **Comprehensive debugging** - Detailed logging for troubleshooting

```typescript
// Enhanced Google Gemini API key handling
const knownPrefixes = ['xai-', 'sk-', 'claude-', 'glpat-', 'AIza'];
const matchedPrefix = knownPrefixes.find(prefix => encryptedData.startsWith(prefix));

if (matchedPrefix) {
  // Special validation for Google Gemini API keys
  if (matchedPrefix === 'AIza' && encryptedData.length !== 39) {
    console.warn('⚠️ Google API key length seems incorrect. Expected 39, got:', encryptedData.length);
  }
  return encryptedData;
}
```

### ✅ **Comprehensive Debug Logging**

**Problem**: Hard to diagnose where exactly the API key decryption fails.

**Fix**: Added detailed debugging throughout the process:

1. **Provider structure analysis** - Shows which fields exist and where API keys are stored
2. **API key location tracking** - Reports which location the API key was found in
3. **Decryption step-by-step logging** - Tracks each stage of the decryption process
4. **Error context** - Detailed error information when decryption fails

### ✅ **Enhanced Error Handling**

**Problem**: Generic error messages don't help identify the specific issue.

**Fix**: Added context-rich error reporting:

```typescript
console.error('❌ getProviderApiKey: No API key found in any location:', {
  checkedLocations: ['configuration.api_key', 'config.api_key', 'provider.api_key'],
  hasProvider: !!provider,
  providerStructure: provider ? Object.keys(provider) : []
});
```

## Files Modified

### 1. `/src/utils/encryption.ts`
- **Enhanced `getProviderApiKey()`** - Multi-location API key retrieval with fallback
- **Enhanced `decryptApiKey()`** - Better Google Gemini support and debugging
- **Added comprehensive logging** - Step-by-step debugging information

### 2. `/src/components/admin/Microsoft365AIOperationsCenter.tsx`
- **Enhanced `testIndividualModel()`** - Detailed provider structure debugging
- **Enhanced `checkProviderHealth()`** - API key location analysis and error context

## Expected Results

### ✅ **Successful API Key Detection**
```
🔍 getProviderApiKey DEBUG: {
  hasProvider: true,
  hasConfiguration: true,
  hasConfig: true,
  hasConfigApiKey: true,
  hasConfigurationApiKey: false,
  providerType: "google",
  apiKeyInConfig: true,
  apiKeyInConfiguration: false
}

🔐 Found API key in: config.api_key {
  apiKeyType: "string",
  apiKeyLength: 39,
  startsWithAIza: true,
  lookLikeBase64: false
}

✅ decryptApiKey: Detected plain text API key with prefix: AIza

✅ API key decryption result: {
  success: true,
  decryptedLength: 39,
  decryptedPrefix: "AIzaSyBZ_J...",
  sourceLocation: "config.api_key"
}
```

### ✅ **Successful Model Testing**
```
[22:19:06] INFO: Testing model: gemini-2.5-flash
[22:19:06] SUCCESS: Model gemini-2.5-flash: Test successful (850ms)
[22:19:06] INFO: Testing model: gemini-1.5-pro  
[22:19:06] SUCCESS: Model gemini-1.5-pro: Test successful (920ms)
```

### ✅ **Successful Health Checks**
```
[22:19:31] INFO: Starting health check
[22:19:31] SUCCESS: API key decrypted successfully
[22:19:31] SUCCESS: Connection successful (1200ms)
```

## Testing Strategy

### Manual Test Steps:
1. **Open AI Operations Center** - Navigate to provider management
2. **Check Google Gemini provider** - Look for existing Gemini providers
3. **Trigger model testing** - Click test button on Gemini models
4. **Check debug console** - Open browser DevTools → Console
5. **Verify debug output** - Look for detailed API key retrieval logs
6. **Test health check** - Manual health check on Gemini provider

### Expected Debug Output:
```
🔍 getProviderApiKey DEBUG: { provider structure info }
🔐 Found API key in: [location]
✅ decryptApiKey: Detected plain text API key with prefix: AIza
✅ API key decryption result: { success details }
```

## Fallback Strategy

If the enhanced logic still fails, the debug output will show:
- **Exact provider structure** - What fields exist
- **API key locations** - Where keys are stored (or missing)
- **Decryption attempts** - What failed and why
- **Error context** - Detailed failure information

This will enable targeted fixes for any remaining edge cases.

## Impact Assessment

### ✅ **For Google Gemini Users**
- **Immediate fix** - API key decryption should work consistently
- **Better error messages** - Clear diagnosis when issues occur
- **Model testing restored** - Can test individual Gemini models
- **Health checks working** - Provider status accurate

### ✅ **For System Reliability**
- **Multi-location support** - Works regardless of API key storage location
- **Backward compatibility** - Supports legacy storage patterns
- **Enhanced debugging** - Easier troubleshooting for future issues
- **Provider agnostic** - Benefits all provider types, not just Google Gemini

### ✅ **For Development/Support**
- **Clear diagnostics** - Debug logs show exactly what's happening
- **Systematic approach** - Consistent error handling across all functions
- **Easy identification** - Can quickly see where API keys are stored and why decryption fails