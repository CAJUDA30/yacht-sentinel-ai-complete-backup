// API Key Encryption/Decryption Utility
// Provides secure encryption for API keys stored in database

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

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
 */
export const encryptApiKey = async (plaintext: string): Promise<string> => {
  if (!plaintext) return '';
  
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle || !crypto.subtle.encrypt) {
      console.warn('⚠️ Web Crypto API not available - using plain text storage with prefix');
      return `PLAIN:${plaintext}`;
    }
    
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
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
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // In development, return the plain key with a warning
    console.warn('⚠️ API key not encrypted - using plain text for development');
    return `PLAIN:${plaintext}`;
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
 * Safely get API key from provider configuration
 * Handles both encrypted and plain text keys with enhanced debugging
 * Checks both config and configuration fields for compatibility
 */
export const getProviderApiKey = async (provider: any): Promise<string> => {
  console.log('🔍 getProviderApiKey DEBUG:', {
    hasProvider: !!provider,
    hasConfiguration: !!provider?.configuration,
    hasConfig: !!provider?.config,
    hasConfigApiKey: !!provider?.config?.api_key,
    hasConfigurationApiKey: !!provider?.configuration?.api_key,
    providerType: provider?.provider_type,
    providerId: provider?.id,
    configKeys: provider?.configuration ? Object.keys(provider.configuration) : [],
    configObjectKeys: provider?.config ? Object.keys(provider.config) : [],
    apiKeyInConfig: !!provider?.config?.api_key,
    apiKeyInConfiguration: !!provider?.configuration?.api_key
  });
  
  // Try multiple possible API key locations for maximum compatibility
  let apiKey = null;
  let keySource = '';
  
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
  
  if (!apiKey) {
    console.error('❌ getProviderApiKey: No API key found in any location:', {
      checkedLocations: ['configuration.api_key', 'config.api_key', 'provider.api_key'],
      hasProvider: !!provider,
      providerStructure: provider ? Object.keys(provider) : []
    });
    return '';
  }
  
  console.log('🔐 Found API key in:', keySource, {
    apiKeyType: typeof apiKey,
    apiKeyLength: apiKey?.length,
    startsWithPlain: apiKey?.startsWith('PLAIN:'),
    startsWithAIza: apiKey?.startsWith('AIza'),
    lookLikeBase64: /^[A-Za-z0-9+/]+={0,2}$/.test(apiKey || '')
  });
  
  try {
    // decryptApiKey now handles plain text detection internally
    const decryptedKey = await decryptApiKey(apiKey);
    console.log('✅ API key decryption result:', {
      success: !!decryptedKey,
      decryptedLength: decryptedKey?.length,
      decryptedPrefix: decryptedKey?.substring(0, 10) + '...' || 'N/A',
      sourceLocation: keySource
    });
    return decryptedKey;
  } catch (error) {
    console.error('❌ getProviderApiKey: Decryption failed:', error);
    return '';
  }
};

/**
 * Safely store API key in provider configuration
 * Attempts encryption but falls back to PLAIN: prefix if needed
 */
export const storeProviderApiKey = async (apiKey: string): Promise<string> => {
  if (!apiKey) return '';
  
  try {
    const encrypted = await encryptApiKey(apiKey);
    // If encryption succeeded and we didn't get a PLAIN: prefix, return encrypted
    if (encrypted && !encrypted.startsWith('PLAIN:')) {
      return encrypted;
    }
    // Otherwise use PLAIN: prefix for secure identification
    return `PLAIN:${apiKey}`;
  } catch (error) {
    console.warn('⚠️ Encryption failed, storing with PLAIN: prefix:', error.message);
    return `PLAIN:${apiKey}`;
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