/**
 * Automatic Cache Invalidation System
 * Clears localStorage/sessionStorage when app version changes
 * This ensures users always see the latest code after updates
 */

import packageJson from '../../package.json';

const STORAGE_VERSION_KEY = 'yacht-sentinel-app-version';
const CURRENT_VERSION = packageJson.version;

/**
 * Check if cache needs to be invalidated
 * Returns true if storage was cleared
 */
export function checkAndInvalidateCache(): boolean {
  try {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    
    // First run or version changed - clear everything
    if (!storedVersion || storedVersion !== CURRENT_VERSION) {
      console.log('%c[Yacht Sentinel] Version Update Detected', 'color: #3b82f6; font-weight: bold; font-size: 14px');
      console.log('[Cache] Version changed:', {
        from: storedVersion || 'none (first run)',
        to: CURRENT_VERSION,
        action: 'clearing storage'
      });
      
      // Clear all storage EXCEPT the version key
      const keysToPreserve = [STORAGE_VERSION_KEY];
      
      // Clear localStorage (except version)
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (!keysToPreserve.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage completely
      sessionStorage.clear();
      
      // Set new version
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      
      console.log('%c[Cache] ✅ Storage Cleared', 'color: #10b981; font-weight: bold');
      console.log('[Cache] New version:', CURRENT_VERSION);
      
      return true;
    }
    
    // Same version - no action needed
    console.log('[Cache] App version:', CURRENT_VERSION, '- No cache clear needed');
    return false;
    
  } catch (error) {
    console.error('[Cache] Error checking version:', error);
    return false;
  }
}

/**
 * Force clear all cache (for development)
 */
export function forceClearCache(): void {
  localStorage.clear();
  sessionStorage.clear();
  console.log('[Cache] ✅ Forced cache clear completed');
}

/**
 * Get current app version
 */
export function getAppVersion(): string {
  return CURRENT_VERSION;
}

/**
 * Get stored version
 */
export function getStoredVersion(): string | null {
  return localStorage.getItem(STORAGE_VERSION_KEY);
}
