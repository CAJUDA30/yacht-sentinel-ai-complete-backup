import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { handleAuthError, isRefreshTokenError } from '@/utils/authUtils';

// Simplified global auth state
let globalAuthState = {
  user: null as User | null,
  session: null as Session | null,
  loading: true,
  initialized: false
};

let authSubscription: any = null;
let subscribers: Set<(state: typeof globalAuthState) => void> = new Set();
let isInitializing = false;

// Immediate state notification
const notifySubscribers = () => {
  console.log('[Auth] Notifying', subscribers.size, 'subscribers:', {
    loading: globalAuthState.loading,
    isAuthenticated: !!globalAuthState.session,
    initialized: globalAuthState.initialized
  });
  subscribers.forEach(callback => {
    try {
      callback({ ...globalAuthState });
    } catch (error) {
      console.error('[Auth] Subscriber callback error:', error);
    }
  });
};

// Clean, simple initialization - trust Supabase's built-in validation
const initializeAuth = async () => {
  if (isInitializing) {
    return;
  }
  
  if (globalAuthState.initialized) {
    notifySubscribers();
    return;
  }
  
  isInitializing = true;
  console.log('[Auth] Initializing...');
  
  try {
    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
    const session = result?.data?.session || null;
    
    globalAuthState = {
      user: session?.user || null,
      session: session || null,
      loading: false,
      initialized: true
    };
    
    console.log('[Auth] Ready -', session ? `Logged in as ${session.user.email}` : 'No session');
    notifySubscribers();
    
    // Set up auth state listener ONCE
    if (!authSubscription) {
      authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Auth] Event:', event);
        
        globalAuthState = {
          user: session?.user || null,
          session: session || null,
          loading: false,
          initialized: true
        };
        notifySubscribers();
      });
    }
    
  } catch (error) {
    console.warn('[Auth] Init timeout/error - starting without session');
    globalAuthState = {
      user: null,
      session: null,
      loading: false,
      initialized: true
    };
    notifySubscribers();
  } finally {
    isInitializing = false;
  }
};

export const useSupabaseAuth = () => {
  const [state, setState] = useState(globalAuthState);
  
  const updateState = useCallback((newState: typeof globalAuthState) => {
    console.log('[useSupabaseAuth] State update:', {
      loading: newState.loading,
      isAuthenticated: !!newState.session,
      initialized: newState.initialized
    });
    setState(newState);
  }, []);
  
  useEffect(() => {
    console.log('[useSupabaseAuth] Hook initialized');
    
    // Subscribe to updates
    subscribers.add(updateState);
    
    // Initialize auth if needed
    if (!globalAuthState.initialized && !isInitializing) {
      // Start initialization - NO timeout that could clear valid sessions
      initializeAuth();
    } else {
      // Use current state immediately
      console.log('[useSupabaseAuth] Using existing global state:', {
        hasUser: !!globalAuthState.user,
        hasSession: !!globalAuthState.session,
        loading: globalAuthState.loading,
        initialized: globalAuthState.initialized
      });
      setState(globalAuthState);
    }
    
    return () => {
      subscribers.delete(updateState);
    };
  }, [updateState]);
  
  const signIn = async (email: string, password: string) => {
    console.log('[Auth] Attempting sign in');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[Auth] Sign in error:', error);
    }
    return { error };
  };
  
  const signUp = async (email: string, password: string) => {
    console.log('[Auth] Attempting sign up');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    if (error) {
      console.error('[Auth] Sign up error:', error);
    }
    return { error };
  };
  
  const signOut = async () => {
    console.log('[Auth] Signing out');
    
    // Update state immediately
    globalAuthState = {
      user: null,
      session: null,
      loading: false,
      initialized: true
    };
    notifySubscribers();
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    return { error };
  };
  
  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAuthenticated: !!state.session,
    signIn,
    signUp,
    signOut
  };
};