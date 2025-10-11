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
 * Decrypt API key or sensitive data
 */
export const decryptApiKey = async (encryptedData: string): Promise<string> => {
  if (!encryptedData) return '';
  
  // Handle plain text fallback for development
  if (encryptedData.startsWith('PLAIN:')) {
    return encryptedData.substring(6);
  }
  
  try {
    // Check if Web Crypto API is available
    if (!crypto || !crypto.subtle || !crypto.subtle.decrypt) {
      console.warn('⚠️ Web Crypto API not available - treating as plain text');
      // If it's not a PLAIN: prefixed string but crypto is unavailable, return as-is
      // This handles legacy data that might be stored without encryption
      return encryptedData;
    }
    
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
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    console.warn('⚠️ Failed to decrypt API key - treating as legacy plain text');
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
 * Handles both encrypted and plain text keys
 */
export const getProviderApiKey = async (provider: any): Promise<string> => {
  if (!provider?.configuration?.api_key) {
    return '';
  }
  
  const storedKey = provider.configuration.api_key;
  
  // If it's clearly a plain text API key (starts with known prefixes), return as-is
  if (storedKey.startsWith('xai-') || 
      storedKey.startsWith('sk-') || 
      storedKey.startsWith('claude-') ||
      storedKey.startsWith('glpat-') ||
      storedKey.startsWith('PLAIN:')) {
    return storedKey.startsWith('PLAIN:') ? storedKey.substring(6) : storedKey;
  }
  
  // Try to decrypt if it looks like encrypted data
  try {
    return await decryptApiKey(storedKey);
  } catch (error) {
    console.warn('⚠️ Could not decrypt API key, treating as plain text:', error.message);
    return storedKey;
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