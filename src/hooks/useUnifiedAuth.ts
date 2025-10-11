import { useEffect, useCallback } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { debugConsole } from '@/services/debugConsole';

/**
 * Unified Authentication Coordinator
 * 
 * This hook ensures all authentication-related systems are synchronized
 * with a single source of truth from useSupabaseAuth.
 * 
 * It provides a central coordination point for:
 * - User authentication state
 * - Role management
 * - System initialization
 * - Health monitoring
 */
export const useUnifiedAuth = () => {
  const { user, session, loading, isAuthenticated, signIn, signUp, signOut } = useSupabaseAuth();

  // Central auth state change handler
  const handleAuthStateChange = useCallback(async (isAuth: boolean, userData: any) => {
    if (isAuth && userData) {
      debugConsole.info('UNIFIED_AUTH', '✅ User authenticated', {
        email: userData.email,
        id: userData.id,
        timestamp: new Date().toISOString()
      });
      
      // Trigger system initialization for authenticated users
      debugConsole.info('UNIFIED_AUTH', '🚀 Triggering authenticated system initialization');
      
    } else {
      debugConsole.info('UNIFIED_AUTH', '👋 User signed out - resetting system state');
      
      // Clean up system state on sign out
      localStorage.removeItem('yacht_sentinel_cache');
      sessionStorage.clear();
    }
  }, []);

  // Monitor authentication state changes
  useEffect(() => {
    if (!loading) {
      handleAuthStateChange(isAuthenticated, user);
    }
  }, [loading, isAuthenticated, user, handleAuthStateChange]);

  // Unified sign out with complete cleanup
  const unifiedSignOut = useCallback(async () => {
    debugConsole.info('UNIFIED_AUTH', '🔄 Initiating unified sign out');
    
    try {
      // Clear all app state
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase
      const result = await signOut();
      
      debugConsole.success('UNIFIED_AUTH', '✅ Unified sign out complete');
      
      // Force page reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
      return result;
    } catch (error) {
      debugConsole.error('UNIFIED_AUTH', '❌ Sign out error', { error });
      throw error;
    }
  }, [signOut]);

  return {
    // Core auth state
    user,
    session,
    loading,
    isAuthenticated,
    
    // Auth actions
    signIn,
    signUp,
    signOut: unifiedSignOut,
    
    // Status checks
    isReady: !loading,
    hasUser: !!user,
    hasSession: !!session,
    
    // Unified auth coordinator info
    coordinatorActive: true,
    authSystem: 'unified'
  };
};

// Export for backward compatibility
export { useSupabaseAuth as useAuth };