/**
 * Unified Authentication Synchronization System
 * 
 * This service ensures all authentication-related components and contexts
 * are properly synchronized with a single source of truth.
 * 
 * Key Features:
 * - Single auth state source from useSupabaseAuth
 * - Coordinated context provider updates
 * - Synchronized system initialization
 * - Unified error handling
 * - Clean state management
 */

import { debugConsole } from '@/services/debugConsole';

interface AuthSyncEvent {
  type: 'SIGNED_IN' | 'SIGNED_OUT' | 'SESSION_REFRESHED' | 'ERROR';
  user?: any;
  session?: any;
  error?: any;
  timestamp: string;
}

class AuthSyncService {
  private listeners: Set<(event: AuthSyncEvent) => void> = new Set();
  private currentState: {
    isAuthenticated: boolean;
    user: any;
    session: any;
    loading: boolean;
  } = {
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true
  };

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: (event: AuthSyncEvent) => void) {
    this.listeners.add(callback);
    
    // Immediately notify with current state if available
    if (!this.currentState.loading) {
      callback({
        type: this.currentState.isAuthenticated ? 'SIGNED_IN' : 'SIGNED_OUT',
        user: this.currentState.user,
        session: this.currentState.session,
        timestamp: new Date().toISOString()
      });
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Update global auth state and notify all listeners
   */
  updateAuthState(state: {
    isAuthenticated: boolean;
    user: any;
    session: any;
    loading: boolean;
  }) {
    const wasAuthenticated = this.currentState.isAuthenticated;
    const isAuthenticatedNow = state.isAuthenticated;
    
    this.currentState = state;
    
    if (!state.loading) {
      const eventType = isAuthenticatedNow 
        ? 'SIGNED_IN' 
        : (wasAuthenticated ? 'SIGNED_OUT' : 'SIGNED_OUT');

      const event: AuthSyncEvent = {
        type: eventType,
        user: state.user,
        session: state.session,
        timestamp: new Date().toISOString()
      };

      debugConsole.info('AUTH_SYNC', `📡 Broadcasting auth event: ${eventType}`, {
        listeners: this.listeners.size,
        user: state.user?.email,
        authenticated: isAuthenticatedNow
      });

      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          debugConsole.error('AUTH_SYNC', '❌ Listener callback error', { error });
        }
      });
    }
  }

  /**
   * Get current auth state
   */
  getCurrentState() {
    return { ...this.currentState };
  }

  /**
   * Broadcast auth error to all listeners
   */
  broadcastError(error: any) {
    const event: AuthSyncEvent = {
      type: 'ERROR',
      error,
      timestamp: new Date().toISOString()
    };

    debugConsole.error('AUTH_SYNC', '📡 Broadcasting auth error', { error });

    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (callbackError) {
        debugConsole.error('AUTH_SYNC', '❌ Error listener callback failed', { callbackError });
      }
    });
  }

  /**
   * Force refresh all auth-dependent systems
   */
  async forceRefreshAll() {
    debugConsole.info('AUTH_SYNC', '🔄 Force refresh all auth systems');
    
    const refreshEvent: AuthSyncEvent = {
      type: 'SESSION_REFRESHED',
      user: this.currentState.user,
      session: this.currentState.session,
      timestamp: new Date().toISOString()
    };

    this.listeners.forEach(callback => {
      try {
        callback(refreshEvent);
      } catch (error) {
        debugConsole.error('AUTH_SYNC', '❌ Refresh callback error', { error });
      }
    });
  }

  /**
   * Clean up all auth state
   */
  cleanup() {
    debugConsole.info('AUTH_SYNC', '🧹 Cleaning up auth sync service');
    
    this.currentState = {
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false
    };
    
    this.listeners.clear();
  }
}

// Singleton instance
export const authSyncService = new AuthSyncService();

// React hook for easy integration
export const useAuthSync = () => {
  return {
    subscribe: authSyncService.subscribe.bind(authSyncService),
    getCurrentState: authSyncService.getCurrentState.bind(authSyncService),
    forceRefresh: authSyncService.forceRefreshAll.bind(authSyncService)
  };
};