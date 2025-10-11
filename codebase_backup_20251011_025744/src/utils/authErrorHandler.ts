/**
 * Authentication Error Handler
 * Handles common authentication issues and browser extension conflicts
 */

import { supabase, clearInvalidAuthTokens } from '@/integrations/supabase/client';

export class AuthErrorHandler {
  private static retryCount = 0;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  
  /**
   * Handle authentication errors and clear invalid tokens
   */
  static async handleAuthError(error: any): Promise<void> {
    console.log('[AuthErrorHandler] Handling auth error:', error);
    
    // Check for invalid refresh token errors
    if (
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('Refresh Token Not Found') ||
      error?.message?.includes('session_not_found') ||
      error?.status === 400
    ) {
      console.log('[AuthErrorHandler] Invalid session detected, clearing tokens');
      await clearInvalidAuthTokens();
      this.retryCount = 0; // Reset retry count
      return;
    }
    
    // Handle JWT expired errors with retry logic
    if (error?.message?.includes('JWT expired')) {
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`[AuthErrorHandler] JWT expired, retrying (${this.retryCount}/${this.MAX_RETRIES})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        
        try {
          // Try to refresh the session
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            throw refreshError;
          }
          console.log('[AuthErrorHandler] Session refreshed successfully');
          this.retryCount = 0;
          return;
        } catch (refreshError) {
          console.log('[AuthErrorHandler] Session refresh failed, signing out');
          await supabase.auth.signOut();
          this.retryCount = 0;
          return;
        }
      } else {
        console.log('[AuthErrorHandler] Max retries exceeded, signing out');
        await supabase.auth.signOut();
        this.retryCount = 0;
        return;
      }
    }
    
    // Handle 403/permission errors gracefully
    if (error?.status === 403 || error?.message?.includes('permission denied')) {
      console.warn('[AuthErrorHandler] Permission denied - may be due to RLS policies');
      // Don't sign out for permission errors, just log
      return;
    }
  }
  
  /**
   * Suppress browser extension errors that don't affect app functionality
   */
  static suppressExtensionErrors(): void {
    // Override console.error to filter out known extension errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || '';
      
      // Filter out TronLink and other wallet extension errors
      if (
        message.includes('tronlinkParams') ||
        message.includes('injected.js') ||
        message.includes('Cannot read properties of undefined') ||
        message.includes('MetaMask') ||
        message.includes('wallet') ||
        message.includes('Extension') ||
        message.includes('chrome-extension') ||
        message.includes('Failed to fetch') && args[1]?.includes('chrome-extension')
      ) {
        return; // Suppress these errors
      }
      
      // Filter out common Supabase realtime errors that are non-critical
      if (
        message.includes('realtime') ||
        message.includes('websocket') ||
        message.includes('Failed to connect to realtime')
      ) {
        // Log as warning instead of error
        console.warn('[Realtime]', ...args);
        return;
      }
      
      // Call original console.error for other errors
      originalError.apply(console, args);
    };
  }
  
  /**
   * Initialize error handling on app startup
   */
  static initialize(): void {
    console.log('[AuthErrorHandler] Initializing error handling');
    
    // Suppress extension errors
    this.suppressExtensionErrors();
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('tronlinkParams')) {
        event.preventDefault(); // Prevent the error from being logged
        return;
      }
      
      // Handle auth-related promise rejections
      if (
        event.reason?.message?.includes('Invalid Refresh Token') ||
        event.reason?.message?.includes('Refresh Token Not Found')
      ) {
        event.preventDefault();
        this.handleAuthError(event.reason);
        return;
      }
    });
    
    // Monitor auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        console.log('[AuthErrorHandler] User signed out, clearing any remaining tokens');
        await clearInvalidAuthTokens();
      }
    });
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  AuthErrorHandler.initialize();
}