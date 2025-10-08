/**
 * Enhanced Supabase Error Handler
 * Handles authentication and connection issues systematically
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

export class SupabaseErrorHandler {
  private static instance: SupabaseErrorHandler;
  private errorCount = 0;
  private lastErrorTime = 0;

  static getInstance(): SupabaseErrorHandler {
    if (!SupabaseErrorHandler.instance) {
      SupabaseErrorHandler.instance = new SupabaseErrorHandler();
    }
    return SupabaseErrorHandler.instance;
  }

  handleAuthError(error: SupabaseError): void {
    console.error('[SupabaseErrorHandler] Auth error:', error);

    const now = Date.now();
    if (now - this.lastErrorTime < 5000) {
      this.errorCount++;
    } else {
      this.errorCount = 1;
    }
    this.lastErrorTime = now;

    // Handle specific error types
    if (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token')) {
      this.handleRefreshTokenError();
      return;
    }

    if (error.message?.includes('Failed to load resource')) {
      this.handleConnectionError();
      return;
    }

    if (error.code === '401' || error.message?.includes('unauthorized')) {
      this.handleUnauthorizedError();
      return;
    }

    // Generic error handling
    toast.error('Authentication Error', {
      description: error.message || 'An authentication error occurred'
    });
  }

  private async handleRefreshTokenError(): Promise<void> {
    console.log('[SupabaseErrorHandler] Handling refresh token error');
    
    try {
      // Clear all auth data
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear localStorage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-vdjsfupbjtbkpuvwffbn')
      );
      authKeys.forEach(key => localStorage.removeItem(key));
      
      toast.info('Session expired', {
        description: 'Please sign in again'
      });
      
    } catch (error) {
      console.error('[SupabaseErrorHandler] Error clearing auth:', error);
    }
  }

  private handleConnectionError(): void {
    console.log('[SupabaseErrorHandler] Handling connection error');
    
    if (this.errorCount > 3) {
      toast.error('Connection Issues', {
        description: 'Please check your internet connection and try again'
      });
    }
  }

  private async handleUnauthorizedError(): Promise<void> {
    console.log('[SupabaseErrorHandler] Handling unauthorized error');
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.info('Please sign in', {
        description: 'You need to be signed in to perform this action'
      });
    }
  }

  reset(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }
}

export const supabaseErrorHandler = SupabaseErrorHandler.getInstance();