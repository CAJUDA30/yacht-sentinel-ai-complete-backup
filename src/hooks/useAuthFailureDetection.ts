import { useEffect, useRef } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';

/**
 * Global authentication failure detection hook
 * This provides an additional layer of protection against delayed authentication failures
 * Use this in critical components that must immediately respond to auth issues
 */
export const useAuthFailureDetection = () => {
  const { isAuthenticated, isSuperAdmin, session, loading } = useSupabaseAuth();
  const lastAuthState = useRef<{
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    sessionId: string | null;
  }>({
    isAuthenticated: false,
    isSuperAdmin: false,
    sessionId: null
  });

  useEffect(() => {
    // Don't process during initial loading
    if (loading) return;

    const currentState = {
      isAuthenticated,
      isSuperAdmin,
      sessionId: session?.user?.id || null
    };

    const previousState = lastAuthState.current;

    // Detect critical authentication failures
    const authLost = previousState.isAuthenticated && !currentState.isAuthenticated;
    const superAdminLost = previousState.isSuperAdmin && !currentState.isSuperAdmin;
    const sessionChanged = previousState.sessionId && 
                          previousState.sessionId !== currentState.sessionId;

    if (authLost || superAdminLost || sessionChanged) {
      console.error('🚨 AUTH FAILURE DETECTED BY GLOBAL MONITOR:', {
        authLost,
        superAdminLost,
        sessionChanged,
        previousState,
        currentState,
        action: 'IMMEDIATE_REDIRECT'
      });

      // Immediate redirect with no delays
      window.location.href = '/auth';
      return;
    }

    // Update reference state
    lastAuthState.current = currentState;
  }, [isAuthenticated, isSuperAdmin, session?.user?.id, loading]);

  return {
    isMonitoring: !loading,
    lastKnownAuthState: lastAuthState.current
  };
};