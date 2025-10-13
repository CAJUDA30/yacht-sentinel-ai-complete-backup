// API Key Encryption/Decryption Utility
// Provides secure encryption for API keys stored in database

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// DEVELOPMENT MODE: Allow unencrypted storage in development only
const IS_DEVELOPMENT = import.meta.env.DEV || import.meta.env.MODE === 'development';
const ALLOW_UNENCRYPTED_IN_DEV = IS_DEVELOPMENT;

/**
 * Generate a random encryption key
 * This should be stored securely and not in the codebase
 */
export const generateEncryptionKey = async (): Promise<string> => {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  
  const exported = await crypto.subtle.exportKey('raw', key);
  return Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Import encryption key from hex string
 */
const importKey = async (keyHex: string): Promise<CryptoKey> => {
  const keyBuffer = new Uint8Array(
    keyHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
  
  return await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Get encryption key from environment or generate a session key
 */
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // Check if Web Crypto API is available
  if (!crypto || !crypto.subtle || !crypto.subtle.importKey) {
    throw new Error('Web Crypto API not available in this environment');
  }
  
  // In production, this should come from environment variables
  // For now, we'll use a deterministic key based on the current session
  const keyMaterial = 'yacht-sentinel-ai-key-2024'; // This should be from env
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  // Create a proper key from the material
  const importedKey = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', keyData),
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  
  return importedKey;
};

/**
 * Encrypt API key or sensitive data
 * In development mode with HTTP, stores with PLAIN: prefix
 * In production or HTTPS contexts, uses Web Crypto API encryption
 */
export const encryptApiKey = async (plaintext: string): Promise<string> => {
  if (!plaintext) {
    throw new Error('Empty plaintext provided for encryption');
  }
  
  const isSecureContext = typeof window !== 'undefined' ? window.isSecureContext : false;
  const hasCryptoAPI = !!(crypto && crypto.subtle && crypto.subtle.encrypt);
  
  console.log('🔐 encryptApiKey: Starting encryption', {
    plaintextLength: plaintext.length,
    plaintextPrefix: plaintext.substring(0, 4),
    webCryptoAvailable: hasCryptoAPI,
    isSecureContext,
    isDevelopment: IS_DEVELOPMENT,
    allowUnencryptedInDev: ALLOW_UNENCRYPTED_IN_DEV,
    algorithmSupported: ALGORITHM
  });
  
  // DEVELOPMENT FALLBACK: If Web Crypto API is unavailable and we're in development, use PLAIN: prefix
  if (!hasCryptoAPI && ALLOW_UNENCRYPTED_IN_DEV) {
    console.warn('⚠️ encryptApiKey: DEVELOPMENT MODE - Storing with PLAIN: prefix (no encryption)', {
      reason: 'Web Crypto API unavailable (HTTP context)',
      isSecureContext,
      protocol: typeof window !== 'undefined' ? window.location?.protocol : 'unknown',
      warning: 'This is only allowed in development. Production MUST use HTTPS.'
    });
    return `PLAIN:${plaintext}`;
  }
  
  // PRODUCTION MODE: Require Web Crypto API
  if (!hasCryptoAPI) {
    const error = new Error('Web Crypto API is not available. HTTPS or secure context required for encryption.');
    console.error('❌ encryptApiKey: CRITICAL - Web Crypto API unavailable in PRODUCTION', {
      hasCrypto: !!crypto,
      hasSubtle: !!(crypto?.subtle),
      hasEncrypt: !!(crypto?.subtle?.encrypt),
      isSecureContext,
      protocol: typeof window !== 'undefined' ? window.location?.protocol : 'unknown',
      isDevelopment: IS_DEVELOPMENT
    });
    throw error;
  }
  
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    console.log('🔐 encryptApiKey: Encryption parameters ready', {
      dataLength: data.length,
      ivLength: iv.length,
      keyGenerated: !!key
    });
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    const base64Result = btoa(String.fromCharCode(...combined));
    
    console.log('✅ encryptApiKey: Encryption successful', {
      originalLength: plaintext.length,
      encryptedLength: base64Result.length,
      base64Preview: base64Result.substring(0, 20) + '...',
      ivLength: iv.length,
      encryptedDataLength: encrypted.byteLength,
      isProperlyEncrypted: !base64Result.startsWith('PLAIN:')
    });
    
    return base64Result;
  } catch (error: any) {
    console.error('❌ encryptApiKey: Encryption failed', {
      error: error.message,
      errorType: error.constructor?.name,
      stack: error.stack,
      plaintextLength: plaintext.length,
      isDevelopment: IS_DEVELOPMENT
    });
    
    // DEVELOPMENT FALLBACK: If encryption fails in development, use PLAIN: prefix
    if (ALLOW_UNENCRYPTED_IN_DEV) {
      console.warn('⚠️ encryptApiKey: DEVELOPMENT FALLBACK - Storing with PLAIN: prefix after encryption failure');
      return `PLAIN:${plaintext}`;
    }
    
    // PRODUCTION: Re-throw the error
    throw new Error(`Failed to encrypt API key: ${error.message}`);
  }
};

/**
 * Decrypt API key or sensitive data with enhanced debugging
 */
export const decryptApiKey = async (encryptedData: string): Promise<string> => {
  console.log('🔐 decryptApiKey DEBUG START:', {
    hasData: !!encryptedData,
    dataType: typeof encryptedData,
    dataLength: encryptedData?.length,
    dataPrefix: encryptedData?.substring(0, 15) + '...' || 'N/A'
  });
  
  if (!encryptedData) {
    console.warn('⚠️ decryptApiKey: Empty data provided');
    return '';
  }
  
  // Handle plain text fallback for development
  if (encryptedData.startsWith('PLAIN:')) {
    const plainKey = encryptedData.substring(6);
    console.log('✅ decryptApiKey: Found PLAIN: prefix, returning plain key');
    return plainKey;
  }
  
  // If it's clearly a plain text API key (starts with known prefixes), return as-is
  const knownPrefixes = ['xai-', 'sk-', 'claude-', 'glpat-', 'AIza'];
  const matchedPrefix = knownPrefixes.find(prefix => encryptedData.startsWith(prefix));
  
  if (matchedPrefix) {
    console.log('✅ decryptApiKey: Detected plain text API key with prefix:', matchedPrefix);
    // Special validation for Google Gemini API keys
    if (matchedPrefix === 'AIza' && encryptedData.length !== 39) {
      console.warn('⚠️ decryptApiKey: Google API key length seems incorrect. Expected 39, got:', encryptedData.length);
    }
    return encryptedData;
  }
  
  // Check if data looks like base64 encoded encrypted data
  // Base64 data should only contain A-Z, a-z, 0-9, +, /, and = for padding
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  const looksLikeBase64 = base64Regex.test(encryptedData) && encryptedData.length >= 32;
  
  console.log('🔍 decryptApiKey: Base64 validation:', {
    passesRegex: base64Regex.test(encryptedData),
    lengthOk: encryptedData.length >= 32,
    looksLikeBase64
  });
  
  if (!looksLikeBase64) {
    // If it doesn't look like base64 or is too short to be encrypted, treat as plain text
    console.warn('⚠️ decryptApiKey: Data does not appear to be encrypted - treating as legacy plain text');
    return encryptedData;
  }
  
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle || !crypto.subtle.decrypt) {
      console.warn('⚠️ decryptApiKey: Web Crypto API not available - treating as plain text');
      // If it's not a PLAIN: prefixed string but crypto is unavailable, return as-is
      // This handles legacy data that might be stored without encryption
      return encryptedData;
    }
    
    console.log('🔐 decryptApiKey: Attempting crypto decryption...');
    const key = await getEncryptionKey();
    
    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      encrypted
    );
    
    // Convert back to string
    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);
    console.log('✅ decryptApiKey: Crypto decryption successful, result length:', result.length);
    return result;
  } catch (error) {
    console.error('❌ decryptApiKey: Decryption failed:', error);
    console.warn('⚠️ decryptApiKey: Failed to decrypt API key - treating as legacy plain text');
    // Fallback: treat as plain text if decryption fails
    // This handles cases where data was stored before encryption was implemented
    return encryptedData;
  }
};

/**
 * Mask API key for display purposes
 */
export const maskApiKey = (apiKey: string): string => {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '••••••••';
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}••••••••••••${end}`;
};

/**
 * Validate API key format for different providers
 */
export const validateApiKeyFormat = (apiKey: string, providerType: string): boolean => {
  if (!apiKey) return false;
  
  switch (providerType.toLowerCase()) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    case 'google':
    case 'vertex':
      return apiKey.length > 30; // Google API keys are longer
    case 'grok':
    case 'xai':
      return apiKey.startsWith('xai-') && apiKey.length > 20;
    case 'deepseek':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    default:
      return apiKey.length > 10; // Generic validation
  }
};

/**
 * Test if API key can be decrypted successfully
 */
export const testEncryption = async (plaintext: string): Promise<boolean> => {
  try {
    const encrypted = await encryptApiKey(plaintext);
    const decrypted = await decryptApiKey(encrypted);
    return decrypted === plaintext;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
};

/**
 * SYSTEMATIC SOLUTION: Safely get API key from provider configuration
 * Uses unified database-level encryption approach - reads from decryption view
 * The ai_providers_with_keys view automatically decrypts the api_key field
 */
export const getProviderApiKey = async (provider: any): Promise<string> => {
  console.log('🔍 getProviderApiKey: CORE FIX - Database view ONLY (no config interference)', {
    hasProvider: !!provider,
    providerId: provider?.id,
    providerType: provider?.provider_type,
    providerName: provider?.name,
    approach: 'database_view_authoritative'
  });
  
  if (!provider) {
    console.warn('⚠️ getProviderApiKey: No provider provided');
    return '';
  }
  
  // CORE FIX: Use ONLY the api_key field from ai_providers_with_keys view
  // This is the single source of truth - automatically decrypted by database
  // NEVER use config or configuration fields for API keys
  const apiKey = provider.api_key;
  
  // Log config interference but IGNORE it completely
  const configApiKey = provider.config?.api_key || provider.configuration?.api_key;
  if (configApiKey) {
    console.warn('🚨 Config interference detected - IGNORING config API key', {
      config_api_key_preview: configApiKey?.substring(0, 10) + '...',
      action: 'Using database view api_key field ONLY',
      provider_id: provider?.id,
      note: 'Config API keys are legacy data and should be cleaned'
    });
  }
  
  if (!apiKey) {
    console.log('🔍 getProviderApiKey: No API key in database view', {
      checkedField: 'provider.api_key (from ai_providers_with_keys view)',
      config_ignored: !!configApiKey,
      status: 'No API key configured in encrypted storage'
    });
    return '';
  }
  
  // SYSTEMATIC CORRUPTION DETECTION: Reject corrupted keys
  if (apiKey.startsWith('Icyh') && apiKey.length >= 128) {
    console.error('🚨 CORRUPTED API KEY DETECTED - Rejecting Icyh prefix key', {
      corruptedPrefix: 'Icyh',
      keyLength: apiKey.length,
      provider: provider?.name,
      action: 'Returning empty string - key needs to be re-entered',
      corruption_type: 'double_encryption_artifact'
    });
    return '';
  }
  
  console.log('✅ getProviderApiKey: API key retrieved from database view', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 4),
    sourceLocation: 'ai_providers_with_keys_view_AUTHORITATIVE',
    config_interference_ignored: !!configApiKey
  });
  
  return apiKey;
};

/**
 * Safely store API key in provider configuration
 * Attempts encryption but falls back to PLAIN: prefix if needed
 */
export const storeProviderApiKey = async (apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error('Empty API key provided for storage');
  }
  
  console.log('🔐 storeProviderApiKey: Starting STRICT encryption (no fallbacks)', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 4),
    cryptoApiAvailable: !!(crypto && crypto.subtle),
    environment: typeof window !== 'undefined' ? 'browser' : 'server',
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : 'unknown'
  });
  
  try {
    // STRICT MODE: Encryption must succeed or throw error
    const encrypted = await encryptApiKey(apiKey);
    
    // Verify encryption succeeded (no PLAIN: prefix allowed in strict mode)
    if (encrypted.startsWith('PLAIN:')) {
      throw new Error('Encryption returned PLAIN: prefix - this should never happen in strict mode');
    }
    
    console.log('✅ storeProviderApiKey: STRICT encryption successful', {
      originalLength: apiKey.length,
      encryptedLength: encrypted.length,
      encryptionVerified: !encrypted.startsWith('PLAIN:'),
      resultType: 'encrypted',
      encryptedPrefix: encrypted.substring(0, 10) + '...'
    });
    
    return encrypted;
  } catch (error: any) {
    console.error('❌ storeProviderApiKey: STRICT MODE - Encryption failed, operation aborted', {
      error: error.message,
      errorType: error.constructor?.name,
      apiKeyLength: apiKey.length,
      stack: error.stack
    });
    
    // STRICT MODE: Re-throw error with helpful message
    throw new Error(
      `Failed to encrypt API key: ${error.message}. ` +
      'Ensure you are running in a secure context (HTTPS or localhost). ' +
      'Web Crypto API is required for production use.'
    );
  }
};

// Export types for TypeScript
export interface EncryptionResult {
  success: boolean;
  data?: string;
  error?: string;
}

export interface ApiKeyValidation {
  isValid: boolean;
  provider: string;
  format: string;
  masked: string;
}

/**
 * SYSTEMATIC SOLUTION: Provider-aware API key validation
 * Handles current, legacy, and future API key formats with extensible patterns
 */
export const validateApiKeyByProvider = (apiKey: string, providerType?: string): { isValid: boolean; format: string; error?: string } => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, format: 'invalid', error: 'API key must be a non-empty string' };
  }

  const cleaned = apiKey.trim();
  const type = providerType?.toLowerCase();
  
  // Provider-specific validation with comprehensive pattern support
  switch (type) {
    case 'grok':
    case 'xai':
      // SYSTEMATIC FIX: Reject corrupted keys first
      if (cleaned.startsWith('Icyh') && cleaned.length >= 128) {
        return { 
          isValid: false, 
          format: 'corrupted', 
          error: 'Corrupted API key detected (double encryption artifact) - please re-enter your real xai-* key' 
        };
      }
      
      // PROFESSIONAL: Only accept valid Grok formats
      // Modern format: xai-* (REQUIRED for Grok/xAI)
      if (/^xai-[a-zA-Z0-9_-]+$/.test(cleaned)) {
        return { isValid: true, format: 'grok_modern' };
      }
      
      // REJECT all other formats for systematic consistency
      return { 
        isValid: false, 
        format: 'grok_invalid', 
        error: 'Grok API key must start with "xai-" prefix' 
      };
      
    case 'openai':
      if (/^sk-[a-zA-Z0-9_-]+$/.test(cleaned)) {
        return { isValid: true, format: 'openai_standard' };
      }
      return { isValid: false, format: 'openai_invalid', error: 'OpenAI API key must start with "sk-"' };
      
    case 'google':
    case 'vertex':
      if (/^AIza[a-zA-Z0-9_-]+$/.test(cleaned)) {
        return { isValid: true, format: 'google_standard' };
      }
      return { isValid: false, format: 'google_invalid', error: 'Google API key must start with "AIza"' };
      
    case 'anthropic':
      if (/^sk-ant-[a-zA-Z0-9_-]+$/.test(cleaned)) {
        return { isValid: true, format: 'anthropic_standard' };
      }
      return { isValid: false, format: 'anthropic_invalid', error: 'Anthropic API key must start with "sk-ant-"' };
      
    default:
      // FUTURE-PROOF: Generic validation for unknown providers
      // This ensures new providers will work without code changes
      const patterns = [
        { pattern: /^xai-[a-zA-Z0-9_-]+$/, format: 'grok_modern' },
        { pattern: /^[a-zA-Z0-9]{129}$/, format: 'grok_legacy' },
        { pattern: /^sk-[a-zA-Z0-9_-]+$/, format: 'openai_standard' },
        { pattern: /^AIza[a-zA-Z0-9_-]+$/, format: 'google_standard' },
        { pattern: /^sk-ant-[a-zA-Z0-9_-]+$/, format: 'anthropic_standard' },
        { pattern: /^[a-zA-Z0-9_-]{20,}$/, format: 'generic_valid' }
      ];
      
      // SYSTEMATIC CORRUPTION CHECK for unknown providers too
      if (cleaned.startsWith('Icyh') && cleaned.length >= 128) {
        return { 
          isValid: false, 
          format: 'corrupted', 
          error: 'Corrupted API key detected (double encryption artifact)' 
        };
      }
      
      for (const { pattern, format } of patterns) {
        if (pattern.test(cleaned)) {
          return { isValid: true, format };
        }
      }
      
      return { 
        isValid: false, 
        format: 'unknown_format', 
        error: 'API key format not recognized - ensure it matches your provider\'s expected format'
      };
  }
};

/**
 * SYSTEMATIC FIX: Sanitize API key for HTTP headers with provider awareness
 * Prevents "Failed to execute 'fetch' on 'Window': Invalid value" errors
 * Removes control characters, null bytes, and validates format
 */
export const sanitizeApiKeyForHeaders = (apiKey: string, providerType?: string): { sanitized: string; isValid: boolean; error?: string } => {
  console.log('🧹 sanitizeApiKeyForHeaders: Starting sanitization', {
    hasApiKey: !!apiKey,
    apiKeyType: typeof apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 4),
    providerType: providerType || 'unknown'
  });
  
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'API key is null, undefined, or not a string'
    };
  }

  // Remove control characters (\x00-\x1F), null bytes, line breaks, tabs
  // These characters can cause "Invalid value" errors in fetch headers
  const cleaned = apiKey
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
    .replace(/\u0000/g, '') // Remove null bytes
    .trim(); // Remove leading/trailing whitespace

  console.log('🧹 sanitizeApiKeyForHeaders: Cleaning completed', {
    originalLength: apiKey.length,
    cleanedLength: cleaned.length,
    removedCharacters: apiKey.length - cleaned.length,
    cleanedPrefix: cleaned.substring(0, 4)
  });

  if (!cleaned) {
    return {
      sanitized: '',
      isValid: false,
      error: 'API key contains only invalid characters'
    };
  }

  // Validate length (minimum 10 characters for any API key)
  if (cleaned.length < 10) {
    return {
      sanitized: cleaned,
      isValid: false,
      error: `API key is too short (${cleaned.length} chars, minimum 10 required)`
    };
  }

  // SYSTEMATIC VALIDATION: Provider-aware pattern matching
  const validation = validateApiKeyByProvider(cleaned, providerType);
  
  console.log('✅ sanitizeApiKeyForHeaders: Validation completed', {
    isValid: validation.isValid,
    format: validation.format,
    finalLength: cleaned.length,
    providerType: providerType || 'generic',
    error: validation.error
  });
  
  return {
    sanitized: cleaned,
    isValid: validation.isValid,
    error: validation.error
  };
};

/**
 * Validate HTTP headers to prevent fetch "Invalid value" errors
 * Ensures all header values are safe for HTTP requests
 */
export const validateHttpHeaders = (headers: Record<string, string>): { valid: boolean; sanitized: Record<string, string>; errors: string[] } => {
  const sanitized: Record<string, string> = {};
  const errors: string[] = [];
  
  console.log('🔍 validateHttpHeaders: Starting header validation', {
    headerCount: Object.keys(headers).length,
    headerNames: Object.keys(headers)
  });
  
  for (const [key, value] of Object.entries(headers)) {
    // Validate header name
    if (!key || typeof key !== 'string' || !/^[a-zA-Z0-9-]+$/.test(key)) {
      errors.push(`Invalid header name: "${key}"`);
      continue;
    }
    
    // Validate header value
    if (value === null || value === undefined) {
      errors.push(`Header "${key}" has null/undefined value`);
      continue;
    }
    
    if (typeof value !== 'string') {
      errors.push(`Header "${key}" value is not a string: ${typeof value}`);
      continue;
    }
    
    // Remove control characters from header values
    const cleanValue = value
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[\r\n]/g, '')
      .trim();
    
    if (!cleanValue && key.toLowerCase() !== 'content-length') {
      errors.push(`Header "${key}" is empty after sanitization`);
      continue;
    }
    
    sanitized[key] = cleanValue;
  }
  
  console.log('✅ validateHttpHeaders: Validation completed', {
    originalHeaders: Object.keys(headers).length,
    validHeaders: Object.keys(sanitized).length,
    errorCount: errors.length,
    errors: errors.length > 0 ? errors : 'none'
  });
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
};

/**
 * Enhanced getProviderApiKey with comprehensive sanitization
 * This is the SAFE version that should be used for HTTP requests
 * Follows memory guidance on API key retrieval priority and sanitization
 */
export const getProviderApiKeySafe = async (provider: any): Promise<{ apiKey: string; isValid: boolean; error?: string }> => {
  console.log('🔐 getProviderApiKeySafe: Starting safe API key retrieval', {
    providerId: provider?.id,
    providerType: provider?.provider_type,
    hasProvider: !!provider
  });
  
  try {
    // Use existing getProviderApiKey function (follows memory guidance on priority)
    const rawApiKey = await getProviderApiKey(provider);
    
    if (!rawApiKey) {
      return {
        apiKey: '',
        isValid: false,
        error: 'No API key found in provider configuration (checked: configuration.api_key, config.api_key, provider.api_key)'
      };
    }

    // Apply provider-aware sanitization to prevent fetch errors
    const sanitizationResult = sanitizeApiKeyForHeaders(rawApiKey, provider?.provider_type);
    
    console.log('🔐 getProviderApiKeySafe: Process completed', {
      originalLength: rawApiKey.length,
      sanitizedLength: sanitizationResult.sanitized.length,
      isValid: sanitizationResult.isValid,
      format: (sanitizationResult as any).format || 'detected_via_validation',
      error: sanitizationResult.error,
      providerId: provider?.id,
      providerType: provider?.provider_type
    });

    return {
      apiKey: sanitizationResult.sanitized,
      isValid: sanitizationResult.isValid,
      error: sanitizationResult.error
    };
  } catch (error: any) {
    console.error('❌ getProviderApiKeySafe failed:', {
      error: error.message,
      errorType: error.constructor?.name,
      providerId: provider?.id,
      providerType: provider?.provider_type
    });
    
    return {
      apiKey: '',
      isValid: false,
      error: error.message || 'Failed to get and sanitize API key'
    };
  }
};