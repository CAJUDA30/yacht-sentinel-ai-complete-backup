import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { handleAuthError, isRefreshTokenError } from '@/utils/authUtils';

// Global auth state to prevent multiple initializations
let globalAuthState: {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
} = {
  user: null,
  session: null,
  loading: true,
  initialized: false
};

let globalSubscription: any = null;
const authCallbacks: Set<(state: typeof globalAuthState) => void> = new Set();
let notificationDebounce: NodeJS.Timeout | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitializing = false;

// Debounced notification to prevent rapid state updates
const notifySubscribers = () => {
  if (notificationDebounce) clearTimeout(notificationDebounce);
  notificationDebounce = setTimeout(() => {
    authCallbacks.forEach(callback => callback(globalAuthState));
  }, 50); // Increased debounce time to reduce rapid updates
};

// Initialize auth once globally
const initializeGlobalAuth = async (): Promise<void> => {
  // Return existing promise if already initializing
  if (initializationPromise) {
    return initializationPromise;
  }
  
  if (globalAuthState.initialized || isInitializing) {
    return Promise.resolve();
  }
  
  // Mark as initializing immediately to prevent race conditions
  isInitializing = true;
  
  initializationPromise = (async () => {
    try {
      // Mark as initializing to prevent race conditions
      globalAuthState.initialized = true;
      console.log('[Auth] Initializing authentication system (single instance)');
      console.log('[Auth] Provider initialised'); // Keep debug logging
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error?.message.includes('Invalid Refresh Token') || 
          error?.message.includes('Refresh Token Not Found') ||
          error?.message.includes('refresh_token')) {
        // Clear invalid tokens silently
        console.log('[Auth] Clearing invalid refresh token');
        await supabase.auth.signOut({ scope: 'local' });
        globalAuthState = { user: null, session: null, loading: false, initialized: true };
      } else {
        globalAuthState = {
          user: session?.user ?? null,
          session: session,
          loading: false,
          initialized: true
        };
        
        // Debug successful auth state
        if (session?.user) {
          console.log('[Auth] Session found:', {
            userEmail: session.user.email,
            userId: session.user.id,
            hasSession: !!session
          });
        }
      }
      
      // Single auth state listener for entire app
      if (!globalSubscription) {
        globalSubscription = supabase.auth.onAuthStateChange((event, session) => {
          // Prevent rapid state changes during initialization
          if (event === 'INITIAL_SESSION') {
            return; // Skip initial session to prevent duplicate updates
          }
          
          // Handle auth errors gracefully
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.log('[Auth] Token refresh failed, clearing session');
            globalAuthState = {
              user: null,
              session: null,
              loading: false,
              initialized: true
            };
          } else {
            globalAuthState = {
              user: session?.user ?? null,
              session: session,
              loading: false,
              initialized: true
            };
          }
          
          // Notify all subscribers with debounce
          notifySubscribers();
        });
      }
      
      // Notify all subscribers
      notifySubscribers();
      
    } catch (error) {
      console.log('[Auth] Session initialization error:', error);
      
      // Handle refresh token errors
      if (isRefreshTokenError(error)) {
        await handleAuthError(error);
        return; // handleAuthError will reload the page
      }
      
      globalAuthState = { user: null, session: null, loading: false, initialized: true };
      notifySubscribers();
    } finally {
      isInitializing = false;
    }
  })();
  
  return initializationPromise;
};

export const useSupabaseAuth = () => {
  const [localState, setLocalState] = useState(globalAuthState);

  const updateLocalState = useCallback((newState: typeof globalAuthState) => {
    setLocalState(newState);
  }, []);

  useEffect(() => {
    // Subscribe to global auth state
    authCallbacks.add(updateLocalState);
    
    // Initialize if not already done (with promise support)
    if (!globalAuthState.initialized) {
      initializeGlobalAuth();
    } else {
      // Use existing state
      setLocalState(globalAuthState);
    }

    return () => {
      authCallbacks.delete(updateLocalState);
    };
  }, [updateLocalState]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  return {
    user: localState.user,
    session: localState.session,
    loading: localState.loading,
    signOut,
    signIn,
    signUp,
    isAuthenticated: !!localState.session
  };
};