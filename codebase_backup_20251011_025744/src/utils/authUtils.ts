/**
 * Authentication utility functions for handling auth errors and cleanup
 * Enhanced for enterprise-grade error handling
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Clear all authentication data from localStorage
 * This resolves "Invalid Refresh Token" errors
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    // Clear Supabase auth session
    await supabase.auth.signOut({ scope: 'local' });
    
    // Clear any remaining auth-related items from localStorage
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('sb-vdjsfupbjtbkpuvwffbn')
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Auth: Successfully cleared all authentication data');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

/**
 * Handle refresh token errors gracefully with retry logic
 */
export const handleRefreshTokenError = async (): Promise<void> => {
  console.log('Auth: Handling refresh token error...');
  await clearAuthData();
  
  // Add a small delay before reload to ensure cleanup is complete
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

/**
 * Check if error is related to refresh token issues
 */
export const isRefreshTokenError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  return errorMessage.includes('Invalid Refresh Token') ||
         errorMessage.includes('Refresh Token Not Found') ||
         errorMessage.includes('refresh_token') ||
         errorMessage.includes('AuthApiError') ||
         errorMessage.includes('400') && errorMessage.includes('token') ||
         errorMessage.includes('JWT') && errorMessage.includes('invalid');
};

/**
 * Enhanced error handler for authentication errors with enterprise logging
 */
export const handleAuthError = async (error: any): Promise<void> => {
  if (isRefreshTokenError(error)) {
    console.log('Auth: Token refresh error detected, clearing auth data');
    await handleRefreshTokenError();
  } else {
    console.error('Auth error:', error);
    // Log to enterprise monitoring if available
    if (typeof window !== 'undefined' && (window as any).analyticsTracker) {
      (window as any).analyticsTracker.track('auth_error', {
        error: error.message || error.toString(),
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Enhanced session validation with enterprise checks
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError();
        return false;
      }
      throw error;
    }
    
    return !!session?.user;
  } catch (error) {
    await handleAuthError(error);
    return false;
  }
};

/**
 * Safe auth token getter with automatic error handling
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      await handleAuthError(error);
      return null;
    }
    
    return session?.access_token || null;
  } catch (error) {
    await handleAuthError(error);
    return null;
  }
};