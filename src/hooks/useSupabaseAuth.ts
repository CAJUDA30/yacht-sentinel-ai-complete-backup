import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { handleAuthError, isRefreshTokenError } from '@/utils/authUtils';
import { authSyncService } from '@/services/authSyncService';

// MASTER AUTHENTICATION SYSTEM - Single source of truth for entire application
// This eliminates all conflicts between UserRoleContext, AppSettingsContext, SuperAdminContext
interface MasterAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  roles: string[];
  permissions: string[];
  lastUpdate: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isViewer: boolean;
  isGuest: boolean;
}

// GLOBAL STATE - Single source of truth
let masterAuthState: MasterAuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
  roles: [],
  permissions: [],
  lastUpdate: '',
  isSuperAdmin: false,
  isAdmin: false,
  isManager: false,
  isUser: false,
  isViewer: false,
  isGuest: true
};

// MASTER NOTIFICATION SYSTEM - Perfect singleton protection
let authSubscription: any = null;
let subscribers: Set<(state: MasterAuthState) => void> = new Set();
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;
const INIT_TIMEOUT_MS = 15000; // Increased to 15 seconds for slow connections

// MASTER ROLE DETECTION - Unified role system
const detectUserRoles = async (user: User): Promise<string[]> => {
  const roles: string[] = [];
  
  try {
    // Method 1: Email-based detection (HIGHEST PRIORITY)
    if (user.email === 'superadmin@yachtexcel.com') {
      roles.push('superadmin');
      console.log('[MasterAuth] ✅ SUPERADMIN detected by email');
      return roles;
    }
    
    // Method 2: Specific User ID (HARDCODED FALLBACK)
    if (user.id === '73af070f-0168-4e4c-a42b-c58931a9009a') {
      roles.push('superadmin');
      console.log('[MasterAuth] ✅ SUPERADMIN detected by user ID');
      return roles;
    }
    
    // Method 3: Metadata-based detection
    if (user.user_metadata?.role === 'global_superadmin' ||
        user.app_metadata?.role === 'global_superadmin' ||
        user.user_metadata?.is_superadmin === true ||
        user.app_metadata?.is_superadmin === true) {
      roles.push('superadmin');
      console.log('[MasterAuth] ✅ SUPERADMIN detected by metadata');
      return roles;
    }
    
    // Method 4: Database RPC check (if available)
    try {
      const { data: dbCheck, error: dbError } = await supabase.rpc('is_superadmin');
      if (!dbError && dbCheck === true) {
        roles.push('superadmin');
        console.log('[MasterAuth] ✅ SUPERADMIN detected by database RPC');
        return roles;
      }
    } catch (dbError) {
      console.warn('[MasterAuth] Database RPC check failed (expected):', dbError);
    }
    
    // Smart role assignment based on email patterns
    if (user.email?.includes('@yachtexcel.com')) {
      roles.push('admin');
    } else if (user.email?.includes('admin') || user.email?.includes('manager')) {
      roles.push('manager');
    } else {
      roles.push('user');
    }
    
  } catch (error) {
    console.error('[MasterAuth] Error in role detection:', error);
    roles.push('user'); // Default fallback
  }
  
  return roles;
};

// MASTER NOTIFICATION SYSTEM - Reduced logging for performance
const notifyAllSubscribers = () => {
  // Minimal logging for performance
  if (subscribers.size > 5) {
    console.warn('[MasterAuth] Performance warning: high subscriber count:', subscribers.size);
  }
  
  // Update auth sync service
  authSyncService.updateAuthState({
    isAuthenticated: !!masterAuthState.session,
    user: masterAuthState.user,
    session: masterAuthState.session,
    loading: masterAuthState.loading
  });
  
  // Notify all subscribers with perfect synchronization
  subscribers.forEach(callback => {
    try {
      callback({ ...masterAuthState });
    } catch (error) {
      console.error('[MasterAuth] Subscriber callback error:', error);
    }
  });
};

// MASTER INITIALIZATION - Single auth source with timeout and singleton protection
const initializeMasterAuth = async (): Promise<void> => {
  // CRITICAL: If already initializing, return the existing promise
  if (initializationPromise) {
    console.log('[MasterAuth] ⚠️ Init already in progress, returning existing promise');
    return initializationPromise;
  }
  
  // CRITICAL: If already initialized, just notify
  if (masterAuthState.initialized) {
    console.log('[MasterAuth] ✅ Already initialized, notifying subscribers');
    notifyAllSubscribers();
    return Promise.resolve();
  }
  
  // CRITICAL: Check max attempts
  if (initAttempts >= MAX_INIT_ATTEMPTS) {
    console.error('[MasterAuth] ❌ Max initialization attempts reached, forcing guest mode');
    masterAuthState = {
      user: null,
      session: null,
      loading: false,
      initialized: true,
      roles: [],
      permissions: [],
      lastUpdate: new Date().toISOString(),
      isSuperAdmin: false,
      isAdmin: false,
      isManager: false,
      isUser: false,
      isViewer: false,
      isGuest: true
    };
    notifyAllSubscribers();
    return Promise.resolve();
  }
  
  initAttempts++;
  isInitializing = true;
  
  // Create singleton promise
  initializationPromise = (async () => {
    console.log(`[MasterAuth] 🚀 MASTER AUTH SYSTEM - Initializing (attempt ${initAttempts}/${MAX_INIT_ATTEMPTS})...`);
    
    try {
      // CRITICAL FIX: Add timeout to prevent infinite loading
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), INIT_TIMEOUT_MS)
      );
      
      let session = null;
      let sessionError = null;
      
      try {
        // More patient approach - use Promise.race with longer timeout
        const result = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]);
        session = result?.data?.session || null;
        sessionError = result?.error || null;
      } catch (timeoutError: any) {
        console.warn('[MasterAuth] Session fetch timed out after', INIT_TIMEOUT_MS, 'ms, continuing with guest mode');
        // Don't throw error - continue with null session (guest mode)
        session = null;
        sessionError = null;
      }
      
      if (sessionError) {
        console.warn('[MasterAuth] Session fetch error:', sessionError.message);
      }
      
      let roles: string[] = [];
      let permissions: string[] = [];
      
      // Detect roles if user is authenticated
      if (session?.user) {
        console.log('[MasterAuth] User authenticated, detecting roles for:', session.user.email);
        roles = await detectUserRoles(session.user);
        
        // Set permissions based on roles
        if (roles.includes('superadmin')) {
          permissions = ['*'];
        } else if (roles.includes('admin')) {
          permissions = ['read', 'write', 'admin'];
        } else if (roles.includes('manager')) {
          permissions = ['read', 'write'];
        } else {
          permissions = ['read'];
        }
      } else {
        console.log('[MasterAuth] ⚠️ No session found - initializing as guest');
      }
      
      // UPDATE MASTER STATE
      masterAuthState = {
        user: session?.user || null,
        session: session || null,
        loading: false,
        initialized: true,
        roles,
        permissions,
        lastUpdate: new Date().toISOString(),
        isSuperAdmin: roles.includes('superadmin'),
        isAdmin: roles.includes('admin'),
        isManager: roles.includes('manager'),
        isUser: roles.includes('user'),
        isViewer: roles.includes('viewer'),
        isGuest: !session
      };
      
      console.log('[MasterAuth] ✅ INITIALIZED -', session ? 
        `Logged in as ${session.user.email} with roles: [${roles.join(', ')}]` : 
        'No session - guest mode');
      
      notifyAllSubscribers();
      
      // Set up SINGLE auth state listener (only once)
      if (!authSubscription) {
        console.log('[MasterAuth] Setting up SINGLE MASTER auth state listener');
        authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[MasterAuth] 🔄 Auth state changed:', event, session ? `for ${session.user.email}` : 'no session');
          
          // Handle token cleanup on sign out
          if (event === 'SIGNED_OUT') {
            console.log('[MasterAuth] 🔒 User signed out, clearing state');
            localStorage.clear();
            sessionStorage.clear();
          }
          
          let newRoles: string[] = [];
          let newPermissions: string[] = [];
          
          // Detect roles for new session
          if (session?.user) {
            newRoles = await detectUserRoles(session.user);
            
            if (newRoles.includes('superadmin')) {
              newPermissions = ['*'];
            } else if (newRoles.includes('admin')) {
              newPermissions = ['read', 'write', 'admin'];
            } else if (newRoles.includes('manager')) {
              newPermissions = ['read', 'write'];
            } else {
              newPermissions = ['read'];
            }
          }
          
          masterAuthState = {
            user: session?.user || null,
            session: session || null,
            loading: false,
            initialized: true,
            roles: newRoles,
            permissions: newPermissions,
            lastUpdate: new Date().toISOString(),
            isSuperAdmin: newRoles.includes('superadmin'),
            isAdmin: newRoles.includes('admin'),
            isManager: newRoles.includes('manager'),
            isUser: newRoles.includes('user'),
            isViewer: newRoles.includes('viewer'),
            isGuest: !session
          };
          
          notifyAllSubscribers();
        });
      }
      
    } catch (error: any) {
      console.error('[MasterAuth] ❌ CRITICAL: Init error, recovering as guest:', error);
      
      // CRITICAL: Always set initialized = true to prevent infinite loading
      masterAuthState = {
        user: null,
        session: null,
        loading: false,
        initialized: true,
        roles: [],
        permissions: [],
        lastUpdate: new Date().toISOString(),
        isSuperAdmin: false,
        isAdmin: false,
        isManager: false,
        isUser: false,
        isViewer: false,
        isGuest: true
      };
      notifyAllSubscribers();
    } finally {
      isInitializing = false;
      initializationPromise = null; // Clear promise for future re-init
      console.log('[MasterAuth] ✅ Initialization complete, final state:', {
        loading: masterAuthState.loading,
        initialized: masterAuthState.initialized,
        hasSession: !!masterAuthState.session,
        roles: masterAuthState.roles,
        isSuperAdmin: masterAuthState.isSuperAdmin,
        subscribers: subscribers.size
      });
    }
  })();
  
  return initializationPromise;
};

// MASTER AUTHENTICATION HOOK - Single unified interface
export const useSupabaseAuth = () => {
  const [state, setState] = useState(masterAuthState);
  
  const updateState = useCallback((newState: MasterAuthState) => {
    // Reduced logging for performance - only log on auth changes
    const wasAuthenticated = !!state.session;
    const nowAuthenticated = !!newState.session;
    if (nowAuthenticated !== wasAuthenticated) {
      console.log('[useSupabaseAuth] Auth state changed:', {
        wasAuthenticated,
        nowAuthenticated,
        roles: newState.roles
      });
    }
    setState(newState);
  }, [state.session]);
  
  useEffect(() => {
    // Reduced logging for performance
    if (subscribers.size === 0) {
      console.log('[useSupabaseAuth] 🚀 MASTER HOOK initialized, subscribers:', subscribers.size);
    }
    
    // Subscribe to updates
    subscribers.add(updateState);
    
    // CRITICAL: Use singleton initialization
    if (!masterAuthState.initialized && !initializationPromise) {
      initializeMasterAuth().catch(error => {
        console.error('[useSupabaseAuth] Init failed:', error);
      });
    } else if (initializationPromise) {
      // Reduced logging - only log once
      if (subscribers.size === 1) {
        console.log('[useSupabaseAuth] Init already in progress, waiting for completion...');
      }
      initializationPromise.then(() => {
        setState(masterAuthState);
      });
    } else {
      // Use current state immediately - minimal logging
      setState(masterAuthState);
    }
    
    return () => {
      subscribers.delete(updateState);
      // Only log unsubscribe for monitoring
      if (subscribers.size % 5 === 0) {
        console.log('[useSupabaseAuth] Unsubscribed, remaining:', subscribers.size);
      }
    };
  }, [updateState]);
  
  const signIn = async (email: string, password: string) => {
    console.log('[MasterAuth] Attempting sign in');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[MasterAuth] Sign in error:', error);
    }
    return { error };
  };
  
  const signUp = async (email: string, password: string) => {
    console.log('[MasterAuth] Attempting sign up');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` }
    });
    if (error) {
      console.error('[MasterAuth] Sign up error:', error);
    }
    return { error };
  };
  
  const signOut = async () => {
    console.log('[MasterAuth] Signing out');
    
    // Update state immediately
    masterAuthState = {
      user: null,
      session: null,
      loading: false,
      initialized: true,
      roles: [],
      permissions: [],
      lastUpdate: new Date().toISOString(),
      isSuperAdmin: false,
      isAdmin: false,
      isManager: false,
      isUser: false,
      isViewer: false,
      isGuest: true
    };
    notifyAllSubscribers();
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    return { error };
  };
  
  // ROLE CHECKING FUNCTIONS - Unified API
  const hasRole = useCallback((role: string) => {
    return state.roles.includes(role) || (role !== 'superadmin' && state.isSuperAdmin);
  }, [state.roles, state.isSuperAdmin]);

  const hasAnyRole = useCallback((roles: string[]) => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const canRead = useCallback((resource: string) => {
    if (state.isSuperAdmin || state.isAdmin) return true;
    if (state.isManager && ['yachts', 'users', 'reports'].includes(resource)) return true;
    if (state.isUser && ['yachts', 'reports', 'profile'].includes(resource)) return true;
    if (state.isViewer && ['yachts', 'reports'].includes(resource)) return true;
    return false;
  }, [state.isSuperAdmin, state.isAdmin, state.isManager, state.isUser, state.isViewer]);

  const canWrite = useCallback((resource: string) => {
    if (state.isSuperAdmin || state.isAdmin) return true;
    if (state.isManager && ['yachts', 'users', 'reports'].includes(resource)) return true;
    if (state.isUser && ['profile'].includes(resource)) return true;
    return false;
  }, [state.isSuperAdmin, state.isAdmin, state.isManager, state.isUser]);

  const canDelete = useCallback((resource: string) => {
    if (state.isSuperAdmin || state.isAdmin) return true;
    if (state.isManager && ['reports'].includes(resource)) return true;
    return false;
  }, [state.isSuperAdmin, state.isAdmin, state.isManager]);

  const canAdmin = useCallback((resource?: string) => {
    return state.isSuperAdmin || state.isAdmin;
  }, [state.isSuperAdmin, state.isAdmin]);
  
  return {
    // Core auth state
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAuthenticated: !!state.session,
    initialized: state.initialized,
    
    // Role state
    roles: state.roles,
    permissions: state.permissions,
    isSuperAdmin: state.isSuperAdmin,
    isAdmin: state.isAdmin,
    isManager: state.isManager,
    isUser: state.isUser,
    isViewer: state.isViewer,
    isGuest: state.isGuest,
    
    // Role checking functions
    hasRole,
    hasAnyRole,
    canRead,
    canWrite,
    canDelete,
    canAdmin,
    
    // Auth actions
    signIn,
    signUp,
    signOut,
    
    // Refresh function
    refreshRoles: () => initializeMasterAuth(),
    
    // Legacy compatibility
    userRole: state.isSuperAdmin ? 'superadmin' : 
              state.isAdmin ? 'admin' : 
              state.isManager ? 'manager' : 
              state.isUser ? 'user' : 
              state.isViewer ? 'viewer' : 'guest',
    refreshStatus: () => initializeMasterAuth()
  };
};

// UNIFIED EXPORT ALIASES - Backward compatibility
export const useUnifiedAuth = useSupabaseAuth;
export const useUserRole = useSupabaseAuth;
export const useSuperAdmin = () => {
  const auth = useSupabaseAuth();
  return {
    isSuperAdmin: auth.isSuperAdmin,
    userRole: auth.userRole,
    loading: auth.loading,
    refreshStatus: auth.refreshStatus
  };
};

// MASTER AUTH STATE EXPORT - For contexts that need raw state
export const getMasterAuthState = () => masterAuthState;
export const subscribeMasterAuth = (callback: (state: MasterAuthState) => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};